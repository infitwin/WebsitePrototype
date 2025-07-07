/**
 * Production Workflow Module
 * Extracted from sandbox.html - Phase 6 of Architecture Refactoring
 * 
 * Manages the workflow for posting sandbox changes to production including
 * review modals, commit operations, and post-commit cleanup.
 */

import { createReviewFormContent } from './ui-builders.js';

export class ProductionWorkflow {
    constructor(sandboxState) {
        this.sandboxState = sandboxState;
        this.log = sandboxState.log.bind(sandboxState);
        this.activeReviewModal = null;
        
        // Make postToProduction globally accessible
        window.postToProduction = this.postToProduction.bind(this);
    }

    /**
     * Main function to post sandbox changes to production
     * Shows review modal and handles the commit workflow
     */
    async postToProduction() {
        this.log('📊 Current sandbox data:', this.sandboxState.currentSandboxData);
        this.log('🔢 Changes count:', this.sandboxState.changesCount);
        
        // Double-check we have changes to post
        if (this.sandboxState.changesCount === 0 || !this.sandboxState.currentSandboxData.nodes.length) {
            if (window.Modal) {
                const modal = new window.Modal({
                    title: 'No Changes to Post',
                    content: 'There are no pending changes in the sandbox to post to production.',
                    type: 'info',
                    actions: [
                        {
                            text: 'OK',
                            type: 'primary',
                            action: () => {} // Modal will auto-hide
                        }
                    ]
                });
                modal.show();
            } else {
                alert('No changes to post to production');
            }
            return;
        }
        

        if (this.activeReviewModal) {
            console.log('🔒 Closing existing review modal');
            this.activeReviewModal.hide();
            this.activeReviewModal = null;
        }
        
        // Show review form modal
        if (window.Modal) {
            this.activeReviewModal = new window.Modal({
                title: 'Review Changes Before Posting',
                content: createReviewFormContent(),
                size: 'medium',
                type: 'default',
                closable: true,
                actions: [
                    {
                        text: 'Cancel',
                        type: 'secondary',
                        action: () => {} // Modal will auto-hide
                    },
                    {
                        text: 'Post to Production',
                        type: 'success',
                        icon: '📤',
                        action: () => {
                            console.log('🔘 Modal Post to Production clicked!');
                            
                            // Get review notes
                            const reviewNotes = document.getElementById('reviewNotes')?.value || '';
                            console.log('📝 Review notes:', reviewNotes);
                            
                            // Hide the review modal immediately
                            console.log('🔒 Hiding review modal...');
                            this.activeReviewModal.hide();
                            this.activeReviewModal = null;
                            
                            // Proceed with posting after modal is hidden
                            setTimeout(() => {
                                console.log('📤 Calling performPostToProduction...');
                                this.performPostToProduction(reviewNotes);
                            }, 100);
                        }
                    }
                ]
            });
            this.activeReviewModal.show();
        } else {
            // Fallback to simple confirm
            const confirmPost = confirm(`Are you sure you want to post ${this.sandboxState.changesCount} ${this.sandboxState.changesCount === 1 ? 'change' : 'changes'} to production?`);
            if (!confirmPost) return;
            await this.performPostToProduction('');
        }
    }
    
