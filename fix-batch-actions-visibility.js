// JavaScript fix to ensure batch actions appear correctly
function fixBatchActionsVisibility() {
    const originalUpdateVisibility = window.updateBatchActionsVisibility;
    
    window.updateBatchActionsVisibility = function() {
        // Call original function
        if (originalUpdateVisibility) {
            originalUpdateVisibility.apply(this, arguments);
        }
        
        const batchActions = document.getElementById('batchActions');
        const selectedCount = document.getElementById('selectedCount');
        
        if (window.selectedFiles && window.selectedFiles.size > 0) {
            if (batchActions) {
                // Force display
                batchActions.style.display = 'block';
                batchActions.style.visibility = 'visible';
                batchActions.style.opacity = '1';
                
                // Ensure it's in the right place
                const uploadZone = document.getElementById('uploadZone');
                if (uploadZone && batchActions.parentElement === uploadZone.parentElement) {
                    // Make sure it's right after upload zone
                    uploadZone.parentElement.insertBefore(batchActions, uploadZone.nextSibling);
                }
            }
            
            if (selectedCount) {
                selectedCount.textContent = window.selectedFiles.size;
            }
        } else {
            if (batchActions) {
                batchActions.style.display = 'none';
            }
        }
    };
}

// Apply fix when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fixBatchActionsVisibility);
} else {
    fixBatchActionsVisibility();
}