/**
 * Nexus Metadata Editor Integration for Sandbox
 * Handles integration of the Nexus Metadata Editor Forms with the graph visualization
 */

export class MetadataEditorIntegration {
    constructor() {
        this.currentHandle = null;
        this.isLoaded = false;
        this.loadPromise = null;
    }

    /**
     * Load the Nexus Metadata Editor bundle
     * @returns {Promise<boolean>} True if loaded successfully
     */
    async loadEditor() {
        if (this.isLoaded) return true;
        
        // Return existing promise if already loading
        if (this.loadPromise) return this.loadPromise;
        
        this.loadPromise = new Promise((resolve, reject) => {
            // Check if already loaded (v2.0.0 uses NexusMetadataEditor)
            if (window.NexusMetadataEditor || window.NexusMetadataControl) {
                this.isLoaded = true;
                resolve(true);
                return;
            }
            
            // Load the bundle
            const script = document.createElement('script');
            script.src = '../bundles/nexus-metadata-editor-v3.1.0.bundle.js';
            script.onload = () => {
                // v3.1.0 exports as NexusMetadataEditor
                if (window.NexusMetadataEditor) {
                    // Create alias for backward compatibility
                    window.NexusMetadataControl = window.NexusMetadataEditor;
                    this.isLoaded = true;
                    console.log('✅ Nexus Metadata Editor v3.1.0 loaded');
                    console.log('📦 NexusMetadataEditor type:', typeof window.NexusMetadataEditor);
                    console.log('📦 NexusMetadataEditor keys:', Object.keys(window.NexusMetadataEditor));
                    console.log('📦 Has mount method?', typeof window.NexusMetadataEditor.mount);
                    console.log('🎉 v3.1.0 features:');
                    console.log('  - JSON-safe data (no Map objects)');
                    console.log('  - Temporal data is optional');
                    console.log('  - Empty strings handled properly');
                    
                    resolve(true);
                } else if (window.NexusMetadataControl) {
                    // Fallback for older bundles
                    this.isLoaded = true;
                    console.log('✅ Nexus Metadata Editor loaded (legacy)');
                    resolve(true);
                } else {
                    reject(new Error('NexusMetadataEditor not found after loading'));
                }
            };
            script.onerror = () => {
                reject(new Error('Failed to load Nexus Metadata Editor bundle'));
            };
            
            document.head.appendChild(script);
        });
        
        return this.loadPromise;
    }

    /**
     * Map graph node types to editor entity types
     * @param {string} nodeType - The node type from the graph (lowercase)
     * @returns {string} The entity type for the editor (capitalized)
     */
    getEntityType(nodeType) {
        const typeMap = {
            'person': 'Person',
            'user': 'Person',
            'individual': 'Person',
            'organization': 'Organization',
            'company': 'Organization',
            'org': 'Organization',
            'event': 'Event',
            'meeting': 'Event',
            'conference': 'Event',
            'place': 'Place',
            'location': 'Place',
            'venue': 'Place',
            'thing': 'Thing',
            'object': 'Thing',
            'item': 'Thing'
        };
        return typeMap[nodeType?.toLowerCase()] || 'Thing';
    }

    /**
     * Convert graph node data to entity format for the editor
     * @param {Object} node - Graph node data
     * @returns {Object} Entity data for the editor
     */
    prepareEntity(node) {
        // Extract properties, handling different node formats
        const props = node.properties || node.data || {};
        
        const entity = {
            id: node.id,
            name: node.label || node.name || props.name || 'Unnamed',
            type: this.getEntityType(node.type),
            description: props.description || '',
            // Spread any additional properties
            ...props
        };
        
        // Handle special fields for different types
        if (entity.type === 'Person') {
            // Ensure date fields are properly formatted
            if (props.birthDate) entity.birthDate = props.birthDate;
            if (props.deathDate) entity.deathDate = props.deathDate;
        } else if (entity.type === 'Organization') {
            if (props.foundingDate) entity.foundingDate = props.foundingDate;
            if (props.dissolutionDate) entity.dissolutionDate = props.dissolutionDate;
        } else if (entity.type === 'Event') {
            if (props.startDate) entity.startDate = props.startDate;
            if (props.endDate) entity.endDate = props.endDate;
        }
        
        return entity;
    }

