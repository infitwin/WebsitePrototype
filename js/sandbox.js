// Sandbox functionality
let nexusControl = null;
let panels = {};
let changeCount = 0;
let currentUser = null;

// Panel configurations
const panelConfigs = {
    nodeList: {
        title: '📋 Node List',
        width: 300,
        height: 400,
        x: 100,
        y: 100,
        content: () => `
            <div class="node-list">
                <input type="text" class="search-input" placeholder="Search nodes..." onkeyup="filterNodes(this.value)">
                <div id="nodeListContent">
                    <p style="color: #6B7280;">Loading nodes...</p>
                </div>
            </div>
        `
    },
    faces: {
        title: '👤 Faces',
        width: 350,
        height: 500,
        x: 420,
        y: 100,
        content: () => `
            <div class="faces-panel">
                <h3>Face Recognition</h3>
                <p style="color: #6B7280;">Connect faces to family members</p>
                <button class="btn-primary" onclick="uploadFaces()">Upload Photos</button>
                <div id="facesContent" style="margin-top: 20px;">
                    <!-- Face thumbnails will appear here -->
                </div>
            </div>
        `
    },
    artifacts: {
        title: '📎 Artifacts',
        width: 350,
        height: 450,
        x: 100,
        y: 520,
        content: () => `
            <div class="artifacts-panel">
                <h3>Files & Documents</h3>
                <button class="btn-primary" onclick="uploadArtifact()">Upload File</button>
                <button class="btn-secondary" onclick="debugFiles()">Debug Files</button>
                <div id="artifactsContent" style="margin-top: 20px;">
                    <p style="color: #6B7280;">Loading files...</p>
                </div>
            </div>
        `
    },
    production: {
        title: '🔵 Production Graph',
        width: 600,
        height: 500,
        x: 800,
        y: 100,
        content: () => `
            <div class="production-panel">
                <div id="productionGraphContainer" style="width: 100%; height: 100%;">
                    <!-- Production graph will be rendered here -->
                </div>
            </div>
        `
    },
    ai: {
        title: '🤖 AI Assistant',
        width: 400,
        height: 600,
        x: 470,
        y: 300,
        content: () => `
            <div class="ai-panel">
                <h3>AI Analysis</h3>
                <div id="aiChat" style="height: 400px; overflow-y: auto; border: 1px solid #E5E7EB; padding: 10px; margin: 10px 0; border-radius: 8px;">
                    <p style="color: #6B7280;">AI assistant ready to help...</p>
                </div>
                <div style="display: flex; gap: 10px;">
                    <input type="text" class="form-input" placeholder="Ask about the graph..." onkeypress="if(event.key==='Enter')sendAIMessage(this.value)">
                    <button class="btn-primary" onclick="sendAIMessage(document.querySelector('.ai-panel input').value)">Send</button>
                </div>
            </div>
        `
    },
    tools: {
        title: '🛠️ Tools',
        width: 300,
        height: 400,
        x: 900,
        y: 620,
        content: () => `
            <div class="tools-panel">
                <h3>Sandbox Tools</h3>
                <button class="btn-secondary" onclick="clearSandbox()">🗑️ Clear Sandbox</button>
                <button class="btn-secondary" onclick="exportGraph()">📥 Export Graph</button>
                <button class="btn-secondary" onclick="importGraph()">📤 Import Graph</button>
                <button class="btn-secondary" onclick="validateGraph()">✅ Validate</button>
                <hr style="margin: 20px 0;">
                <h4>Session Info</h4>
                <p>Interview ID: <code>${window.interviewId || 'None'}</code></p>
                <p>Session ID: <code>${window.sessionId || 'None'}</code></p>
                <p>Changes: <strong>${changeCount}</strong></p>
            </div>
        `
    }
};

// Initialize sandbox
function initializeSandbox() {
    console.log('Initializing sandbox...');
    
    // Set up toggle buttons
    document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.addEventListener('click', () => togglePanel(btn.dataset.panel));
    });
    
    // Initialize Nexus Control
    initializeNexusControl();
    
    // Set up Firebase button
    const firebaseBtn = document.getElementById('firebaseBtn');
    firebaseBtn?.addEventListener('click', toggleFirebaseDropdown);
    
    // Set up ESC key handler
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            hideAllPanels();
        }
    });
    
    // Load initial data
    loadArtifacts();
    updateChangeCount(0);
}

