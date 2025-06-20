// Fix for image click vs selection issue
// This code ensures clicking on an image to view it doesn't affect file selection

function fixImageClickSelection() {
    console.log('🔧 Applying fix for image click vs selection separation...');
    
    // Get all file cards
    const fileCards = document.querySelectorAll('.file-card');
    
    fileCards.forEach(card => {
        const thumbnail = card.querySelector('.file-thumbnail');
        const checkbox = card.querySelector('.file-checkbox');
        
        if (thumbnail && thumbnail.tagName === 'IMG') {
            // Remove any existing click handlers
            const newThumbnail = thumbnail.cloneNode(true);
            thumbnail.parentNode.replaceChild(newThumbnail, thumbnail);
            
            // Add new click handler that prevents selection
            newThumbnail.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();
                
                // Get file data
                const fileId = card.dataset.fileId;
                const file = window.currentFiles?.find(f => f.id === fileId);
                
                if (file) {
                    console.log('📸 Opening image modal for:', file.fileName || file.name);
                    window.showImageModal(file);
                }
            }, true);
            
            // Ensure clicking anywhere else on the thumbnail container doesn't select
            const thumbnailContainer = card.querySelector('.file-thumbnail-container');
            if (thumbnailContainer) {
                thumbnailContainer.addEventListener('click', function(e) {
                    // Only allow clicks on specific elements
                    const target = e.target;
                    const isAllowed = 
                        target.classList.contains('file-checkbox') ||
                        target.closest('.quick-actions') ||
                        target.closest('.face-indicator') ||
                        target.closest('.processing-indicator');
                    
                    if (!isAllowed) {
                        e.preventDefault();
                        e.stopPropagation();
                    }
                }, true);
            }
        }
        
        // Ensure checkbox works properly
        if (checkbox) {
            checkbox.addEventListener('click', function(e) {
                e.stopPropagation();
            }, true);
        }
    });
    
    // Also ensure the vectorize button always shows correct text
    const vectorizeBtn = document.getElementById('vectorizeBtn');
    if (vectorizeBtn) {
        // Save the original HTML
        const originalHTML = `
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"/>
            </svg>
            Vectorize Selected
        `;
        
        // Ensure it always shows the correct text
        if (!vectorizeBtn.innerHTML.includes('Vectorize Selected')) {
            vectorizeBtn.innerHTML = originalHTML;
        }
    }
    
    console.log('✅ Fix applied successfully');
}

// Apply the fix when the page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fixImageClickSelection);
} else {
    fixImageClickSelection();
}

// Also apply fix when new files are added
const originalRenderFiles = window.renderFiles;
if (originalRenderFiles) {
    window.renderFiles = function(...args) {
        const result = originalRenderFiles.apply(this, args);
        setTimeout(fixImageClickSelection, 100);
        return result;
    };
}