    /**
     * Convert updated entity back to graph node format
     * @param {Object} entity - Updated entity from the editor
     * @param {Object} originalNode - Original graph node
     * @returns {Object} Updated node data for the graph
     */
    prepareNodeUpdate(entity, originalNode) {
        // Extract type and create node properties
        const { type, id, name, ...properties } = entity;
        
        // Create updated node maintaining original structure
        const updatedNode = {
            ...originalNode,
            label: name,
            // Update nested properties if that's the structure
            ...(originalNode.properties ? {
                properties: {
                    ...originalNode.properties,
                    ...properties
                }
            } : properties),
            // Update data field if that's the structure
            ...(originalNode.data ? {
                data: {
                    ...originalNode.data,
                    label: name,
                    ...properties
                }
            } : {})
        };
        
        return updatedNode;
    }

    /**
     * Show the metadata editor for a node
     * @param {Object} node - Graph node to edit
     * @param {HTMLElement} container - Container element for the form
     * @param {Function} onUpdate - Callback when node is updated
     * @param {Function} onClose - Callback when form is closed
     */
    async showEditor(node, container, onUpdate, onClose) {
        try {
            // Ensure editor is loaded
            await this.loadEditor();
            
            // Close any existing form
            if (this.currentHandle) {
                this.currentHandle.unmount();
            }
            
            // Prepare entity data
            const entity = this.prepareEntity(node);
            
            // Validate container
            if (!container) {
                console.error('❌ Container element is null or undefined');
                throw new Error('Container element not provided');
            }
            
            if (!(container instanceof HTMLElement)) {
                console.error('❌ Container is not a DOM element:', container);
                throw new Error('Container must be a DOM element');
            }
            
            console.log('✅ Container validated:', container);
            
            // Show loading state
            container.innerHTML = '<div style="padding: 20px; text-align: center;">Loading editor...</div>';
            
            // v2.0.0 uses the mount method
            if (!window.NexusMetadataEditor || typeof window.NexusMetadataEditor.mount !== 'function') {
                console.error('❌ NexusMetadataEditor.mount not available');
                throw new Error('NexusMetadataEditor v2.0.0 mount method not found');
            }
            
            console.log('📦 Mounting editor with entity:', entity);
            
            // Use v2.0.0 mount API
            try {
                this.currentHandle = window.NexusMetadataEditor.mount(container, {
                    entity: entity,
                    mode: 'inline',  // Always use inline mode
                    onSave: (updatedEntity) => {
                        console.log('📝 onSave callback triggered with:', updatedEntity);
                        // Convert back to node format
                        const updatedNode = this.prepareNodeUpdate(updatedEntity, node);
                        
                        // Call the update callback
                        if (onUpdate) {
                            onUpdate(updatedNode, updatedEntity);
                        }
                        
                        // Don't hide editor here - let the mount handle do it
                        if (onClose) onClose(true);
                    },
                    onCancel: () => {
                        console.log('❌ onCancel callback triggered');
                        // Don't hide editor here - let the mount handle do it
                        if (onClose) onClose(false);
                    }
                });
                
                console.log('✅ Editor mounted successfully');
            } catch (err) {
                console.error('❌ Failed to mount editor:', err);
                throw err;
            }
            
        } catch (error) {
            console.error('❌ Failed to show metadata editor:', error);
            container.innerHTML = `
                <div style="padding: 20px; color: #dc3545; text-align: center;">
                    <div style="font-size: 20px; margin-bottom: 10px;">⚠️</div>
                    <div>Failed to load metadata editor</div>
                    <div style="font-size: 12px; margin-top: 5px;">${error.message}</div>
                </div>
            `;
            if (onClose) onClose(false);
        }
    }

