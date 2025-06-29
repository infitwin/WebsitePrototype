/**
 * My Files Page Module
 * Handles file management functionality using centralized components
 */

import { initializeDragDrop, createUploadQueue, processFilesForUpload, showNotification } from '../file-ui.js';
import { getUserFiles, deleteFile, calculateStorageUsed } from '../file-service.js';
import { getStorageBreakdown } from '../storage-service.js';
import { guardPage } from '../auth-guard.js';
import { createThumbnailElement, getFallbackIcon } from '../thumbnail-generator.js';
import { createStorageDonutChart } from '../storage-ui.js';
import { Modal } from '../components/ui/modal.js';
import { Button } from '../components/ui/button.js';
import { Search } from '../components/ui/search.js';

// State management
let currentFiles = [];
let currentView = 'grid';
let sortBy = 'name';
let uploadQueue = null;
let activeFilter = 'all';
let searchTimeout;

/**
 * Initialize the My Files page
 */
export async function initializeMyFiles() {
    console.log('🔄 My Files page loading...');
    
    // Check authentication
    console.log('🔐 Checking authentication...');
    const allowed = await guardPage({
        requireVerified: false,  // Allow unverified emails
        redirectTo: '/pages/auth.html'
    });
    
    if (!allowed) {
        console.log('❌ Authentication failed');
        showNotAuthenticatedState();
        return;
    }
    
    console.log('✅ Authentication passed');

    // Check Firebase services initialization
    await checkFirebaseServices();

    // Initialize new design components
    initializeStorageIndicator();
    initializeSearchAndFilters();
    initializeUploadHandling();
    initializeModalHandlers();
    initializeBatchSelection();
    initializeVectorizationQuota();
    
    // Initialize existing components
    initializeButtons();
    await initializeFileBrowser();
}

/**
 * Initialize storage indicator with progressive colors
 */
function initializeStorageIndicator() {
    updateStorageIndicator(0); // Start with 0%, will be updated when files load
}

/**
 * Update storage bar with progressive coloring
 */
function updateStorageIndicator(percentage, used = '0 GB', total = '10 GB') {
    const storageBar = document.getElementById('storageBar');
    const storagePercent = document.getElementById('storagePercent');
    
    if (storageBar && storagePercent) {
        storageBar.style.width = percentage + '%';
        storagePercent.textContent = percentage + '%';
        
        // Update storage text
        const storageText = document.querySelector('.storage-text');
        if (storageText) {
            storageText.textContent = `${used} of ${total} used`;
        }
        
        // Progressive colors
        storageBar.classList.remove('warning', 'danger');
        if (percentage >= 90) {
            storageBar.classList.add('danger');
        } else if (percentage >= 70) {
            storageBar.classList.add('warning');
        }
    }
}

/**
 * Initialize search and filter functionality
 */
function initializeSearchAndFilters() {
    // Search input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                performSearch(e.target.value);
            }, 300);
        });
    }

    // Filter chips
    const filterChips = document.querySelectorAll('.filter-chip');
    filterChips.forEach(chip => {
        chip.addEventListener('click', () => {
            // Remove active from all
            filterChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            
            activeFilter = chip.dataset.filter;
            applyFilter(activeFilter);
        });
    });

    // Upload button
    const uploadBtn = document.getElementById('uploadBtn');
    if (uploadBtn) {
        uploadBtn.addEventListener('click', () => {
            const fileInput = document.getElementById('fileInput');
            if (fileInput) {
                fileInput.click();
            }
        });
    }
}

/**
 * Perform search across files
 */
function performSearch(query) {
    const lowerQuery = query.toLowerCase();
    const fileCards = document.querySelectorAll('.file-card');
    let visibleCount = 0;
    
    fileCards.forEach(card => {
        const fileName = card.querySelector('.file-name')?.textContent.toLowerCase() || '';
        const hasFaces = card.dataset.hasFaces === 'true';
        const isProcessing = card.dataset.processing === 'true';
        
        let shouldShow = fileName.includes(lowerQuery);
        
        // Enhanced search - also search by attributes
        if (lowerQuery.includes('face') && hasFaces) shouldShow = true;
        if (lowerQuery.includes('processing') && isProcessing) shouldShow = true;
        
        card.style.display = shouldShow ? '' : 'none';
        if (shouldShow) visibleCount++;
    });
    
    // Show empty state if no results
    updateEmptyState(visibleCount === 0 && query.length > 0);
}

/**
 * Apply filter to files
 */
function applyFilter(filter) {
    const fileCards = document.querySelectorAll('.file-card');
    let visibleCount = 0;
    
    fileCards.forEach(card => {
        let shouldShow = true;
        
        switch(filter) {
            case 'faces':
                shouldShow = card.dataset.hasFaces === 'true';
                break;
            case 'processing':
                shouldShow = card.dataset.processing === 'true';
                break;
            case 'recent':
                const dateText = card.querySelector('.file-date')?.textContent || '';
                shouldShow = dateText.includes('ago') || dateText.includes('now') || dateText.includes('hour');
                break;
            case 'all':
            default:
                shouldShow = true;
                break;
        }
        
        card.style.display = shouldShow ? '' : 'none';
        if (shouldShow) visibleCount++;
    });
    
    // Show empty state if no results
    updateEmptyState(visibleCount === 0 && filter !== 'all');
}

/**
 * Update empty state visibility
 */
function updateEmptyState(show) {
    const emptyState = document.getElementById('emptyState');
    const uploadZone = document.getElementById('uploadZone');
    const fileGrid = document.getElementById('filesContainer');
    
    if (show) {
        emptyState?.classList.add('active');
        uploadZone?.classList.add('hidden');
        if (fileGrid) fileGrid.style.display = 'none';
    } else {
        emptyState?.classList.remove('active');
        uploadZone?.classList.remove('hidden');
        if (fileGrid) fileGrid.style.display = 'grid';
    }
}

/**
 * Clear all filters and search
 */
window.clearAllFilters = function() {
    // Clear search
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.value = '';
    }
    
    // Reset filter to 'All Files'
    const filterChips = document.querySelectorAll('.filter-chip');
    filterChips.forEach(chip => {
        chip.classList.remove('active');
        if (chip.dataset.filter === 'all') {
            chip.classList.add('active');
        }
    });
    
    activeFilter = 'all';
    
    // Show all files
    document.querySelectorAll('.file-card').forEach(card => {
        card.style.display = '';
    });
    
    // Hide empty state
    updateEmptyState(false);
};

/**
 * Initialize upload handling with drag and drop
 */
function initializeUploadHandling() {
    const uploadZone = document.getElementById('uploadZone');
    const fileInput = document.getElementById('fileInput');
    let dragCounter = 0;
    
    // Drag and drop for entire document
    document.addEventListener('dragenter', (e) => {
        e.preventDefault();
        dragCounter++;
        uploadZone?.classList.add('dragover');
    });
    
    document.addEventListener('dragleave', (e) => {
        dragCounter--;
        if (dragCounter === 0) {
            uploadZone?.classList.remove('dragover');
        }
    });
    
    document.addEventListener('dragover', (e) => {
        e.preventDefault();
    });
    
    document.addEventListener('drop', (e) => {
        e.preventDefault();
        dragCounter = 0;
        uploadZone?.classList.remove('dragover');
        
        if (e.target.closest('.upload-zone') && e.dataTransfer.files.length > 0) {
            handleFileUpload(e.dataTransfer.files);
        }
    });
    
    // Click upload zone
    uploadZone?.addEventListener('click', () => {
        fileInput?.click();
    });
    
    // File input change
    fileInput?.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFileUpload(e.target.files);
        }
    });
}

/**
 * Handle file upload
 */
