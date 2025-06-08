/**
 * File Service
 * 
 * Handles all file-related operations including upload, download,
 * and interaction with Firebase Storage.
 */

import { storage, auth, db } from './firebase-config.js';
import { 
    ref, 
    uploadBytesResumable, 
    getDownloadURL, 
    deleteObject,
    listAll,
    getMetadata
} from 'firebase/storage';
import { createAndUploadThumbnail } from './thumbnail-generator.js';
import { 
    collection, 
    doc, 
    setDoc, 
    getDoc, 
    getDocs, 
    deleteDoc, 
    query, 
    where, 
    orderBy,
    serverTimestamp,
    limit,
    startAfter
} from 'firebase/firestore';

// File size limits (Phase 2 spec: 10MB, but UI shows 50MB)
export const FILE_SIZE_LIMIT = 10 * 1024 * 1024; // 10MB in bytes

// Supported file types
export const SUPPORTED_FILE_TYPES = {
    images: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    documents: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'application/rtf'],
    spreadsheets: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    ebooks: ['application/epub+zip']
};

// Get all supported types as flat array
export const ALL_SUPPORTED_TYPES = Object.values(SUPPORTED_FILE_TYPES).flat();

/**
 * File metadata schema
 * @typedef {Object} FileMetadata
 * @property {string} id - Unique identifier
 * @property {string} userId - Owner's user ID
 * @property {string} fileName - Original file name
 * @property {string} fileType - MIME type
 * @property {number} fileSize - Size in bytes
 * @property {string} storagePath - Path in Firebase Storage
 * @property {string} downloadURL - Public download URL
 * @property {string} uploadedAt - ISO string upload time
 * @property {string} category - File category (image, document, etc.)
 * @property {string} thumbnailURL - Thumbnail URL for images (optional)
 */

/**
 * Validate file before upload
 * @param {File} file - File to validate
 * @returns {Object} Validation result with isValid and errors
 */
