/**
 * Curator Page Module
 * Main module that wires together all extracted curator functionality
 */

// Import all extracted modules
import { UndoRedoManager } from '../managers/undo-redo-manager.js';
import { CurationProgressManager } from '../managers/curation-progress-manager.js';
import {
    initializeAudioServices,
    startInterviewWithOrchestrator,
    sendAudioChunk,
    isOrchestratorConnected,
    getInterviewState,
    setInterviewActive
} from '../shared/interview-services.js';
import { setWinstonState, showToast, showConnectionBanner, updateInterviewQuestion } from '../shared/interview-ui.js';
import { addMessage } from '../shared/chat-interface.js';
import { IdeaCloudsManager } from '../shared/idea-clouds.js';

// Module-scoped state object
const state = {
    undoRedoManager: null,
    progressManager: null,
    ideaCloudsManager: null,
    isRecording: false
};

// ========================================
// Undo/Redo Functions
// ========================================

/**
 * Perform undo action
 */
function undoAction() {
    if (state.undoRedoManager) {
        state.undoRedoManager.undo();
    }
}

/**
 * Perform redo action
 */
function redoAction() {
    if (state.undoRedoManager) {
        state.undoRedoManager.redo();
    }
}

/**
 * Helper function to create undo actions for common curator operations
 * @param {string} description - Description of the action
 * @param {Function} undoFunction - Function to execute on undo
 * @param {Function} redoFunction - Function to execute on redo
 * @returns {Object} Action object for UndoRedoManager
 */
function createCuratorAction(description, undoFunction, redoFunction) {
    return {
        description: description,
        undo: undoFunction,
        redo: redoFunction,
        timestamp: Date.now()
    };
}

// ========================================
// Curation Progress Functions
// ========================================

/**
 * Update curation progress display
 * @param {number} curated - Number of curated memories
 * @param {number|null} total - Total memories (optional)
 */
function updateCurationProgress(curated, total = null) {
    if (state.progressManager) {
        if (total !== null) {
            state.progressManager.setTotalMemories(total);
        }
        state.progressManager.setCuratedMemories(curated);
    }
}

/**
 * Increment curation progress by one
 */
function incrementCurationProgress() {
    if (state.progressManager) {
        state.progressManager.incrementCurated();
    }
}

/**
 * Get current curation progress percentage
 * @returns {number} Progress percentage (0-100)
 */
function getCurationProgress() {
    return state.progressManager ? state.progressManager.getProgress() : 0;
}

// ========================================
// Recording Functions
// ========================================

/**
 * Toggle audio recording on/off
 */
function toggleRecording() {
    const micBtn = document.getElementById('micBtn');

    if (!state.isRecording) {
        startRecording();
        if (micBtn) {
            micBtn.classList.add('recording');
            micBtn.textContent = '\u23F9\uFE0F'; // Stop emoji
        }
    } else {
        stopRecording();
        if (micBtn) {
            micBtn.classList.remove('recording');
            micBtn.textContent = '\uD83C\uDFA4'; // Microphone emoji
        }
    }

    state.isRecording = !state.isRecording;
}

/**
 * Start audio recording
 */
function startRecording() {
    const { audioRecorder } = getInterviewState();
    const { isInterviewActive } = getInterviewState();

    if (!audioRecorder) {
        showToast('Audio recorder not initialized', 'error');
        return;
    }

    try {
        audioRecorder.start(
            // onAudioChunk callback
            (chunk) => {
                console.log(`Audio chunk ${chunk.chunkNumber}: ${chunk.size} bytes`);

                // Send audio chunk to orchestrator if interview is active
                if (isInterviewActive) {
                    sendAudioChunk(chunk);
                }
            },
            // onError callback
            (error) => {
                console.error('Recording error:', error);
                showToast('Recording error: ' + error.message, 'error');
                toggleRecording(); // Stop recording on error
            },
            // onStateChange callback
            (stateChange) => {
                console.log('Recording state changed:', stateChange);
                if (stateChange.recording) {
                    setWinstonState('listening');
                } else {
                    setWinstonState('idle');
                }
            }
        );

        console.log('Audio recording started');
        setWinstonState('listening');

    } catch (error) {
        console.error('Failed to start recording:', error);
        showToast('Failed to start recording: ' + error.message, 'error');
        toggleRecording(); // Reset button state
    }
}

/**
 * Stop audio recording
 */
function stopRecording() {
    const { audioRecorder } = getInterviewState();

    if (audioRecorder) {
        try {
            audioRecorder.stop();
            console.log('Audio recording stopped');
            setWinstonState('idle');
        } catch (error) {
            console.error('Failed to stop recording:', error);
            showToast('Failed to stop recording: ' + error.message, 'error');
        }
    }
}

