/**
 * UI Builder Functions for Sandbox
 * Creates various UI elements like thumbnails, filters, and forms
 */

import { getFileIcon } from '../utils/sandbox-utils.js';

/**
 * Create artifact thumbnail element
 * @param {string} fileId - Unique file ID
 * @param {Object} fileData - File data object
 * @param {Object} handlers - Event handler functions
 * @returns {HTMLElement} Thumbnail div element
 */
export function createArtifactThumbnail(fileId, fileData, handlers = {}) {
    const div = document.createElement('div');
    div.className = 'artifact-thumbnail';
    div.draggable = true;
    div.dataset.fileId = fileId;
    div.dataset.fileName = fileData.fileName || fileData.name || 'Unnamed';
    div.dataset.fileType = fileData.fileType || 'document';
    div.dataset.downloadUrl = fileData.downloadURL || '';
    div.dataset.fileSize = fileData.fileSize || fileData.size || '0';
    
    // Determine content based on file type
    if (fileData.thumbnailURL) {
        // Use thumbnail if available
        div.innerHTML = `
            <img src="${fileData.thumbnailURL}" alt="${fileData.fileName}" />
            <div class="artifact-thumbnail-name">${fileData.fileName || 'Unnamed'}</div>
        `;
    } else if (fileData.fileType && fileData.fileType.startsWith('image/')) {
        // Use download URL for images without thumbnails
        div.innerHTML = `
            <img src="${fileData.downloadURL}" alt="${fileData.fileName}" />
            <div class="artifact-thumbnail-name">${fileData.fileName || 'Unnamed'}</div>
        `;
    } else {
        // Use icon for non-image files
        const icon = getFileIcon(fileData.fileType);
        div.innerHTML = `
            <div class="artifact-thumbnail-icon">${icon}</div>
            <div class="artifact-thumbnail-name">${fileData.fileName || 'Unnamed'}</div>
        `;
    }
    
    // Add drag event handlers if provided
    if (handlers.dragstart) {
        div.addEventListener('dragstart', handlers.dragstart);
    }
    if (handlers.dragend) {
        div.addEventListener('dragend', handlers.dragend);
    }
    
    return div;
}

/**
 * Create draggable face thumbnail
 * @param {string} fileId - Source file ID
 * @param {Object} fileData - Source file data
 * @param {Object} face - Face data object
 * @param {number} faceIndex - Index of face in the file
 * @param {Object} handlers - Event handler functions
 * @returns {HTMLElement} Face thumbnail div element
 */
export function createFaceThumbnail(fileId, fileData, face, faceIndex, handlers = {}) {
    const div = document.createElement('div');
    div.className = 'face-thumbnail';
    div.draggable = true;
    div.dataset.fileId = fileId;
    div.dataset.faceIndex = faceIndex;
    div.dataset.fileName = fileData.fileName || 'Unknown';
    div.dataset.faceId = face.faceId || `face_${faceIndex}`;
    div.dataset.confidence = face.confidence || 0;
    
    // Create loading placeholder
    const loadingDiv = document.createElement('div');
    loadingDiv.style.width = '100%';
    loadingDiv.style.height = '100%';
    loadingDiv.style.background = '#f0f0f0';
    loadingDiv.style.display = 'flex';
    loadingDiv.style.alignItems = 'center';
    loadingDiv.style.justifyContent = 'center';
    loadingDiv.style.fontSize = '24px';
    loadingDiv.textContent = '😊';
    div.appendChild(loadingDiv);
    
    // Extract face using bounding box if available
    const boundingBox = face.boundingBox || face.BoundingBox;
    if (fileData.downloadURL && boundingBox && window.extractFaceFromImage) {
        console.log('📐 Extracting face with bounding box:', JSON.stringify(boundingBox));
        window.extractFaceFromImage(fileData.downloadURL, boundingBox)
            .then(faceDataUrl => {
                // Replace loading placeholder with extracted face
                div.innerHTML = '';
                const img = document.createElement('img');
                img.src = faceDataUrl;
                img.alt = `Face ${faceIndex + 1}`;
                img.draggable = false; // CRITICAL: Prevent default image drag behavior
                div.appendChild(img);
                
                // Add confidence badge
                const confidence = face.confidence || face.Confidence;
                if (confidence) {
                    const confidenceBadge = document.createElement('div');
                    confidenceBadge.className = 'face-thumbnail-confidence';
                    confidenceBadge.textContent = Math.round(confidence) + '%';
                    div.appendChild(confidenceBadge);
                }
                
                // Add name/label
                const nameLabel = document.createElement('div');
                nameLabel.className = 'face-thumbnail-name';
                nameLabel.textContent = face.name || `Face ${faceIndex + 1}`;
                div.appendChild(nameLabel);
                
                // CRITICAL: Update the stored face data to include the extracted image URL
                const existingData = JSON.parse(div.dataset.faceData || '{}');
                div.dataset.faceData = JSON.stringify({
                    ...existingData,
                    imageUrl: faceDataUrl,  // Add the extracted face image URL
                    dataUrl: faceDataUrl    // Also store as dataUrl for compatibility
                });
            })
            .catch(error => {
                console.error('❌ Failed to extract face:', error.message);
                // Show error state instead of placeholder
                div.innerHTML = '<div style="color: red; font-size: 10px; padding: 5px;">Error</div>';
            });
    } else {
        console.log('⚠️ No bounding box for face:', JSON.stringify(face));
        div.innerHTML = '<div style="color: orange; font-size: 10px; padding: 5px;">No box</div>';
    }
    
    // Store face data for drag operation
    div.dataset.faceData = JSON.stringify({
        fileId: fileId,
        fileName: fileData.fileName,
        faceId: face.faceId,
        faceIndex: faceIndex,
        confidence: face.confidence,
        boundingBox: face.boundingBox,
        emotions: face.emotions,
        ageRange: face.ageRange
    });
    
    // Add drag event handlers if provided
    if (handlers.dragstart) {
        div.addEventListener('dragstart', handlers.dragstart);
    }
    if (handlers.dragend) {
        div.addEventListener('dragend', handlers.dragend);
    }
    
    return div;
}