async function handleFileUpload(files) {
    console.log('Files selected for upload:', files);
    // Convert FileList to array
    const filesArray = Array.from(files);
    // Log file types for debugging
    filesArray.forEach(file => {
        console.log(`📄 File: ${file.name}, Type: ${file.type || 'unknown'}, Size: ${file.size}`);
    });
    
    // Integration with existing upload system
    const uploadContainer = document.getElementById('uploadQueue') || document.getElementById('filesContainer');
    try {
        // Show initial notification
        if (typeof showNotification === 'function') {
            showNotification(`${filesArray.length} file(s) added to upload queue`, 'info');
        }
        
        // AWAIT the upload process to ensure it completes
        await processFilesForUpload(filesArray, uploadContainer);
        
        // Show success feedback
        if (typeof showNotification === 'function') {
            showNotification(`${filesArray.length} file(s) uploaded successfully`, 'success');
        } else {
            console.log(`✅ ${filesArray.length} file(s) uploaded successfully`);
            // Create simple notification fallback
            const notification = document.createElement('div');
            notification.style.cssText = 'position: fixed; top: 20px; right: 20px; background: #10B981; color: white; padding: 12px 20px; border-radius: 8px; z-index: 1000;';
            notification.textContent = `${filesArray.length} file(s) uploaded successfully`;
            document.body.appendChild(notification);
            setTimeout(() => notification.remove(), 3000);
        }
        
        // Refresh file list immediately after upload completes
        console.log('🔄 Refreshing file list after upload...');
        try {
            await initializeFileBrowser();
            console.log('✅ File list refreshed successfully');
        } catch (error) {
            console.error('❌ Failed to refresh file list:', error);
            // Force a page reload as fallback
            window.location.reload();
        }
        
    } catch (error) {
        console.error('Upload failed:', error);
        if (typeof showNotification === 'function') {
            showNotification('Upload failed. Please try again.', 'error');
        } else {
            console.error('❌ Upload failed. Please try again.');
        }
    }
}

// Expose upload functions globally for debugging and testing
window.handleFileUpload = handleFileUpload;
window.processFilesForUpload = processFilesForUpload;
window.initializeDragDrop = initializeDragDrop;

/**
 * Initialize modal handlers
 */
function initializeModalHandlers() {
    // Face modal close handler
    window.closeFaceModal = function() {
        const faceModal = document.getElementById('faceModal');
        faceModal?.classList.remove('active');
    };
    
    // Click outside face modal to close
    const faceModal = document.getElementById('faceModal');
    faceModal?.addEventListener('click', (e) => {
        if (e.target === e.currentTarget) {
            window.closeFaceModal();
        }
    });
    
    // Delete modal handlers
    const deleteModal = document.getElementById('deleteModal');
    let fileToDelete = null;
    
    // Close delete modal
    document.querySelector('.modal-cancel')?.addEventListener('click', () => {
        deleteModal?.classList.remove('active');
        fileToDelete = null;
    });
    
    // Confirm delete
    document.querySelector('.modal-confirm')?.addEventListener('click', async () => {
        if (fileToDelete) {
            console.log('🗑️ Deleting file...');
            
            // Get file ID from the card
            const fileId = fileToDelete.dataset.fileId;
            console.log('🗑️ File ID to delete:', fileId);
            
            if (fileId) {
                try {
                    // Delete from database first
                    await deleteFile(fileId);
                    console.log('✅ File deleted from database');
                    
                    // Fix: Check if element still exists before DOM manipulation
                    if (fileToDelete && fileToDelete.parentNode) {
                        // Then remove from DOM with animation
                        fileToDelete.style.transform = 'scale(0.8)';
                        fileToDelete.style.opacity = '0';
                        
                        setTimeout(() => {
                            // Double-check element still exists before removing
                            if (fileToDelete && fileToDelete.parentNode) {
                                fileToDelete.remove();
                                updateFileCounts();
                                
                                // Check if no files left and update empty state
                                const remainingFiles = document.querySelectorAll('.file-card');
                                if (remainingFiles.length === 0) {
                                    showEmptyState();
                                }
                                console.log('✅ File removed from UI');
                            } else {
                                console.log('⚠️ File element already removed from DOM');
                            }
                        }, 300);
                    } else {
                        console.error('❌ File element is null or has no parent');
                        alert('DOM Error: File element no longer exists');
                    }
                    
                } catch (error) {
                    console.error('❌ Failed to delete file:', error);
                    // Show error to user - NO FALLBACKS, let it break visibly
                    alert(`Delete failed: ${error.message}`);
                }
            } else {
                console.error('❌ No file ID found for deletion');
                alert('Cannot delete: File ID missing');
            }
        }
        deleteModal?.classList.remove('active');
        fileToDelete = null;
    });
    
    // Global delete handler
    window.showDeleteConfirmation = function(fileCard) {
        fileToDelete = fileCard;
        deleteModal?.classList.add('active');
    };
    
    // Image modal handlers
    const imageModal = document.getElementById('imageModal');
    
    // Click outside image modal to close
    imageModal?.addEventListener('click', (e) => {
        if (e.target === e.currentTarget) {
            window.closeImageModal();
        }
    });
    
    // ESC key to close image modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && imageModal?.classList.contains('active')) {
            window.closeImageModal();
        }
    });
    
    // Text modal handlers - similar to image modal for consistency
    const textModal = document.getElementById('textModal');
    
    // Click outside text modal to close - provides easy dismissal
    textModal?.addEventListener('click', (e) => {
        if (e.target === e.currentTarget) {
            window.closeTextModal();
        }
    });
    
    // ESC key to close text modal - keyboard accessibility
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && textModal?.classList.contains('active')) {
            window.closeTextModal();
        }
    });
}

/**
 * Update file display name in Firebase
 * @param {string} fileId - File ID
 * @param {string} displayName - New display name
 */
async function updateFileDisplayName(fileId, displayName) {
    const { auth, db } = await import('../firebase-config.js');
    const { doc, updateDoc } = await import('firebase/firestore');
    
    const user = auth.currentUser;
    if (!user) {
        throw new Error('User must be authenticated');
    }
    
    console.log('🔄 Updating Firebase for fileId:', fileId, 'with displayName:', displayName);
    
    const fileRef = doc(db, 'users', user.uid, 'files', fileId);
    await updateDoc(fileRef, {
        displayName: displayName,
        lastModified: new Date()
    });
    
    console.log('✅ Firebase updated successfully for fileId:', fileId);
}

/**
 * Update file card display name in the grid
 * @param {string} fileId - File ID
 * @param {string} displayName - New display name
 */
function updateFileCardDisplayName(fileId, displayName) {
    const fileCard = document.querySelector(`[data-file-id="${fileId}"]`);
    if (fileCard) {
        const nameElement = fileCard.querySelector('.file-name');
        if (nameElement) {
            nameElement.textContent = displayName;
            console.log('📝 Updated file card name in grid');
        }
    }
}

/**
 * Handle face deletion
 * @param {string} fileId - File ID
 * @param {Object} faceData - Face data to delete
 * @param {number} faceIndex - Index of face in array
 */