// ========================================
// Chat Functions
// ========================================

/**
 * Send a message from the chat input
 */
function sendMessage() {
    const input = document.getElementById('messageInput');
    const message = input ? input.value.trim() : '';

    if (!message) return;

    // Add user message
    addMessage(message, 'user');
    if (input) input.value = '';

    // Simulate Winston thinking
    setWinstonState('thinking');

    // Simulate response after delay
    setTimeout(() => {
        const responses = [
            "That's a wonderful memory! Can you tell me more about how that made you feel?",
            "I can see this is important to you. What details stand out most in your mind?",
            "Thank you for sharing that. How did this experience shape who you are today?",
            "That sounds meaningful. Are there other people connected to this memory?",
            "I'm capturing this in your knowledge graph. What happened next?"
        ];

        const response = responses[Math.floor(Math.random() * responses.length)];
        addMessage(response, 'winston');
        setWinstonState('idle');
    }, 2000);
}

/**
 * Expand chat to full modal view
 */
function expandChat() {
    const chatModal = document.getElementById('chatModal');
    if (chatModal) {
        chatModal.classList.add('active');
        populateModalMessages();
    }
}

/**
 * Collapse chat modal back to inline view
 */
function collapseChat() {
    const chatModal = document.getElementById('chatModal');
    if (chatModal) {
        chatModal.classList.remove('active');
    }
}

/**
 * Copy messages from main chat to modal
 */
function populateModalMessages() {
    const mainMessages = document.getElementById('chatMessages');
    const modalMessages = document.getElementById('modalMessages');

    if (mainMessages && modalMessages) {
        modalMessages.innerHTML = mainMessages.innerHTML;
    }
}

// ========================================
// Interview Manager Functions
// ========================================

/**
 * Toggle interview manager sidebar visibility
 */
function toggleInterviewManager() {
    const manager = document.getElementById('interviewManager');
    const overlay = document.getElementById('overlay');

    if (manager) manager.classList.toggle('active');
    if (overlay) overlay.classList.toggle('active');
}

/**
 * Close all overlays and sidebars
 */
function closeAll() {
    const interviewManager = document.getElementById('interviewManager');
    const overlay = document.getElementById('overlay');
    const chatModal = document.getElementById('chatModal');

    if (interviewManager) interviewManager.classList.remove('active');
    if (overlay) overlay.classList.remove('active');
    if (chatModal) chatModal.classList.remove('active');
}

// ========================================
// Interview Session Functions
// ========================================

/**
 * Start the interview session (called from privacy modal)
 */
async function startInterview() {
    const privacyModal = document.getElementById('privacyModal');
    if (privacyModal) {
        privacyModal.classList.remove('active');
    }

    // Initialize all services first
    const servicesReady = await initializeAudioServices();
    if (!servicesReady) {
        showToast('Connection error: Failed to initialize services. Interview cannot start.', 'error');
        return;
    }

    // Start the orchestrator interview session
    await startInterviewWithOrchestrator();

    // Start the idea clouds
    if (state.ideaCloudsManager) {
        state.ideaCloudsManager.start();
    }

    showToast('Interview ready! Click the mic to start speaking.', 'success');
}

/**
 * Start a new interview
 */
function newInterview() {
    showToast('Starting new interview...', 'success');
    closeAll();
}

/**
 * Start a photo-based interview
 */
function photoInterview() {
    showToast('Select a photo to discuss...', 'success');
    closeAll();
}

/**
 * Resume an existing interview
 * @param {string} type - Type of interview to resume
 */
function resumeInterview(type) {
    showToast(`Resuming ${type} interview...`, 'success');
    closeAll();
}

/**
 * View a completed interview
 * @param {string} type - Type of interview to view
 */
function viewInterview(type) {
    showToast(`Opening ${type} interview in read-only mode...`, 'success');
    closeAll();
}

/**
 * Stop the current session
 */
function stopSession() {
    showToast('Session paused. Progress saved.', 'success');
}

// ========================================
// Curator Popup Functions
// ========================================

/**
 * Toggle curator operations popup
 */
function toggleCuratorPopup() {
    const popup = document.getElementById('curatorOpsPopup');
    if (popup) {
        popup.classList.add('show');
    }
}

/**
 * Close curator operations popup
 */
function closeCuratorPopup() {
    const popup = document.getElementById('curatorOpsPopup');
    if (popup) {
        popup.classList.remove('show');
    }
}

/**
 * Close curator popup when clicking overlay
 * @param {Event} event - Click event
 */
function closeCuratorPopupOnOverlay(event) {
    if (event.target.id === 'curatorOpsPopup') {
        closeCuratorPopup();
    }
}

