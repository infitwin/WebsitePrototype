/**
 * Thumbnail Generator
 * 
 * Client-side thumbnail generation for image files during upload.
 * Creates 150x150px thumbnails and stores them in Firebase Storage.
 */

import { storage, auth } from './firebase-config.js';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// Thumbnail configuration
export const THUMBNAIL_SIZE = 150; // 150x150px as per Phase 2 spec
export const THUMBNAIL_QUALITY = 0.85; // JPEG quality
export const THUMBNAIL_FORMAT = 'image/jpeg'; // Always use JPEG for thumbnails

/**
 * Check if file type supports thumbnail generation
 * @param {string} mimeType - File MIME type
 * @returns {boolean} True if thumbnails can be generated
 */
export function canGenerateThumbnail(mimeType) {
    const supportedTypes = [
        'image/jpeg',
        'image/jpg', 
        'image/png',
        'image/gif',
        'image/webp'
    ];
    return supportedTypes.includes(mimeType);
}

/**
 * Generate thumbnail from image file
 * @param {File} imageFile - Source image file
 * @returns {Promise<Blob>} Thumbnail blob
 */
export async function generateThumbnail(imageFile) {
    return new Promise((resolve, reject) => {
        // Check if file is an image
        if (!canGenerateThumbnail(imageFile.type)) {
            reject(new Error('File type does not support thumbnail generation'));
            return;
        }

        // Create canvas for thumbnail generation
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = function() {
            // Set canvas size to thumbnail dimensions
            canvas.width = THUMBNAIL_SIZE;
            canvas.height = THUMBNAIL_SIZE;

            // Calculate scaling to maintain aspect ratio
            const scale = Math.min(
                THUMBNAIL_SIZE / img.width,
                THUMBNAIL_SIZE / img.height
            );

            const scaledWidth = img.width * scale;
            const scaledHeight = img.height * scale;

            // Center the image on canvas
            const offsetX = (THUMBNAIL_SIZE - scaledWidth) / 2;
            const offsetY = (THUMBNAIL_SIZE - scaledHeight) / 2;

            // Fill background with white (for transparent images)
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, THUMBNAIL_SIZE, THUMBNAIL_SIZE);

            // Draw scaled image centered on canvas
            ctx.drawImage(
                img,
                offsetX,
                offsetY,
                scaledWidth,
                scaledHeight
            );

            // Convert canvas to blob
            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error('Failed to generate thumbnail blob'));
                    }
                },
                THUMBNAIL_FORMAT,
                THUMBNAIL_QUALITY
            );
        };

        img.onerror = function() {
            reject(new Error('Failed to load image for thumbnail generation'));
        };

        // Load image from file
        const reader = new FileReader();
        reader.onload = function(e) {
            img.src = e.target.result;
        };
        reader.onerror = function() {
            reject(new Error('Failed to read image file'));
        };
        reader.readAsDataURL(imageFile);
    });
}

/**
 * Upload thumbnail to Firebase Storage
 * @param {Blob} thumbnailBlob - Thumbnail blob
 * @param {string} originalFileId - Original file ID
 * @returns {Promise<string>} Thumbnail download URL
 */
export async function uploadThumbnail(thumbnailBlob, originalFileId) {
    const user = auth.currentUser;
    if (!user) {
        throw new Error('User must be authenticated to upload thumbnails');
    }

    try {
        // Generate thumbnail storage path
        const thumbnailPath = `thumbnails/${user.uid}/${originalFileId}_thumb.jpg`;
        const thumbnailRef = ref(storage, thumbnailPath);

        // Upload thumbnail blob
        await uploadBytes(thumbnailRef, thumbnailBlob);

        // Get download URL
        const downloadURL = await getDownloadURL(thumbnailRef);
        return downloadURL;
    } catch (error) {
        console.error('Error uploading thumbnail:', error);
        throw new Error('Failed to upload thumbnail to storage');
    }
}

/**
 * Generate and upload thumbnail for image file
 * @param {File} imageFile - Source image file
 * @param {string} fileId - File ID for naming thumbnail
 * @returns {Promise<string|null>} Thumbnail URL or null if generation failed
 */
