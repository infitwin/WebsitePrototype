/**
 * Face Extractor Module
 * Extracts face thumbnails from images using bounding box data
 */

/**
 * Extract a face from an image using bounding box coordinates
 * @param {string} imageUrl - URL of the source image
 * @param {Object} boundingBox - Face bounding box {x, y, width, height}
 * @returns {Promise<string>} Data URL of the extracted face
 */
export async function extractFaceFromImage(imageUrl, boundingBox) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous'; // Enable CORS for Firebase Storage URLs
        
        img.onload = function() {
            // Create canvas for face extraction
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Convert percentage-based coordinates to pixels
            // Firestore uses: Left, Top, Width, Height (all 0-1)
            const x = (boundingBox.Left || boundingBox.x || 0) * img.width;
            const y = (boundingBox.Top || boundingBox.y || 0) * img.height;
            const width = (boundingBox.Width || boundingBox.width || 0) * img.width;
            const height = (boundingBox.Height || boundingBox.height || 0) * img.height;
            
            // Set canvas size to extracted face dimensions (150x150 for thumbnails)
            const thumbnailSize = 150;
            canvas.width = thumbnailSize;
            canvas.height = thumbnailSize;
            
            // Draw the face region from the source image, scaled to thumbnail size
            ctx.drawImage(
                img,
                x,                  // Source X (pixels)
                y,                  // Source Y (pixels)
                width,              // Source Width (pixels)
                height,             // Source Height (pixels)
                0,                  // Destination X
                0,                  // Destination Y
                thumbnailSize,      // Destination Width
                thumbnailSize       // Destination Height
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

/**
 * Extract all faces from an image given an array of face data
 * @param {string} imageUrl - URL of the source image
 * @param {Array} faces - Array of face objects with boundingBox property
 * @returns {Promise<Array>} Array of face thumbnails with data URLs
 */
export async function extractAllFaces(imageUrl, faces) {
    if (!faces || faces.length === 0) {
        return [];
    }
    
    const facePromises = faces.map(async (face, index) => {
        try {
            const faceDataUrl = await extractFaceFromImage(imageUrl, face.BoundingBox || face.boundingBox);
            return {
                index: index,
                dataUrl: faceDataUrl,
                confidence: face.Confidence || face.confidence,
                faceId: face.faceId,
                vectorId: face.vectorId
            };
        } catch (error) {
            console.error(`Failed to extract face ${index}:`, error);
            return null;
        }
    });
    
    const extractedFaces = await Promise.all(facePromises);
    return extractedFaces.filter(face => face !== null);
}

/**
 * Create a face thumbnail element
 * @param {Object} faceData - Face data with dataUrl
 * @param {number} index - Face index
 * @returns {HTMLElement} Face thumbnail element
 */
export function createFaceThumbnailElement(faceData, index) {
    const faceItem = document.createElement('div');
    faceItem.className = 'face-item';
    
    const img = document.createElement('img');
    img.src = faceData.dataUrl;
    img.className = 'face-thumb';
    img.alt = `Face ${index + 1}`;
    
    const label = document.createElement('div');
    label.className = 'face-label';
    label.textContent = `Face ${index + 1}`;
    
    faceItem.appendChild(img);
    faceItem.appendChild(label);
    
    return faceItem;
}