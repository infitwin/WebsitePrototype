/**
 * Image processing utility functions
 */

/**
 * Extract face from image using bounding box
 * @param {string} imageUrl - URL of the image
 * @param {Object} boundingBox - Face bounding box with Left, Top, Width, Height properties
 * @returns {Promise<string>} Data URL of the extracted face
 */
export async function extractFaceFromImage(imageUrl, boundingBox) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        
        img.onload = function() {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Convert percentage-based bounding box to pixels
            const imgWidth = img.width;
            const imgHeight = img.height;
            
            const left = (boundingBox.Left || boundingBox.left || 0) * imgWidth;
            const top = (boundingBox.Top || boundingBox.top || 0) * imgHeight;
            const width = (boundingBox.Width || boundingBox.width || 0.1) * imgWidth;
            const height = (boundingBox.Height || boundingBox.height || 0.1) * imgHeight;
            
            // Add some padding around the face
            const padding = Math.min(width, height) * 0.2;
            const x = Math.max(0, left - padding);
            const y = Math.max(0, top - padding);
            const w = Math.min(imgWidth - x, width + padding * 2);
            const h = Math.min(imgHeight - y, height + padding * 2);
            
            // Set canvas size to extracted face dimensions
            canvas.width = w;
            canvas.height = h;
            
            // Draw the face portion
            ctx.drawImage(
                img,
                x, y, w, h,  // Source rectangle
                0, 0, w, h   // Destination rectangle
            );
            
            // Convert to data URL
            const faceDataUrl = canvas.toDataURL('image/jpeg', 0.9);
            resolve(faceDataUrl);
        };
        
        img.onerror = function() {
            reject(new Error('Failed to load image for face extraction'));
        };
        
        img.src = imageUrl;
    });
}