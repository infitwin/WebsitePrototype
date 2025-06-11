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

/**
 * Initialize the My Files page
 */
export async function initializeMyFiles() {
    console.log('🔄 My Files page loading...');
    
    // Check authentication
    console.log('🔐 Checking authentication...');
    const allowed = await guardPage({
        requireVerified: false,  // Temporarily disabled for testing
        redirectTo: '/pages/auth.html'
    });
    
    if (!allowed) {
        console.log('❌ Authentication failed');
        showNotAuthenticatedState();
        return;
    }
    
    console.log('✅ Authentication passed');

    // Initialize components
    initializeButtons();
    initializeSearch();
    await initializeFileBrowser();
}

/**
 * Show not authenticated state
 */
function showNotAuthenticatedState() {
    console.log('🔐 Showing not authenticated state');
    
    // Hide loading state
    const loadingState = document.getElementById('loadingState');
    if (loadingState) {
        loadingState.style.display = 'none';
    }
    
    // Show empty state with auth message
    const emptyState = document.getElementById('emptyState');
    if (emptyState) {
        emptyState.style.display = 'block';
        emptyState.innerHTML = `
            <div class="empty-icon">🔒</div>
            <h3>Authentication Required</h3>
            <p>Please log in to view your files</p>
            <div id="login-button-container"></div>
        `;
        
        // Add login button
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
    
    // Hide other UI elements
    const elements = ['filesContainer', 'storageInfo', 'uploadQueue'];
    elements.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });
}

/**
 * Initialize all buttons with centralized Button component
 */
function initializeButtons() {
    // Choose Files Button
    const chooseFilesContainer = document.getElementById('choose-files-button');
    if (chooseFilesContainer) {
        const chooseFilesBtn = new Button({
            text: 'Choose Files',
            type: 'secondary',
            icon: '📁',
            onClick: () => {
                document.getElementById('fileInput').click();
            }
        });
        chooseFilesContainer.appendChild(chooseFilesBtn.element);
    }

    // View toggle buttons
    const gridViewBtn = document.querySelector('.view-toggle button[title="Grid view"]');
    const listViewBtn = document.querySelector('.view-toggle button[title="List view"]');
    
    if (gridViewBtn && listViewBtn) {
        // Replace with centralized buttons
        const newGridBtn = new Button({
            text: '⊞',
            type: currentView === 'grid' ? 'primary' : 'secondary',
            size: 'small',
            onClick: () => setView('grid')
        });
        const newListBtn = new Button({
            text: '☰',
            type: currentView === 'list' ? 'primary' : 'secondary',
            size: 'small',
            onClick: () => setView('list')
        });
        
        gridViewBtn.replaceWith(newGridBtn.element);
        listViewBtn.replaceWith(newListBtn.element);
    }
}

/**
 * Initialize search with centralized Search component
 */
function initializeSearch() {
    const searchContainer = document.querySelector('.search-box');
    if (searchContainer) {
        // Remove existing search input
        const oldSearch = searchContainer.querySelector('input');
        if (oldSearch) {
            oldSearch.remove();
        }
        
        // Add centralized search component
        const search = new Search({
            placeholder: 'Search files...',
            onSearch: (query) => {
                filterFiles(query);
            },
            debounceTime: 300
        });
        
        searchContainer.appendChild(search.element);
    }
}

/**
 * Initialize file browser
 */
async function initializeFileBrowser() {
    console.log('🗂️ Initializing file browser...');
    
    try {
        // Initialize drag and drop
        initializeDragDrop();
        
        // Initialize upload queue
        uploadQueue = createUploadQueue();
        
        // Set up file input handler
        const fileInput = document.getElementById('fileInput');
        if (fileInput) {
            fileInput.addEventListener('change', handleFileSelect);
        }
        
        // Set up view toggles
        setupViewToggles();
        
        // Set up sort dropdown
        setupSortDropdown();
        
        // Set up batch actions
        setupBatchActions();
        
        // Load user info
        await loadUserInfo();
        
        // Load initial files
        await loadFiles();
        
        // Set up periodic refresh
        setInterval(async () => {
            await updateStorageInfo();
        }, 30000); // Refresh every 30 seconds
        
        console.log('✅ File browser initialized');
    } catch (error) {
        console.error('❌ Error initializing file browser:', error);
        showError('Failed to initialize file browser');
    }
}

/**
 * Handle file selection from input
 */
async function handleFileSelect(event) {
    const files = Array.from(event.target.files);
    if (files.length > 0) {
        await processFilesForUpload(files);
        event.target.value = ''; // Reset input
        
        // Reload files after upload
        setTimeout(() => loadFiles(), 1000);
    }
}

/**
 * Set up view toggle handlers
 */