    /**
     * Perform the actual post to production
     * @param {string} reviewNotes - Optional review notes from the user
     */
    async performPostToProduction(reviewNotes) {
        console.log('📝 Review notes:', reviewNotes);
        
        try {
            // Disable button during processing
            const button = document.querySelector('#postToProductionButton button');
            if (button && window.Button) {
                const buttonInstance = button._buttonInstance;
                if (buttonInstance) {
                    buttonInstance.setLoading(true);
                }
            }
            
            // Show loading modal
            let loadingModal;
            if (window.Modal) {
                loadingModal = new window.Modal({
                    title: 'Posting to Production',
                    content: '<div style="text-align: center; padding: 20px;"><div style="font-size: 48px; margin-bottom: 10px;">⏳</div><div>Processing changes...</div></div>',
                    size: 'small',
                    closable: false,
                    closeOnBackdrop: false,
                    closeOnEscape: false
                });
                loadingModal.show();
            }
            
            // Post to production
            this.log('📤 Posting changes to production...');
            this.log('📝 Review notes:', reviewNotes);
            this.log('📊 Nodes to save:', this.sandboxState.currentSandboxData.nodes.length);
            this.log('🔗 Edges to save:', this.sandboxState.currentSandboxData.edges.length);
            
            // Save to Neo4j
            const success = await this.saveToNeo4j(this.sandboxState.currentSandboxData);
            
            if (!success) {
                throw new Error('Failed to save to Neo4j');
            }
            
            // Reset changes count
            this.sandboxState.changesCount = 0;
            this.sandboxState.updateChangesDisplay();
            
            // Hide loading modal
            if (loadingModal) {
                loadingModal.hide();
            }
            
            // Ensure review modal is closed
            if (this.activeReviewModal) {
                console.log('🔒 Ensuring review modal is closed after success');
                this.activeReviewModal.hide();
                this.activeReviewModal = null;
            }
            
            // Show success modal or alert
            if (window.Modal) {
                const successModal = new window.Modal({
                    title: 'Success!',
                    content: '<div style="text-align: center; padding: 20px;"><div style="font-size: 48px; margin-bottom: 10px; color: #10B981;">✅</div><div>Changes successfully posted to production!</div></div>',
                    type: 'success',
                    size: 'small',
                    actions: [
                        {
                            text: 'OK',
                            type: 'primary',
                            action: () => {} // Modal will auto-hide
                        }
                    ]
                });
                successModal.show();
            } else {
                alert('✅ Changes successfully posted to production!');
            }
            
            this.log('✅ Production update complete');
            
            // Re-enable button
            if (button && window.Button) {
                const buttonInstance = button._buttonInstance;
                if (buttonInstance) {
                    buttonInstance.setLoading(false);
                }
            }
            
        } catch (error) {
            this.log('❌ Error posting to production:', error);
            
            // Show error modal or alert
            if (window.Modal) {
                const errorModal = new window.Modal({
                    title: 'Error',
                    content: 'Failed to post changes to production. Please try again.',
                    type: 'danger',
                    actions: [
                        {
                            text: 'OK',
                            type: 'primary',
                            action: () => {} // Modal will auto-hide
                        }
                    ]
                });
                errorModal.show();
            } else {
                alert('Error posting to production. Please try again.');
            }
            
            // Re-enable button on error
            const button = document.querySelector('#postToProductionButton button');
            if (button && window.Button) {
                const buttonInstance = button._buttonInstance;
                if (buttonInstance) {
                    buttonInstance.setLoading(false);
                }
            }
        }
    }

    /**
     * Save sandbox data to Neo4j using centralized connection
     * @param {Object} sandboxData - The sandbox data to commit
     * @returns {boolean} Success status
     */
    async saveToNeo4j(sandboxData) {
        try {
            // Get user ID and twin ID
            const userId = firebase.auth().currentUser?.uid;
            if (!userId) {
                throw new Error('User not logged in');
            }
            const twinId = `${userId}-1`;
            
            // Connect to Neo4j if not already connected
            if (!window.Neo4jConnection.isConnected) {
                const connected = await window.Neo4jConnection.connect();
                if (!connected) {
                    throw new Error('Failed to connect to Neo4j');
                }
            }
            
            // Use the new commit method that removes :Sandbox labels
            const result = await window.Neo4jConnection.commitSandboxToProduction(
                this.sandboxState.currentInterviewId,
                userId,
                twinId
            );
            
            if (result.success) {
                this.log(`✅ Committed to production: ${result.newNodes} new nodes, ${result.updatedNodes} updated nodes, ${result.relationships} relationships`);
                
                // Clear sandbox data
                this.sandboxState.currentSandboxData = { nodes: [], edges: [] };
                
                // Generate new interview ID for next session
                this.sandboxState.currentInterviewId = `interview_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                
                // Re-render empty sandbox
                await window.initializeSandbox();
                
                // Refresh production panel if open
                const productionPanel = document.getElementById('productionPanel');
                if (productionPanel && productionPanel.classList.contains('open')) {
                    this.log('🔄 Refreshing production panel...');
                    await window.initializeProduction();
                }
                
                return true;
            } else {
                throw new Error('Commit failed');
            }
            
        } catch (error) {
            this.log('❌ Error saving to Neo4j:', error);
            return false;
        }
    }

    /**
     * Get current workflow state for debugging
     */
    getState() {
        return {
            hasActiveReviewModal: !!this.activeReviewModal,
            changesCount: this.sandboxState.changesCount,
            hasChangesToCommit: this.sandboxState.currentSandboxData.nodes.length > 0
        };
    }
}

/**
 * Factory function to create production workflow instance
 */
export function createProductionWorkflow(sandboxState) {
    return new ProductionWorkflow(sandboxState);
}