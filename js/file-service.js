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

// Supported file extensions for fallback validation
const SUPPORTED_EXTENSIONS = {
    images: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    documents: ['.pdf', '.doc', '.docx', '.txt', '.rtf'],
    spreadsheets: ['.xls', '.xlsx'],
    ebooks: ['.epub']
};

// Dangerous file extensions that should never be allowed
const DANGEROUS_EXTENSIONS = [
    '.exe', '.bat', '.cmd', '.com', '.scr', '.pif', '.app', '.dmg', 
    '.deb', '.rpm', '.pkg', '.msi', '.jar', '.vbs', '.js', '.ps1',
    '.sh', '.bin', '.run', '.apk', '.ipa'
];

/**
 * Check if file extension is supported
 * @param {string} fileName - File name
 * @returns {boolean} True if extension is supported
 */
function isValidFileExtension(fileName) {
    const extension = getFileExtension(fileName);
    const allExtensions = Object.values(SUPPORTED_EXTENSIONS).flat();
    return allExtensions.includes(extension);
}

/**
 * Check if file extension is dangerous
 * @param {string} fileName - File name
 * @returns {boolean} True if extension is dangerous
 */
function isDangerousFileExtension(fileName) {
    const extension = getFileExtension(fileName);
    return DANGEROUS_EXTENSIONS.includes(extension);
}

/**
 * Get file extension from filename
 * @param {string} fileName - File name
 * @returns {string} File extension in lowercase
 */
