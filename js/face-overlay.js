/**
 * Face Overlay Module
 * Renders bounding boxes on images to show detected faces
 */

/**
 * Create an overlay canvas with face bounding boxes
 * @param {HTMLImageElement} img - The image element
 * @param {Array} faces - Array of face objects with BoundingBox property
 * @returns {HTMLCanvasElement} Canvas with bounding boxes drawn
 */
export function createFaceOverlay(img, faces) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas size to match image
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;
    
    // Draw the original image
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    
    // Draw bounding boxes for each face
    faces.forEach((face, index) => {
        if (!face.BoundingBox) return;
        
        const box = face.BoundingBox;
        
        // Convert normalized coordinates (0-1) to pixels
        const x = (box.Left || 0) * canvas.width;
        const y = (box.Top || 0) * canvas.height;
        const width = (box.Width || 0) * canvas.width;
        const height = (box.Height || 0) * canvas.height;
        
        // Draw bounding box
        ctx.strokeStyle = '#10B981'; // Green color
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, width, height);
        
        // Draw face number label
        ctx.fillStyle = '#10B981';
        ctx.fillRect(x, y - 25, 60, 25);
        ctx.fillStyle = 'white';
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText(`Face ${index + 1}`, x + 5, y - 5);
        
        // Draw confidence if available
        if (face.Confidence) {
            const confidence = Math.round(face.Confidence);
            ctx.fillStyle = '#10B981';
            ctx.fillRect(x, y + height, 70, 20);
            ctx.fillStyle = 'white';
            ctx.font = '12px sans-serif';
            ctx.fillText(`${confidence}%`, x + 5, y + height + 15);
        }
    });
    
    return canvas;
}

/**
 * Show image with face overlays in modal
 * @param {Object} file - File object with extractedFaces
 */
export async function showImageWithFaces(file) {
    const modal = document.getElementById('imageModal');
    const container = modal?.querySelector('.image-container');
    
    if (!modal || !container || !file.downloadURL || !file.extractedFaces?.length) {
        // Fallback to regular image modal
        if (window.showImageModal) {
            window.showImageModal(file);
        }
        return;
    }
    
    // Clear container
    container.innerHTML = '<div class="loading">Loading image with faces...</div>';
    
    // Show modal
    modal.classList.add('active');
    
    // Update modal title and metadata
    const modalTitle = document.getElementById('imageModalTitle');
    const modalSize = document.getElementById('imageModalSize');
    const modalDate = document.getElementById('imageModalDate');
    const modalType = document.getElementById('imageModalType');
    
    if (modalTitle) modalTitle.textContent = file.fileName || file.name || 'Image';
    if (modalSize) modalSize.textContent = formatFileSize(file.fileSize || file.size || 0);
    if (modalDate) modalDate.textContent = formatDate(file.uploadedAt || file.dateUploaded);
    if (modalType) modalType.textContent = file.fileType || 'Unknown';
    
    // Add Face Details button to header if faces exist
    const modalHeader = modal.querySelector('.image-modal-header');
    if (modalHeader && file.extractedFaces?.length > 0) {
        // Remove any existing face details button
        const existingBtn = modalHeader.querySelector('.face-details-btn');
        if (existingBtn) existingBtn.remove();
        
        // Create face details button
        const faceDetailsBtn = document.createElement('button');
        faceDetailsBtn.className = 'btn-secondary face-details-btn';
        faceDetailsBtn.style.marginLeft = 'auto';
        faceDetailsBtn.style.marginRight = '10px';
        faceDetailsBtn.innerHTML = `
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20" style="margin-right: 6px;">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"/>
            </svg>
            View Faces (${file.extractedFaces.length})
        `;
        faceDetailsBtn.onclick = (e) => window.showFaces(e, file);
        
        // Insert button before the close button
        const closeBtn = modalHeader.querySelector('.modal-close');
        modalHeader.insertBefore(faceDetailsBtn, closeBtn);
    }
    
    try {
        // Load image
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = file.downloadURL;
        });
        
        // Create overlay canvas
        const canvas = createFaceOverlay(img, file.extractedFaces);
        canvas.className = 'modal-image face-overlay-canvas';
        canvas.style.maxWidth = '100%';
        canvas.style.height = 'auto';
        
        // Replace loading with canvas
        container.innerHTML = '';
        container.appendChild(canvas);
        
        // Add face count info below image (without button)
        const faceInfo = document.createElement('div');
        faceInfo.className = 'face-overlay-info';
        faceInfo.innerHTML = `
            <p>${file.extractedFaces.length} face${file.extractedFaces.length !== 1 ? 's' : ''} detected</p>
        `;
        container.appendChild(faceInfo);
        
    } catch (error) {
        console.error('Error loading image with faces:', error);
        container.innerHTML = '<div class="error">Failed to load image</div>';
    }
}

// Helper functions (should be imported from utils in real implementation)
function formatFileSize(bytes) {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDate(date) {
    if (!date) return 'Unknown';
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString();
}

// Export for use in my-files.js
export default {
    createFaceOverlay,
    showImageWithFaces
};