// ========================================
// Graph Control Functions
// ========================================

/**
 * Center the memory graph
 */
function centerGraph() {
    console.log('Centering memory graph');
    if (window.curatorNeo4jViz) {
        window.curatorNeo4jViz.center();
    }
}

/**
 * Fit the memory graph to container
 */
function fitGraph() {
    console.log('Fitting memory graph');
    if (window.curatorNeo4jViz) {
        window.curatorNeo4jViz.fit();
    }
}

/**
 * Reset the memory graph to initial state
 */
function resetGraph() {
    console.log('Resetting memory graph');
    if (window.curatorNeo4jViz) {
        window.curatorNeo4jViz.reset();
    }
}

/**
 * Apply beautiful layout to memory graph
 */
function beautifyGraph() {
    console.log('Beautifying memory graph');
    if (window.curatorNeo4jViz) {
        window.curatorNeo4jViz.beautify();
    }
}

// ========================================
// Utility Functions
// ========================================

/**
 * Save and exit to dashboard
 */
function saveAndExit() {
    showToast('Interview saved. Returning to dashboard...', 'success');
    setTimeout(() => {
        window.location.href = '../dashboard.html';
    }, 1500);
}

/**
 * Update time display
 */
function updateTime() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    const timeElement = document.getElementById('currentTime');
    if (timeElement) {
        timeElement.textContent = timeStr;
    }
}

// ========================================
// Initialization
// ========================================

/**
 * Initialize the curator page
 * Main entry point that sets up all managers and event listeners
 */
function initializeCurator() {
    console.log('Initializing Curator page...');

    // Initialize Undo/Redo Manager
    state.undoRedoManager = new UndoRedoManager();
    console.log('Undo/Redo system initialized');

    // Initialize Curation Progress Manager
    state.progressManager = new CurationProgressManager();
    console.log('Curation progress system initialized');

    // Initialize Idea Clouds Manager
    state.ideaCloudsManager = new IdeaCloudsManager('#ideaClouds');
    console.log('Idea clouds manager initialized');

    // Add keyboard shortcuts for undo/redo
    document.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
            e.preventDefault();
            undoAction();
        } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
            e.preventDefault();
            redoAction();
        }
    });

    // Set up messageInput keypress event
    const messageInput = document.getElementById('messageInput');
    if (messageInput) {
        messageInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault(); // Prevent newline in textarea
                sendMessage();
            }
        });
    }

    // Set up modalInput keypress event
    const modalInput = document.getElementById('modalInput');
    if (modalInput) {
        modalInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const message = e.target.value.trim();
                if (message) {
                    addMessage(message, 'user');
                    e.target.value = '';
                    // Also add to modal
                    populateModalMessages();
                }
            }
        });
    }

    // Initialize time display
    updateTime();
    setInterval(updateTime, 60000);

    console.log('Curator page initialization complete');
}

// ========================================
// Exports
// ========================================

export { initializeCurator };

// Also export individual functions for external use
export {
    undoAction,
    redoAction,
    createCuratorAction,
    updateCurationProgress,
    incrementCurationProgress,
    getCurationProgress,
    toggleRecording,
    sendMessage,
    expandChat,
    collapseChat,
    toggleInterviewManager,
    closeAll,
    startInterview,
    newInterview,
    photoInterview,
    resumeInterview,
    viewInterview,
    stopSession,
    toggleCuratorPopup,
    closeCuratorPopup,
    closeCuratorPopupOnOverlay,
    centerGraph,
    fitGraph,
    resetGraph,
    beautifyGraph,
    saveAndExit,
    updateTime
};

// ========================================
// Expose functions to window for onclick handlers
// ========================================

window.undoAction = undoAction;
window.redoAction = redoAction;
window.toggleRecording = toggleRecording;
window.sendMessage = sendMessage;
window.expandChat = expandChat;
window.collapseChat = collapseChat;
window.toggleInterviewManager = toggleInterviewManager;
window.closeAll = closeAll;
window.startInterview = startInterview;
window.newInterview = newInterview;
window.photoInterview = photoInterview;
window.resumeInterview = resumeInterview;
window.viewInterview = viewInterview;
window.stopSession = stopSession;
window.toggleCuratorPopup = toggleCuratorPopup;
window.closeCuratorPopup = closeCuratorPopup;
window.closeCuratorPopupOnOverlay = closeCuratorPopupOnOverlay;
window.centerGraph = centerGraph;
window.fitGraph = fitGraph;
window.resetGraph = resetGraph;
window.beautifyGraph = beautifyGraph;
window.saveAndExit = saveAndExit;