async function handleFaceDelete(fileId, faceData, faceIndex) {
    try {
        console.log('🗑️ Deleting face:', { fileId, faceId: faceData.faceId, faceIndex });
        
        // Show loading state
        showNotification('Deleting face...', 'info');
        
        // Get current user
        const { auth, db } = await import('../firebase-config.js');
        const { doc, getDoc, updateDoc } = await import('firebase/firestore');
        
        const user = auth.currentUser;
        if (!user) {
            throw new Error('User must be authenticated');
        }
        
        // Get current file document
        const fileRef = doc(db, 'users', user.uid, 'files', fileId);
        const fileDoc = await getDoc(fileRef);
        
        if (!fileDoc.exists()) {
            throw new Error('File not found');
        }
        
        const fileData = fileDoc.data();
        const currentFaces = fileData.extractedFaces || [];
        
        // Remove the face at the specified index
        const updatedFaces = currentFaces.filter((_, index) => index !== faceIndex);
        
        // Update Firebase
        await updateDoc(fileRef, {
            extractedFaces: updatedFaces,
            faceCount: updatedFaces.length,
            faceLastModified: new Date()
        });
        
        // Update local data
        const file = window.currentFiles?.find(f => f.id === fileId);
        if (file) {
            file.extractedFaces = updatedFaces;
            file.faceCount = updatedFaces.length;
        }
        
        // Update UI
        const fileCard = document.querySelector(`[data-file-id="${fileId}"]`);
        if (fileCard) {
            // Update face count display
            const faceIndicator = fileCard.querySelector('.face-indicator');
            if (updatedFaces.length > 0) {
                if (faceIndicator) {
                    faceIndicator.innerHTML = `
                        <svg class="face-icon" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                            <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"/>
                        </svg>
                        ${updatedFaces.length} face${updatedFaces.length !== 1 ? 's' : ''}
                    `;
                }
                fileCard.dataset.faceCount = updatedFaces.length;
            } else {
                // Remove face indicator if no faces left
                if (faceIndicator) {
                    faceIndicator.remove();
                }
                fileCard.dataset.hasFaces = 'false';
                delete fileCard.dataset.faceCount;
            }
        }
        
        // Update filter counts
        updateFileCounts();
        
        showNotification('Face deleted successfully', 'success');
        console.log('✅ Face deleted successfully');
        
    } catch (error) {
        console.error('❌ Failed to delete face:', error);
        showNotification(`Failed to delete face: ${error.message}`, 'error');
        throw error;
    }
}

/**
 * Show faces modal
 */
window.showFaces = async function(event, file) {
    event.stopPropagation();
    
    const modal = document.getElementById('faceModal');
    const facesGrid = document.getElementById('facesModalGrid');
    const filenameSpan = document.getElementById('faceModalFilename');
    
    if (!modal || !facesGrid || !filenameSpan) return;
    
    filenameSpan.textContent = file.displayName || file.fileName || file.name;
    facesGrid.innerHTML = '<div style="text-align: center; padding: 20px;">Loading faces...</div>';
    
    modal.classList.add('active');
    
    // Check if we have extracted faces data
    if (file.extractedFaces && file.extractedFaces.length > 0 && file.downloadURL) {
        try {
            // Import face extractor functions
            const { extractAllFaces, createFaceThumbnailElement } = await import('/js/face-extractor.js?v=' + Date.now());
            
            // Extract all faces from the image
            const extractedFaces = await extractAllFaces(file.downloadURL, file.extractedFaces);
            
            // Clear loading message
            facesGrid.innerHTML = '';
            
            // Display extracted faces
            if (extractedFaces.length > 0) {
                console.log('🎯 Creating face elements with delete functionality');
                extractedFaces.forEach((face, index) => {
                    const faceElement = createFaceThumbnailElement(face, index, {
                        fileId: file.id,
                        onDelete: async (faceData, faceIndex, fileId) => {
                            console.log('🗑️ Delete clicked for face:', faceIndex);
                            await handleFaceDelete(fileId, faceData, faceIndex);
                            // Refresh the modal
                            window.showFaces(event, file);
                        }
                    });
                    console.log('✅ Face element created with delete button:', faceElement);
                    facesGrid.appendChild(faceElement);
                });
            } else {
                facesGrid.innerHTML = '<div style="text-align: center; padding: 20px;">No faces could be extracted</div>';
            }
        } catch (error) {
            console.error('Error extracting faces:', error);
            facesGrid.innerHTML = '<div style="text-align: center; padding: 20px; color: #ef4444;">Error loading faces</div>';
        }
    } else {
        // Fallback to placeholder faces if no extracted face data
        facesGrid.innerHTML = '';
        const faceCount = file.faceCount || file.extractedFaces?.length || 0;
        for (let i = 1; i <= faceCount; i++) {
            const faceItem = document.createElement('div');
            faceItem.className = 'face-item';
            faceItem.innerHTML = `
                <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 150 150'%3E%3Crect width='150' height='150' fill='%23f3f4f6' rx='12'/%3E%3Ccircle cx='75' cy='75' r='50' fill='%23e5e7eb'/%3E%3Ccircle cx='60' cy='65' r='5' fill='%236b7280'/%3E%3Ccircle cx='90' cy='65' r='5' fill='%236b7280'/%3E%3Cpath d='M 60 90 Q 75 100 90 90' stroke='%236b7280' stroke-width='3' fill='none'/%3E%3C/svg%3E" 
                     class="face-thumb" 
                     alt="Face ${i}">
                <div class="face-label">Face ${i}</div>
            `;
            facesGrid.appendChild(faceItem);
        }
    }
};

/**
 * Start editing file name
 * @param {HTMLElement} titleElement - The title element to edit
 * @param {Object} file - The file object
 */
window.startEditingFileName = function startEditingFileName(titleElement, file) {
    console.log('📝 Starting edit mode for file:', file?.fileName || 'unknown');
    
    // Safety check
    if (!titleElement || !file) {
        console.error('❌ Missing titleElement or file object');
        return;
    }
    
    // Don't allow multiple edit sessions
    if (titleElement.querySelector('input')) {
        console.log('⚠️ Edit session already active');
        return;
    }
    
    // Get current display name
    const currentName = file.displayName || file.fileName || file.name || 'Untitled Image';
    
    // Create input element
    const input = document.createElement('input');
    input.type = 'text';
    input.value = currentName;
    input.className = 'file-name-edit-input';
    input.style.cssText = `
        font-size: inherit;
        font-weight: inherit;
        font-family: inherit;
        color: inherit;
        background: white;
        border: 2px solid #6B46C1;
        border-radius: 6px;
        padding: 4px 8px;
        width: 100%;
        max-width: 400px;
        outline: none;
    `;
    
    // Replace title with input
    titleElement.textContent = '';
    titleElement.appendChild(input);
    
    // Select all text and focus
    input.select();
    input.focus();
    
    console.log('✏️ Edit mode activated, current name:', currentName);
    
    // Handle Enter key (save) and Escape key (cancel)
    input.addEventListener('keydown', async (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            await saveFileName(titleElement, input, file);
        } else if (e.key === 'Escape') {
            e.preventDefault();
            cancelFileNameEdit(titleElement, currentName);
        }
    });
    
    // Handle blur (click outside)
    input.addEventListener('blur', async () => {
        // Small delay to allow for button clicks if needed
        setTimeout(async () => {
            if (document.activeElement !== input) {
                await saveFileName(titleElement, input, file);
            }
        }, 200);
    });
}

/**
 * Save the edited file name
 * @param {HTMLElement} titleElement - The title element
 * @param {HTMLInputElement} input - The input element
 * @param {Object} file - The file object
 */
async function saveFileName(titleElement, input, file) {
    const newName = input.value.trim();
    const currentName = file.displayName || file.fileName || file.name || 'Untitled Image';
    
    console.log('💾 Saving file name:', { 
        fileId: file.id, 
        old: currentName, 
        new: newName,
        originalFileName: file.fileName
    });
    
    // Validate input
    if (!newName) {
        console.log('❌ Empty name, reverting to original');
        cancelFileNameEdit(titleElement, currentName);
        return;
    }
    
    // Check max length
    if (newName.length > 100) {
        showNotification('File name must be less than 100 characters', 'error');
        return;
    }
    
    // Check if name actually changed
    if (newName === currentName) {
        console.log('ℹ️ Name unchanged, exiting edit mode');
        cancelFileNameEdit(titleElement, currentName);
        return;
    }
    
    // Show loading state
    titleElement.innerHTML = `<span style="opacity: 0.6">${newName}</span> <span style="font-size: 0.8em">💾</span>`;
    
    try {
        // Update Firebase
        await updateFileDisplayName(file.id, newName);
        
        // Update the file object
        file.displayName = newName;
        
        // Update window.currentImageFile if it exists
        if (window.currentImageFile) {
            window.currentImageFile.displayName = newName;
        }
        
        // Update in currentFiles array
        const fileInArray = window.currentFiles?.find(f => f.id === file.id);
        if (fileInArray) {
            fileInArray.displayName = newName;
        }
        
        // Update UI
        titleElement.textContent = newName;
        titleElement.style.cursor = 'text';
        
        // Update the file card in the grid if visible
        updateFileCardDisplayName(file.id, newName);
        
        console.log('✅ File name updated in Firebase and UI:', newName);
        showNotification('File name updated', 'success');
        
    } catch (error) {
        console.error('❌ Failed to update file name:', error);
        showNotification('Failed to update file name', 'error');
        // Revert to original name on error
        cancelFileNameEdit(titleElement, currentName);
    }
}

