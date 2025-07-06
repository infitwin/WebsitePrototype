/**
 * Sandbox React Components Module
 * Extracted from sandbox.html - Phase 4 of Architecture Refactoring
 * 
 * Provides factory functions for creating configured React components
 * for the sandbox and production graph visualizations.
 */

/**
 * Resolves and returns the correct NexusGraphControl component
 * Handles different bundle versions and export patterns
 */
export function getNexusComponent() {
    // v17.12.0 uses destructuring pattern: const { NexusGraphControl } = window.NexusGraphControl;
    let NexusComponent;
    
    if (window.NexusGraphControl && window.NexusGraphControl.NexusGraphControl) {
        // v17.12.0 and later pattern
        const { NexusGraphControl } = window.NexusGraphControl;
        NexusComponent = NexusGraphControl;
    } else if (window.NexusGraphControl && window.NexusGraphControl.default) {
        // Module default export pattern
        NexusComponent = window.NexusGraphControl.default;
    } else if (typeof window.NexusGraphControl === 'function') {
        // Direct function export
        NexusComponent = window.NexusGraphControl;
    } else {
        console.error('Could not find NexusGraphControl component');
        return null;
    }
    
    return NexusComponent;
}

/**
 * Creates a ForwardRef wrapper for the NexusGraphControl
 * Used for sandbox to expose ref for direct component access
 */
export function createSandboxWrapper() {
    const NexusControl = window.NexusGraphControl.NexusGraphControl;
    
    return React.forwardRef((props, ref) => {
        return React.createElement(NexusControl, { ...props, ref });
    });
}

/**
 * Creates the main sandbox graph component with full CRUD operations
 */
