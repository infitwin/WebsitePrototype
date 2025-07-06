/**
 * Sandbox Neo4j Integration Module
 * Extracted from sandbox.html - Phase 3 of Architecture Refactoring
 * 
 * Manages all Neo4j database operations for the sandbox graph editor including
 * data loading, node/edge CRUD operations, and production synchronization.
 */

export class SandboxNeo4jIntegration {
    constructor(sandboxState) {
        this.sandboxState = sandboxState;
        this.log = sandboxState.log.bind(sandboxState);
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
                
                const sandboxData = {
                    nodes: nodes,
                    edges: edges
                };
                
                this.log(`✅ Loaded ${nodes.length} nodes and ${edges.length} relationships from sandbox`);
                
                // Update state
                this.sandboxState.setState({ currentSandboxData: sandboxData });
                
                // Update Nexus control if available
                const state = this.sandboxState.getState();
                if (state.sandboxRoot && state.sandboxGraphRef.current) {
                    this.log('🔄 Updating Nexus control with loaded data...');
                    if (state.sandboxGraphRef.current.updateData) {
                        state.sandboxGraphRef.current.updateData(sandboxData);
                    } else if (state.sandboxGraphRef.current.setData) {
                        state.sandboxGraphRef.current.setData(sandboxData);
                    } else {
                        this.log('⚠️ No update method found on Nexus control, re-initializing...');
                        window.initializeSandbox && window.initializeSandbox();
                    }
                } else {
                    this.log('⚠️ Nexus control not ready yet, data will be loaded on initialization');
                }
                
                return sandboxData;
                
            } finally {
                await session.close();
            }
            
        } catch (error) {
            this.log('❌ Failed to load sandbox data: ' + error.message);
            console.error('Load sandbox error:', error);
            throw error;
        }
    }

    /**
     * Auto-save node position changes
     */
    async saveNodePosition(nodeId, x, y, nodeName) {
        try {
            const updates = {
                x: x,
                y: y,
                positionUpdatedAt: new Date().toISOString()
            };
            
            await window.Neo4jConnection.updateSandboxNode(nodeId, updates, []);
            this.log('✅ Node position auto-saved to Neo4j: ' + nodeId);
            return true;
        } catch (error) {
            this.log('❌ Failed to save node position: ' + error.message);
            console.error('Node position save error:', error);
            return false;
        }
    }

    /**
     * Auto-save face image updates
     */
    async saveNodeFace(nodeId, imageUrl, nodeName) {
        try {
            const updates = {
                imageUrl: imageUrl,
                hasFace: true,
                faceUpdatedAt: new Date().toISOString()
            };
            
            await window.Neo4jConnection.updateSandboxNode(nodeId, updates, []);
            this.log('✅ Face image auto-saved to Neo4j: ' + nodeId);
            return true;
        } catch (error) {
            this.log('❌ Failed to save face update: ' + error.message);
            console.error('Face save error:', error);
            return false;
        }
    }

    /**
     * Auto-save file attachments to nodes
     */
    async saveNodeAttachments(nodeId, attachments) {
        try {
            const updates = {
                attachments: JSON.stringify(attachments),
                attachmentUpdatedAt: new Date().toISOString()
            };
            
            await window.Neo4jConnection.updateSandboxNode(nodeId, updates, []);
            this.log('✅ File attachments auto-saved to Neo4j: ' + nodeId);
            return true;
        } catch (error) {
            this.log('❌ Failed to save file attachments: ' + error.message);
            console.error('Attachment save error:', error);
            return false;
        }
    }

    /**
     * Auto-save file attachments to edges
     */
    async saveEdgeAttachments(edgeId, attachments, sourceId, targetId, edgeType) {
        try {
            const updates = {
                attachments: attachments,
                hasAttachments: true,
                attachmentsUpdatedAt: new Date().toISOString()
            };
            
            await window.Neo4jConnection.updateSandboxRelationship(
                edgeId,
                updates,
                sourceId,
                targetId,
                edgeType,
                this.sandboxState.currentInterviewId
            );
            
            this.log('✅ File attachments saved to database for edge: ' + edgeId);
            return true;
        } catch (error) {
            this.log('❌ Failed to save edge file attachments: ' + error.message);
            console.error('Edge file attachment save error:', error);
            return false;
        }
    }

    /**
     * Handle metadata form save operations
     */
    async handleMetaSave(metaData) {
        this.log('📝 Processing metadata form save:', metaData);
        
        try {
            if (!window.Neo4jConnection.isConnected) {
                await window.Neo4jConnection.connect();
            }
            
            const userId = firebase.auth().currentUser?.uid;
            const twinId = `${userId}-1`;
            
            if (metaData.entityType === 'node') {
                if (metaData.action === 'create') {
                    const newNode = await window.Neo4jConnection.createSandboxNode(
                        metaData.updates,
                        userId,
                        twinId,
                        this.sandboxState.currentInterviewId
                    );
                    this.log('✅ New node created via metadata form: ' + newNode.id);
                    return newNode;
                } else if (metaData.action === 'update') {
                    const updatedNode = await window.Neo4jConnection.updateSandboxNode(
                        metaData.entityId,
                        metaData.updates,
                        metaData.deletedFields,
                        userId,
                        twinId,
                        this.sandboxState.currentInterviewId
                    );
                    this.log('✅ Node updated via metadata form: ' + metaData.entityId);
                    return updatedNode;
                }
            } else if (metaData.entityType === 'relationship') {
                const sourceId = metaData.sourceId;
                const targetId = metaData.targetId;
                const type = metaData.updates?.type || metaData.updates?.label;
                
                const updatedRel = await window.Neo4jConnection.updateSandboxRelationship(
                    metaData.entityId,
                    metaData.updates,
                    sourceId,
                    targetId,
                    type || 'RELATED_TO',
                    this.sandboxState.currentInterviewId
                );
                this.log('✅ Relationship updated via metadata form: ' + metaData.entityId);
                return updatedRel;
            }
            
            this.log('⚠️ Unknown metadata save operation:', metaData);
            return null;
            
        } catch (error) {
            this.log('❌ Metadata save failed: ' + error.message);
            console.error('MetaSave error:', error);
            throw error;
        }
    }

    /**
     * Create a new sandbox node
     */
    async createSandboxNode(nodeData) {
        this.log('🆕 Creating sandbox node:', nodeData);
        
        try {
            const userId = firebase.auth().currentUser?.uid;
            const twinId = `${userId}-1`;
            
            const createdNode = await window.Neo4jConnection.createSandboxNode(
                nodeData,
                userId,
                twinId,
                this.sandboxState.currentInterviewId
            );
            
            this.log('✅ Sandbox node created: ' + createdNode.id);
            return createdNode;
            
        } catch (error) {
            this.log('❌ Failed to create sandbox node: ' + error.message);
            console.error('Create node error:', error);
            throw error;
        }
    }

    /**
     * Update an existing sandbox node
     */
    async updateSandboxNode(nodeId, updates) {
        this.log('📝 Updating sandbox node:', nodeId, updates);
        
        try {
            const updatedNode = await window.Neo4jConnection.updateSandboxNode(
                nodeId,
                updates,
                []
            );
            
            this.log('✅ Sandbox node updated: ' + nodeId);
            return updatedNode;
            
        } catch (error) {
            this.log('❌ Failed to update sandbox node: ' + error.message);
            console.error('Update node error:', error);
            throw error;
        }
    }

    /**
     * Delete sandbox nodes
     */
    async deleteSandboxNodes(nodeIds) {
        this.log('🗑️ Deleting sandbox nodes:', nodeIds);
        
        try {
            if (!window.Neo4jConnection.isConnected) {
                await window.Neo4jConnection.connect();
            }
            
            const results = [];
            for (const nodeId of nodeIds) {
                try {
                    const deleted = await window.Neo4jConnection.deleteSandboxNode(nodeId);
                    
                    if (deleted) {
                        this.log('✅ Node deleted from database: ' + nodeId);
                        results.push({ nodeId, success: true });
                    } else {
                        this.log('⚠️ Node not found in database: ' + nodeId);
                        results.push({ nodeId, success: false, reason: 'not_found' });
                    }
                } catch (error) {
                    this.log('❌ Failed to delete node: ' + nodeId + ' - ' + error.message);
                    results.push({ nodeId, success: false, error: error.message });
                }
            }
            
            return results;
            
        } catch (error) {
            this.log('❌ Failed to delete sandbox nodes: ' + error.message);
            console.error('Delete nodes error:', error);
            throw error;
        }
    }

    /**
     * Create a new sandbox relationship
     */
    async createSandboxRelationship(edgeData) {
        this.log('🔗 Creating sandbox relationship:', edgeData);
        
        try {
            const createdRel = await window.Neo4jConnection.createSandboxRelationship(
                edgeData.source,
                edgeData.target,
                edgeData.label || edgeData.type || 'RELATED_TO',
                edgeData.properties || {},
                this.sandboxState.currentInterviewId
            );
            
            this.log('✅ Sandbox relationship created: ' + createdRel.id);
            return createdRel;
            
        } catch (error) {
            this.log('❌ Failed to create sandbox relationship: ' + error.message);
            console.error('Create relationship error:', error);
            throw error;
        }
    }

    /**
     * Delete sandbox relationships
     */
    async deleteSandboxRelationships(edgeIds) {
        this.log('🗑️ Deleting sandbox relationships:', edgeIds);
        
        try {
            if (!window.Neo4jConnection.isConnected) {
                await window.Neo4jConnection.connect();
            }
            
            const results = [];
            for (const edgeId of edgeIds) {
                try {
                    const deleted = await window.Neo4jConnection.deleteSandboxRelationship(edgeId);
                    
                    if (deleted) {
                        this.log('✅ Edge deleted from database: ' + edgeId);
                        results.push({ edgeId, success: true });
                    } else {
                        this.log('⚠️ Edge not found in database: ' + edgeId);
                        results.push({ edgeId, success: false, reason: 'not_found' });
                    }
                } catch (error) {
                    this.log('❌ Failed to delete edge: ' + edgeId + ' - ' + error.message);
                    results.push({ edgeId, success: false, error: error.message });
                }
            }
            
            return results;
            
        } catch (error) {
            this.log('❌ Failed to delete sandbox relationships: ' + error.message);
            console.error('Delete relationships error:', error);
            throw error;
        }
    }

    /**
     * Handle node drops onto the sandbox canvas
     */
    async handleSandboxNodeDrop(nodeData, dropType, position, targetId = null) {
        this.log('📦 Handling sandbox node drop:', { nodeData, dropType, position, targetId });
        
        try {
            if (!window.Neo4jConnection.isConnected) {
                await window.Neo4jConnection.connect();
            }
            
            const userId = firebase.auth().currentUser?.uid;
            const twinId = `${userId}-1`;
            let newNodeId = null;
            
            if (dropType === 'onto-canvas') {
                // All nodes from the node list are production nodes with existing IDs
                if (nodeData.id) {
                    // First check if this node already exists in sandbox
                    const existingNode = this.sandboxState.currentSandboxData.nodes.find(n => n.id === nodeData.id);
                    if (existingNode) {
                        this.log('⚠️ Node already exists in sandbox, updating position only:', nodeData.id);
                        
                        if (position) {
                            // Update position of existing node
                            await this.updateSandboxNode(existingNode.id, {
                                x: position.x,
                                y: position.y
                            });
                            existingNode.x = position.x;
                            existingNode.y = position.y;
                        }
                        
                        return existingNode;
                    }
                    
                    // Copy existing production node to sandbox
                    this.log('📋 Copying production node to sandbox:', nodeData.id);
                    try {
                        const copiedNode = await window.Neo4jConnection.copyProductionNodeToSandbox(
                            nodeData.id,
                            this.sandboxState.currentInterviewId
                        );
                        
                        if (position) {
                            // Update position of copied node
                            await this.updateSandboxNode(copiedNode.id, {
                                x: position.x,
                                y: position.y
                            });
                        }
                        
                        this.log('✅ Production node copied to sandbox: ' + copiedNode.id);
                        return copiedNode;
                    } catch (error) {
                        // If copy fails due to constraint, the node might already exist in sandbox
                        if (error.message.includes('already exists')) {
                            this.log('⚠️ Node constraint violation - checking if already in sandbox');
                            // Reload sandbox data to get the latest state
                            await this.loadExistingSandboxData();
                            const existingNode = this.sandboxState.currentSandboxData.nodes.find(n => n.id === nodeData.id);
                            if (existingNode) {
                                return existingNode;
                            }
                        }
                        throw error;
                    }
                } else {
                    // This should rarely happen - nodes from node list always have IDs
                    throw new Error('Node data missing ID - cannot drop nodes without IDs from production');
                }
            } else if (dropType === 'onto-node' && targetId) {
                // Handle dropping onto another node - create relationship
                
                // First ensure the source node exists in sandbox
                if (nodeData.id) {
                    // Check if node already exists in sandbox
                    let sourceNode = this.sandboxState.currentSandboxData.nodes.find(n => n.id === nodeData.id);
                    
                    if (!sourceNode) {
                        // Copy production node to sandbox
                        try {
                            sourceNode = await window.Neo4jConnection.copyProductionNodeToSandbox(
                                nodeData.id,
                                this.sandboxState.currentInterviewId
                            );
                            this.log('✅ Source node copied to sandbox: ' + sourceNode.id);
                        } catch (error) {
                            if (error.message.includes('already exists')) {
                                // Reload and try to find it
                                await this.loadExistingSandboxData();
                                sourceNode = this.sandboxState.currentSandboxData.nodes.find(n => n.id === nodeData.id);
                            }
                            if (!sourceNode) throw error;
                        }
                    }
                    
                    newNodeId = sourceNode.id;
                } else {
                    throw new Error('Cannot create relationship - source node missing ID');
                }
                
                // Create relationship between the new/copied node and target
                const newRel = await window.Neo4jConnection.createSandboxRelationship(
                    newNodeId,
                    targetId,
                    'RELATED_TO',
                    {},
                    this.sandboxState.currentInterviewId
                );
                
                this.log('✅ Node drop with relationship created: ' + newNodeId + ' -> ' + targetId);
                return { nodeId: newNodeId, relationshipId: newRel.id };
            }
            
        } catch (error) {
            this.log('❌ Failed to handle node drop: ' + error.message);
            console.error('Node drop error:', error);
            throw error;
        }
    }

    /**
     * Copy production node to sandbox
     */
    async copyProductionNodeToSandbox(nodeId) {
        try {
            const copiedNode = await window.Neo4jConnection.copyProductionNodeToSandbox(
                nodeId,
                this.sandboxState.currentInterviewId
            );
            
            this.log('✅ Production node copied to sandbox: ' + copiedNode.id);
            return copiedNode;
            
        } catch (error) {
            this.log('❌ Failed to copy production node: ' + error.message);
            console.error('Copy node error:', error);
            throw error;
        }
    }

    /**
     * Commit sandbox changes to production
     */
    async commitSandboxToProduction() {
        this.log('🚀 Committing sandbox to production...');
        
        try {
            if (!window.Neo4jConnection.isConnected) {
                const connected = await window.Neo4jConnection.connect();
                if (!connected) {
                    throw new Error('Failed to connect to Neo4j');
                }
            }
            
            const userId = firebase.auth().currentUser?.uid;
            const twinId = `${userId}-1`;
            
            const result = await window.Neo4jConnection.commitSandboxToProduction(
                this.sandboxState.currentInterviewId,
                userId,
                twinId
            );
            
            this.log('✅ Sandbox committed to production successfully');
            return result;
            
        } catch (error) {
            this.log('❌ Failed to commit sandbox to production: ' + error.message);
            console.error('Commit to production error:', error);
            throw error;
        }
    }

    /**
     * Get Neo4j connection status
     */
    isConnected() {
        return window.Neo4jConnection?.isConnected || false;
    }

    /**
     * Connect to Neo4j if not already connected
     */
    async ensureConnected() {
        if (!this.isConnected()) {
            return await window.Neo4jConnection.connect();
        }
        return true;
    }
}

// Export for use in other modules
export function createSandboxNeo4jIntegration(sandboxState) {
    return new SandboxNeo4jIntegration(sandboxState);
}