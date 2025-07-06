/**
 * Sandbox Event System Module
 * Extracted from sandbox.html - Phase 2 of Architecture Refactoring
 * 
 * Manages all event handling, panel toggles, toolbar states, and UI interactions
 * for the sandbox graph editor.
 */

export class SandboxEvents {
    constructor(sandboxState, firebaseIntegration) {
        this.sandboxState = sandboxState;
        this.firebaseIntegration = firebaseIntegration;
        this.log = sandboxState.log.bind(sandboxState);
        
        // Initialize global event handling
        this.initializeGlobalEvents();
    }

    /**
     * Initialize global event listeners
     */
    initializeGlobalEvents() {
        // Make togglePanel globally accessible
        window.togglePanel = this.togglePanel.bind(this);
        
        // Add any other global event listeners here
        this.log('🎮 Sandbox Events initialized');
    }

    /**
     * Toggle a panel open/closed
     * @param {string} panelId - The ID of the panel to toggle
     */
    togglePanel(panelId) {
        const panel = document.getElementById(panelId + 'Panel');
        if (!panel) {
            this.log('❌ Panel not found: ' + panelId);
            return;
        }
        
        const isOpen = panel.classList.contains('open');
        
        if (isOpen) {
            this.closePanelHandler(panelId, panel);
        } else {
            this.openPanelHandler(panelId, panel);
        }
        
        // Update toolbar button states
        this.updateToolbarStates();
    }

    /**
     * Handle panel closing
     * @param {string} panelId - Panel ID
     * @param {HTMLElement} panel - Panel element
     */
    closePanelHandler(panelId, panel) {
        panel.classList.remove('open');
        this.log('📋 ' + panelId + ' panel closed');
        
        // Clean up production panel when closing
        if (panelId === 'production' && this.sandboxState.productionRoot) {
            this.sandboxState.productionRoot.unmount();
            this.sandboxState.setState({ productionRoot: null });
            this.log('🧹 Production panel unmounted');
        }
    }

    /**
     * Handle panel opening
     * @param {string} panelId - Panel ID  
     * @param {HTMLElement} panel - Panel element
     */
    openPanelHandler(panelId, panel) {
        panel.classList.add('open');
        this.log('📋 ' + panelId + ' panel opened');
        
        // Initialize drag functionality for any panel
        if (window.initializeDragFunctionality) {
            window.initializeDragFunctionality(panelId);
        }
        
        // Initialize resize observer for all panels
        this.observePanelResize(panelId);
        
        // Special handling for different panels
        switch (panelId) {
            case 'production':
                setTimeout(async () => {
                    if (window.initializeProduction) {
                        await window.initializeProduction();
                    }
                }, 200);
                break;
                
            case 'node-list':
                this.handleNodeListPanel();
                break;
                
            case 'artifacts':
                this.handleArtifactsPanel();
                break;
                
            case 'faces':
                this.handleFacesPanel();
                break;
        }
    }

    /**
     * Handle node list panel opening
     */
    handleNodeListPanel() {
        // Initialize Firebase first if needed for authentication
        if (!this.firebaseIntegration.isInitialized()) {
            this.firebaseIntegration.initialize();
            setTimeout(() => {
                if (firebase.auth().currentUser) {
                    this.loadNodeList();
                }
            }, 2000);
        } else if (firebase.auth().currentUser) {
            this.loadNodeList();
        } else {
            // Try to wait for auth
            this.log('⏳ Waiting for authentication...');
            const unsubscribe = firebase.auth().onAuthStateChanged((user) => {
                if (user) {
                    this.loadNodeList();
                    unsubscribe(); // Stop listening after first auth
                }
            });
        }
    }

    /**
     * Handle artifacts panel opening
     */
    handleArtifactsPanel() {
        if (!this.firebaseIntegration.isInitialized()) {
            this.firebaseIntegration.initialize();
            setTimeout(() => {
                if (firebase.auth().currentUser) {
                    this.loadUserArtifacts();
                }
            }, 2000);
        } else if (firebase.auth().currentUser) {
            this.loadUserArtifacts();
        } else {
            // Try to wait for auth
            this.log('⏳ Waiting for authentication...');
            const unsubscribe = firebase.auth().onAuthStateChanged((user) => {
                if (user) {
                    this.loadUserArtifacts();
                    unsubscribe(); // Stop listening after first auth
                }
            });
        }
    }