    /**
     * Hide the current editor
     */
    hideEditor() {
        if (this.currentHandle) {
            // Try different unmount methods
            if (typeof this.currentHandle.unmount === 'function') {
                this.currentHandle.unmount();
            } else if (typeof this.currentHandle.destroy === 'function') {
                this.currentHandle.destroy();
            } else if (typeof this.currentHandle.remove === 'function') {
                this.currentHandle.remove();
            } else {
                console.warn('⚠️ No unmount method found on handle:', this.currentHandle);
            }
            this.currentHandle = null;
        }
    }

    /**
     * Show editor in a modal with handleMetaSave integration
     * @param {Object} node - Graph node to edit
     * @param {Function} onUpdate - Callback when node is updated
     * @param {Object} graphRef - Reference to Nexus control for handleMetaSave
     */
    showEditorModal(node, onUpdate, graphRef = null) {
        // Create modal backdrop
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;
        
        // Create content container
        const content = document.createElement('div');
        content.style.cssText = `
            background: white;
            border-radius: 8px;
            width: 90%;
            max-width: 600px;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        `;
        modal.appendChild(content);
        
        // Add to body
        document.body.appendChild(modal);
        
        // Modified callback to use handleMetaSave if available
        const updateCallback = (updatedNode, updatedEntity) => {
            console.log('📝 Update callback triggered');
            console.log('Original node:', node);
            console.log('Updated entity:', updatedEntity);
            
            // If graphRef with handleMetaSave is available, use it
            if (graphRef && graphRef.current && typeof graphRef.current.handleMetaSave === 'function') {
                // For v2.0.0, updatedEntity contains all fields, not just changes
                // So we should pass the entire entity as updates
                const updates = {};
                
                // Copy all fields from updatedEntity except id
                Object.keys(updatedEntity).forEach(key => {
                    if (key !== 'id') {
                        updates[key] = updatedEntity[key];
                    }
                });
                
                // Find deleted fields by checking what was in node.properties but not in updatedEntity
                const deletedFields = [];
                const nodeProps = node.properties || node;
                Object.keys(nodeProps).forEach(key => {
                    if (!['id', 'type', '_isSandbox', 'interviewId', 'sessionId', 'userId', 'twinId'].includes(key) && 
                        !(key in updatedEntity)) {
                        deletedFields.push(key);
                    }
                });
                
                console.log('Calling handleMetaSave with:', {
                    entityType: 'node',
                    entityId: node.id,
                    action: 'update',
                    updates: updates,
                    deletedFields: deletedFields
                });
                
                // Call handleMetaSave with proper structure
                graphRef.current.handleMetaSave({
                    entityType: 'node',
                    entityId: node.id,
                    action: 'update',  // Always update when editing existing node
                    updates: updates,
                    deletedFields: deletedFields,
                    timestamp: new Date().toISOString()
                });
            } else if (onUpdate) {
                // Fallback to direct callback
                onUpdate(updatedNode, updatedEntity);
            }
        };
        
        // Show editor
        this.showEditor(node, content, updateCallback, (saved) => {
            document.body.removeChild(modal);
        });
        
        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.hideEditor();
                document.body.removeChild(modal);
            }
        });
    }

    /**
     * Show editor in a sidebar panel
     * @param {Object} node - Graph node to edit
     * @param {HTMLElement} panel - Sidebar panel element
     * @param {Function} onUpdate - Callback when node is updated
     */
    showEditorInPanel(node, panel, onUpdate) {
        // Find or create form container
        let formContainer = panel.querySelector('.metadata-form-container');
        if (!formContainer) {
            formContainer = document.createElement('div');
            formContainer.className = 'metadata-form-container';
            panel.appendChild(formContainer);
        }
        
        // Show panel if it has a show method or class
        if (panel.classList && panel.classList.contains('floating-panel')) {
            panel.classList.add('open');
        }
        
        // Show editor
        this.showEditor(node, formContainer, onUpdate, (saved) => {
            // Optionally hide panel after save
            if (saved && panel.classList && panel.classList.contains('floating-panel')) {
                setTimeout(() => {
                    panel.classList.remove('open');
                }, 500);
            }
        });
    }

    /**
     * Check if editor is currently showing
     * @returns {boolean} True if editor is mounted
     */
    isEditorOpen() {
        return this.currentHandle !== null;
    }

    /**
     * Get available fields for an entity type
     * @param {string} type - Entity type
     * @param {string[]} existingFields - Fields already shown
     * @returns {Array} Available optional fields
     */
    async getAvailableFields(type, existingFields = []) {
        await this.loadEditor();
        if (window.NexusMetadataControl && window.NexusMetadataControl.getAdditionalFieldsForEntity) {
            return window.NexusMetadataControl.getAdditionalFieldsForEntity(type, existingFields);
        }
        return [];
    }

    /**
     * Show relationship editor in a modal
     * @param {Object} edge - Edge/relationship data
     * @param {Object} sourceNode - Source node
     * @param {Object} targetNode - Target node
     * @param {Function} onUpdate - Callback when relationship is updated
     * @param {Object} graphRef - Reference to Nexus control for handleMetaSave
     */
    showRelationshipEditorModal(edge, sourceNode, targetNode, onUpdate, graphRef = null) {
        // Create modal backdrop
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;
        
        // Create content container
        const content = document.createElement('div');
        content.style.cssText = `
            background: white;
            border-radius: 8px;
            width: 90%;
            max-width: 700px;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        `;
        modal.appendChild(content);
        
        // Add to body
        document.body.appendChild(modal);
        
        // Show relationship editor
        this.showRelationshipEditor(edge, sourceNode, targetNode, content, (updatedRel, updatedData) => {
            console.log('🔗 Relationship updated:', updatedData);
            
            // If graphRef with handleMetaSave is available, use it
            if (graphRef && graphRef.current && typeof graphRef.current.handleMetaSave === 'function') {
                // Call handleMetaSave with relationship data
                graphRef.current.handleMetaSave({
                    entityType: 'relationship',
                    entityId: edge.id,
                    action: 'update',
                    updates: updatedData,
                    deletedFields: [],
                    timestamp: new Date().toISOString()
                });
            } else if (onUpdate) {
                // Fallback to direct callback
                onUpdate(updatedRel, updatedData);
            }
            
            document.body.removeChild(modal);
        }, (cancelled) => {
            document.body.removeChild(modal);
        });
        
        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.hideEditor();
                document.body.removeChild(modal);
            }
        });
    }

    /**
     * Show the relationship editor
     * @param {Object} edge - Edge data
     * @param {Object} sourceNode - Source node
     * @param {Object} targetNode - Target node
     * @param {HTMLElement} container - Container element
     * @param {Function} onUpdate - Update callback
     * @param {Function} onClose - Close callback
     */
    async showRelationshipEditor(edge, sourceNode, targetNode, container, onUpdate, onClose) {
        try {
            // Ensure editor is loaded
            await this.loadEditor();
            
            // Check if mount method exists (same for both nodes and relationships)
            if (!window.NexusMetadataEditor || typeof window.NexusMetadataEditor.mount !== 'function') {
                console.error('❌ NexusMetadataEditor.mount not available');
                throw new Error('NexusMetadataEditor v2.0.0 mount method not found');
            }
            
            // Prepare relationship data as 'entity' (v2.0.0 API)
            const relationshipEntity = {
                category: edge.category || this.inferRelationshipCategory(edge.type || edge.label),
                type: edge.type || edge.label || 'RELATED_TO',
                sourceId: edge.source,
                targetId: edge.target,
                stateMaps: edge.stateMaps || [],
                // Include any other properties from edge
                ...edge.properties
            };
            
            console.log('📦 Mounting relationship editor with entity:', relationshipEntity);
            
            // Debug the mount configuration
            const mountConfig = {
                entity: relationshipEntity,  // Pass relationship as 'entity'
                sourceNode: {
                    id: sourceNode.id,
                    name: sourceNode.label || sourceNode.name,
                    type: sourceNode.type || 'Person'
                },
                targetNode: {
                    id: targetNode.id,
                    name: targetNode.label || targetNode.name,
                    type: targetNode.type || 'Person'
                },
                mode: 'inline',
                onSave: (updatedRelationship) => {
                    console.log('📝 Relationship save triggered with data:', updatedRelationship);
                    console.log('📝 onUpdate callback exists:', !!onUpdate);
                    console.log('📝 onClose callback exists:', !!onClose);
                    
                    try {
                        // Convert back to edge format
                        const updatedEdge = {
                            ...edge,
                            type: updatedRelationship.type,
                            category: updatedRelationship.category,
                            stateMaps: updatedRelationship.stateMaps,
                            properties: {
                                ...updatedRelationship,
                                // Remove structural fields that shouldn't be in properties
                                category: undefined,
                                type: undefined,
                                sourceId: undefined,
                                targetId: undefined,
                                stateMaps: undefined
                            }
                        };
                        
                        console.log('📝 Calling onUpdate with updatedEdge:', updatedEdge);
                        
                        if (onUpdate) {
                            onUpdate(updatedEdge, updatedRelationship);
                        }
                        
                        console.log('📝 Calling onClose(true)');
                        if (onClose) onClose(true);
                    } catch (error) {
                        console.error('❌ Error in relationship save callback:', error);
                    }
                },
                onCancel: () => {
                    console.log('❌ Relationship edit cancelled');
                    if (onClose) onClose(false);
                }
            };
            
            console.log('🔧 Full mount configuration:', mountConfig);
            
            // Use the same mount() method but pass relationship as 'entity'
            this.currentHandle = window.NexusMetadataEditor.mount(container, mountConfig);
            
            console.log('✅ Relationship editor mounted successfully');
            console.log('📦 Handle returned:', this.currentHandle);
            
        } catch (error) {
            console.error('❌ Failed to show relationship editor:', error);
            container.innerHTML = `
                <div style="padding: 20px; color: #dc3545; text-align: center;">
                    <div style="font-size: 20px; margin-bottom: 10px;">⚠️</div>
                    <div>Failed to load relationship editor</div>
                    <div style="font-size: 12px; margin-top: 5px;">${error.message}</div>
                </div>
            `;
            if (onClose) onClose(false);
        }
    }

    /**
     * Infer relationship category from type
     * @param {string} type - Relationship type
     * @returns {string} Category
     */
    inferRelationshipCategory(type) {
        const typeUpper = type.toUpperCase();
        
        // Interpersonal relationships
        if (['FRIEND_OF', 'FAMILY_OF', 'SPOUSE_OF', 'CHILD_OF', 'PARENT_OF', 'SIBLING_OF', 'KNOWS'].includes(typeUpper)) {
            return 'INTERPERSONAL';
        }
        
        // Organizational relationships
        if (['WORKS_FOR', 'MEMBER_OF', 'LEADS', 'MANAGES', 'EMPLOYED_BY'].includes(typeUpper)) {
            return 'ORGANIZATIONAL';
        }
        
        // Experiential relationships
        if (['ATTENDED', 'PARTICIPATED_IN', 'VISITED', 'EXPERIENCED'].includes(typeUpper)) {
            return 'EXPERIENTIAL';
        }
        
        // Attribution relationships
        if (['CREATED', 'AUTHORED', 'OWNS', 'CONTRIBUTED_TO'].includes(typeUpper)) {
            return 'ATTRIBUTION';
        }
        
        // Default to referential
        return 'REFERENTIAL';
    }
}