export function validateFile(file) {
    const errors = [];
    
    // Check file size
    if (file.size > FILE_SIZE_LIMIT) {
        errors.push(`File size must be less than ${FILE_SIZE_LIMIT / 1024 / 1024}MB`);
    }
    
    // Check file type
    if (!ALL_SUPPORTED_TYPES.includes(file.type)) {
        errors.push('File type not supported. Supported types: Images (JPG, PNG, GIF, WEBP), Documents (PDF, DOC, DOCX, TXT, RTF), Spreadsheets (XLS, XLSX), Ebooks (EPUB)');
    }
    
    // Check file name length
    if (file.name.length > 200) {
        errors.push('File name must be less than 200 characters');
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

/**
 * Get file category from MIME type
 * @param {string} mimeType - File MIME type
 * @returns {string} Category name
 */
export function getFileCategory(mimeType) {
    for (const [category, types] of Object.entries(SUPPORTED_FILE_TYPES)) {
        if (types.includes(mimeType)) {
            return category;
        }
    }
    return 'other';
}

/**
 * Generate storage path for file
 * @param {string} userId - User ID
 * @param {string} fileName - Original file name
 * @returns {string} Storage path
 */
export function generateStoragePath(userId, fileName) {
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    return `users/${userId}/files/${timestamp}_${sanitizedFileName}`;
}

/**
 * Upload file to Firebase Storage
 * @param {File} file - File to upload
 * @param {Function} onProgress - Progress callback (percentage)
 * @param {Function} onError - Error callback
 * @returns {Promise<Object>} Upload result with metadata
 */
export async function uploadFile(file, onProgress, onError) {
    try {
        // Get current user
        const user = auth.currentUser;
        if (!user) {
            throw new Error('User must be authenticated to upload files');
        }
        
        // Validate file
        const validation = validateFile(file);
        if (!validation.isValid) {
            throw new Error(validation.errors.join(', '));
        }
        
        // Generate storage path
        const storagePath = generateStoragePath(user.uid, file.name);
        const storageRef = ref(storage, storagePath);
        
        // Create upload task
        const uploadTask = uploadBytesResumable(storageRef, file);
        
        // Return promise that resolves with file metadata
        return new Promise((resolve, reject) => {
            uploadTask.on('state_changed',
                // Progress handler
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    if (onProgress) {
                        onProgress(progress);
                    }
                },
                // Error handler
                (error) => {
                    console.error('Upload error:', error);
                    if (onError) {
                        onError(error);
                    }
                    reject(error);
                },
                // Success handler
                async () => {
                    try {
                        // Get download URL
                        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                        
                        // Generate unique file ID
                        const fileId = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                        
                        // Create base metadata object
                        const fileMetadata = {
                            id: fileId,
                            userId: user.uid,
                            fileName: file.name,
                            fileType: file.type,
                            fileSize: file.size,
                            storagePath: storagePath,
                            downloadURL: downloadURL,
                            uploadedAt: new Date().toISOString(),
                            category: getFileCategory(file.type)
                        };
                        
                        // Generate thumbnail for images
                        try {
                            const thumbnailURL = await createAndUploadThumbnail(file, fileId);
                            if (thumbnailURL) {
                                fileMetadata.thumbnailURL = thumbnailURL;
                            }
                        } catch (thumbnailError) {
                            console.warn('Thumbnail generation failed:', thumbnailError);
                            // Continue without thumbnail - not critical
                        }
                        
                        // Save metadata to Firestore
                        await saveFileMetadata(fileMetadata);
                        
                        resolve(fileMetadata);
                    } catch (error) {
                        reject(error);
                    }
                }
            );
            
            // Store upload task for potential cancellation
            uploadTask._file = file;
            return uploadTask;
        });
    } catch (error) {
        if (onError) {
            onError(error);
        }
        throw error;
    }
}

/**
 * Save file metadata to Firestore
 * @param {FileMetadata} metadata - File metadata to save
 * @returns {Promise<void>}
 */
async function saveFileMetadata(metadata) {
    const user = auth.currentUser;
    if (!user) {
        throw new Error('User must be authenticated');
    }
    
    const docRef = doc(db, 'users', user.uid, 'files', metadata.id);
    await setDoc(docRef, {
        ...metadata,
        serverTimestamp: serverTimestamp()
    });
}

/**
 * Get files for current user with pagination
 * @param {Object} options - Pagination and filtering options
 * @returns {Promise<{files: FileMetadata[], hasMore: boolean, lastDoc: any}>} Paginated file results
 */
export async function getUserFiles(options = {}) {
    const {
        pageSize = 20,
        lastDoc = null,
        sortBy = 'uploadedAt',
        sortOrder = 'desc',
        filterType = null
    } = options;
    
    const user = auth.currentUser;
    if (!user) {
        throw new Error('User must be authenticated');
    }
    
    try {
        const filesRef = collection(db, 'users', user.uid, 'files');
        let q = query(
            filesRef,
            orderBy(sortBy, sortOrder),
            limit(pageSize)
        );
        
        // Add type filter if specified
        if (filterType && filterType !== 'all') {
            q = query(q, where('category', '==', filterType));
        }
        
        // Add pagination cursor if provided
        if (lastDoc) {
            q = query(q, startAfter(lastDoc));
        }
        
        const querySnapshot = await getDocs(q);
        
        const files = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            delete data.serverTimestamp; // Remove server field
            files.push({
                ...data,
                _doc: doc // Store doc reference for pagination
            });
        });
        
        return {
            files,
            hasMore: files.length === pageSize,
            lastDoc: files.length > 0 ? files[files.length - 1]._doc : null
        };
    } catch (error) {
        console.error('Error getting files:', error);
        return { files: [], hasMore: false, lastDoc: null };
    }
}

/**
 * Get all files for current user (backward compatibility)
 * @returns {Promise<FileMetadata[]>} Array of file metadata
 */
export async function getAllUserFiles() {
    const user = auth.currentUser;
    if (!user) {
        throw new Error('User must be authenticated');
    }
    
    try {
        const filesRef = collection(db, 'users', user.uid, 'files');
        const q = query(filesRef, orderBy('uploadedAt', 'desc'));
        const querySnapshot = await getDocs(q);
        
        const files = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            delete data.serverTimestamp; // Remove server field
            files.push(data);
        });
        
        return files;
    } catch (error) {
        console.error('Error getting files:', error);
        return [];
    }
}

/**
 * Delete file from Storage and Firestore
 * @param {string} fileId - File ID to delete
 * @param {string} storagePath - Storage path
 * @returns {Promise<void>}
 */
export async function deleteFile(fileId, storagePath) {
    const user = auth.currentUser;
    if (!user) {
        throw new Error('User must be authenticated');
    }
    
    try {
        // Delete from Storage
        const storageRef = ref(storage, storagePath);
        await deleteObject(storageRef);
        
        // Delete from Firestore
        const docRef = doc(db, 'users', user.uid, 'files', fileId);
        await deleteDoc(docRef);
    } catch (error) {
        console.error('Error deleting file:', error);
        throw error;
    }
}

/**
 * Calculate total storage used by user
 * @returns {Promise<number>} Total bytes used
 */
export async function calculateStorageUsed() {
    const files = await getAllUserFiles();
    return files.reduce((total, file) => total + (file.fileSize || 0), 0);
}