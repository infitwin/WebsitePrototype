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
            // Check if already loaded
            if (window.NexusMetadataControl) {
                this.isLoaded = true;
                resolve(true);
                return;
            }
            
            // Load the bundle
            const script = document.createElement('script');
            script.src = '../bundles/nexus-metadata-control.min.js';
            script.onload = () => {
                if (window.NexusMetadataControl) {
                    this.isLoaded = true;
                    console.log('✅ Nexus Metadata Editor loaded');
                    resolve(true);
                } else {
                    reject(new Error('NexusMetadataControl not found after loading'));
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
            
            // Show loading state
            container.innerHTML = '<div style="padding: 20px; text-align: center;">Loading editor...</div>';
            
            // Mount the form
            this.currentHandle = window.NexusMetadataControl.mount(container, {
                entity: entity,
                onChange: (updatedEntity) => {
                    // Convert back to node format
                    const updatedNode = this.prepareNodeUpdate(updatedEntity, node);
                    
                    // Call the update callback
                    if (onUpdate) {
                        onUpdate(updatedNode, updatedEntity);
                    }
                    
                    // Close the editor
                    this.hideEditor();
                    if (onClose) onClose(true);
                },
                onCancel: () => {
                    this.hideEditor();
                    if (onClose) onClose(false);
                },
                config: {
                    enableValidation: true,
                    showOptionalFields: true
                }
            });
            
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
            this.currentHandle.unmount();
            this.currentHandle = null;
        }
    }

    /**
     * Show editor in a modal
     * @param {Object} node - Graph node to edit
     * @param {Function} onUpdate - Callback when node is updated
     */
    showEditorModal(node, onUpdate) {
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
        
        // Show editor
        this.showEditor(node, content, onUpdate, (saved) => {
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
}