export function createSandboxComponent(config) {
    const {
        ref,
        data,
        state,
        neo4jConnection,
        metadataEditor,
        handleSandboxNodeDrop,
        handleSandboxFileDrop,
        Modal
    } = config;
    
    const SandboxWrapper = createSandboxWrapper();
    
    return React.createElement(SandboxWrapper, {
        ref: ref,
        data: data,
        title: "Sandbox",
        hidePageHeader: true,
        hideStatusBar: true,
        useExternalMetadataEditor: true,
        enableDelete: true,
        onDataChange: state.handleSandboxDataChange.bind(state),
        
        // Metadata save handler
        onMetaSave: async (metaData) => {
            state.log('📝 Meta save triggered:', metaData);
            
            try {
                // Ensure connection
                if (!neo4jConnection.isConnected) {
                    await neo4jConnection.connect();
                }
                
                const userId = firebase.auth().currentUser?.uid;
                const twinId = `${userId}-1`;
                
                if (metaData.entityType === 'node') {
                    if (metaData.action === 'create') {
                        const newNode = await neo4jConnection.createSandboxNode(
                            metaData.updates,
                            userId,
                            twinId,
                            state.currentInterviewId
                        );
                        state.log('✅ Created sandbox node:', newNode);
                    } else {
                        const updatedNode = await neo4jConnection.updateSandboxNode(
                            metaData.entityId,
                            metaData.updates,
                            metaData.deletedFields,
                            userId,
                            twinId,
                            state.currentInterviewId
                        );
                        state.log('✅ Updated/created sandbox node:', updatedNode);
                    }
                } else if (metaData.entityType === 'edge' || metaData.entityType === 'relationship') {
                    const { sourceId, targetId, type } = metaData.updates;
                    
                    if (!sourceId || !targetId) {
                        throw new Error('Relationship missing sourceId or targetId');
                    }
                    
                    const updatedRel = await neo4jConnection.updateSandboxRelationship(
                        metaData.entityId,
                        metaData.updates,
                        sourceId,
                        targetId,
                        type || 'RELATED_TO',
                        state.currentInterviewId
                    );
                    state.log('✅ Updated/created sandbox relationship:', updatedRel);
                }
                
                state.simulateChange();
            } catch (error) {
                state.log('❌ Meta save error:', error.message);
                console.error('Full error details:', error);
                if (Modal) {
                    new Modal({
                        title: 'Save Error',
                        content: `Failed to save changes: ${error.message}`,
                        type: 'danger'
                    }).show();
                }
            }
        },
        
        // CRUD Operations
        onNodeCreate: async (nodeData) => {
            state.log('➕ Node create triggered:', nodeData);
            
            try {
                const userId = firebase.auth().currentUser?.uid;
                const twinId = `${userId}-1`;
                
                const sandboxNode = {
                    ...nodeData,
                    _isSandbox: true,
                    interviewId: state.currentInterviewId,
                    sessionId: state.currentInterviewId
                };
                
                const createdNode = await neo4jConnection.createSandboxNode(
                    sandboxNode,
                    userId,
                    twinId,
                    state.currentInterviewId
                );
                
                state.currentSandboxData.nodes.push(createdNode);
                state.simulateChange();
                
                return createdNode;
            } catch (error) {
                state.log('❌ Node create error:', error);
                throw error;
            }
        },
        
        onNodeUpdate: async (nodeId, updates) => {
            state.log('📝 Node update triggered:', nodeId, updates);
            
            try {
                const updatedNode = await neo4jConnection.updateSandboxNode(
                    nodeId,
                    updates,
                    []
                );
                
                // Update local data
                const nodeIndex = state.currentSandboxData.nodes.findIndex(n => n.id === nodeId);
                if (nodeIndex >= 0) {
                    state.currentSandboxData.nodes[nodeIndex] = {
                        ...state.currentSandboxData.nodes[nodeIndex],
                        ...updates
                    };
                }
                
                state.simulateChange();
                return updatedNode;
            } catch (error) {
                state.log('❌ Node update error:', error);
                throw error;
            }
        },
        
        onNodesDelete: async (nodeIds) => {
            state.log('🗑️ Nodes delete triggered:', nodeIds);
            
            try {
                if (!neo4jConnection.isConnected) {
                    await neo4jConnection.connect();
                }
                
                for (const nodeId of nodeIds) {
                    try {
                        const deleted = await neo4jConnection.deleteSandboxNode(nodeId);
                        
                        if (deleted) {
                            state.log('✅ Node deleted from database: ' + nodeId);
                        } else {
                            state.log('⚠️ Node not found in database: ' + nodeId);
                        }
                    } catch (error) {
                        console.error(`Failed to delete node ${nodeId}:`, error);
                        state.log('❌ Failed to delete node ' + nodeId + ': ' + error.message);
                    }
                }
                
                state.currentSandboxData.nodes = state.currentSandboxData.nodes.filter(n => !nodeIds.includes(n.id));
                state.currentSandboxData.edges = state.currentSandboxData.edges.filter(
                    e => !nodeIds.includes(e.source) && !nodeIds.includes(e.target)
                );
                state.simulateChange();
                
            } catch (error) {
                state.log('❌ Nodes delete error:', error.message);
                console.error('Full delete error:', error);
                throw error;
            }
        },
        
        onEdgeCreate: async (edgeData) => {
            state.log('🔗 Edge create triggered:', edgeData);
            
            try {
                const createdRel = await neo4jConnection.createSandboxRelationship(
                    edgeData.source,
                    edgeData.target,
                    edgeData.label || edgeData.type || 'RELATED_TO',
                    edgeData.properties || {},
                    state.currentInterviewId
                );
                
                state.currentSandboxData.edges.push({
                    ...edgeData,
                    id: createdRel.id
                });
                
                state.simulateChange();
                return createdRel;
            } catch (error) {
                state.log('❌ Edge create error:', error);
                throw error;
            }
        },
        
        onEdgesDelete: async (edgeIds) => {
            state.log('🗑️ Edges delete triggered:', edgeIds);
            
            try {
                if (!neo4jConnection.isConnected) {
                    await neo4jConnection.connect();
                }
                
                for (const edgeId of edgeIds) {
                    try {
                        const deleted = await neo4jConnection.deleteSandboxRelationship(edgeId);
                        
                        if (deleted) {
                            state.log('✅ Edge deleted from database: ' + edgeId);
                        } else {
                            state.log('⚠️ Edge not found in database: ' + edgeId);
                        }
                    } catch (error) {
                        console.error(`Failed to delete edge ${edgeId}:`, error);
                        state.log('❌ Failed to delete edge ' + edgeId + ': ' + error.message);
                    }
                }
                
                state.currentSandboxData.edges = state.currentSandboxData.edges.filter(e => !edgeIds.includes(e.id));
                state.simulateChange();
                
            } catch (error) {
                state.log('❌ Edges delete error:', error.message);
                console.error('Full delete error:', error);
                throw error;
            }
        },
        
        // Drag and drop handlers
        onNodeDrop: handleSandboxNodeDrop,
        onFileDrop: handleSandboxFileDrop,
        
        onFaceDrop: (nodeId, imageData, isNode) => {
            if (!isNode || !nodeId) {
                console.log('❌ Face not dropped on a node');
                return;
            }
            
            const nodeIndex = state.currentSandboxData.nodes.findIndex(n => n.id === nodeId);
            if (nodeIndex === -1) {
                console.log('❌ Node not found:', nodeId);
                return;
            }
            
            let imageUrl = null;
            if (typeof imageData === 'string') {
                imageUrl = imageData;
            } else if (imageData && typeof imageData === 'object') {
                imageUrl = imageData.url || imageData.imageUrl || imageData.dataUrl || imageData.src;
            }
            
            if (!imageUrl) {
                console.log('❌ No image URL found in imageData:', imageData);
                return;
            }
            
            state.currentSandboxData.nodes[nodeIndex].imageUrl = imageUrl;
            
            if (state.sandboxGraphRef && state.sandboxGraphRef.current) {
                if (state.sandboxGraphRef.current.updateData) {
                    state.sandboxGraphRef.current.updateData(state.currentSandboxData);
                }
            }
            
            state.simulateChange();
        },
        
        // Click handlers
        onNodeClick: (node) => {
            // Single click - just select/highlight
        },
        
        onNodeDoubleClick: (node) => {
            metadataEditor.showEditorModal(node, null, state.sandboxGraphRef);
        },
        
        onEdgeClick: (edgeData) => {
            // Single click - just select/highlight
        },
        
        onEdgeDoubleClick: (edgeData) => {
            const edge = edgeData;
            
            let nodes = state.currentSandboxData.nodes;
            if (state.sandboxGraphRef.current && state.sandboxGraphRef.current.getData) {
                const graphData = state.sandboxGraphRef.current.getData();
                if (graphData && graphData.nodes) {
                    nodes = graphData.nodes;
                }
            }
            
            const sourceNode = nodes.find(n => n.id === edge.source);
            const targetNode = nodes.find(n => n.id === edge.target);
            
            if (sourceNode && targetNode) {
                try {
                    metadataEditor.showRelationshipEditorModal(
                        edge,
                        sourceNode,
                        targetNode,
                        null,
                        state.sandboxGraphRef
                    );
                } catch (error) {
                    console.error('❌ Error showing relationship editor:', error.message);
                    console.error('Full error:', error);
                }
            } else {
                console.log('❌ Could not find source or target node for edge');
                console.log('Looking for source:', edge.source);
                console.log('Looking for target:', edge.target);
                console.log('Available node IDs:', nodes.map(n => n.id));
            }
        }
    });
}