export async function createAndUploadThumbnail(imageFile, fileId) {
    try {
        // Check if thumbnail can be generated
        if (!canGenerateThumbnail(imageFile.type)) {
            console.log(`Skipping thumbnail generation for ${imageFile.type}`);
            return null;
        }

        console.log(`Generating thumbnail for ${imageFile.name}...`);

        // Generate thumbnail
        const thumbnailBlob = await generateThumbnail(imageFile);
        
        console.log(`Thumbnail generated, size: ${thumbnailBlob.size} bytes`);

        // Upload thumbnail
        const thumbnailURL = await uploadThumbnail(thumbnailBlob, fileId);
        
        console.log(`Thumbnail uploaded: ${thumbnailURL}`);
        
        return thumbnailURL;
    } catch (error) {
        console.error('Error creating thumbnail:', error);
        // Don't throw error - thumbnail generation is optional
        return null;
    }
}

/**
 * Get file type from file object (handles different field names)
 * @param {Object} file - File object
 * @returns {string} MIME type or best guess
 */
function getFileType(file) {
    // Try explicit type fields first
    let fileType = file.fileType || file.mimeType || file.type;
    
    // If no type field, infer from filename
    if (!fileType && file.fileName) {
        const fileName = file.fileName.toLowerCase();
        if (fileName.includes('.jpg') || fileName.includes('.jpeg')) return 'image/jpeg';
        if (fileName.includes('.png')) return 'image/png';
        if (fileName.includes('.gif')) return 'image/gif';
        if (fileName.includes('.webp')) return 'image/webp';
        if (fileName.includes('.pdf')) return 'application/pdf';
        if (fileName.includes('.doc') || fileName.includes('.docx')) return 'application/msword';
        if (fileName.includes('.xls') || fileName.includes('.xlsx')) return 'application/vnd.ms-excel';
        if (fileName.includes('.txt')) return 'text/plain';
        if (fileName.includes('.epub')) return 'application/epub+zip';
    }
    
    return fileType || 'application/octet-stream';
}

/**
 * Get fallback icon for non-image files
 * @param {string} mimeType - File MIME type
 * @returns {string} Emoji icon for file type
 */
export function getFallbackIcon(mimeType) {
    if (!mimeType || typeof mimeType !== 'string') return '📄'; // Default fallback
    if (mimeType.startsWith('image/')) return '🖼️'; // Image files
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
    if (mimeType.includes('sheet') || mimeType.includes('excel')) return '📊';
    if (mimeType.includes('epub')) return '📚';
    if (mimeType.startsWith('video/')) return '🎥';
    if (mimeType.startsWith('audio/')) return '🎵';
    if (mimeType.includes('zip') || mimeType.includes('archive')) return '📦';
    return '📎'; // Generic file icon
}

/**
 * Create thumbnail display element
 * @param {Object} file - File metadata object
 * @returns {HTMLElement} Thumbnail display element
 */
export function createThumbnailElement(file) {
    const container = document.createElement('div');
    container.className = 'file-thumbnail';

    const fileType = getFileType(file);
    const isImageFile = canGenerateThumbnail(fileType);

    if (file.thumbnailURL) {
        // Show actual thumbnail
        const img = document.createElement('img');
        img.src = file.thumbnailURL;
        img.alt = file.fileName;
        img.className = 'thumbnail-image';
        img.loading = 'lazy'; // Lazy loading for performance
        
        // Add error fallback
        img.onerror = function() {
            container.innerHTML = `<div class="thumbnail-fallback">${getFallbackIcon(fileType)}</div>`;
        };
        
        container.appendChild(img);
    } else if (isImageFile && file.downloadURL) {
        // For image files without thumbnails, show the actual image
        const img = document.createElement('img');
        img.src = file.downloadURL;
        img.alt = file.fileName;
        img.className = 'thumbnail-image';
        img.loading = 'lazy'; // Lazy loading for performance
        
        // Add error fallback
        img.onerror = function() {
            container.innerHTML = `<div class="thumbnail-fallback">${getFallbackIcon(fileType)}</div>`;
        };
        
        container.appendChild(img);
    } else {
        // Show fallback icon
        const icon = document.createElement('div');
        icon.className = 'thumbnail-fallback';
        icon.textContent = getFallbackIcon(fileType);
        container.appendChild(icon);
    }

    return container;
}