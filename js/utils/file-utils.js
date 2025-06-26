/**
 * File utility functions
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