/**
 * Create draggable node element for node list panel
 * @param {Object} node - Node data
 * @param {Function} logFn - Logging function
 * @returns {HTMLElement} Node element div
 */
export function createDraggableNodeElement(node, logFn = console.log) {
    const div = document.createElement('div');
    div.className = 'node-list-item';
    div.draggable = true;
    div.dataset.nodeId = node.id;
    div.dataset.nodeType = node.type;
    div.dataset.nodeData = JSON.stringify(node);
    
    const color = window.getNodeColor ? window.getNodeColor(node.type) : '#6B7280';
    
    div.style.cssText = `
        background: white; 
        padding: 10px; 
        border-radius: 4px; 
        border-left: 4px solid ${color}; 
        cursor: grab; 
        transition: all 0.2s;
        margin-bottom: 5px;
    `;
    
    div.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 16px;">${window.getNodeTypeIcon ? window.getNodeTypeIcon(node.type) : '📄'}</span>
            <div style="flex: 1;">
                <strong style="color: #333; font-size: 14px;">${node.label}</strong><br>
                <small style="color: #666;">${node.id}</small>
            </div>
        </div>
    `;
    
    // Add hover effects
    div.addEventListener('mouseenter', () => {
        div.style.transform = 'translateX(5px)';
        div.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
    });
    
    div.addEventListener('mouseleave', () => {
        div.style.transform = 'translateX(0)';
        div.style.boxShadow = 'none';
    });
    
    // Add drag event handlers
    div.addEventListener('dragstart', (e) => {
        div.style.cursor = 'grabbing';
        
        // Use the drag data format from NODE_DRAG_DROP_GUIDE
        const dragData = {
            dragType: 'node',           // REQUIRED: Identifies this as a node (not file)
            sourceControl: 'node-list', // REQUIRED: Must be 'node-list' for the drop to work
            id: node.id,                // Neo4j node ID
            name: node.label,           // Display name
            type: node.type,            // Node type (person, organization, etc.)
            label: node.label,          // Display label
            properties: node.props || {}, // All Neo4j properties
            metadata: {
                source: 'neo4j',
                nodeType: node.type,
                draggedAt: new Date().toISOString(),
                sourcePanel: 'node-list'
            },
            originalData: node          // Complete original node data
        };
        
        e.dataTransfer.effectAllowed = 'copy';
        e.dataTransfer.setData('text/plain', JSON.stringify(dragData));
        logFn(`🏃 Dragging node: ${node.label} (${node.id}) with type: ${node.type}`);
    });
    
    div.addEventListener('dragend', () => {
        div.style.cursor = 'grab';
    });
    
    return div;
}

/**
 * Create filter button for node type filtering
 * @param {string} type - Node type
 * @param {string} icon - Icon for the type
 * @param {string} label - Display label
 * @param {number} count - Number of nodes of this type
 * @param {boolean} isActive - Whether filter is active
 * @returns {HTMLElement} Button element
 */
export function createFilterButton(type, icon, label, count, isActive) {
    const button = document.createElement('button');
    button.className = `filter-btn ${isActive ? 'active' : ''}`;
    button.dataset.type = type;
    button.innerHTML = `
        <span class="filter-icon">${icon}</span>
        <span class="filter-label">${label}</span>
        <span class="filter-count">${count}</span>
    `;
    
    button.style.cssText = `
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 16px;
        border: 1px solid ${isActive ? '#6B46C1' : '#E5E7EB'};
        background: ${isActive ? '#6B46C1' : 'white'};
        color: ${isActive ? 'white' : '#374151'};
        border-radius: 20px;
        cursor: pointer;
        font-size: 14px;
        transition: all 0.2s;
    `;
    
    // Note: Click handler will be attached by the caller
    return button;
}

/**
 * Create review form content for post to production modal
 * @returns {HTMLElement} Container element with form content
 */
export function createReviewFormContent() {
    const changesCount = window.changesCount || 0;
    const currentSandboxData = window.currentSandboxData || { nodes: [], edges: [] };
    
    const container = document.createElement('div');
    container.style.cssText = 'padding: 20px;';
    
    // Summary section
    const summary = document.createElement('div');
    summary.style.cssText = 'margin-bottom: 20px;';
    summary.innerHTML = `
        <h3 style="margin-bottom: 10px; color: #374151;">Changes Summary</h3>
        <div style="background: #F3F4F6; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span style="color: #6B7280;">Total Changes:</span>
                <span style="font-weight: 600; color: #374151;">${changesCount}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span style="color: #6B7280;">Nodes Added:</span>
                <span style="font-weight: 600; color: #10B981;">${currentSandboxData.nodes.length || 0}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
                <span style="color: #6B7280;">Edges Added:</span>
                <span style="font-weight: 600; color: #3B82F6;">${currentSandboxData.edges.length || 0}</span>
            </div>
        </div>
    `;
    container.appendChild(summary);
    
    // Review notes section
    const notesSection = document.createElement('div');
    notesSection.style.cssText = 'margin-bottom: 20px;';
    notesSection.innerHTML = `
        <label style="display: block; margin-bottom: 8px; font-weight: 500; color: #374151;">
            Review Notes (Optional)
        </label>
        <textarea 
            id="reviewNotes" 
            placeholder="Add any notes about these changes..."
            style="width: 100%; min-height: 100px; padding: 10px; border: 1px solid #E5E7EB; border-radius: 6px; font-family: inherit; font-size: 14px; resize: vertical;"
        ></textarea>
    `;
    container.appendChild(notesSection);
    
    // Warning section
    const warning = document.createElement('div');
    warning.style.cssText = 'background: #FEF3C7; border: 1px solid #F59E0B; border-radius: 6px; padding: 12px; margin-bottom: 20px;';
    warning.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
            <span style="color: #F59E0B;">⚠️</span>
            <span style="color: #92400E; font-size: 14px;">
                This action will update the production graph. All changes will be immediately visible to users.
            </span>
        </div>
    `;
    container.appendChild(warning);
    
    return container;
}

/**
 * Create node type filters section
 * @param {Object} nodesByType - Nodes grouped by type
 * @param {Function} filterCallback - Callback when filter is clicked
 * @returns {HTMLElement} Filters container element
 */
export function createNodeTypeFilters(nodesByType, filterCallback) {
    const container = document.createElement('div');
    container.className = 'node-filters';
    container.style.cssText = `
        display: flex;
        gap: 8px;
        margin-bottom: 16px;
        flex-wrap: wrap;
    `;
    
    // Add "All" filter
    const allCount = Object.values(nodesByType).reduce((sum, nodes) => sum + nodes.length, 0);
    const allButton = createFilterButton('all', '🌐', 'All', allCount, true);
    allButton.addEventListener('click', () => filterCallback('all'));
    container.appendChild(allButton);
    
    // Add type-specific filters
    Object.entries(nodesByType).forEach(([type, nodes]) => {
        const icon = window.getNodeTypeIcon ? window.getNodeTypeIcon(type) : '📄';
        const label = type.charAt(0).toUpperCase() + type.slice(1);
        const button = createFilterButton(type, icon, label, nodes.length, false);
        button.addEventListener('click', () => filterCallback(type));
        container.appendChild(button);
    });
    
    return container;
}