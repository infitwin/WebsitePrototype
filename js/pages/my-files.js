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
        
        // Set up file type filter
        setupFileTypeFilter();
        
        // Set up batch actions
        setupBatchActions();
        
        // Load user info
        await loadUserInfo();
        
        // Load initial files
        await loadFiles();
        
        // Set up vectorization status listener
        setupVectorizationListener();
        
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
 * Set up file type filter
 */
function setupFileTypeFilter() {
    const fileTypeFilter = document.getElementById('fileTypeFilter');
    if (fileTypeFilter) {
        fileTypeFilter.addEventListener('change', (e) => {
            const filterType = e.target.value;
            handleFileTypeFilter(filterType);
        });
    }
}

/**
 * Handle file type filter changes
 */
function handleFileTypeFilter(filterType) {
    const filesContainer = document.getElementById('filesContainer');
    const facesContainer = document.getElementById('facesContainer');
    
    if (filterType === 'faces') {
        // Show faces view
        filesContainer.style.display = 'none';
        facesContainer.style.display = 'block';
        loadExtractedFaces();
    } else {
        // Show files view
        filesContainer.style.display = currentView === 'grid' ? 'grid' : 'block';
        facesContainer.style.display = 'none';
        
        // Filter files by type
        if (filterType === 'all') {
            renderFiles(currentFiles);
        } else if (filterType === 'vectorized') {
            const vectorized = currentFiles.filter(file => file.vectorizationStatus === 'completed');
            renderFiles(vectorized);
        } else {
            // Filter by file type
            const filtered = currentFiles.filter(file => {
                const fileType = file.fileType || file.type || '';
                const fileName = file.fileName || file.name || '';
                const ext = fileName.split('.').pop()?.toLowerCase();
                
                switch(filterType) {
                    case 'images':
                        return fileType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
                    case 'documents':
                        return fileType.includes('pdf') || fileType.includes('document') || 
                               ['pdf', 'doc', 'docx', 'txt', 'rtf'].includes(ext);
                    case 'spreadsheets':
                        return fileType.includes('spreadsheet') || fileType.includes('excel') ||
                               ['xls', 'xlsx'].includes(ext);
                    case 'ebooks':
                        return fileType.includes('epub') || ext === 'epub';
                    case 'gedcom':
                        return ext === 'ged';
                    default:
                        return true;
                }
            });
            renderFiles(filtered);
        }
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
    
    // Batch vectorize button
    const batchVectorizeBtn = document.querySelector('.btn-batch-vectorize');
    if (batchVectorizeBtn) {
        batchVectorizeBtn.addEventListener('click', handleBatchVectorize);
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
        
        // Ensure we have auth before proceeding
        const { auth } = await import('../firebase-config.js');
        if (!auth.currentUser) {
            console.log('⏳ Waiting for auth...');
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        // Get files
        const result = await getUserFiles();
        const files = result.files;
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
            sorted.sort((a, b) => {
                const nameA = a.fileName || a.name || '';
                const nameB = b.fileName || b.name || '';
                return nameA.localeCompare(nameB);
            });
            break;
        case 'date':
            sorted.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
            break;
        case 'size':
            sorted.sort((a, b) => {
                const sizeA = a.fileSize || a.size || 0;
                const sizeB = b.fileSize || b.size || 0;
                return sizeB - sizeA;
            });
            break;
        case 'type':
            sorted.sort((a, b) => {
                const nameA = a.fileName || a.name || '';
                const nameB = b.fileName || b.name || '';
                const typeA = nameA.split('.').pop() || '';
                const typeB = nameB.split('.').pop() || '';
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
    
    // Add vectorization badge if vectorized
    if (file.vectorizationStatus === 'completed') {
        const badge = document.createElement('div');
        badge.className = 'vectorization-badge';
        badge.innerHTML = '<span class="badge-icon">🔍</span><span class="badge-text">Vectorized</span>';
        thumbnailContainer.appendChild(badge);
    }
    
    // Create info section
    const info = document.createElement('div');
    info.className = 'file-info';
    
    const name = document.createElement('div');
    name.className = 'file-name';
    name.textContent = file.fileName || file.name;
    name.title = file.fileName || file.name;
    
    const meta = document.createElement('div');
    meta.className = 'file-meta';
    meta.textContent = formatFileSize(file.fileSize || file.size);
    
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
    icon.innerHTML = getFallbackIcon(file.fileType || file.type);
    
    // Create name
    const name = document.createElement('div');
    name.className = 'file-name';
    name.textContent = file.fileName || file.name;
    name.title = file.fileName || file.name;
    
    // Create meta info
    const type = document.createElement('div');
    type.className = 'file-type';
    const fileName = file.fileName || file.name || '';
    type.textContent = fileName.split('.').pop()?.toUpperCase() || 'FILE';
    
    const size = document.createElement('div');
    size.className = 'file-size';
    size.textContent = formatFileSize(file.fileSize || file.size);
    
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
    link.href = file.downloadURL || file.url;
    link.download = file.fileName || file.name;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification(`Downloading ${file.fileName || file.name}`, 'info');
}

/**
 * Confirm file deletion
 */
function confirmDelete(file) {
    const fileName = file.fileName || file.name;
    const modal = Modal.confirm({
        title: 'Delete File',
        message: `Are you sure you want to delete "${fileName}"? This action cannot be undone.`,
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
    const fileName = file.fileName || file.name;
    try {
        showNotification(`Deleting ${fileName}...`, 'info');
        
        await deleteFile(file.id, file.storagePath);
        
        showNotification(`${fileName} deleted successfully`, 'success');
        
        // Reload files
        await loadFiles();
    } catch (error) {
        console.error('Error deleting file:', error);
        showNotification(`Failed to delete ${fileName}`, 'error');
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
 * Handle batch vectorize
 */
async function handleBatchVectorize() {
    const selectedFiles = getSelectedFiles();
    if (selectedFiles.length === 0) {
        showNotification('No files selected for vectorization', 'error');
        return;
    }
    
    // Filter only image files
    const imageFiles = selectedFiles.filter(file => {
        const fileType = file.fileType || file.type || '';
        const fileName = file.fileName || file.name || '';
        const ext = fileName.split('.').pop()?.toLowerCase();
        return fileType.startsWith('image/') || 
               ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
    });
    
    if (imageFiles.length === 0) {
        showNotification('Please select image files to vectorize', 'error');
        return;
    }
    
    const confirmModal = await Modal.confirm({
        title: 'Vectorize Images',
        message: `Vectorize ${imageFiles.length} image${imageFiles.length > 1 ? 's' : ''}? This will extract faces and enable AI search.`,
        confirmText: 'Vectorize',
        type: 'primary'
    });
    
    if (confirmModal) {
        await performVectorization(imageFiles);
    }
}

/**
 * Perform vectorization
 */
async function performVectorization(files) {
    // Disable button and show loading
    const vectorizeBtn = document.querySelector('.btn-batch-vectorize');
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
        
        const twinId = localStorage.getItem('selectedTwinId') || 'default';
        
        // Import orchestration endpoints
        const { ORCHESTRATION_ENDPOINTS, getEndpoints } = await import('../config/orchestration-endpoints.js');
        
        // Use development endpoints for localhost
        const endpoints = getEndpoints(window.location.hostname === 'localhost');
        const apiEndpoint = endpoints.ARTIFACT_PROCESSOR;
        
        // Prepare payload
        const payload = {
            files: files.map(file => ({
                fileId: file.id,
                downloadURL: file.downloadURL || file.url,
                userId: user.uid,
                twinId: twinId
            })),
            processType: "vectorize-photos"
        };
        
        console.log('Vectorization payload:', payload);
        console.log('Endpoint:', apiEndpoint);
        
        // Call Artifact Processor with proper headers
        const response = await fetch(apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${await user.getIdToken()}`,
                'Origin': window.location.origin
            },
            mode: 'cors',
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Vectorization response error:', errorText);
            throw new Error(`Vectorization failed: ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('Vectorization result:', result);
        
        // Process the vectorization results
        if (result.success && result.results && Array.isArray(result.results)) {
            let totalFacesExtracted = 0;
            
            // Update each file with vectorization results
            const { doc, updateDoc } = await import('firebase/firestore');
            const { db } = await import('../firebase-config.js');
            
            for (let i = 0; i < result.results.length; i++) {
                const fileResult = result.results[i];
                const originalFile = files[i];
                
                if (!originalFile) continue;
                
                try {
                    const updateData = {
                        vectorizationStatus: fileResult.success ? 'completed' : 'failed',
                        vectorizationCompletedAt: new Date().toISOString(),
                        vectorizationError: fileResult.error || null
                    };
                    
                    // Add face extraction data if available
                    if (fileResult.faces && Array.isArray(fileResult.faces) && fileResult.faces.length > 0) {
                        const facesData = fileResult.faces.map((face, faceIndex) => ({
                            id: `${originalFile.id}_face_${faceIndex}`,
                            confidence: face.confidence || 0.8,
                            boundingBox: face.boundingBox || face.bbox || {
                                x: face.x || 0,
                                y: face.y || 0,
                                width: face.width || 100,
                                height: face.height || 100
                            },
                            thumbnail: face.thumbnail || face.croppedImage || face.url,
                            embedding: face.embedding || face.vector || [],
                            extractedAt: new Date().toISOString(),
                            fileName: originalFile.fileName || originalFile.name
                        }));
                        
                        updateData.extractedFaces = facesData;
                        updateData.faceCount = facesData.length;
                        totalFacesExtracted += facesData.length;
                        
                        console.log(`👤 Extracted ${facesData.length} faces from ${originalFile.fileName}`);
                    } else {
                        updateData.extractedFaces = [];
                        updateData.faceCount = 0;
                    }
                    
                    // Add vector embedding if available
                    if (fileResult.embedding || fileResult.vector) {
                        updateData.vectorEmbedding = fileResult.embedding || fileResult.vector;
                        updateData.embeddingDimensions = (fileResult.embedding || fileResult.vector).length;
                    }
                    
                    await updateDoc(doc(db, 'files', originalFile.id), updateData);
                    console.log(`✅ Updated file ${originalFile.id} with vectorization results`);
                    
                } catch (updateError) {
                    console.error(`❌ Error updating file ${originalFile.id}:`, updateError);
                }
            }
            
            showNotification(
                `Vectorization completed! Extracted ${totalFacesExtracted} faces from ${files.length} images`, 
                'success'
            );
            
        } else {
            // Fallback: mark as processing (for async processing)
            showNotification(`Vectorization started for ${files.length} images`, 'info');
            
            const { doc, updateDoc } = await import('firebase/firestore');
            const { db } = await import('../firebase-config.js');
            
            for (const file of files) {
                try {
                    await updateDoc(doc(db, 'files', file.id), {
                        vectorizationStatus: 'processing',
                        vectorizationStartedAt: new Date().toISOString()
                    });
                } catch (updateError) {
                    console.error('Error updating file status:', updateError);
                }
            }
        }
        
        // Clear selection
        document.querySelectorAll('.file-checkbox:checked').forEach(cb => cb.checked = false);
        updateBatchActions();
        
        // Reload files to show updated status
        setTimeout(() => loadFiles(), 1000);
        
    } catch (error) {
        console.error('Vectorization error:', error);
        
        if (error.message.includes('Failed to fetch') || error.message.includes('CORS')) {
            showNotification('CORS error: The vectorization service needs to be configured to allow requests from localhost. Contact the API administrator.', 'error');
        } else {
            showNotification(`Vectorization failed: ${error.message}`, 'error');
        }
    } finally {
        // Re-enable button
        if (vectorizeBtn) {
            vectorizeBtn.disabled = false;
            vectorizeBtn.textContent = originalText;
        }
    }
}

/**
 * Set up vectorization status listener
 */
function setupVectorizationListener() {
    // This will be implemented to listen for Firestore updates
    // on vectorization status changes
}

/**
 * Load extracted faces from Firestore
 */
async function loadExtractedFaces() {
    console.log('👤 Loading extracted faces...');
    
    try {
        const { collection, query, where, getDocs } = await import('firebase/firestore');
        const { db, auth } = await import('../firebase-config.js');
        
        const user = auth.currentUser;
        if (!user) {
            console.log('❌ User not authenticated for face loading');
            showEmptyFacesState();
            return;
        }
        
        // Query for files with extracted faces
        const filesRef = collection(db, 'files');
        const facesQuery = query(
            filesRef,
            where('userId', '==', user.uid),
            where('extractedFaces', '!=', null)
        );
        
        const snapshot = await getDocs(facesQuery);
        const allFaces = [];
        
        snapshot.docs.forEach(doc => {
            const fileData = doc.data();
            if (fileData.extractedFaces && Array.isArray(fileData.extractedFaces)) {
                fileData.extractedFaces.forEach((face, index) => {
                    allFaces.push({
                        id: `${doc.id}_${index}`,
                        fileId: doc.id,
                        fileName: fileData.fileName || fileData.name,
                        ...face
                    });
                });
            }
        });
        
        console.log(`👤 Found ${allFaces.length} extracted faces`);
        
        const facesGrid = document.getElementById('facesGrid');
        if (!facesGrid) {
            console.log('❌ Faces grid container not found');
            return;
        }
        
        if (allFaces.length === 0) {
            showEmptyFacesState();
            return;
        }
        
        // Clear grid and populate with faces
        facesGrid.innerHTML = '';
        
        allFaces.forEach(face => {
            const faceElement = createFaceElement(face);
            facesGrid.appendChild(faceElement);
        });
        
    } catch (error) {
        console.error('❌ Error loading extracted faces:', error);
        showEmptyFacesState();
    }
}

/**
 * Show empty faces state
 */
function showEmptyFacesState() {
    const facesGrid = document.getElementById('facesGrid');
    if (facesGrid) {
        facesGrid.innerHTML = `
            <div class="empty-faces">
                <div class="empty-icon">👤</div>
                <h4>No faces extracted yet</h4>
                <p>Vectorize images to extract faces</p>
            </div>
        `;
    }
}

/**
 * Create face element for display
 */
function createFaceElement(face) {
    const faceItem = document.createElement('div');
    faceItem.className = 'face-item';
    faceItem.dataset.faceId = face.id;
    faceItem.dataset.fileId = face.fileId;
    
    // Make face draggable
    faceItem.draggable = true;
    faceItem.addEventListener('dragstart', handleFaceDragStart);
    faceItem.addEventListener('dragend', handleFaceDragEnd);
    
    const faceHTML = `
        <img 
            class="face-thumbnail" 
            src="${face.thumbnail || face.url}" 
            alt="Extracted face"
            loading="lazy"
            onerror="this.style.display='none'"
        />
        <div class="face-info">
            <div class="face-confidence">
                ${face.confidence ? `${Math.round(face.confidence * 100)}%` : 'N/A'}
            </div>
            <div class="face-source">
                From: ${face.fileName}
            </div>
            ${face.boundingBox ? `
                <div class="face-coordinates">
                    ${Math.round(face.boundingBox.x)}, ${Math.round(face.boundingBox.y)}
                </div>
            ` : ''}
        </div>
    `;
    
    faceItem.innerHTML = faceHTML;
    
    // Add click handler for face selection/details
    faceItem.addEventListener('click', () => handleFaceClick(face));
    
    return faceItem;
}

/**
 * Handle face drag start
 */
function handleFaceDragStart(e) {
    const faceItem = e.target.closest('.face-item');
    faceItem.classList.add('dragging');
    
    // Store face data for drop handling
    e.dataTransfer.setData('application/json', JSON.stringify({
        faceId: faceItem.dataset.faceId,
        fileId: faceItem.dataset.fileId
    }));
    
    console.log('👤 Started dragging face:', faceItem.dataset.faceId);
}

/**
 * Handle face drag end
 */
function handleFaceDragEnd(e) {
    const faceItem = e.target.closest('.face-item');
    faceItem.classList.remove('dragging');
    console.log('👤 Finished dragging face');
}

/**
 * Handle face click for details/selection
 */
function handleFaceClick(face) {
    console.log('👤 Face clicked:', face);
    
    // Create face details modal
    const modal = Modal.create({
        title: 'Face Details',
        content: `
            <div class="face-details">
                <img 
                    src="${face.thumbnail || face.url}" 
                    alt="Face thumbnail"
                    class="face-detail-image"
                    style="max-width: 200px; border-radius: 8px;"
                />
                <div class="face-metadata">
                    <p><strong>Source File:</strong> ${face.fileName}</p>
                    <p><strong>Confidence:</strong> ${face.confidence ? `${Math.round(face.confidence * 100)}%` : 'N/A'}</p>
                    ${face.boundingBox ? `
                        <p><strong>Position:</strong> (${Math.round(face.boundingBox.x)}, ${Math.round(face.boundingBox.y)})</p>
                        <p><strong>Size:</strong> ${Math.round(face.boundingBox.width)}×${Math.round(face.boundingBox.height)}px</p>
                    ` : ''}
                    ${face.embedding ? `
                        <p><strong>Vector Embedding:</strong> ${face.embedding.length} dimensions</p>
                    ` : ''}
                </div>
            </div>
        `,
        actions: [
            {
                text: 'Close',
                type: 'secondary',
                onClick: () => modal.close()
            }
        ]
    });
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