/**
 * Cancel file name editing
 * @param {HTMLElement} titleElement - The title element
 * @param {string} originalName - The original name to restore
 */
function cancelFileNameEdit(titleElement, originalName) {
    console.log('❌ Canceling edit, restoring:', originalName);
    titleElement.textContent = originalName;
    titleElement.style.cursor = 'text';
}

/**
 * Show image modal with full size image and comments
 */
window.showImageModal = function(file) {
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('imageModalImg');
    const modalTitle = document.getElementById('imageModalTitle');
    const modalSize = document.getElementById('imageModalSize');
    const modalDate = document.getElementById('imageModalDate');
    const modalType = document.getElementById('imageModalType');
    const commentsList = document.getElementById('imageCommentsList');
    const newCommentText = document.getElementById('newCommentText');
    
    if (!modal || !modalImg) return;
    
    // Set image and metadata
    modalImg.src = file.downloadURL || file.thumbnailURL || '';
    modalTitle.textContent = file.displayName || file.fileName || file.name || 'Untitled Image';
    modalSize.textContent = formatFileSize(file.fileSize || file.size || 0);
    modalDate.textContent = formatDate(file.uploadedAt || file.dateUploaded);
    modalType.textContent = file.fileType || 'Unknown';
    
    // Store current file for commenting and editing
    window.currentImageFile = file;
    
    // Add double-click handler for title editing
    modalTitle.style.cursor = 'text';
    modalTitle.title = 'Double-click to edit name';
    
    // Remove any existing handlers
    modalTitle.ondblclick = null;
    modalTitle.removeEventListener('dblclick', modalTitle._editHandler);
    
    // Create new handler
    modalTitle._editHandler = function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('🖱️ Double-click detected on title:', modalTitle.textContent);
        // Always use the current file, not the one from when modal opened
        startEditingFileName(modalTitle, window.currentImageFile || file);
    };
    
    // Add both methods to ensure it works
    modalTitle.addEventListener('dblclick', modalTitle._editHandler);
    modalTitle.ondblclick = modalTitle._editHandler;
    
    // Load existing comments
    loadImageComments(file.id);
    
    // Clear comment input
    newCommentText.value = '';
    
    // Show modal
    modal.classList.add('active');
};

/**
 * Close image modal
 */
window.closeImageModal = function() {
    const modal = document.getElementById('imageModal');
    modal?.classList.remove('active');
    window.currentImageFile = null;
};

/**
 * Show text file modal with content viewer
 * Opens a modal similar to the image viewer but displays text file contents
 * @param {Object} file - File metadata object containing downloadURL, fileName, etc.
 */
window.showTextModal = async function(file) {
    const modal = document.getElementById('textModal');
    const modalTitle = document.getElementById('textModalTitle');
    const modalContent = document.getElementById('textModalContent');
    const modalSize = document.getElementById('textModalSize');
    const modalDate = document.getElementById('textModalDate');
    const modalEncoding = document.getElementById('textModalEncoding');
    
    if (!modal || !modalContent) return;
    
    // Set metadata
    modalTitle.textContent = file.displayName || file.fileName || file.name || 'Text File';
    modalSize.textContent = formatFileSize(file.fileSize || file.size || 0);
    modalDate.textContent = formatDate(file.uploadedAt || file.dateUploaded);
    modalEncoding.textContent = 'UTF-8'; // Default encoding
    
    // Store current file for actions
    window.currentTextFile = file;
    
    // Show loading state
    modalContent.textContent = 'Loading text content...';
    modal.classList.add('active');
    
    try {
        // Fetch text content from download URL
        const response = await fetch(file.downloadURL);
        if (!response.ok) {
            throw new Error('Failed to load text file');
        }
        
        const text = await response.text();
        
        // Display text content
        modalContent.textContent = text;
        
        console.log('✅ Loaded text file:', file.fileName);
        
    } catch (error) {
        console.error('❌ Failed to load text file:', error);
        modalContent.textContent = `Error loading file: ${error.message}`;
        modalContent.style.color = '#ef4444';
    }
};

/**
 * Close text modal and cleanup
 * Removes the modal from view and clears the current file reference
 */
window.closeTextModal = function() {
    const modal = document.getElementById('textModal');
    modal?.classList.remove('active');
    window.currentTextFile = null;
};

/**
 * Copy text content to clipboard
 * Copies the entire text file content to the user's clipboard
 * Shows success/error notification based on result
 */
window.copyTextContent = async function() {
    const content = document.getElementById('textModalContent')?.textContent;
    if (!content) return;
    
    try {
        await navigator.clipboard.writeText(content);
        showNotification('Text copied to clipboard', 'success');
    } catch (error) {
        console.error('Failed to copy text:', error);
        showNotification('Failed to copy text', 'error');
    }
};

/**
 * Download text file
 * Triggers browser download of the text file using its Firebase Storage URL
 * Uses the original filename or defaults to 'download.txt'
 */