    /**
     * Handle faces panel opening
     */
    handleFacesPanel() {
        if (!this.firebaseIntegration.isInitialized()) {
            this.firebaseIntegration.initialize();
            setTimeout(() => {
                if (firebase.auth().currentUser) {
                    this.loadUserFaces();
                }
            }, 2000);
        } else if (firebase.auth().currentUser) {
            this.loadUserFaces();
        } else {
            // Try to wait for auth
            this.log('⏳ Waiting for authentication...');
            const unsubscribe = firebase.auth().onAuthStateChanged((user) => {
                if (user) {
                    this.loadUserFaces();
                    unsubscribe(); // Stop listening after first auth
                }
            });
        }
    }

    /**
     * Update toolbar button states to reflect open panels
     */
    updateToolbarStates() {
        document.querySelectorAll('.toolbar-btn').forEach(btn => {
            const title = btn.getAttribute('title');
            let panelId = '';
            
            // Map button titles to panel IDs
            switch(title) {
                case 'Node List': panelId = 'node-list'; break;
                case 'Faces': panelId = 'faces'; break;
                case 'Artifacts': panelId = 'artifacts'; break;
                case 'Production Graph': panelId = 'production'; break;
                case 'AI Assistant': panelId = 'ai-assistant'; break;
                case 'Tools': panelId = 'tools'; break;
            }
            
            const panel = document.getElementById(panelId + 'Panel');
            
            if (panel && panel.classList.contains('open')) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    /**
     * Observe panel resize events
     * @param {string} panelId - Panel ID to observe
     */
    observePanelResize(panelId) {
        const panel = document.getElementById(panelId + 'Panel');
        if (!panel) return;

        // Check if ResizeObserver is available
        if (typeof ResizeObserver !== 'undefined') {
            const resizeObserver = new ResizeObserver(entries => {
                for (let entry of entries) {
                    const { width, height } = entry.contentRect;
                    this.log(`📐 Panel ${panelId} resized: ${width}x${height}`);
                    
                    // Trigger any panel-specific resize handlers
                    this.handlePanelResize(panelId, width, height);
                }
            });
            
            resizeObserver.observe(panel);
        }
    }

    /**
     * Handle panel resize events
     * @param {string} panelId - Panel ID
     * @param {number} width - New width
     * @param {number} height - New height
     */
    handlePanelResize(panelId, width, height) {
        // Panel-specific resize handling
        switch (panelId) {
            case 'production':
                // Trigger production panel resize if needed
                if (this.sandboxState.productionRoot) {
                    // Could trigger a re-render or size update
                }
                break;
                
            default:
                // Default resize handling
                break;
        }
    }

    /**
     * Placeholder methods for data loading - these will be moved to appropriate modules later
     */
    loadNodeList() {
        if (window.loadNodeList) {
            window.loadNodeList();
        } else {
            this.log('⚠️ loadNodeList function not available');
        }
    }

    loadUserArtifacts() {
        if (this.firebaseIntegration && this.firebaseIntegration.loadUserArtifacts) {
            this.firebaseIntegration.loadUserArtifacts();
        } else {
            this.log('⚠️ Firebase integration not available');
        }
    }

    loadUserFaces() {
        if (this.firebaseIntegration && this.firebaseIntegration.loadUserFaces) {
            this.firebaseIntegration.loadUserFaces();
        } else {
            this.log('⚠️ Firebase integration not available');
        }
    }

    /**
     * Get current event system state
     */
    getState() {
        return {
            activeEvents: Object.keys(this),
            panelStates: this.getPanelStates()
        };
    }

    /**
     * Get current panel states
     */
    getPanelStates() {
        const panels = ['node-list', 'faces', 'artifacts', 'production', 'ai-assistant', 'tools'];
        const states = {};
        
        panels.forEach(panelId => {
            const panel = document.getElementById(panelId + 'Panel');
            states[panelId] = panel ? panel.classList.contains('open') : false;
        });
        
        return states;
    }
}

// For backward compatibility with global access
export function createSandboxEvents(sandboxState, firebaseIntegration) {
    return new SandboxEvents(sandboxState, firebaseIntegration);
}