// Initialize Nexus Control
function initializeNexusControl() {
    const container = document.getElementById('graphContainer');
    if (!container || !window.NexusControl) {
        console.error('Cannot initialize Nexus Control - missing container or library');
        return;
    }
    
    try {
        nexusControl = new window.NexusControl(container, {
            width: container.offsetWidth,
            height: container.offsetHeight,
            mode: 'sandbox',
            showHistory: true,
            showControls: true,
            showTabs: true,
            neo4j: {
                uri: 'neo4j+s://80dc1193.databases.neo4j.io',
                database: 'sandbox'
            }
        });
        
        // Listen for changes
        nexusControl.on('change', (event) => {
            updateChangeCount(changeCount + 1);
        });
        
        console.log('Nexus Control initialized');
    } catch (error) {
        console.error('Failed to initialize Nexus Control:', error);
    }
}

// Toggle panel visibility
function togglePanel(panelName) {
    const btn = document.querySelector(`[data-panel="${panelName}"]`);
    
    if (panels[panelName]) {
        // Hide panel
        panels[panelName].remove();
        delete panels[panelName];
        btn.classList.remove('active');
    } else {
        // Show panel
        createPanel(panelName);
        btn.classList.add('active');
    }
}

// Create floating panel
function createPanel(panelName) {
    const config = panelConfigs[panelName];
    if (!config) return;
    
    const panel = document.createElement('div');
    panel.className = 'floating-panel';
    panel.id = `panel-${panelName}`;
    panel.innerHTML = `
        <div class="panel-header">
            <span>${config.title}</span>
            <button class="panel-close" onclick="togglePanel('${panelName}')">×</button>
        </div>
        <div class="panel-content">
            ${config.content()}
        </div>
    `;
    
    // Set initial position and size
    panel.style.left = `${config.x}px`;
    panel.style.top = `${config.y}px`;
    panel.style.width = `${config.width}px`;
    panel.style.height = `${config.height}px`;
    
    // Add to DOM
    document.getElementById('floatingPanels').appendChild(panel);
    panels[panelName] = panel;
    
    // Make draggable using basic mouse events
    makeDraggable(panel);
    
    // Special handling for production panel
    if (panelName === 'production') {
        initializeProductionGraph();
    }
}

// Make panel draggable
function makeDraggable(panel) {
    const header = panel.querySelector('.panel-header');
    let isDragging = false;
    let startX, startY, initialX, initialY;
    
    header.addEventListener('mousedown', (e) => {
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        initialX = panel.offsetLeft;
        initialY = panel.offsetTop;
        panel.style.zIndex = getHighestZIndex() + 1;
    });
    
    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        
        e.preventDefault();
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        
        panel.style.left = `${initialX + dx}px`;
        panel.style.top = `${initialY + dy}px`;
    });
    
    document.addEventListener('mouseup', () => {
        isDragging = false;
    });
}

// Get highest z-index
function getHighestZIndex() {
    let highest = 200;
    document.querySelectorAll('.floating-panel').forEach(panel => {
        const z = parseInt(panel.style.zIndex || 200);
        if (z > highest) highest = z;
    });
    return highest;
}

// Hide all panels
function hideAllPanels() {
    Object.keys(panels).forEach(panelName => {
        togglePanel(panelName);
    });
}

// Update change count
function updateChangeCount(count) {
    changeCount = count;
    const bar = document.getElementById('smartContextBar');
    const countEl = document.getElementById('changeCount');
    
    if (count > 0) {
        bar.classList.add('show');
        countEl.textContent = `${count} change${count > 1 ? 's' : ''}`;
    } else {
        bar.classList.remove('show');
    }
    
    // Update tools panel if open
    const toolsContent = document.querySelector('.tools-panel');
    if (toolsContent) {
        const changesEl = toolsContent.querySelector('p:last-child strong');
        if (changesEl) changesEl.textContent = count;
    }
}