function getFileExtension(fileName) {
    const lastDot = fileName.lastIndexOf('.');
    return lastDot >= 0 ? fileName.substring(lastDot).toLowerCase() : '';
}

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
    
    // Check for zero-byte files
    if (file.size === 0) {
        errors.push('Empty files (0 bytes) are not allowed');
    }
    
    // Check file size
    if (file.size > FILE_SIZE_LIMIT) {
        errors.push(`File size must be less than ${FILE_SIZE_LIMIT / 1024 / 1024}MB`);
    }
    
    // Check file type (MIME type first, then extension fallback)
    const isValidMimeType = ALL_SUPPORTED_TYPES.includes(file.type);
    const isValidExtension = isValidFileExtension(file.name);
    
    if (!isValidMimeType && !isValidExtension) {
        errors.push('File type not supported. Supported types: Images (JPG, PNG, GIF, WEBP), Documents (PDF, DOC, DOCX, TXT, RTF), Spreadsheets (XLS, XLSX), Ebooks (EPUB)');
    }
    
    // Check for dangerous file extensions
    if (isDangerousFileExtension(file.name)) {
        errors.push('This file type is not allowed for security reasons');
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
    return `uploads/${userId}/${timestamp}_${sanitizedFileName}`;
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
        
        // Store upload task for potential cancellation  
        uploadTask._file = file;
        
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
                        
                        // Create base metadata object per data-standard-section-1-4.md
                        const fileMetadata = {
                            id: fileId,
                            userId: user.uid,
                            fileName: file.name,
                            fileType: file.type || 'text/plain', // Default to text/plain if type is missing
                            fileSize: file.size,
                            storagePath: storagePath,
                            downloadURL: downloadURL,
                            uploadedAt: new Date().toISOString(),
                            category: getFileCategory(file.type || 'text/plain')
                        };
                        
                        console.log(`📄 Creating metadata for ${file.name}:`, {
                            fileName: file.name,
                            fileType: fileMetadata.fileType,
                            category: fileMetadata.category,
                            size: fileMetadata.fileSize
                        });
                        
                        // Add vectorizationStatus for images per data standard
                        if (file.type && file.type.startsWith('image/')) {
                            fileMetadata.vectorizationStatus = {
                                faces: {
                                    processed: false,
                                    processedAt: null
                                },
                                fullImage: {
                                    processed: false,
                                    processedAt: null
                                }
                            };
                            fileMetadata.extractedFaces = [];
                        }
                        
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
    
    console.log('💾 saveFileMetadata: Saving to user-based collection structure');
    // CRITICAL: Per data-standard-section-1-4.md - All files stored in /users/{userId}/files/{fileId}
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
        console.log('🔍 getUserFiles: Using user-based collection structure');
        console.log('🔍 getUserFiles: Current user:', user.uid, user.email);
        
        // Query user's files from user-based collection per data-standard-section-1-4.md
        const filesQuery = query(
            collection(db, "users", user.uid, "files"),
            orderBy("uploadedAt", "desc"),
            limit(pageSize || 10)
        );
        
        console.log('🔍 getUserFiles: Executing Firestore query...');
        const querySnapshot = await getDocs(filesQuery);
        
        const files = [];
        querySnapshot.forEach((doc) => {
            files.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        console.log('🔍 getUserFiles: Query complete. Found', files.length, 'files');
        console.log('🔍 getUserFiles: Files:', files);
        
        return {
            files,
            hasMore: files.length === (pageSize || 10),
            lastDoc: files.length > 0 ? querySnapshot.docs[querySnapshot.docs.length - 1] : null
        };
    } catch (error) {
        console.error('❌ getUserFiles Error:', error);
        console.error('❌ Error details:', error.message);
        console.error('❌ Error code:', error.code);
        
        // If it's a permission or index error, provide helpful info
        if (error.code === 'permission-denied') {
            console.error('❌ Permission denied - check Firestore rules');
        } else if (error.message && error.message.includes('index')) {
            console.error('❌ Composite index required - check Firebase console');
        }
        
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
        console.log('🔍 getAllUserFiles: Using user-based collection structure');
        // Query user's files from user-based collection per data-standard-section-1-4.md
        const filesRef = collection(db, 'users', user.uid, 'files');
        const q = query(filesRef, orderBy('uploadedAt', 'desc'));
        const querySnapshot = await getDocs(q);
        
        const files = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            delete data.serverTimestamp; // Remove server field
            files.push({
                id: doc.id,
                ...data
            });
        });
        
        console.log('🔍 getAllUserFiles: Found', files.length, 'files');
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
        console.log('🗑️ deleteFile called with:', { fileId, storagePath });
        
        // Get file document first to ensure we have the correct storage path
        const docRef = doc(db, 'users', user.uid, 'files', fileId);
        const docSnap = await getDoc(docRef);
        
        if (!docSnap.exists()) {
            throw new Error('File document not found');
        }
        
        const fileData = docSnap.data();
        console.log('🗑️ File data:', fileData);
        
        // Try to get storage path from file data if not provided or invalid
        let actualStoragePath = storagePath || fileData.storagePath || fileData.path;
        
        // If still no path, try to construct from file URL
        if (!actualStoragePath && fileData.downloadURL) {
            try {
                // Extract path from download URL
                const url = new URL(fileData.downloadURL);
                const pathMatch = url.pathname.match(/\/o\/(.+?)\?/);
                if (pathMatch) {
                    actualStoragePath = decodeURIComponent(pathMatch[1]);
                }
            } catch (e) {
                console.warn('Could not extract path from URL:', e);
            }
        }
        
        console.log('🗑️ Using storage path:', actualStoragePath);
        
        // Delete from Storage if we have a valid path
        if (actualStoragePath && actualStoragePath !== '') {
            const storageRef = ref(storage, actualStoragePath);
            console.log('🗑️ Deleting from storage:', actualStoragePath);
            await deleteObject(storageRef);
            console.log('✅ Storage deletion successful');
        } else {
            console.warn('⚠️ No valid storage path found, skipping storage deletion');
        }
        
        console.log('🗑️ deleteFile: Deleting from user-based collection');
        
        // If the file has extracted faces, we need to clean those up too
        if (fileData.extractedFaces && Array.isArray(fileData.extractedFaces)) {
            console.log(`🗑️ Cleaning up ${fileData.extractedFaces.length} extracted faces`);
            // The faces are stored within the file document, so they'll be deleted
            // when we delete the document. No separate cleanup needed.
        }
        
        // Delete from Firestore - use user-based collection
        await deleteDoc(docRef);
        console.log('✅ Firestore deletion successful');
        
    } catch (error) {
        console.error('Error deleting file:', error);
        throw error;
    }
}

/**
 * Calculate total storage used by user
 * @returns {Promise<{used: number, total: number, percentage: number}>} Storage usage data
 */
export async function calculateStorageUsed() {
    const files = await getAllUserFiles();
    const used = files.reduce((total, file) => total + (file.fileSize || 0), 0);
    const total = 10 * 1024 * 1024 * 1024; // 10GB limit
    
    return {
        used,
        total,
        percentage: Math.round((used / total) * 100)
    };
}