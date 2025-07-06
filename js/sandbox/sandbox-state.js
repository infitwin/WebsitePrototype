/**
 * Sandbox State Management Module
 * Extracted from sandbox.html - Phase 1 of Architecture Refactoring
 * 
 * Manages all global state variables and state synchronization logic
 * for the sandbox graph editor.
 */

export class SandboxState {
    constructor() {
        this.neo4jIntegration = null; // Will be set after initialization
        // Core state variables
        this.sandboxRoot = null;
        this.productionRoot = null;
        this.sandboxGraphRef = null;
        this.debugMessages = [];
        this.openPanels = [];
        this.changesCount = 0;
        this.initialDataLoaded = false;
        this.currentSandboxData = { nodes: [], edges: [] };
        this.activeReviewModal = null;
        
        // Initialize interview ID
        this.currentInterviewId = localStorage.getItem('currentInterviewId');
        if (!this.currentInterviewId) {
            this.currentInterviewId = `interview_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            localStorage.setItem('currentInterviewId', this.currentInterviewId);
        }
    }

    /**
     * Set the Neo4j integration instance
     */
    setNeo4jIntegration(integration) {
        this.neo4jIntegration = integration;
    }

    /**
     * Logging utility (disabled for production)
     */
    log(message) {
        // Logging disabled for production
    }

    /**
     * Update the changes display and context bar
     */
    updateChangesDisplay() {
        const shouldShow = this.initialDataLoaded && this.changesCount > 0;
        const contextBar = document.getElementById('contextBar');
        const changesText = document.getElementById('changesText');
        
        if (contextBar) {
            if (shouldShow) {
                contextBar.classList.add('visible');
            } else {
                contextBar.classList.remove('visible');
            }
        }
        
        if (changesText) {
            changesText.textContent = this.changesCount + ' ' + (this.changesCount === 1 ? 'change' : 'changes') + ' pending in sandbox';
        }
        
        // Update Review & Post button state
        const button = document.querySelector('#postToProductionButton button');
        if (button && button._buttonInstance) {
            button._buttonInstance.setDisabled(this.changesCount === 0);
        } else if (button) {
            // Fallback for simple button
            button.disabled = this.changesCount === 0;
            button.style.opacity = this.changesCount === 0 ? '0.5' : '1';
            button.style.cursor = this.changesCount === 0 ? 'not-allowed' : 'pointer';
        }
    }

    /**
     * Load existing sandbox data from Neo4j
     */
    async loadExistingSandboxData() {
        this.log('🔄 Loading existing sandbox data...');
        
        try {
            if (!window.Neo4jConnection.isConnected) {
                await window.Neo4jConnection.connect();
            }
            
            const userId = firebase.auth().currentUser?.uid;
            const twinId = `${userId}-1`;
            
            this.log(`🔍 Loading ALL sandbox items for User: ${userId}, Twin: ${twinId}`);
            
            if (!userId) {
                this.log('⚠️ No user ID, skipping sandbox load');
                return;
            }
            
            const session = window.Neo4jConnection.getSession();
            
            try {
                this.log(`📊 Loading ALL sandbox items for userId: ${userId}, twinId: ${twinId}`);
                const nodesResult = await session.run(`
                    MATCH (n:Sandbox)
                    WHERE n.userId = $userId
                    AND n.twinId = $twinId
                    RETURN n
                    ORDER BY n.createdAt DESC
                `, {
                    userId: userId,
                    twinId: twinId
                });
                
                this.log(`📊 Node query returned ${nodesResult.records.length} records`);
                
                const relsResult = await session.run(`
                    MATCH (source:Sandbox)-[r]->(target:Sandbox)
                    WHERE r._isSandbox = true
                    AND source.userId = $userId
                    AND source.twinId = $twinId
                    AND target.userId = $userId
                    AND target.twinId = $twinId
                    RETURN r, source.id as sourceId, target.id as targetId, type(r) as relType
                    ORDER BY r.createdAt DESC
                `, {
                    userId: userId,
                    twinId: twinId
                });
                
                const nodes = nodesResult.records.map(record => {
                    const node = record.get('n');
                    const props = node.properties;
                    
                    if (props.stateMaps && typeof props.stateMaps === 'string') {
                        try {
                            props.stateMaps = JSON.parse(props.stateMaps);
                        } catch (e) {
                            console.error('Failed to parse node stateMaps:', e);
                            props.stateMaps = [];
                        }
                    }
                    
                    if (props.attachments && typeof props.attachments === 'string') {
                        try {
                            props.attachments = JSON.parse(props.attachments);
                        } catch (e) {
                            console.error('Failed to parse node attachments:', e);
                            props.attachments = [];
                        }
                    }
                    
                    return {
                        id: props.id,
                        name: props.name || 'Unnamed',
                        label: props.name || 'Unnamed',
                        type: props.type?.toLowerCase() || 'thing',
                        x: props.x || Math.random() * 800,
                        y: props.y || Math.random() * 600,
                        imageUrl: props.imageUrl || null,
                        attachments: props.attachments || [],
                        properties: props
                    };
                });
                
                const edges = relsResult.records.map(record => {
                    const rel = record.get('r');
                    const props = rel.properties;
                    const sourceId = record.get('sourceId');
                    const targetId = record.get('targetId');
                    const relType = record.get('relType');
                    
                    if (props.stateMaps && typeof props.stateMaps === 'string') {
                        try {
                            props.stateMaps = JSON.parse(props.stateMaps);
                        } catch (e) {
                            console.error('Failed to parse relationship stateMaps:', e);
                            props.stateMaps = [];
                        }
                    }
                    
                    if (props.attachments && typeof props.attachments === 'string') {
                        try {
                            props.attachments = JSON.parse(props.attachments);
                        } catch (e) {
                            console.error('Failed to parse relationship attachments:', e);
                            props.attachments = [];
                        }
                    }
                    
                    return {
                        id: props.id,
                        source: sourceId,
                        target: targetId,
                        label: relType,
                        type: relType,
                        attachments: props.attachments || [],
                        properties: props
                    };
                });
                
                this.currentSandboxData = {
                    nodes: nodes,
                    edges: edges
                };
                
                this.log(`✅ Loaded ${nodes.length} nodes and ${edges.length} relationships from sandbox`);
                
                if (this.sandboxRoot && this.sandboxGraphRef.current) {
                    this.log('🔄 Updating Nexus control with loaded data...');
                    if (this.sandboxGraphRef.current.updateData) {
                        this.sandboxGraphRef.current.updateData(this.currentSandboxData);
                    } else if (this.sandboxGraphRef.current.setData) {
                        this.sandboxGraphRef.current.setData(this.currentSandboxData);
                    } else {
                        this.log('⚠️ No update method found on Nexus control, re-initializing...');
                        // Note: initializeSandbox will be handled by the main module
                        window.initializeSandbox && window.initializeSandbox();
                    }
                } else {
                    this.log('⚠️ Nexus control not ready yet, data will be loaded on initialization');
                }
                
            } finally {
                await session.close();
            }
            
        } catch (error) {
            this.log('❌ Failed to load sandbox data: ' + error.message);
            console.error('Load sandbox error:', error);
        }
    }

    /**
     * Simulate a change for testing purposes
     */
    simulateChange() {
        if (this.initialDataLoaded) {
            this.changesCount++;
            this.updateChangesDisplay();
            this.log('Change recorded: ' + this.changesCount + ' total');
        }
    }

    /**
     * Auto-save handler for all sandbox data changes
     * Detects and saves: position changes, face updates, file attachments
     */
    async handleSandboxDataChange(newData) {
        // Process node updates - check for position, face, and attachment changes
        for (const newNode of newData.nodes) {
            const oldNode = this.currentSandboxData.nodes.find(n => n.id === newNode.id);
            if (!oldNode) continue; // Skip new nodes (handled by onNodeDrop/onEdgeCreate callbacks)
            
            // Auto-save position changes
            if ((oldNode.x !== newNode.x || oldNode.y !== newNode.y) && newNode.x !== undefined && newNode.y !== undefined) {
                this.log(`📍 Node position changed: ${newNode.id} - ${newNode.name || newNode.label}`);
                
                try {
                    const updates = {
                        x: newNode.x,
                        y: newNode.y,
                        positionUpdatedAt: new Date().toISOString()
                    };
                    
                    await window.Neo4jConnection.updateSandboxNode(newNode.id, updates, []);
                    this.log('✅ Node position auto-saved to Neo4j: ' + newNode.id);
                } catch (error) {
                    this.log('❌ Failed to save node position: ' + error.message);
                    console.error('Node position save error:', error);
                }
            }
            
            // Auto-save face updates
            if (newNode.imageUrl && oldNode.imageUrl !== newNode.imageUrl) {
                this.log(`😊 Face updated on node ${newNode.id}: ${newNode.name || newNode.label}`);
                
                try {
                    const updates = {
                        imageUrl: newNode.imageUrl,
                        hasFace: true,
                        faceUpdatedAt: new Date().toISOString()
                    };
                    
                    await window.Neo4jConnection.updateSandboxNode(newNode.id, updates, []);
                    this.log('✅ Face image auto-saved to Neo4j: ' + newNode.id);
                } catch (error) {
                    this.log('❌ Failed to save face update: ' + error.message);
                    console.error('Face save error:', error);
                }
            }
            
            // Auto-save file attachments
            const oldAttachments = oldNode.attachments || [];
            const newAttachments = newNode.attachments || [];
            
            if (newAttachments.length > oldAttachments.length) {
                const addedFiles = newAttachments.slice(oldAttachments.length);
                this.log(`📎 File attachment added to node ${newNode.id}: ${addedFiles.length} files`);
                
                try {
                    const updates = {
                        attachments: JSON.stringify(newAttachments),
                        attachmentUpdatedAt: new Date().toISOString()
                    };
                    
                    await window.Neo4jConnection.updateSandboxNode(newNode.id, updates, []);
                    this.log('✅ File attachments auto-saved to Neo4j: ' + newNode.id);
                } catch (error) {
                    this.log('❌ Failed to save file attachments: ' + error.message);
                    console.error('Attachment save error:', error);
                }
            }
        }
        
        // Process edge updates - mainly for file attachments
        for (const newEdge of newData.edges) {
            const oldEdge = this.currentSandboxData.edges.find(e => e.id === newEdge.id);
            if (!oldEdge) continue; // Skip new edges
            
            const oldAttachments = oldEdge.attachments || [];
            const newAttachments = newEdge.attachments || [];
            
            if (newAttachments.length > oldAttachments.length) {
                const addedFiles = newAttachments.slice(oldAttachments.length);
                this.log(`📎 File attachment added to edge ${newEdge.id}: ${addedFiles.length} files`);
                
                try {
                    const updates = {
                        attachments: JSON.stringify(newAttachments),
                        attachmentUpdatedAt: new Date().toISOString()
                    };
                    
                    await window.Neo4jConnection.updateSandboxEdge(newEdge.id, updates, []);
                    this.log('✅ Edge file attachments auto-saved to Neo4j: ' + newEdge.id);
                } catch (error) {
                    this.log('❌ Failed to save edge file attachments: ' + error.message);
                    console.error('Edge attachment save error:', error);
                }
            }
        }
        
        // Update our local data
        this.currentSandboxData = newData;
        
        // Mark as having changes if not explicitly loading from database
        if (this.initialDataLoaded) {
            this.changesCount++;
            this.updateChangesDisplay();
        }
    }

    /**
     * Get current state for other modules
     */
    getState() {
        return {
            sandboxRoot: this.sandboxRoot,
            productionRoot: this.productionRoot,
            sandboxGraphRef: this.sandboxGraphRef,
            debugMessages: this.debugMessages,
            openPanels: this.openPanels,
            changesCount: this.changesCount,
            initialDataLoaded: this.initialDataLoaded,
            currentSandboxData: this.currentSandboxData,
            activeReviewModal: this.activeReviewModal,
            currentInterviewId: this.currentInterviewId
        };
    }

    /**
     * Set state values for other modules
     */
    setState(updates) {
        Object.assign(this, updates);
    }
}

// Export singleton instance
export const sandboxState = new SandboxState();

// For backward compatibility with global access
window.sandboxState = sandboxState;