function setupViewToggles() {
    document.querySelectorAll('.view-toggle button').forEach(button => {
        button.addEventListener('click', () => {
            const view = button.getAttribute('title').toLowerCase().replace(' view', '');
            setView(view);
        });
    });
}

/**
 * Set view mode
 */
function setView(view) {
    currentView = view;
    const container = document.getElementById('filesContainer');
    
    if (view === 'grid') {
        container.classList.remove('list-view');
        container.classList.add('grid-view');
    } else {
        container.classList.remove('grid-view');
        container.classList.add('list-view');
    }
    
    // Update button states
    document.querySelectorAll('.view-toggle button').forEach(btn => {
        if (btn.getAttribute('title').toLowerCase().includes(view)) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
    
    // Re-render files
    renderFiles(currentFiles);
}

/**
 * Set up sort dropdown
 */
function setupSortDropdown() {
    const sortDropdown = document.getElementById('sortDropdown');
    if (sortDropdown) {
        sortDropdown.addEventListener('change', (e) => {
            sortBy = e.target.value;
            renderFiles(currentFiles);
        });
    }
}

/**
 * Set up batch actions
 */
function setupBatchActions() {
    // Select all checkbox
    const selectAllCheckbox = document.getElementById('selectAll');
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', (e) => {
            const checkboxes = document.querySelectorAll('.file-checkbox');
            checkboxes.forEach(cb => cb.checked = e.target.checked);
            updateBatchActions();
        });
    }
    
    // Batch delete button
    const batchDeleteBtn = document.querySelector('.btn-batch-delete');
    if (batchDeleteBtn) {
        batchDeleteBtn.addEventListener('click', handleBatchDelete);
    }
}

/**
 * Load user info
 */
async function loadUserInfo() {
    const userInfo = document.getElementById('userInfo');
    if (userInfo) {
        const userName = localStorage.getItem('userName') || 'User';
        const userEmail = localStorage.getItem('userEmail') || '';
        userInfo.textContent = `${userName} ${userEmail ? `(${userEmail})` : ''}`;
    }
}

/**
 * Load files from service
 */
async function loadFiles() {
    console.log('📂 Loading files...');
    
    try {
        // Show loading state
        showLoadingState();
        
        // Get files
        const files = await getUserFiles();
        currentFiles = files;
        
        console.log(`📁 Loaded ${files.length} files`);
        
        // Update storage info
        await updateStorageInfo();
        
        // Render files
        renderFiles(files);
        
    } catch (error) {
        console.error('❌ Error loading files:', error);
        showError('Failed to load files');
    }
}

/**
 * Update storage information
 */
async function updateStorageInfo() {
    try {
        const breakdown = await getStorageBreakdown();
        const used = await calculateStorageUsed();
        
        // Update storage text
        const storageText = document.querySelector('.storage-text');
        if (storageText) {
            const total = 10 * 1024 * 1024 * 1024; // 10GB in bytes
            const percentage = Math.round((used / total) * 100);
            storageText.textContent = `${formatFileSize(used)} of 10GB used (${percentage}%)`;
        }
        
        // Update storage chart
        const chartContainer = document.getElementById('storageChart');
        if (chartContainer) {
            createStorageDonutChart(chartContainer, breakdown);
        }
    } catch (error) {
        console.error('Error updating storage info:', error);
    }
}

/**
 * Render files in the current view
 */
function renderFiles(files) {
    const container = document.getElementById('filesContainer');
    if (!container) return;
    
    // Sort files
    const sortedFiles = sortFiles(files, sortBy);
    
    // Clear container
    container.innerHTML = '';
    
    if (sortedFiles.length === 0) {
        showEmptyState();
        return;
    }
    
    // Hide empty state
    const emptyState = document.getElementById('emptyState');
    if (emptyState) {
        emptyState.style.display = 'none';
    }
    
    // Show files container
    container.style.display = currentView === 'grid' ? 'grid' : 'block';
    
    // Render each file
    sortedFiles.forEach(file => {
        const fileElement = currentView === 'grid' 
            ? createFileGridItem(file) 
            : createFileListItem(file);
        container.appendChild(fileElement);
    });
    
    // Update file count
    updateFileCount(sortedFiles.length);
}

/**
 * Sort files
 */
function sortFiles(files, sortBy) {
    const sorted = [...files];
    
    switch (sortBy) {
        case 'name':
            sorted.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'date':
            sorted.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
            break;
        case 'size':
            sorted.sort((a, b) => b.size - a.size);
            break;
        case 'type':
            sorted.sort((a, b) => {
                const typeA = a.name.split('.').pop() || '';
                const typeB = b.name.split('.').pop() || '';
                return typeA.localeCompare(typeB);
            });
            break;
    }
    
    return sorted;
}

/**
 * Create file grid item
 */
