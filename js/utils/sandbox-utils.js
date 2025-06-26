/**
 * Sandbox-specific utility functions
 */

/**
 * Get icon for file type
 * @param {string} fileType - The file type/mime type
 * @returns {string} Emoji icon for the file type
 */
export function getFileIcon(fileType) {
    if (!fileType) return '📄';
    
    if (fileType.includes('pdf')) return '📑';
    if (fileType.includes('word') || fileType.includes('doc')) return '📝';
    if (fileType.includes('excel') || fileType.includes('sheet')) return '📊';
    if (fileType.includes('powerpoint') || fileType.includes('presentation')) return '📽️';
    if (fileType.includes('text')) return '📄';
    if (fileType.includes('zip') || fileType.includes('archive')) return '📦';
    if (fileType.includes('video')) return '🎥';
    if (fileType.includes('audio')) return '🎵';
    
    return '📄';
}

/**
 * Get icon for node type
 * @param {string} type - The node type
 * @returns {string} Emoji icon for the node type
 */
export function getNodeTypeIcon(type) {
    const icons = {
        person: '👤',
        organization: '🏢',
        location: '📍',
        event: '📅',
        thing: '📦',
        default: '⚪'
    };
    return icons[type] || icons.default;
}

/**
 * Get color for node type
 * @param {string} type - The node type
 * @returns {string} Hex color code for the node type
 */
export function getNodeColor(type) {
    const colors = {
        person: '#9C88FF',
        organization: '#FF9F7F', 
        location: '#74B9FF',
        event: '#FF7675',
        thing: '#6BCF7F',
        default: '#9CA3AF'
    };
    return colors[type] || colors.default;
}

/**
 * Check if required bundles are loaded
 * @returns {boolean} True if React, ReactDOM, and NexusGraphControl are loaded
 */
export function checkBundle() {
    const hasReact = typeof React !== 'undefined';
    const hasReactDOM = typeof ReactDOM !== 'undefined';
    const hasNexus = typeof window.NexusGraphControl !== 'undefined';
    
    return hasReact && hasReactDOM && hasNexus;
}

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