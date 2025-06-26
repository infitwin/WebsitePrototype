/**
 * Drag handling functions for the sandbox
 * Handles panel dragging, artifact dragging, and face dragging
 */

/**
 * Initialize drag functionality for a floating panel
 * @param {string} panelId - The ID of the panel (without 'Panel' suffix)
 * @param {Function} logFn - Logging function
 * @param {Function} togglePanelFn - Function to toggle panel visibility
 */
export function initializeDragFunctionality(panelId, logFn = console.log, togglePanelFn = null) {
    const panel = document.getElementById(panelId + 'Panel');
    const header = document.getElementById(panelId + 'Header');
    
    logFn(`🔧 Initializing drag for ${panelId} panel`);
    logFn(`   Panel found: ${!!panel}, Header found: ${!!header}`);
    
    if (!panel || !header) {
        logFn(`❌ Missing elements for ${panelId} drag`);
        return;
    }
    
    // Local drag state for this panel
    let isDragging = false;
    let currentPanel = null;
    let dragOffset = { x: 0, y: 0 };
    
    // Remove any existing listeners first
    const newHeader = header.cloneNode(true);
    header.parentNode.replaceChild(newHeader, header);
    
    // Re-attach close button functionality
    const closeBtn = newHeader.querySelector('button');
    if (closeBtn && togglePanelFn) {
        closeBtn.onclick = () => togglePanelFn(panelId);
    }
    
    const startDrag = (e) => {
        logFn(`🖱️ ${panelId} header clicked, target: ${e.target.tagName}`);
        
        // Don't start drag if clicking on close button
        if (e.target.tagName === 'BUTTON') {
            logFn(`🚫 Clicked close button, not dragging`);
            return;
        }
        
        isDragging = true;
        currentPanel = panel;
        panel.classList.add('dragging');
        
        const rect = panel.getBoundingClientRect();
        dragOffset.x = e.clientX - rect.left;
        dragOffset.y = e.clientY - rect.top;
        
        logFn('🔵 ' + panelId + ' panel drag started');
        e.preventDefault();
    };
    
    const drag = (e) => {
        if (!isDragging || !currentPanel) return;
        
        const x = e.clientX - dragOffset.x;
        const y = e.clientY - dragOffset.y;
        
        // Keep panel within viewport bounds
        const maxX = window.innerWidth - currentPanel.offsetWidth;
        const maxY = window.innerHeight - currentPanel.offsetHeight;
        
        const constrainedX = Math.max(80, Math.min(x, maxX)); // 80px for sidebar
        const constrainedY = Math.max(0, Math.min(y, maxY));
        
        currentPanel.style.left = constrainedX + 'px';
        currentPanel.style.top = constrainedY + 'px';
        currentPanel.style.right = 'auto';
        currentPanel.style.bottom = 'auto';
        
        e.preventDefault();
    };
    
    const stopDrag = () => {
        if (isDragging && currentPanel) {
            isDragging = false;
            currentPanel.classList.remove('dragging');
            logFn('🔵 ' + panelId + ' panel drag ended');
            currentPanel = null;
        }
    };
    
    newHeader.addEventListener('mousedown', startDrag);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', stopDrag);
}

/**
 * Handle start of artifact drag operation
 * @param {DragEvent} e - The drag start event
 * @param {Function} logFn - Logging function
 */
export function handleArtifactDragStart(e, logFn = console.log) {
    e.target.classList.add('dragging');
    
    // CRITICAL: Set drag data as JSON per FILE_DROP_GUIDE.md
    e.dataTransfer.setData('text/plain', JSON.stringify({
        name: e.target.dataset.fileName,
        type: e.target.dataset.fileType,
        url: e.target.dataset.downloadUrl,
        size: parseInt(e.target.dataset.fileSize) || 0,
        // Add custom metadata
        source: 'artifact-panel',
        fileId: e.target.dataset.fileId,
        timestamp: new Date().toISOString()
    }));
    e.dataTransfer.effectAllowed = 'copy';
    
    logFn('🚀 Dragging artifact for attachment:', e.target.dataset.fileName);
}

/**
 * Handle end of artifact drag operation
 * @param {DragEvent} e - The drag end event
 */
export function handleArtifactDragEnd(e) {
    e.target.classList.remove('dragging');
}

/**
 * Handle start of face drag operation
 * @param {DragEvent} e - The drag start event
 * @param {Function} logFn - Logging function
 */
export function handleFaceDragStart(e, logFn = console.log) {
    e.target.classList.add('dragging');
    
    const faceData = JSON.parse(e.target.dataset.faceData);
    
    // Use node drag format as per NODE_DRAG_DROP_GUIDE.md
    const dragData = {
        dragType: 'node',           // REQUIRED: Identifies this as a node drag
        sourceControl: 'node-list', // REQUIRED: Must be 'node-list' for the drop to work
        id: `face_${faceData.faceId}_${Date.now()}`,
        name: faceData.fileName || `Face ${faceData.faceIndex + 1}`,
        type: 'person',             // Faces represent people
        label: faceData.fileName || `Face ${faceData.faceIndex + 1}`,
        properties: {
            ...faceData,
            source: 'faces-panel'
        },
        // Keep original face data for compatibility
        originalData: {
            type: 'face',
            ...faceData
        }
    };
    
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('text/plain', JSON.stringify(dragData));
    
    logFn('🚀 Dragging face as person node:', dragData.name);
}

/**
 * Handle end of face drag operation
 * @param {DragEvent} e - The drag end event
 */
export function handleFaceDragEnd(e) {
    e.target.classList.remove('dragging');
}