/**
 * Creates a simplified sandbox component for re-rendering
 * Used when updating sandbox data without full CRUD operations
 */
export function createSimpleSandboxComponent(config) {
    const {
        data,
        state,
        metadataEditor,
        handleSandboxNodeDrop,
        handleSandboxFileDrop
    } = config;
    
    const NexusComponent = getNexusComponent();
    if (!NexusComponent) return null;
    
    return React.createElement(NexusComponent, {
        data: data,
        title: "Sandbox",
        hidePageHeader: true,
        hideStatusBar: true,
        useExternalMetadataEditor: true,
        onDataChange: state.handleSandboxDataChange.bind(state),
        onNodeDrop: handleSandboxNodeDrop,
        onFileDrop: handleSandboxFileDrop,
        onNodeClick: (node) => {
            // Single click - just select/highlight
        },
        onNodeDoubleClick: (node) => {
            // Double click - show metadata editor
            metadataEditor.showEditorModal(node, (updatedNode) => {
                state.log('📝 Node updated in sandbox:', updatedNode);
            });
        },
        onEdgeClick: (edge) => {
            // Single click - just select/highlight edge
            console.log('🔗 Edge selected:', edge.id);
            state.log('🔗 Edge selected:', edge.id);
        },
        onEdgeDoubleClick: (edge) => {
            // Double click - show edge metadata editor
            console.log('🔗 Edge double-clicked:', edge.id);
            state.log('🔗 Edge double-clicked:', edge.id);
            
            // Find source and target nodes for context
            const sourceNode = state.currentSandboxData.nodes.find(n => n.id === edge.source);
            const targetNode = state.currentSandboxData.nodes.find(n => n.id === edge.target);
            
            if (sourceNode && targetNode) {
                metadataEditor.showRelationshipEditorModal(edge, sourceNode, targetNode, 
                    (updatedEdge) => {
                        state.log('📝 Edge updated in sandbox:', updatedEdge);
                    },
                    state.sandboxGraphRef
                );
            } else {
                state.log('❌ Could not find source or target nodes for edge:', edge.id);
            }
        }
    });
}

/**
 * Creates the production view component (read-only with copy functionality)
 */
export function createProductionComponent(config) {
    const {
        data,
        state,
        metadataEditor,
        handleProductionCopyToSandbox,
        handleProductionFileDrop
    } = config;
    
    const NexusComponent = getNexusComponent();
    if (!NexusComponent) return null;
    
    return React.createElement(NexusComponent, {
        data: data,
        title: "Production",
        hidePageHeader: true,
        hideStatusBar: true,
        useExternalMetadataEditor: true,
        readOnly: false,  // Allow editing with the form
        hideAddButton: true,
        showCopyButton: true,
        onCopyClick: handleProductionCopyToSandbox,
        onFileDrop: handleProductionFileDrop,
        onNodeClick: (node) => {
            // Single click - just select/highlight
            state.log('🖱️ Production node selected:', node.id, node.name || node.label);
        },
        onNodeDoubleClick: (node) => {
            // Double click - show metadata editor
            state.log('🖱️ Production node double-clicked:', node);
            if (!metadataEditor) {
                state.log('❌ Metadata editor not initialized!');
                return;
            }
            metadataEditor.showEditorModal(node, (updatedNode) => {
                state.log('📝 Node updated:', updatedNode);
                // The graph should auto-update when data changes
            });
        },
        width: '100%',
        height: '100%',
        style: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }
    });
}

/**
 * Helper function to render a component to a React root
 */
export function renderComponent(root, component) {
    if (root && component) {
        root.render(component);
    }
}