window.downloadTextFile = function() {
    if (!window.currentTextFile) return;
    
    // Create a link and trigger download
    const link = document.createElement('a');
    link.href = window.currentTextFile.downloadURL;
    link.download = window.currentTextFile.fileName || 'download.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

/**
 * Add comment to current image
 */
window.addImageComment = async function() {
    const newCommentText = document.getElementById('newCommentText');
    const commentText = newCommentText.value.trim();
    
    if (!commentText || !window.currentImageFile) return;
    
    try {
        // Add comment to database (placeholder - would integrate with Firebase)
        const comment = {
            id: Date.now().toString(),
            text: commentText,
            timestamp: new Date(),
            fileId: window.currentImageFile.id
        };
        
        // Store comment locally for now (in real app, would save to Firestore)
        const comments = getImageComments(window.currentImageFile.id);
        comments.push(comment);
        localStorage.setItem(`comments_${window.currentImageFile.id}`, JSON.stringify(comments));
        
        // Refresh comments display
        loadImageComments(window.currentImageFile.id);
        
        // Clear input
        newCommentText.value = '';
        
        console.log('✅ Comment added:', comment);
        
    } catch (error) {
        console.error('❌ Failed to add comment:', error);
        alert('Failed to add comment. Please try again.');
    }
};

/**
 * Load comments for an image
 */
function loadImageComments(fileId) {
    const commentsList = document.getElementById('imageCommentsList');
    if (!commentsList) return;
    
    const comments = getImageComments(fileId);
    
    if (comments.length === 0) {
        commentsList.innerHTML = '<div class="no-comments">No comments yet. Add the first one!</div>';
        return;
    }
    
    commentsList.innerHTML = comments.map(comment => `
        <div class="comment-item">
            <div class="comment-text">${escapeHtml(comment.text)}</div>
            <div class="comment-meta">${formatDate(comment.timestamp)}</div>
        </div>
    `).join('');
}

/**
 * Get comments for an image from local storage
 */
function getImageComments(fileId) {
    try {
        const stored = localStorage.getItem(`comments_${fileId}`);
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.error('Failed to load comments:', error);
        return [];
    }
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Update file counts in filter chips
 */
function updateFileCounts() {
    const allFiles = document.querySelectorAll('.file-card').length;
    const withFaces = document.querySelectorAll('[data-has-faces="true"]').length;
    const recent = document.querySelectorAll('.file-card').length; // Simplified for now
    
    const allCountEl = document.getElementById('allCount');
    const facesCountEl = document.getElementById('facesCount');
    const recentCountEl = document.getElementById('recentCount');
    
    if (allCountEl) allCountEl.textContent = allFiles;
    if (facesCountEl) facesCountEl.textContent = withFaces;
    if (recentCountEl) recentCountEl.textContent = Math.min(recent, 8);
}

/**
 * Initialize batch selection functionality
 */
function initializeBatchSelection() {
    // State for selected files
    window.selectedFiles = window.selectedFiles || new Set();
    
    // Handle vectorize button click
    const vectorizeBtn = document.getElementById('vectorizeBtn');
    if (vectorizeBtn) {
        vectorizeBtn.addEventListener('click', handleBatchVectorize);
    }
}

/**
 * Initialize vectorization quota display
 */
async function initializeVectorizationQuota() {
    try {
        const quota = await getVectorizationQuota();
        updateQuotaDisplay(quota);
    } catch (error) {
        console.error('Failed to load vectorization quota:', error);
    }
}

/**
 * Get user's vectorization quota
 */
async function getVectorizationQuota() {
    const { auth, db } = await import('../firebase-config.js');
    const { doc, getDoc } = await import('firebase/firestore');
    
    const user = auth.currentUser;
    if (!user) return { used: 0, limit: 1000, tier: 'free' };
    
    try {
        // Get user's usage data
        const usageDoc = await getDoc(doc(db, 'users', user.uid, 'usage', 'vectorization'));
        const usage = usageDoc.exists() ? usageDoc.data() : { count: 0, lastReset: new Date() };
        
        // For now, assume free tier with 10/month limit
        return {
            used: usage.count || 0,
            limit: 1000,
            tier: 'free',
            lastReset: usage.lastReset
        };
    } catch (error) {
        console.error('Error fetching quota:', error);
        return { used: 0, limit: 1000, tier: 'free' };
    }
}

/**
 * Update quota display
 */
function updateQuotaDisplay(quota) {
    const quotaBar = document.getElementById('quotaBar');
    const quotaText = document.getElementById('quotaText');
    
    if (quotaBar && quotaText) {
        const percentage = (quota.used / quota.limit) * 100;
        quotaBar.style.width = `${percentage}%`;
        quotaText.textContent = `${quota.used}/${quota.limit} this month`;
        
        // Change color based on usage
        if (percentage >= 90) {
            quotaBar.style.background = '#ef4444';
        } else if (percentage >= 70) {
            quotaBar.style.background = '#f59e0b';
        }
    }
}

/**
 * Handle batch vectorize button click
 */
async function handleBatchVectorize() {
    const selectedFiles = Array.from(window.selectedFiles);
    
    if (selectedFiles.length === 0) {
        alert('Please select files to vectorize');
        return;
    }
    
    // Filter only image files
    const imageFiles = selectedFiles.filter(fileId => {
        const file = window.currentFiles?.find(f => f.id === fileId);
        return file && file.fileType && file.fileType.startsWith('image/');
    });
    
    if (imageFiles.length === 0) {
        alert('Please select image files to vectorize');
        return;
    }
    
    // Check quota
    const quota = await getVectorizationQuota();
    if (quota.used + imageFiles.length > quota.limit) {
        alert(`Quota exceeded. You have ${quota.limit - quota.used} vectorizations remaining this month.`);
        return;
    }
    
    // Confirm vectorization
    if (!confirm(`Vectorize ${imageFiles.length} image(s)? This will use ${imageFiles.length} of your monthly quota.`)) {
        return;
    }
    
    // Perform vectorization
    await performVectorization(imageFiles);
}

// Make function globally accessible for testing
window.handleBatchVectorize = handleBatchVectorize;

/**
 * Perform vectorization on selected files
 */
async function performVectorization(fileIds) {
    console.log('🚀 Starting V1 vectorization for files:', fileIds);
    
    // Get files from current files array
    const files = fileIds.map(id => window.currentFiles?.find(f => f.id === id)).filter(Boolean);
    if (files.length === 0) {
        console.error('❌ No files found for vectorization');
        return;
    }
    
    // Disable button and show loading
    const vectorizeBtn = document.querySelector('#vectorizeBtn');
    const originalText = vectorizeBtn ? vectorizeBtn.textContent : '';
    if (vectorizeBtn) {
        vectorizeBtn.disabled = true;
        vectorizeBtn.textContent = 'Vectorizing...';
    }
    
    try {
        showNotification('Starting vectorization...', 'info');
        
        // Get current user and twin ID
        const { auth } = await import('../firebase-config.js');
        const user = auth.currentUser;
        if (!user) {
            showNotification('User not authenticated', 'error');
            return;
        }
        
        // V1 API call exactly as it worked on June 19th
        const twinId = localStorage.getItem('selectedTwinId') || 'default';
        
        // Import V1 orchestration endpoints
        const { ORCHESTRATION_ENDPOINTS, getEndpoints } = await import('../config/orchestration-endpoints.js');
        
        // 🚨 DEBUG MODE: Use local artifact processor for debugging
        console.log('🐛 DEBUG MODE: Using local artifact processor');
        const apiEndpoint = 'http://localhost:8080/process-artifact';
        
        // Log debug info
        console.log('🔧 Local server endpoint:', apiEndpoint);
        console.log('🔬 Debugging face detection issue locally');
        
        // Process each file individually (API expects single file format)
        let processedCount = 0;
        for (const file of files) {
            processedCount++;
            console.log(`🚀 Processing file ${processedCount}/${files.length}: ${file.fileName || file.name}`);
            
            // Add loading indicator to the specific file card
            const fileCard = document.querySelector(`[data-file-id="${file.id}"]`);
            if (fileCard) {
                // Add loading overlay
                const loadingOverlay = document.createElement('div');
                loadingOverlay.className = 'vectorization-loading-overlay';
                loadingOverlay.innerHTML = `
                    <div class="loading-spinner">
                        <svg class="hourglass-icon" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M5 8V16C5 17.8856 5 18.8284 5.58579 19.4142C6.17157 20 7.11438 20 9 20H15C16.8856 20 17.8284 20 18.4142 19.4142C19 18.8284 19 17.8856 19 16V8M5 8C5 6.11438 5 5.17157 5.58579 4.58579C6.17157 4 7.11438 4 9 4H15C16.8856 4 17.8284 4 18.4142 4.58579C19 5.17157 19 6.11438 19 8M5 8L12 12L19 8" stroke-width="2" stroke-linecap="round"/>
                            <animate attributeName="transform" attributeType="XML" values="0 12 12; 180 12 12" dur="1s" repeatCount="indefinite"/>
                        </svg>
                        <div class="loading-text">Vectorizing...</div>
                    </div>
                `;
                fileCard.style.position = 'relative';
                fileCard.appendChild(loadingOverlay);
            }
            
            // Add a delay between files to prevent overwhelming the API
            if (processedCount > 1) {
                console.log('⏳ Waiting 3 seconds before next file to ensure API is ready...');
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
            
            // Use /process-artifact format per ArtifactProcessor API specification
            const payload = {
                artifact_id: file.id,
                file_url: file.downloadURL,
                mime_type: file.fileType || 'image/jpeg',
                user_id: user.uid,
                options: {},
                metadata: {
                    fileName: file.fileName || file.name,
                    twinId: twinId,
                    uploadedAt: file.uploadedAt
                }
            };
            
            console.log('📤 API Payload:', JSON.stringify(payload, null, 2));
            console.log('📍 API Endpoint:', apiEndpoint);
            console.log('📐 Request details:', {
                fileNumber: processedCount,
                fileName: file.fileName,
                fileUrl: file.downloadURL,
                timestamp: new Date().toISOString()
            });
            
            // 🔍 DEBUG: Log full request details
            const authToken = await user.getIdToken();
            console.log('🔑 Auth token length:', authToken.length);
            console.log('🌐 Request origin:', window.location.origin);
            
            // API call with authentication
            console.log('🚀 Making fetch request to local server...');
            const response = await fetch(apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`,
                    'Origin': window.location.origin
                },
                mode: 'cors',
                body: JSON.stringify(payload)
            });
            
            console.log('📡 Response status:', response.status);
            console.log('📡 Response headers:', [...response.headers.entries()]);
            
            console.log(`📥 Response status for ${file.fileName || file.name}: ${response.status}`);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error(`❌ Response error for ${file.fileName || file.name}:`, errorText);
                showNotification(`API Error for ${file.fileName || file.name}: ${response.status}`, 'error');
                // Remove loading overlay on error
                if (fileCard) {
                    const loadingOverlay = fileCard.querySelector('.vectorization-loading-overlay');
                    if (loadingOverlay) {
                        loadingOverlay.remove();
                    }
                }
                continue; // Skip this file but continue with others
            }
            
            const responseText = await response.text();
            console.log(`📄 Raw response length for ${file.fileName}: ${responseText.length} characters`);
            
            let apiResult;
            try {
                apiResult = JSON.parse(responseText);
            } catch (e) {
                console.error(`❌ Failed to parse JSON response for ${file.fileName}:`, e);
                console.log('Raw response:', responseText.substring(0, 500));
                continue;
            }
            
            console.log(`✅ API Result for ${file.fileName || file.name}:`, apiResult);
            
            // Debug: Log exactly what faces we got from the API
            const apiFaces = apiResult.result?.data?.analysis?.faces || 
                           apiResult.vectorizationResults?.faces || 
                           apiResult.faces || 
                           [];
            console.log(`🔍 File ${processedCount}: ${file.fileName} - API returned ${apiFaces.length} faces:`, apiFaces);
            
            // Also check if there's an error in the response
            if (apiResult.error) {
                console.error(`⚠️ API returned error for ${file.fileName}:`, apiResult.error);
            }
            
            // Update Firebase and UI with result for this file
            try {
                console.log(`📊 Updating Firebase for ${file.fileName} with faces:`, 
                    apiResult.result?.data?.analysis?.faces || apiResult.faces || []);
                
                await window.updateFileVectorizationStatus(file.id, apiResult);
                
                // Wait a bit for Firestore to update
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Fetch the updated file data from Firestore to ensure we have the latest
                const { auth, db } = await import('../firebase-config.js');
                const { doc, getDoc } = await import('firebase/firestore');
                const user = auth.currentUser;
                
                if (user) {
                    const fileDoc = await getDoc(doc(db, 'users', user.uid, 'files', file.id));
                    if (fileDoc.exists()) {
                        const updatedFileData = fileDoc.data();
                        const extractedFaces = updatedFileData.extractedFaces || [];
                        
                        console.log(`👤 File ${file.fileName} in Firestore has ${extractedFaces.length} faces`);
                        
                        // Update the file object in currentFiles array with the new face data
                        const fileIndex = window.currentFiles.findIndex(f => f.id === file.id);
                        if (fileIndex !== -1) {
                            window.currentFiles[fileIndex].extractedFaces = extractedFaces;
                            window.currentFiles[fileIndex].faceCount = extractedFaces.length;
                            console.log(`📝 Updated window.currentFiles[${fileIndex}] with ${extractedFaces.length} faces`);
                        }
                        
                        // Also update the local currentFiles array
                        const localFileIndex = currentFiles.findIndex(f => f.id === file.id);
                        if (localFileIndex !== -1) {
                            currentFiles[localFileIndex].extractedFaces = extractedFaces;
                            currentFiles[localFileIndex].faceCount = extractedFaces.length;
                            console.log(`📝 Updated local currentFiles[${localFileIndex}] with ${extractedFaces.length} faces`);
                        }
                        
                        // Update UI with the data from Firestore
                        window.updateFileVectorizationUI(file.id, { faces: extractedFaces });
                    }
                } else {
                    // Fallback to using API result
                    window.updateFileVectorizationUI(file.id, apiResult);
                }
                
                // Remove loading overlay from the specific card
                if (fileCard) {
                    const loadingOverlay = fileCard.querySelector('.vectorization-loading-overlay');
                    if (loadingOverlay) {
                        loadingOverlay.remove();
                    }
                }
            } catch (updateError) {
                console.error(`❌ Error updating ${file.fileName || file.name}:`, updateError);
                
                // Remove loading overlay even on error
                if (fileCard) {
                    const loadingOverlay = fileCard.querySelector('.vectorization-loading-overlay');
                    if (loadingOverlay) {
                        loadingOverlay.remove();
                    }
                }
            }
        }
        
        showNotification(`Vectorization completed for ${files.length} files`, 'success');
        
        // Clear selection but DON'T refresh the entire page
        clearFileSelection();
        // Remove this line to prevent full page reload:
        // await initializeFileBrowser();
        
    } catch (error) {
        console.error('❌ V1 Vectorization error:', error);
        showNotification(`Vectorization failed: ${error.message}`, 'error');
    } finally {
        // Re-enable button
        if (vectorizeBtn) {
            vectorizeBtn.disabled = false;
            vectorizeBtn.textContent = originalText;
        }
    }
}

/**
 * Update file vectorization status in Firebase
 */
window.updateFileVectorizationStatus = async function updateFileVectorizationStatus(fileId, result) {
    const { auth, db } = await import('../firebase-config.js');
    const { doc, updateDoc } = await import('firebase/firestore');
    
    const user = auth.currentUser;
    if (!user) return;
    
    try {
        const fileRef = doc(db, 'users', user.uid, 'files', fileId);
        
        // Extract faces from API result format (result.data.analysis.faces contains the actual data)
        const faces = result.result?.data?.analysis?.faces || result.vectorizationResults?.faces || result.faces || [];
        
        // Debug logging
        const fileName = window.currentFiles?.find(f => f.id === fileId)?.fileName || 'unknown';
        console.log(`💾 Saving to Firebase - ${fileName}:`, {
            fileId,
            facesCount: faces.length,
            faces: faces
        });
        
        await updateDoc(fileRef, {
            vectorizationStatus: {
                faces: {
                    processed: true,
                    processedAt: new Date()
                },
                fullImage: {
                    processed: true,
                    processedAt: new Date()
                }
            },
            extractedFaces: faces,
            faceCount: faces.length,
            vectorizationCompletedAt: new Date()
        });
        
        // Update usage count (create if doesn't exist)
        const usageRef = doc(db, 'users', user.uid, 'usage', 'vectorization');
        const { increment, setDoc } = await import('firebase/firestore');
        await setDoc(usageRef, {
            count: increment(1),
            lastUsed: new Date()
        }, { merge: true });
        
    } catch (error) {
        console.error('Failed to update vectorization status:', error);
        throw error;
    }
}

/**
 * Update file UI after vectorization
 */
window.updateFileVectorizationUI = function updateFileVectorizationUI(fileId, result) {
    console.log(`🎨 Updating UI for fileId: ${fileId}`);
    const card = document.querySelector(`[data-file-id="${fileId}"]`);
    if (!card) {
        console.error(`❌ Could not find card for fileId: ${fileId}`);
        // Try to find by file name as fallback
        const fileName = window.currentFiles?.find(f => f.id === fileId)?.fileName;
        if (fileName) {
            console.log(`🔍 Trying to find card by fileName: ${fileName}`);
            const allCards = document.querySelectorAll('.file-card');
            for (const c of allCards) {
                const nameEl = c.querySelector('.file-name');
                if (nameEl && nameEl.textContent.includes(fileName)) {
                    console.log(`✅ Found card by fileName match`);
                    card = c;
                    break;
                }
            }
        }
        if (!card) return;
    }
    
    // Update badge
    const badge = card.querySelector('.vectorization-badge');
    if (badge) {
        badge.className = 'vectorization-badge';
        badge.textContent = 'Vectorized';
    }
    
    // Add/update face count from API result format (result.data.analysis.faces contains the actual data)
    const faces = result.result?.data?.analysis?.faces || result.vectorizationResults?.faces || result.faces || [];
    
    // Update card data attributes for filtering
    console.log(`🎯 Updating face indicator for ${fileId}: ${faces.length} faces`);
    if (faces.length > 0) {
        card.dataset.hasFaces = 'true';
        card.dataset.faceCount = faces.length;
        let faceIndicator = card.querySelector('.face-indicator');
        if (!faceIndicator) {
            console.log(`🆕 Creating new face indicator for ${fileId}`);
            faceIndicator = document.createElement('div');
            faceIndicator.className = 'face-indicator';
            const thumbnailContainer = card.querySelector('.file-thumbnail-container');
            if (thumbnailContainer) {
                thumbnailContainer.appendChild(faceIndicator);
            } else {
                console.error(`❌ No thumbnail container found for ${fileId}`);
            }
        } else {
            console.log(`♻️ Updating existing face indicator for ${fileId}`);
        }
        
        faceIndicator.innerHTML = `
            <svg class="face-icon" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"/>
            </svg>
            ${faces.length} face${faces.length !== 1 ? 's' : ''}
        `;
        
        // Update click handler with the updated file data
        faceIndicator.onclick = (e) => {
            const file = window.currentFiles?.find(f => f.id === fileId);
            if (file) {
                // Make sure the file has the latest face data
                file.extractedFaces = faces;
                file.faceCount = faces.length;
                window.showFaces(e, file);
            }
        };
    }
}

/**
 * Clear file selection
 */
window.clearFileSelection = function() {
    // Clear selected files
    window.selectedFiles.clear();
    
    // Remove selected class and uncheck checkboxes
    document.querySelectorAll('.file-card').forEach(card => {
        card.classList.remove('selected');
        const checkbox = card.querySelector('.file-checkbox');
        if (checkbox) checkbox.checked = false;
    });
    
    // Hide batch actions
    document.getElementById('batchActions').style.display = 'none';
    document.getElementById('selectedCount').textContent = '0';
};

/**
 * Update batch actions visibility based on selection
 */
function updateBatchActionsVisibility() {
    const batchActions = document.getElementById('batchActions');
    const selectedCount = document.getElementById('selectedCount');
    
    if (window.selectedFiles.size > 0) {
        batchActions.style.display = 'block';
        selectedCount.textContent = window.selectedFiles.size;
    } else {
        batchActions.style.display = 'none';
    }
}

/**
 * Show loading skeleton
 */
function showLoading() {
    const loadingGrid = document.getElementById('loadingGrid');
    const fileGrid = document.getElementById('filesContainer');
    
    if (loadingGrid && fileGrid) {
        loadingGrid.style.display = 'grid';
        fileGrid.style.display = 'none';
    }
}

/**
 * Hide loading skeleton
 */
function hideLoading() {
    setTimeout(() => {
        const loadingGrid = document.getElementById('loadingGrid');
        const fileGrid = document.getElementById('filesContainer');
        
        if (loadingGrid && fileGrid) {
            loadingGrid.style.display = 'none';
            fileGrid.style.display = 'grid';
        }
    }, 1000);
}

/**
 * Create enhanced file card with new design
 */
function createFileCard(file) {
    console.log(`🎨 Creating card for: ${file.fileName || file.name}, Type: ${file.fileType || file.type || 'unknown'}`);
    
    const card = document.createElement('div');
    card.className = 'file-card';
    
    // Set file ID for deletion - NO FALLBACKS
    card.dataset.fileId = file.id;
    
    // Prevent card click from interfering with child elements
    card.addEventListener('click', (e) => {
        // Only allow clicks on interactive elements
        const isInteractive = 
            e.target.classList.contains('file-checkbox') ||
            e.target.closest('.file-checkbox') ||
            e.target.closest('.quick-actions') ||
            e.target.closest('.face-indicator') ||
            e.target.classList.contains('file-thumbnail');
        
        if (!isInteractive) {
            e.preventDefault();
            e.stopPropagation();
        }
    });
    
    // Add checkbox for selection
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'file-checkbox';
    checkbox.addEventListener('change', (e) => {
        e.stopPropagation();
        if (e.target.checked) {
            window.selectedFiles.add(file.id);
            card.classList.add('selected');
        } else {
            window.selectedFiles.delete(file.id);
            card.classList.remove('selected');
        }
        updateBatchActionsVisibility();
    });
    checkbox.addEventListener('click', (e) => {
        e.stopPropagation();
    });
    card.appendChild(checkbox);
    
    // Set data attributes for filtering
    if (file.faceCount > 0) {
        card.dataset.hasFaces = 'true';
        card.dataset.faceCount = file.faceCount;
    }
    
    // File thumbnail container
    const thumbnailContainer = document.createElement('div');
    thumbnailContainer.className = 'file-thumbnail-container';
    
    // Thumbnail
    const thumbnail = createThumbnailElement(file);
    thumbnail.className = 'file-thumbnail';
    
    // Add click handler for images
    if (file.fileType && file.fileType.startsWith('image/')) {
        thumbnail.style.cursor = 'pointer';
        thumbnail.onclick = async (e) => {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            
            // Always use showImageModal to ensure rename feature works
            // TODO: Integrate rename feature into face-overlay.js later
            showImageModal(file);
        };
    }
    
    // Add click handler for text files
    // When a text file is clicked, open it in the text viewer modal
    // This provides inline viewing without needing to download the file
    if (file.fileType && (file.fileType === 'text/plain' || file.fileType.includes('text'))) {
        thumbnail.style.cursor = 'pointer';
        thumbnail.onclick = async (e) => {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            
            showTextModal(file);
        };
    }
    
    thumbnailContainer.appendChild(thumbnail);
    
    // Vectorization status badge
    if (file.vectorizationStatus?.faces?.processed || file.vectorizationStatus?.fullImage?.processed) {
        const badge = document.createElement('div');
        badge.className = 'vectorization-badge';
        badge.textContent = 'Vectorized';
        card.appendChild(badge);
    }
    
    // Face indicator
    if (file.faceCount > 0 || file.extractedFaces?.length > 0) {
        const faceCount = file.faceCount || file.extractedFaces?.length || 0;
        const faceIndicator = document.createElement('div');
        faceIndicator.className = 'face-indicator';
        faceIndicator.onclick = (e) => window.showFaces(e, file);
        faceIndicator.innerHTML = `
            <svg class="face-icon" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"/>
            </svg>
            ${faceCount} face${faceCount !== 1 ? 's' : ''}
        `;
        thumbnailContainer.appendChild(faceIndicator);
    }
    
    
    // Quick actions
    const quickActions = document.createElement('div');
    quickActions.className = 'quick-actions';
    quickActions.innerHTML = `
        <button class="action-btn download-btn" title="Download" onclick="downloadFile('${file.id}')">
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 3a1 1 0 0 0-1 1v6.586L6.707 8.293a1 1 0 1 0-1.414 1.414l4 4a1 1 0 0 0 1.414 0l4-4a1 1 0 0 0-1.414-1.414L11 10.586V4a1 1 0 0 0-1-1z"/>
                <path d="M3 13a1 1 0 0 0-1 1v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2a1 1 0 1 0-2 0v2H4v-2a1 1 0 0 0-1-1z"/>
            </svg>
        </button>
        <button class="action-btn delete-btn" title="Delete" onclick="showDeleteConfirmation(this.closest('.file-card'))">
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z"/>
            </svg>
        </button>
    `;
    thumbnailContainer.appendChild(quickActions);
    
    card.appendChild(thumbnailContainer);
    
    // File info
    const fileInfo = document.createElement('div');
    fileInfo.className = 'file-info';
    
    const fileName = document.createElement('div');
    fileName.className = 'file-name';
    // NO FALLBACKS - show the real field names that exist or break
    fileName.textContent = file.displayName || file.fileName || file.name;
    
    const fileMeta = document.createElement('div');
    fileMeta.className = 'file-meta';
    fileMeta.innerHTML = `
        <span>${formatFileSize(file.fileSize || file.size)}</span>
        <span class="file-date">${formatDate(file.uploadedAt || file.dateUploaded)}</span>
    `;
    
    fileInfo.appendChild(fileName);
    fileInfo.appendChild(fileMeta);
    card.appendChild(fileInfo);
    
    return card;
}

/**
 * Format file size
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Format date
 */
function formatDate(date) {
    const now = new Date();
    const fileDate = new Date(date);
    const diffMs = now - fileDate;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) !== 1 ? 's' : ''} ago`;
    return fileDate.toLocaleDateString();
}

/**
 * Download file handler
 */
window.downloadFile = function(fileId) {
    console.log('Download file:', fileId);
    // Implement download functionality
};

// Legacy functions for compatibility

/**
 * Check if Firebase services are properly initialized
 */
async function checkFirebaseServices() {
    console.log('🔥 Checking Firebase services initialization...');
    
    try {
        const { auth } = await import('../firebase-config.js');
        const { isAuthenticated } = await import('../auth-guard.js');
        
        const userIsAuthenticated = await isAuthenticated();
        if (!userIsAuthenticated) {
            console.warn('⚠️ No authenticated user found');
            showNotification(
                'Please log in to upload files. File uploads require authentication.', 
                'warning',
                10000
            );
            showLoginRequiredState();
            return false;
        }
        
        console.log('✅ Firebase services initialized with user:', auth.currentUser.uid);
        return true;
        
    } catch (error) {
        console.error('❌ Firebase services check failed:', error);
        showNotification('Firebase services unavailable. Please refresh the page.', 'error');
        return false;
    }
}

function showLoginRequiredState() {
    const emptyState = document.getElementById('emptyState');
    if (emptyState && !document.getElementById('filesContainer')?.children.length) {
        emptyState.style.display = 'block';
        emptyState.innerHTML = `
            <div class="empty-icon">🔐</div>
            <h3>Login Required for File Uploads</h3>
            <p>Your upload interface is ready, but file uploads require authentication.</p>
            <p>Please log in to upload and manage your files.</p>
            <div id="login-prompt-button-container"></div>
        `;
        
        const loginBtn = new Button({
            text: 'Go to Login',
            type: 'primary',
            icon: '🔑',
            onClick: () => {
                window.location.href = '/pages/auth.html';
            }
        });
        const loginContainer = document.getElementById('login-prompt-button-container');
        if (loginContainer) {
            loginContainer.appendChild(loginBtn.element);
        }
    }
}

function showNotAuthenticatedState() {
    console.log('🔐 Showing not authenticated state');
    
    const loadingState = document.getElementById('loadingState');
    if (loadingState) {
        loadingState.style.display = 'none';
    }
    
    const emptyState = document.getElementById('emptyState');
    if (emptyState) {
        emptyState.style.display = 'block';
        emptyState.innerHTML = `
            <div class="empty-icon">🔒</div>
            <h3>Authentication Required</h3>
            <p>Please log in to view your files</p>
            <div id="login-button-container"></div>
        `;
        
        const loginBtn = new Button({
            text: 'Go to Login',
            type: 'primary',
            onClick: () => {
                window.location.href = '/pages/auth.html';
            }
        });
        const loginContainer = document.getElementById('login-button-container');
        if (loginContainer) {
            loginContainer.appendChild(loginBtn.element);
        }
    }
    
    const elements = ['filesContainer', 'storageInfo', 'uploadQueue'];
    elements.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });
}

function initializeButtons() {
    // Legacy button initialization for compatibility
    console.log('🔄 Initializing buttons...');
}

function initializeSearch() {
    // Legacy search initialization - now handled by initializeSearchAndFilters
    console.log('🔄 Search initialized with new design');
}

async function initializeFileBrowser() {
    console.log('🔄 Initializing file browser...');
    
    showLoading();
    
    try {
        // Wait for authentication state to be ready
        const { auth } = await import('../firebase-config.js');
        await new Promise((resolve) => {
            if (auth.currentUser) {
                // Already authenticated
                resolve();
            } else {
                // Wait for auth state change
                const unsubscribe = auth.onAuthStateChanged((user) => {
                    if (user) {
                        unsubscribe();
                        resolve();
                    }
                });
            }
        });
        
        // Get user files
        const result = await getUserFiles();
        console.log('📁 getUserFiles returned:', result);
        
        // Extract files array from the result object
        const files = result?.files || [];
        console.log('📁 Extracted files array:', files.length, 'files');
        console.log('📁 Files data type:', typeof files, Array.isArray(files) ? 'array' : 'not array');
        
        currentFiles = files;
        window.currentFiles = files; // Make available to vectorization handler
        
        // V1 vectorization functions are now globally accessible
        
        // Ensure files is an array before rendering
        const fileArray = Array.isArray(files) ? files : [];
        
        // Render files
        renderFiles(fileArray);
        
        // Update storage - NO FALLBACKS, LET IT BREAK!
        const storageData = await calculateStorageUsed();
        console.log('📊 Storage data:', storageData);
        updateStorageIndicator(storageData.percentage, formatFileSize(storageData.used), formatFileSize(storageData.total));
        
        // Update counts
        updateFileCounts();
        
        hideLoading();
        
        if (fileArray.length === 0) {
            console.log('📁 No files to display, showing empty state');
            showEmptyState();
        } else {
            console.log(`📁 Successfully loaded ${fileArray.length} files`);
            // Hide empty state if it's showing
            const emptyState = document.getElementById('emptyState');
            if (emptyState) {
                emptyState.style.display = 'none';
            }
        }
        
    } catch (error) {
        console.error('❌ Failed to load files:', error);
        hideLoading();
        if (typeof showNotification === 'function') {
            showNotification('Failed to load files. Please refresh the page.', 'error');
        } else {
            console.error('❌ Failed to load files. Please refresh the page.');
        }
    }
}

function renderFiles(files) {
    const container = document.getElementById('filesContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    // Ensure files is an array
    const fileArray = Array.isArray(files) ? files : (files ? [files] : []);
    
    if (fileArray.length === 0) {
        console.log('📁 No files to render');
        return;
    }
    
    fileArray.forEach(file => {
        // NO FALLBACKS - use exact data from database or let it break
        console.log('🔍 File data:', file);
        console.log(`📄 Rendering: ${file.fileName}, Type: ${file.fileType}, Category: ${file.category}`);
        
        const card = createFileCard(file);
        container.appendChild(card);
    });
    
    console.log(`📁 Rendered ${fileArray.length} files`);
    
    // Update file counts after rendering all cards
    updateFileCounts();
    console.log('📊 Updated file counts after rendering');
}

function showEmptyState() {
    const emptyState = document.getElementById('emptyState');
    if (emptyState) {
        emptyState.innerHTML = `
            <svg class="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            <h2 class="empty-title">No files yet</h2>
            <p class="empty-text">Upload your first file to get started</p>
        `;
        emptyState.style.display = 'block';
    }
}