function createFileGridItem(file) {
    const item = document.createElement('div');
    item.className = 'file-grid-item';
    item.dataset.fileId = file.id;
    
    // Create checkbox
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'file-checkbox';
    checkbox.addEventListener('change', updateBatchActions);
    
    // Create thumbnail container
    const thumbnailContainer = document.createElement('div');
    thumbnailContainer.className = 'file-thumbnail-container';
    
    // Add thumbnail
    const thumbnailElement = createThumbnailElement(file);
    thumbnailContainer.appendChild(thumbnailElement);
    
    // Create info section
    const info = document.createElement('div');
    info.className = 'file-info';
    
    const name = document.createElement('div');
    name.className = 'file-name';
    name.textContent = file.name;
    name.title = file.name;
    
    const meta = document.createElement('div');
    meta.className = 'file-meta';
    meta.textContent = formatFileSize(file.size);
    
    info.appendChild(name);
    info.appendChild(meta);
    
    // Create actions
    const actions = createFileActions(file);
    
    // Assemble item
    item.appendChild(checkbox);
    item.appendChild(thumbnailContainer);
    item.appendChild(info);
    item.appendChild(actions);
    
    // Add click handler for preview
    thumbnailContainer.addEventListener('click', () => previewFile(file));
    
    return item;
}

/**
 * Create file list item
 */
function createFileListItem(file) {
    const item = document.createElement('div');
    item.className = 'file-list-item';
    item.dataset.fileId = file.id;
    
    // Create checkbox
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'file-checkbox';
    checkbox.addEventListener('change', updateBatchActions);
    
    // Create icon
    const icon = document.createElement('div');
    icon.className = 'file-icon';
    icon.innerHTML = getFallbackIcon(file.type);
    
    // Create name
    const name = document.createElement('div');
    name.className = 'file-name';
    name.textContent = file.name;
    name.title = file.name;
    
    // Create meta info
    const type = document.createElement('div');
    type.className = 'file-type';
    type.textContent = file.name.split('.').pop()?.toUpperCase() || 'FILE';
    
    const size = document.createElement('div');
    size.className = 'file-size';
    size.textContent = formatFileSize(file.size);
    
    const date = document.createElement('div');
    date.className = 'file-date';
    date.textContent = formatDate(file.uploadedAt);
    
    // Create actions
    const actions = createFileActions(file);
    
    // Assemble item
    item.appendChild(checkbox);
    item.appendChild(icon);
    item.appendChild(name);
    item.appendChild(type);
    item.appendChild(size);
    item.appendChild(date);
    item.appendChild(actions);
    
    // Add click handler for preview
    name.addEventListener('click', () => previewFile(file));
    
    return item;
}

/**
 * Create file actions
 */
function createFileActions(file) {
    const actions = document.createElement('div');
    actions.className = 'file-actions';
    
    // Download button
    const downloadBtn = document.createElement('button');
    downloadBtn.className = 'action-btn';
    downloadBtn.title = 'Download';
    downloadBtn.innerHTML = '⬇';
    downloadBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        downloadFile(file);
    });
    
    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'action-btn';
    deleteBtn.title = 'Delete';
    deleteBtn.innerHTML = '🗑';
    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        confirmDelete(file);
    });
    
    actions.appendChild(downloadBtn);
    actions.appendChild(deleteBtn);
    
    return actions;
}

/**
 * Download file
 */
function downloadFile(file) {
    const link = document.createElement('a');
    link.href = file.url;
    link.download = file.name;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification(`Downloading ${file.name}`, 'info');
}

/**
 * Confirm file deletion
 */
function confirmDelete(file) {
    const modal = Modal.confirm({
        title: 'Delete File',
        message: `Are you sure you want to delete "${file.name}"? This action cannot be undone.`,
        confirmText: 'Delete',
        type: 'danger',
        onConfirm: async () => {
            await handleDelete(file);
        }
    });
}

/**
 * Handle file deletion
 */
async function handleDelete(file) {
    try {
        showNotification(`Deleting ${file.name}...`, 'info');
        
        await deleteFile(file.id);
        
        showNotification(`${file.name} deleted successfully`, 'success');
        
        // Reload files
        await loadFiles();
    } catch (error) {
        console.error('Error deleting file:', error);
        showNotification(`Failed to delete ${file.name}`, 'error');
    }
}

/**
 * Preview file
 */
function previewFile(file) {
    // For now, just download the file
    // In future, could implement proper preview modal
    downloadFile(file);
}

/**
 * Handle batch delete
 */