// Load artifacts from Firebase
async function loadArtifacts() {
    if (!firebase.auth().currentUser) {
        console.log('No user logged in');
        return;
    }
    
    const userId = firebase.auth().currentUser.uid;
    const content = document.getElementById('artifactsContent');
    if (!content) return;
    
    try {
        const storage = firebase.storage();
        const listRef = storage.ref(`users/${userId}/files`);
        const result = await listRef.listAll();
        
        if (result.items.length === 0) {
            content.innerHTML = '<p style="color: #6B7280;">No files uploaded yet</p>';
            return;
        }
        
        content.innerHTML = '';
        for (const itemRef of result.items) {
            const metadata = await itemRef.getMetadata();
            const url = await itemRef.getDownloadURL();
            
            const item = document.createElement('div');
            item.className = 'artifact-item';
            item.innerHTML = `
                <span>📄</span>
                <div style="flex: 1;">
                    <div style="font-weight: 500;">${itemRef.name}</div>
                    <div style="font-size: 12px; color: #6B7280;">${formatFileSize(metadata.size)}</div>
                </div>
                <button class="btn-sm" onclick="window.open('${url}', '_blank')">View</button>
            `;
            content.appendChild(item);
        }
    } catch (error) {
        console.error('Error loading artifacts:', error);
        content.innerHTML = '<p style="color: #EF4444;">Error loading files</p>';
    }
}

// Initialize production graph
function initializeProductionGraph() {
    const container = document.getElementById('productionGraphContainer');
    if (!container || !window.NexusControl) return;
    
    try {
        const productionControl = new window.NexusControl(container, {
            width: container.offsetWidth,
            height: container.offsetHeight - 50,
            mode: 'readonly',
            showHistory: false,
            showControls: false,
            showTabs: false,
            neo4j: {
                uri: 'neo4j+s://80dc1193.databases.neo4j.io',
                database: 'production'
            }
        });
        
        console.log('Production graph initialized');
    } catch (error) {
        console.error('Failed to initialize production graph:', error);
    }
}

// Firebase actions
window.firebaseActions = {
    signOut: async () => {
        await firebase.auth().signOut();
        window.location.href = 'auth.html';
    },
    
    refreshToken: async () => {
        const user = firebase.auth().currentUser;
        if (user) {
            const token = await user.getIdToken(true);
            console.log('Token refreshed');
            alert('Token refreshed successfully');
        }
    },
    
    uploadTestFile: async () => {
        const blob = new Blob(['Test file content'], { type: 'text/plain' });
        const file = new File([blob], `test_${Date.now()}.txt`, { type: 'text/plain' });
        
        const userId = firebase.auth().currentUser.uid;
        const fileId = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const storageRef = firebase.storage().ref(`users/${userId}/files/${fileId}`);
        
        await storageRef.put(file);
        alert('Test file uploaded');
        loadArtifacts();
    },
    
    listFiles: async () => {
        const userId = firebase.auth().currentUser.uid;
        const listRef = firebase.storage().ref(`users/${userId}/files`);
        const result = await listRef.listAll();
        
        console.log('Files:', result.items.map(item => item.name));
        alert(`Found ${result.items.length} files`);
    },
    
    showUserInfo: () => {
        const user = firebase.auth().currentUser;
        if (user) {
            alert(`User: ${user.email}\nUID: ${user.uid}`);
        }
    }
};

// Helper functions
function toggleFirebaseDropdown() {
    const dropdown = document.getElementById('firebaseDropdown');
    dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function postChanges() {
    alert(`Posting ${changeCount} changes for review...`);
    // Implementation would send changes to backend
}

function uploadArtifact() {
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const userId = firebase.auth().currentUser.uid;
        const fileId = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const storageRef = firebase.storage().ref(`users/${userId}/files/${fileId}`);
        
        try {
            await storageRef.put(file);
            alert('File uploaded successfully');
            loadArtifacts();
        } catch (error) {
            alert('Upload failed: ' + error.message);
        }
    };
    input.click();
}

function debugFiles() {
    firebaseActions.showUserInfo();
}

// Placeholder functions
function filterNodes(query) {
    console.log('Filtering nodes:', query);
}

function uploadFaces() {
    alert('Face upload feature coming soon');
}

function sendAIMessage(message) {
    console.log('AI message:', message);
    const chat = document.getElementById('aiChat');
    if (chat) {
        chat.innerHTML += `<p><strong>You:</strong> ${message}</p>`;
        chat.innerHTML += `<p><strong>AI:</strong> This feature is coming soon.</p>`;
    }
}

function clearSandbox() {
    if (confirm('Clear all sandbox changes?')) {
        updateChangeCount(0);
        if (nexusControl) {
            nexusControl.clear();
        }
    }
}

function exportGraph() {
    alert('Export feature coming soon');
}

function importGraph() {
    alert('Import feature coming soon');
}

function validateGraph() {
    alert('Validation feature coming soon');
}

// Set interview and session IDs
window.interviewId = `interview_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
window.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;