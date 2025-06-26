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
        handleRealFile(file._file, target, logFn);
        
    } else if (file.url) {
        // Artifact from panel (URL-based)
        logFn(`📎 Artifact dropped: ${file.name} (${file.url})`);
        handleArtifactFile(file, target, logFn);
        
    } else {
        // Legacy test data
        logFn('Test data dropped:', file);
        handleTestData(file, target, logFn);
    }
}

/**
 * Handle real file from file system
 * @param {File} fileObject - Native File object
 * @param {Object} target - Target element
 * @param {Function} logFn - Logging function
 */
export function handleRealFile(fileObject, target, logFn = console.log) {
    logFn(`📁 Processing real file: ${fileObject.name} on ${target.type} ${target.id}`);
    
    if (fileObject.type.startsWith('image/')) {
        logFn(`🖼️ Real image file - you could: read as data URL, set as node background`);
        // Example: const reader = new FileReader(); reader.readAsDataURL(fileObject);
    } else if (fileObject.type === 'application/pdf') {
        logFn(`📑 Real PDF file - you could: extract text, store reference`);
    } else {
        logFn(`📄 Real file - you could: upload to server, store metadata`);
    }
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
    
    if (artifactData.type.startsWith('image/')) {
        logFn(`🖼️ Artifact image - you could: set as node background using URL`);
    } else if (artifactData.type === 'application/pdf') {
        logFn(`📑 Artifact PDF - you could: link to document, show preview`);
    } else {
        logFn(`📄 Artifact file - you could: create attachment, download link`);
    }
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