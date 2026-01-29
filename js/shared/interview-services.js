/**
 * Interview Services
 * Audio and WebSocket service initialization for interview pages
 */

import { setWinstonState, updateInterviewQuestion, showConnectionBanner, showToast } from './interview-ui.js';

// Service instances (module-level state)
let audioRecorder = null;
let ttsPlayer = null;
let orchestratorWebSocket = null;
let currentInterviewId = null;
let isInterviewActive = false;

/**
 * Get current interview state
 * @returns {Object} Current interview state
 */
export function getInterviewState() {
    return {
        audioRecorder,
        ttsPlayer,
        orchestratorWebSocket,
        currentInterviewId,
        isInterviewActive
    };
}

/**
 * Set interview active state
 * @param {boolean} active - Whether interview is active
 */
export function setInterviewActive(active) {
    isInterviewActive = active;
}

/**
 * Get current interview ID
 * @returns {string|null} Current interview ID
 */
export function getCurrentInterviewId() {
    return currentInterviewId;
}

/**
 * Initialize audio and WebSocket services for interviews
 * Requires AudioRecorder, TTSAudioPlayer, and OrchestratorWebSocketService to be loaded
 * @returns {Promise<boolean>} True if initialization succeeded
 */
export async function initializeAudioServices() {
    try {
        console.log('Initializing WebsitePrototype audio services...');

        // Check if required classes are available
        if (typeof AudioRecorder === 'undefined') {
            throw new Error('AudioRecorder not loaded');
        }
        if (typeof TTSAudioPlayer === 'undefined') {
            throw new Error('TTSAudioPlayer not loaded');
        }
        if (typeof OrchestratorWebSocketService === 'undefined') {
            throw new Error('OrchestratorWebSocketService not loaded');
        }

        // Initialize Audio Recorder
        audioRecorder = new AudioRecorder({
            chunkInterval: 100,
            audioBitsPerSecond: 16000
        });
        await audioRecorder.initialize();

        // Initialize TTS Player
        ttsPlayer = new TTSAudioPlayer({
            volume: 1.0,
            playbackRate: 1.0
        });
        await ttsPlayer.initialize();

        // Set up TTS callbacks
        ttsPlayer.onPlaybackStart = (item) => {
            setWinstonState('speaking');
            console.log('Winston started speaking:', item.id);
        };

        ttsPlayer.onPlaybackEnd = (item) => {
            setWinstonState('idle');
            console.log('Winston finished speaking:', item?.id);
        };

        ttsPlayer.onError = (error) => {
            console.error('TTS playback error:', error);
            showToast('Audio playback error: ' + error.message, 'error');
        };

        // Initialize Orchestrator WebSocket
        orchestratorWebSocket = new OrchestratorWebSocketService();

        // Set up orchestrator callbacks
        orchestratorWebSocket.onInterviewStarted = (data) => {
            console.log('Interview started:', data);
            currentInterviewId = data.interviewId;
            isInterviewActive = true;
            showToast('Interview session started with Winston', 'success');
        };

        orchestratorWebSocket.onQuestionReceived = (data) => {
            console.log('Question received:', data);
            updateInterviewQuestion(data.question);

            // If TTS audio is provided, play it
            if (data.audioChunks && data.audioChunks.length > 0) {
                ttsPlayer.addToQueue(data.audioChunks, {
                    turnId: data.turnId || `question-${Date.now()}`,
                    type: 'interview-question'
                });
            }
        };

        orchestratorWebSocket.onAudioChunkRequested = (data) => {
            console.log('Audio chunk requested:', data);
            // This would typically trigger more detailed audio processing
        };

        orchestratorWebSocket.onError = (error) => {
            console.error('Orchestrator WebSocket error:', error);
            showToast('Connection error: ' + error.message, 'error');
            showConnectionBanner(true);
        };

        orchestratorWebSocket.onReconnected = () => {
            console.log('Orchestrator WebSocket reconnected');
            showToast('Connection restored', 'success');
            showConnectionBanner(false);
        };

        console.log('All WebsitePrototype services initialized successfully');
        return true;

    } catch (error) {
        console.error('Service initialization failed:', error);
        showToast('Failed to initialize audio services: ' + error.message, 'error');
        return false;
    }
}

/**
 * Start an interview session with the orchestrator
 * Must call initializeAudioServices() first
 * @returns {Promise<void>}
 */
export async function startInterviewWithOrchestrator() {
    try {
        if (!orchestratorWebSocket) {
            throw new Error('Orchestrator not initialized');
        }

        setWinstonState('thinking');
        showToast('Connecting to interview orchestrator...', 'success');

        // Connect to WebSocket first
        orchestratorWebSocket.connect();

        // Wait a moment for connection
        await new Promise(resolve => setTimeout(resolve, 1000));

        if (!orchestratorWebSocket.isConnected()) {
            throw new Error('Failed to connect to orchestrator');
        }

        showToast('Starting interview session...', 'success');

        // Start interview with orchestrator
        const interviewData = {
            userId: 'demo-user', // In production, get from auth
            twinId: 'winston-interviewer',
            sessionType: 'memory-interview',
            metadata: {
                platform: 'WebsitePrototype',
                timestamp: new Date().toISOString()
            }
        };

        orchestratorWebSocket.startInterview(interviewData);

        setWinstonState('idle');

    } catch (error) {
        console.error('Failed to start interview:', error);
        showToast('Failed to start interview: ' + error.message, 'error');
        setWinstonState('idle');
    }
}

/**
 * Stop the current interview session
 */
export function stopInterviewSession() {
    if (orchestratorWebSocket && isInterviewActive) {
        orchestratorWebSocket.endInterview();
        isInterviewActive = false;
        currentInterviewId = null;
    }
}

/**
 * Send an audio chunk to the orchestrator
 * @param {Object} chunk - Audio chunk data
 */
export function sendAudioChunk(chunk) {
    if (orchestratorWebSocket && isInterviewActive) {
        orchestratorWebSocket.sendAudioChunk(chunk);
    }
}

/**
 * Check if orchestrator is connected
 * @returns {boolean} True if connected
 */
export function isOrchestratorConnected() {
    return orchestratorWebSocket && orchestratorWebSocket.isConnected();
}