function handleBatchDelete() {
    const selectedFiles = getSelectedFiles();
    if (selectedFiles.length === 0) {
        showNotification('No files selected for deletion', 'error');
        return;
    }
    
    const modal = Modal.confirm({
        title: 'Delete Files',
        message: `Are you sure you want to delete ${selectedFiles.length} files? This action cannot be undone.`,
        confirmText: 'Delete',
        type: 'danger',
        onConfirm: async () => {
            showNotification(`Deleting ${selectedFiles.length} files...`, 'info');
            
            // Delete files sequentially
            for (const file of selectedFiles) {
                try {
                    await deleteFile(file.id);
                } catch (error) {
                    console.error(`Error deleting file ${file.id}:`, error);
                }
            }
            
            showNotification('Files deleted successfully', 'success');
            
            // Clear selections and reload
            document.querySelectorAll('.file-checkbox:checked').forEach(cb => cb.checked = false);
            updateBatchActions();
            await loadFiles();
        }
    });
}

/**
 * Get selected files
 */
function getSelectedFiles() {
    const selectedCheckboxes = document.querySelectorAll('.file-checkbox:checked');
    return Array.from(selectedCheckboxes).map(checkbox => {
        const fileItem = checkbox.closest('.file-grid-item, .file-list-item');
        const fileId = fileItem?.dataset.fileId;
        return currentFiles.find(f => f.id === fileId);
    }).filter(Boolean);
}

/**
 * Update batch actions
 */
function updateBatchActions() {
    const selectedCount = document.querySelectorAll('.file-checkbox:checked').length;
    const batchActions = document.querySelector('.batch-actions');
    const selectedCountEl = document.querySelector('.selected-count');
    
    if (batchActions) {
        batchActions.style.display = selectedCount > 0 ? 'flex' : 'none';
    }
    
    if (selectedCountEl) {
        selectedCountEl.textContent = `${selectedCount} selected`;
    }
    
    // Update select all checkbox
    const selectAll = document.getElementById('selectAll');
    const totalCheckboxes = document.querySelectorAll('.file-checkbox').length;
    if (selectAll) {
        selectAll.checked = selectedCount === totalCheckboxes && totalCheckboxes > 0;
        selectAll.indeterminate = selectedCount > 0 && selectedCount < totalCheckboxes;
    }
}

/**
 * Filter files
 */
function filterFiles(query) {
    if (!query) {
        renderFiles(currentFiles);
        return;
    }
    
    const filtered = currentFiles.filter(file => 
        file.name.toLowerCase().includes(query.toLowerCase())
    );
    
    renderFiles(filtered);
    updateFileCount(filtered.length, currentFiles.length);
}

/**
 * Update file count
 */
function updateFileCount(showing, total = showing) {
    const fileCount = document.querySelector('.file-count');
    if (fileCount) {
        if (showing === total) {
            fileCount.textContent = `${showing} files`;
        } else {
            fileCount.textContent = `Showing ${showing} of ${total} files`;
        }
    }
}

/**
 * Show loading state
 */
function showLoadingState() {
    const container = document.getElementById('filesContainer');
    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyState');
    
    if (container) container.style.display = 'none';
    if (emptyState) emptyState.style.display = 'none';
    if (loadingState) loadingState.style.display = 'flex';
}

/**
 * Show empty state
 */
function showEmptyState() {
    const container = document.getElementById('filesContainer');
    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyState');
    
    if (container) container.style.display = 'none';
    if (loadingState) loadingState.style.display = 'none';
    if (emptyState) {
        emptyState.style.display = 'block';
        emptyState.innerHTML = `
            <div class="empty-icon">📁</div>
            <h3>No files yet</h3>
            <p>Upload your first file to get started</p>
            <div id="upload-button-container"></div>
        `;
        
        // Add upload button
        const uploadBtn = new Button({
            text: 'Upload Files',
            type: 'primary',
            icon: '⬆',
            onClick: () => {
                document.getElementById('fileInput').click();
            }
        });
        const uploadContainer = document.getElementById('upload-button-container');
        if (uploadContainer) {
            uploadContainer.appendChild(uploadBtn.element);
        }
    }
}

/**
 * Show error message
 */
function showError(message) {
    const container = document.getElementById('filesContainer');
    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyState');
    
    if (container) container.style.display = 'none';
    if (loadingState) loadingState.style.display = 'none';
    if (emptyState) {
        emptyState.style.display = 'block';
        emptyState.innerHTML = `
            <div class="empty-icon">❌</div>
            <h3>Error</h3>
            <p>${message}</p>
            <div id="retry-button-container"></div>
        `;
        
        // Add retry button
        const retryBtn = new Button({
            text: 'Try Again',
            type: 'primary',
            onClick: () => {
                loadFiles();
            }
        });
        const retryContainer = document.getElementById('retry-button-container');
        if (retryContainer) {
            retryContainer.appendChild(retryBtn.element);
        }
    }
}

/**
 * Format file size
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Format date
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
        return 'Today';
    } else if (diffDays === 1) {
        return 'Yesterday';
    } else if (diffDays < 7) {
        return `${diffDays} days ago`;
    } else {
        return date.toLocaleDateString();
    }
}