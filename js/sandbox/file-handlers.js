/**
 * File handling functions for the sandbox
 * Handles different types of file drops: real files, artifacts, and test data
 */

/**
 * Main file drop handler - routes to appropriate handler based on file type
 * @param {Object} file - File object with various possible structures
 * @param {Object} target - Target element that received the drop
 * @param {Function} logFn - Logging function to use
 */
export function handleSandboxFileDrop(file, target, logFn = console.log) {
    logFn('File data received:', file);
    
    if (file._file) {
        // Real file from file system
        logFn(`📁 Real file dropped: ${file.name} (${file.type})`);
        return handleRealFile(file._file, target, logFn);
        
    } else if (file.url) {
        // Artifact from panel (URL-based)
        logFn(`📎 Artifact dropped: ${file.name} (${file.url})`);
        return handleArtifactFile(file, target, logFn);
        
    } else {
        // Legacy test data
        logFn('Test data dropped:', file);
        return handleTestData(file, target, logFn);
    }
}

/**
 * Handle real file from file system
 * @param {File} fileObject - Native File object
 * @param {Object} target - Target element
 * @param {Function} logFn - Logging function
 */
export async function handleRealFile(fileObject, target, logFn = console.log) {
    logFn(`📁 Processing real file: ${fileObject.name} on ${target.type} ${target.id}`);
    
    // For real files, we need to upload them first or convert to data URL
    // For now, we'll create a placeholder attachment
    // In production, you would upload to Firebase Storage first
    
    const attachment = {
        id: `att_${Date.now()}`,
        name: fileObject.name,
        type: fileObject.type || 'application/octet-stream',
        size: fileObject.size,
        url: '#', // This would be the uploaded file URL
        uploadDate: new Date().toISOString(),
        description: `Local file: ${fileObject.name}`
    };
    
    logFn(`⚠️ Real file uploads not implemented yet. Would need to upload to Firebase Storage.`);
    
    return attachment;
}

/**
 * Handle artifact file from Firebase
 * @param {Object} artifactData - Artifact data object
 * @param {Object} target - Target element
 * @param {Function} logFn - Logging function
 */
export function handleArtifactFile(artifactData, target, logFn = console.log) {
    logFn(`📎 Processing artifact: ${artifactData.name} on ${target.type} ${target.id}`);
    logFn(`📍 Artifact URL: ${artifactData.url}`);
    logFn(`📊 Source: ${artifactData.source}, File ID: ${artifactData.fileId}`);
    
    // Create attachment object in the format expected by NexusMetadataEditor
    const attachment = {
        id: artifactData.fileId || `att_${Date.now()}`,
        name: artifactData.name,
        type: artifactData.type || 'application/octet-stream',
        size: artifactData.size || 0,
        url: artifactData.url,
        uploadDate: artifactData.uploadDate || new Date().toISOString(),
        description: artifactData.description || ''
    };
    
    // Return the attachment object for the Nexus control to handle
    return attachment;
}

/**
 * Handle test data drops
 * @param {Object} file - Test file data
 * @param {Object} target - Target element
 * @param {Function} logFn - Logging function
 */
export function handleTestData(file, target, logFn = console.log) {
    logFn(`🧪 Test data dropped on ${target.type} ${target.id}:`, file);
}

/**
 * Handle file drops on production (read-only mode)
 * @param {Object} file - File data
 * @param {Object} target - Target element
 * @param {Function} logFn - Logging function
 */
export function handleProductionFileDrop(file, target, logFn = console.log) {
    logFn(`📎 File drop on production: ${file.name} - read-only mode`);
    logFn(`💡 Production is read-only. You could copy to sandbox and then attach files there.`);
}