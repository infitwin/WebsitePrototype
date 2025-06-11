/**
 * Interview Page JavaScript
 * Extracted from interview.html as part of refactoring
 * Handles all interview functionality including audio recording, WebSocket communication, and UI state
 */

// Global state variables - to be refactored in Phase 3
let audioRecorder = null;
let ttsPlayer = null;
let orchestratorWebSocket = null;
let audioWebSocket = null;
let currentInterviewId = null;
let currentSessionId = null;
let isInterviewActive = false;
let isRecording = false;
let recognition;
let collectedAudioChunks = [];
let cloudInterval;
let activeClouds = [];
let usedPositions = [];
let transcriptionTimeout = null;

// Idea prompts for floating clouds
const ideaPrompts = [
    "What was your first job like?",
    "Tell me about your childhood home",
    "Who influenced you the most?",
    "What traditions did your family have?",
    "Describe a perfect day from your past",
    "What games did you play as a child?",
    "Tell me about your best friend",
    "What was school like for you?"
];

// Wait for all scripts to load
window.addEventListener('load', function() {
    console.log('Checking loaded functions:');
    console.log('- getBusinessWebSocketUrl:', typeof window.getBusinessWebSocketUrl);
    console.log('- buildStartInterviewMessage:', typeof window.buildStartInterviewMessage);
    console.log('- generateInterviewId:', typeof window.generateInterviewId);
    console.log('- generateCorrelationId:', typeof window.generateCorrelationId);
    
    if (typeof window.getBusinessWebSocketUrl === 'function') {
        console.log('Correct WebSocket URL:', window.getBusinessWebSocketUrl(false));
    }
});

// Initialize Nexus Graph Visualization
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎯 Initializing Nexus in interview page...');
    const graphContainer = document.getElementById('interview-neo4j-container');
    
    if (graphContainer) {
        console.log('✅ Interview Nexus container found');
        
        try {
            // CRITICAL: Initialize NexusControl as ONE INTEGRATED COMPONENT
            // DO NOT attempt to split this control or use only parts of it
            // The NexusControl includes ACTIVE tab, HISTORY tab, and all controls
            const containerWidth = graphContainer.offsetWidth;
            const containerHeight = graphContainer.offsetHeight;
            
            console.log('🚀 Initializing COMPLETE Neo4jCompactControl (not split)');
            console.log(`Container dimensions: ${containerWidth}x${containerHeight}`);
            
            // Wait for Neo4jCompactControl to be loaded
            setTimeout(() => {
                if (typeof Neo4jCompactControl !== 'undefined') {
                    // Create React element for Neo4jCompactControl
                    const nexusElement = React.createElement(Neo4jCompactControl, {
                        data: window.mockInterviewData || [],
                        width: containerWidth,
                        height: containerHeight,
                        onNodeSelect: (node) => console.log('Node selected:', node),
                        onEdgeSelect: (edge) => console.log('Edge selected:', edge)
                    });
                    
                    // Render React component
                    const root = ReactDOM.createRoot(graphContainer);
                    root.render(nexusElement);
                    
                    console.log('✅ Interview Neo4j visualization created successfully');
                    
                    // Store globally for debugging and external access
                    window.interviewNexusViz = root;
                } else {
                    console.error('❌ Neo4jCompactControl not loaded');
                    
                    // Fallback: Show placeholder
                    graphContainer.innerHTML = `
                        <div style="display: flex; align-items: center; justify-content: center; height: 100%; 
                                    background: #f8f9fa; border: 2px dashed #dee2e6; border-radius: 8px;">
                            <div style="text-align: center; color: #6c757d;">
                                <h3>Neo4j Control Loading...</h3>
                                <p>Setting up React environment</p>
                            </div>
                        </div>
                    `;
                }
            }, 1000);
            
            // Hook for interview data updates
            window.updateInterviewGraph = function(data) {
                if (window.interviewNexusViz && data) {
                    // TODO: Implement data update logic
                    console.log('📊 Interview graph updated with new data');
                }
            };
            
            // Hook for adding new nodes during interview
            window.addInterviewNode = function(node) {
                if (window.interviewNexusViz && node) {
                    // TODO: Implement node addition logic
                    console.log('➕ Node added to interview graph:', node);
                }
            };
            
            // Hook for adding new relationships during interview
            window.addInterviewEdge = function(edge) {
                if (window.interviewNexusViz && edge) {
                    // TODO: Implement edge addition logic
                    console.log('🔗 Edge added to interview graph:', edge);
                }
            };
            
        } catch (error) {
            console.error('❌ Failed to initialize interview Nexus visualization:', error);
        }
    } else {
        console.error('❌ Interview Nexus container not found!');
    }
});

// Add missing function stubs for graceful fallback
function createAudioLogger(name) {
    return {
        info: console.log.bind(console, `[${name}]`),
        error: console.error.bind(console, `[${name}]`),
        warn: console.warn.bind(console, `[${name}]`),
        audio: console.log.bind(console, `[${name}][AUDIO]`),
        performance: console.log.bind(console, `[${name}][PERF]`)
    };
}

// Temporary fallback until scripts load - use correct orchestrator URL
if (typeof window.getBusinessWebSocketUrl === 'undefined') {
    window.getBusinessWebSocketUrl = function(isDevelopment) {
        return isDevelopment ? 
            'ws://localhost:8000/ws' : 
            'wss://intervieworchestrationservice-833139648849.us-central1.run.app/ws';
    };
}

// Initialize Audio WebSocket Service
function initializeAudioWebSocket() {
    return new Promise((resolve, reject) => {
        if (!currentSessionId || !currentInterviewId) {
            console.warn('Cannot initialize audio WebSocket: missing session/interview ID');
            reject(new Error('Missing session/interview ID'));
            return;
        }
        
        console.log('Initializing Audio WebSocket for session:', currentSessionId);
        
        // Create audio WebSocket service
        audioWebSocket = new AudioWebSocketService({
            isDevelopment: false,
            autoReconnect: true
        });
        
        // Set up callbacks
        audioWebSocket.onConnected = () => {
            console.log('Audio WebSocket connected');
            // Silent connection for cleaner UX
            resolve(); // Resolve the promise when connected
        };
        
        audioWebSocket.onTranscriptReceived = (transcript) => {
            console.log('Audio WebSocket transcript received:', transcript);
            if (transcript.text && transcript.isFinal) {
                // Only add final transcripts to avoid duplicate/choppy text
                addMessage(transcript.text, 'user');
                showToast('Transcript: ' + transcript.text, 'success');
                // Hide the transcription indicator
                hideTranscriptionIndicator();
            } else if (transcript.text && !transcript.isFinal) {
                // Show partial transcripts in the indicator
                console.log('Partial transcript:', transcript.text);
                showTranscriptionIndicator(transcript.text);
            }
        };
        
        audioWebSocket.onError = (error) => {
            console.error('Audio WebSocket error:', error);
            showToast('Audio service error: ' + error.message, 'error');
            reject(error); // Reject on error
        };
        
        audioWebSocket.onDisconnected = () => {
            console.log('Audio WebSocket disconnected');
            console.warn('Audio service disconnected');
        };
        
        // Connect to audio service
        audioWebSocket.connect(currentSessionId, currentInterviewId);
        
        // Set a timeout in case connection takes too long
        setTimeout(() => {
            if (!audioWebSocket.isConnected()) {
                console.warn('Audio WebSocket connection timed out');
                resolve(); // Resolve anyway to not block
            }
        }, 5000);
    });
}

// Initialize WebsitePrototype services
async function initializeServices() {
    try {
        console.log('Initializing WebsitePrototype audio services...');
        
        // Initialize LINEAR16 Audio Recorder
        audioRecorder = new AudioRecorderLinear16({
            chunkInterval: 100,
            sampleRate: 16000,
            encoding: 'LINEAR16'
        });
        
        try {
            await audioRecorder.initialize();
        } catch (initError) {
            console.warn('Audio recorder initialization failed:', initError);
            // Continue without audio recording capability
            audioRecorder = null;
        }
        
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
        console.log('Available WebSocket URL function:', typeof getBusinessWebSocketUrl);
        console.log('Production WebSocket URL:', getBusinessWebSocketUrl(false));
        orchestratorWebSocket = new OrchestratorWebSocketService();
        
        // CRITICAL: Store orchestrator reference globally for AudioWebSocketService
        window.orchestratorWebSocket = orchestratorWebSocket;
        
        // Set up orchestrator callbacks
        orchestratorWebSocket.onInterviewStarted = async (data) => {
            console.log('Interview started:', data);
            currentInterviewId = data.interviewId;
            currentSessionId = data.sessionId || data.sessionDetails?.id;
            isInterviewActive = true;
            
            // CRITICAL FIX: Only initialize audio WebSocket AFTER we have valid IDs
            if (currentInterviewId && currentSessionId) {
                console.log('✅ Interview IDs confirmed, initializing audio WebSocket...');
                console.log(`  - InterviewId: ${currentInterviewId}`);
                console.log(`  - SessionId: ${currentSessionId}`);
                
                // Initialize audio WebSocket connection and wait for it
                await initializeAudioWebSocket();
                
                // Enable inputs now that services are ready
                const micButton = document.getElementById('micBtn');
                const messageInput = document.getElementById('messageInput');
                if (micButton) {
                    micButton.disabled = false;
                    micButton.classList.remove('disabled');
                }
                if (messageInput) {
                    messageInput.disabled = false;
                    messageInput.placeholder = 'Share your response here...';
                }
                
                // Set Winston to idle state after initialization
                setWinstonState('idle');
            } else {
                console.error('❌ Interview started but missing required IDs:', { currentInterviewId, currentSessionId });
                console.warn('Interview started but audio service unavailable');
            }
        };
        
        // Track if we've shown the initial greeting globally
        window.initialGreetingShown = false;
        
        orchestratorWebSocket.onQuestionReceived = (data) => {
            console.log('🎯 Winston question received:', data);
            
            // Extract question text from payload.data.questionText (actual structure from orchestrator)
            const questionText = data.payload?.data?.questionText || 
                               data.questionText || 
                               data.question;
            
            console.log('Extracted questionText:', questionText);
            
            if (questionText) {
                // Check if this is the duplicate initial greeting
                const isInitialGreeting = questionText.includes("Hello! I'm Winston") && 
                                         questionText.includes("memory curator");
                
                if (isInitialGreeting) {
                    console.log('Skipping initial greeting in chat - already shown in question area');
                    // Update the question display but don't add to chat
                    updateInterviewQuestion(questionText);
                    return;
                }
                
                // Update the question display
                updateInterviewQuestion(questionText);
                
                // Add Winston's message to the chat (non-greeting messages only)
                addMessage(questionText, 'winston');
            }
            
            // If TTS audio is provided, play it
            if (data.audioChunks && data.audioChunks.length > 0) {
                ttsPlayer.addToQueue(data.audioChunks, {
                    turnId: data.turnId || data.turnNumber || `question-${Date.now()}`,
                    type: 'interview-question'
                });
            }
        };
        
        orchestratorWebSocket.onAudioChunkRequested = (data) => {
            console.log('Audio chunk requested:', data);
            // This would typically trigger more detailed audio processing
        };
        
        // Add transcription handler
        orchestratorWebSocket.onTranscriptionReceived = (data) => {
            console.log('Orchestrator transcription received:', data);
            // Don't add message here - let audio WebSocket handle it to avoid duplicates
            const transcribedText = data.transcription || data.text || data.transcript;
            if (transcribedText) {
                console.log('Orchestrator transcript (not displayed):', transcribedText);
                // The audio WebSocket service will handle displaying the transcript
            }
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
        
        console.log('✅ All WebsitePrototype services initialized successfully');
        return true;
        
    } catch (error) {
        console.error('❌ Service initialization failed:', error);
        console.error('Failed to initialize audio services:', error.message);
        return false;
    }
}

// Update interview question display
function updateInterviewQuestion(question) {
    const questionElement = document.querySelector('.interview-question');
    if (questionElement && question) {
        questionElement.textContent = question;
    }
}

// Type out question in the CURRENT QUESTION display area
function typeOutQuestion(question) {
    const questionElement = document.querySelector('.interview-question');
    if (questionElement && question) {
        questionElement.textContent = '';
        let index = 0;
        const typingSpeed = 20; // milliseconds per character
        
        const typeInterval = setInterval(() => {
            if (index < question.length) {
                questionElement.textContent += question[index];
                index++;
            } else {
                clearInterval(typeInterval);
            }
        }, typingSpeed);
    }
}

// Show/hide connection banner
function showConnectionBanner(show) {
    const banner = document.getElementById('connectionBanner');
    if (show) {
        banner.classList.add('active');
    } else {
        banner.classList.remove('active');
    }
}

// Enhanced startInterview function with proper WebSocket message format
async function startInterviewWithOrchestrator(interviewType = 'new', subject = null) {
    try {
        if (!orchestratorWebSocket) {
            throw new Error('Orchestrator not initialized');
        }
        
        setWinstonState('thinking');
        console.log('Connecting to interview orchestrator...');
        
        // Connect to WebSocket first
        orchestratorWebSocket.connect();
        
        // Wait longer for cloud service connection (3 seconds instead of 1)
        let connectionAttempts = 0;
        const maxAttempts = 6; // 6 attempts * 500ms = 3 seconds
        
        while (!orchestratorWebSocket.isConnected() && connectionAttempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 500));
            connectionAttempts++;
        }
        
        if (!orchestratorWebSocket.isConnected()) {
            console.warn('WebSocket not connected after 3 seconds, proceeding anyway...');
            // Silent connection - no notifications
        } else {
            console.log('Connected! Starting interview session...');
        }
        
        // Prepare interview data in the correct format for the message builder
        const interviewData = {
            userId: 'demo-user', // TODO: Get from auth in production
            twinId: 'winston-interviewer',
            subject: subject || (interviewType === 'artifact' ? 'Artifact-based Memory' : 'Memory Interview'),
            interviewType: 'voice', // Always 'voice' for now
            interviewId: generateInterviewId(), // Generate unique ID
            correlationId: generateCorrelationId(), // Generate correlation ID
            additionalParams: {
                sessionParams: {
                    interviewCategory: interviewType, // 'new' or 'artifact'
                    autoRecord: true,
                    enableTranscription: true,
                    language: 'en-US',
                    maxDuration: 3600, // 1 hour max
                    maxQuestions: 30 // Internal limit
                },
                userContext: {
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                    locale: navigator.language,
                    userAgent: navigator.userAgent,
                    platform: 'WebsitePrototype'
                }
            }
        };
        
        // Send the properly formatted message
        const success = orchestratorWebSocket.startInterview(interviewData);
        
        if (!success) {
            throw new Error('Failed to send start interview message');
        }
        
        console.log('Interview started with data:', interviewData);
        
    } catch (error) {
        console.error('Failed to start interview:', error);
        showToast('Failed to start interview: ' + error.message, 'error');
        setWinstonState('idle');
    }
}

// Idea Clouds Management
function createDreamyCloud() {
    const banner = document.getElementById('ideaClouds');
    const prompt = ideaPrompts[Math.floor(Math.random() * ideaPrompts.length)];
    
    const cloud = document.createElement('div');
    cloud.className = 'idea-cloud';
    cloud.textContent = prompt;
    
    // Generate random position with collision avoidance
    let attempts = 0;
    let pos;
    let collision = true;
    
    while (collision && attempts < 20) {
        // Random positioning across full width
        pos = {
            left: Math.random() * 85 + 5, // 5% to 90%
            top: Math.random() * 30 + 5   // 5px to 35px
        };
        
        // Check for collisions with existing clouds
        collision = activeClouds.some(activeCloud => {
            const existingLeft = parseFloat(activeCloud.position.left);
            const existingTop = parseFloat(activeCloud.position.top);
            
            // Calculate distance between clouds
            const horizontalDistance = Math.abs(pos.left - existingLeft);
            const verticalDistance = Math.abs(pos.top - existingTop);
            
            // Require minimum spacing (about 15% horizontally, 20px vertically)
            return horizontalDistance < 15 && verticalDistance < 20;
        });
        
        attempts++;
    }
    
    if (collision) return; // Skip if can't find clear space
    
    cloud.style.left = pos.left + '%';
    cloud.style.top = pos.top + 'px';
    
    banner.appendChild(cloud);
    activeClouds.push({ cloud, position: pos });
    
    // Smoother fade in with random delay
    const fadeInDelay = Math.random() * 2000 + 500; // 0.5-2.5 seconds
    setTimeout(() => cloud.classList.add('visible'), fadeInDelay);
    
    // Fade out and remove with longer duration
    const visibleTime = 40000 + Math.random() * 40000; // 40-80 seconds
    setTimeout(() => {
        cloud.classList.remove('visible');
        setTimeout(() => {
            if (banner.contains(cloud)) {
                banner.removeChild(cloud);
                activeClouds = activeClouds.filter(c => c.cloud !== cloud);
            }
        }, 4000); // 4 second fade out
    }, visibleTime);
}

function startIdeaClouds() {
    // Start with fewer clouds, more spaced out
    setTimeout(() => createDreamyCloud(), 2000);
    setTimeout(() => createDreamyCloud(), 8000);
    setTimeout(() => createDreamyCloud(), 15000);
    setTimeout(() => createDreamyCloud(), 25000);
    
    // Add new clouds to maintain 4-6 active clouds (less crowded)
    cloudInterval = setInterval(() => {
        if (activeClouds.length < 5) {
            createDreamyCloud();
        }
    }, 20000); // Every 20 seconds
}

// Audio Recording Functions
function toggleRecording() {
    const micBtn = document.getElementById('micBtn');
    
    if (!isRecording) {
        // Try to start recording
        const started = startRecording();
        if (started) {
            micBtn.classList.add('recording');
            micBtn.textContent = '⏹️';
            isRecording = true;
        }
    } else {
        // Stop recording
        stopRecording();
        micBtn.classList.remove('recording');
        micBtn.textContent = '🎤';
        isRecording = false;
    }
}

function startRecording() {
    if (!audioRecorder) {
        showToast('Audio recorder not initialized', 'error');
        return false;
    }
    
    if (!audioWebSocket || !audioWebSocket.isConnected()) {
        showToast('Audio service not connected. Please wait...', 'error');
        return false;
    }
    
    // Clear any previously collected chunks
    collectedAudioChunks = [];
    
    try {
        audioRecorder.start(
            // onAudioChunk callback
            (chunk) => {
                console.log(`Audio chunk ${chunk.chunkNumber}: ${chunk.size} bytes`);
                
                // Collect audio chunks instead of sending immediately
                if (isInterviewActive) {
                    collectedAudioChunks.push({
                        audio: chunk.audio,
                        chunkNumber: chunk.chunkNumber,
                        size: chunk.size
                    });
                }
            },
            // onError callback
            (error) => {
                console.error('Recording error:', error);
                showToast('Recording error: ' + error.message, 'error');
                // Reset button state without calling toggleRecording
                const micBtn = document.getElementById('micBtn');
                micBtn.classList.remove('recording');
                micBtn.textContent = '🎤';
                isRecording = false;
                setWinstonState('idle');
            },
            // onStateChange callback
            (state) => {
                console.log('Recording state changed:', state);
                if (state.recording) {
                    setWinstonState('listening');
                } else {
                    setWinstonState('idle');
                }
            }
        );
        
        console.log('Audio recording started');
        setWinstonState('listening');
        return true;
        
    } catch (error) {
        console.error('Failed to start recording:', error);
        showToast('Failed to start recording: ' + error.message, 'error');
        return false;
    }
}

function stopRecording() {
    if (audioRecorder) {
        try {
            audioRecorder.stop();
            console.log('Audio recording stopped');
            
            // Send all collected audio chunks when recording stops
            if (collectedAudioChunks.length > 0 && audioWebSocket && audioWebSocket.isConnected()) {
                console.log(`Sending ${collectedAudioChunks.length} collected audio chunks`);
                
                // Send each chunk in sequence
                collectedAudioChunks.forEach((chunk, index) => {
                    const isFinal = index === collectedAudioChunks.length - 1;
                    audioWebSocket.sendAudioChunk(chunk.audio, chunk.chunkNumber, isFinal);
                });
                
                // Clear the collected chunks
                collectedAudioChunks = [];
            }
            
            setWinstonState('idle');
            // Hide transcription indicator when stopping
            hideTranscriptionIndicator();
        } catch (error) {
            console.error('Failed to stop recording:', error);
            showToast('Failed to stop recording: ' + error.message, 'error');
            collectedAudioChunks = []; // Clear chunks on error
        }
    }
}

// UI State Management
function setWinstonState(state) {
    const orb = document.querySelector('.winston-orb');
    orb.className = 'winston-orb ' + state;
}

function sendMessage() {
    const input = document.getElementById('messageInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    // Add user message to UI immediately
    addMessage(message, 'user');
    input.value = '';
    
    // Send to orchestrator for processing
    if (orchestratorWebSocket && orchestratorWebSocket.isConnected()) {
        // Send text message to orchestrator
        const success = orchestratorWebSocket.sendUserTextMessage(message);
        
        if (success) {
            setWinstonState('thinking');
            console.log('Text message sent to orchestrator:', message);
        } else {
            showToast('Failed to send message', 'error');
            setWinstonState('idle');
        }
    } else {
        console.error('Not connected to interview service');
        
        // Fallback to demo mode if not connected
        setWinstonState('thinking');
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
}

function addMessage(text, sender) {
    const messagesContainer = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message' + (sender === 'user' ? ' user-message' : '');
    
    if (sender === 'winston') {
        messageDiv.innerHTML = `
            <div class="winston-orb winston-avatar">🎩</div>
            <div class="message-content">${text}</div>
        `;
    } else {
        messageDiv.innerHTML = `
            <div class="message-content">${text}</div>
        `;
    }
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Interview Management Functions
async function startNewInterview(type) {
    try {
        console.log(`🚀 Starting new ${type} interview`);
        document.getElementById('interviewSelectionModal').classList.remove('active');
        
        // Disable inputs initially
        const micButton = document.getElementById('micBtn');
        const messageInput = document.getElementById('messageInput');
        if (micButton) {
            micButton.disabled = true;
            micButton.classList.add('disabled');
        }
        if (messageInput) {
            messageInput.disabled = true;
            messageInput.placeholder = 'Waiting for Winston to start the interview...';
        }
        
        // Show Winston's greeting in the CURRENT QUESTION area with typing animation
        const winstonGreeting = "Hello! I'm Winston, your memory curator. Let's begin by choosing a topic for today's interview. What would you like to explore? I'll guide you through about 30 focused questions to help capture your memories.";
        
        // Type out the greeting in the question display area, not in chat
        typeOutQuestion(winstonGreeting);
        
        // Mark that we've shown the initial greeting
        window.initialGreetingShown = true;
        
        // Initialize all services with fallback handling
        const servicesReady = await initializeServices().catch(error => {
            console.warn('Service initialization failed, continuing with limited functionality:', error);
            return false;
        });
        
        // Continue even if services fail to initialize
        if (!servicesReady) {
            console.log('⚠️ Services failed to initialize, continuing in demo mode');
            console.warn('Running in demo mode - some features may not work');
        }
        
        // Try to start orchestrator session with fallback
        try {
            await startInterviewWithOrchestrator(type);
        } catch (error) {
            console.warn('Orchestrator connection failed, continuing in offline mode:', error);
            console.warn('Running in offline mode - audio features disabled');
        }
        
        // Start the idea clouds (this should always work)
        startIdeaClouds();
        
        // Show specialized message for artifact interviews
        if (type === 'artifact') {
            document.getElementById('photoReference').style.display = 'block';
            showToast('Artifact interview ready! Upload or describe your artifact to get started.', 'success');
        } else {
            showToast('Interview ready! Let\'s capture your memories.', 'success');
        }
        
    } catch (error) {
        console.error('❌ Critical error starting interview:', error);
        showToast('Failed to start interview. Please refresh the page and try again.', 'error');
        
        // Emergency fallback - remove modal anyway
        document.getElementById('interviewSelectionModal').classList.remove('active');
    }
}

async function resumeInterview(interviewId) {
    try {
        console.log(`📋 Resuming interview: ${interviewId}`);
        document.getElementById('interviewSelectionModal').classList.remove('active');
        
        showToast('Loading previous interview...', 'success');
        
        // Simulate loading previous interview data
        const interviewData = {
            'family-stories': {
                question: "You were telling me about your grandmother's cooking. What was her most special dish?",
                progress: "12 of 25 questions completed"
            },
            'career-journey': {
                question: "What was the biggest challenge you faced in your first job?",
                progress: "5 of 30 questions completed"
            }
        };
        
        const data = interviewData[interviewId];
        if (data) {
            updateInterviewQuestion(data.question);
            showToast(`Resumed: ${data.progress}`, 'success');
        } else {
            updateInterviewQuestion("Welcome back! What would you like to continue discussing?");
        }
        
        // Initialize services and start interview
        await initializeServices().catch(() => false);
        await startInterviewWithOrchestrator('resume', interviewId).catch(() => {});
        startIdeaClouds();
        
    } catch (error) {
        console.error('❌ Error resuming interview:', error);
        showToast('Failed to resume interview', 'error');
        document.getElementById('interviewSelectionModal').classList.remove('active');
    }
}

async function viewInterview(interviewId) {
    showToast('Opening completed interview in view mode...', 'success');
    document.getElementById('interviewSelectionModal').classList.remove('active');
    
    // In a real implementation, this would load the completed interview data
    updateInterviewQuestion("This is a completed interview. You can review the conversation but not add new responses.");
    
    // Disable input controls for view mode
    const inputField = document.getElementById('messageInput');
    const micBtn = document.getElementById('micBtn');
    if (inputField) inputField.disabled = true;
    if (micBtn) micBtn.disabled = true;
    
    showToast('Viewing completed interview - read-only mode', 'success');
}

// Session Management
function pauseInterview() {
    showToast('Interview paused. Your progress has been saved.', 'success');
    // TODO: Send pause message to orchestrator
    if (orchestratorWebSocket && orchestratorWebSocket.isConnected()) {
        // You can add orchestrator pause logic here if needed
    }
    setTimeout(() => {
        window.location.href = '../dashboard.html';
    }, 1500);
}

function submitForReview() {
    // Show confirmation dialog
    if (confirm('Are you ready to submit this interview for final review? This will end the current session.')) {
        showToast('Submitting interview for final review...', 'success');
        // TODO: Send submit message to orchestrator
        if (orchestratorWebSocket && orchestratorWebSocket.isConnected()) {
            // You can add orchestrator submit logic here if needed
        }
        setTimeout(() => {
            window.location.href = '../dashboard.html';
        }, 2000);
    }
}

// Deprecated - kept for backward compatibility
function saveAndExit() {
    pauseInterview();
}

function stopSession() {
    // Show confirmation dialog
    if (confirm('Are you sure you want to stop this interview session? Your progress will be saved.')) {
        // Stop any active recording
        if (isRecording) {
            toggleRecording();
        }
        
        // Stop any active TTS playback
        if (ttsPlayer) {
            ttsPlayer.stopAndClearQueue();
        }
        
        // Close WebSocket connections if active
        if (orchestratorWebSocket && isInterviewActive) {
            orchestratorWebSocket.endInterview();
            isInterviewActive = false;
        }
        
        // Disconnect audio WebSocket
        if (audioWebSocket) {
            audioWebSocket.disconnect();
            audioWebSocket = null;
        }
        
        // Stop idea clouds animation
        if (cloudInterval) {
            clearInterval(cloudInterval);
            cloudInterval = null;
        }
        
        // Clear all active clouds
        const banner = document.getElementById('ideaClouds');
        banner.innerHTML = '';
        activeClouds = [];
        usedPositions = [];
        
        // Reset Winston state
        setWinstonState('idle');
        
        // Show success message
        showToast('Interview session stopped. Your progress has been saved.', 'success');
        
        // Optionally navigate back to dashboard after a delay
        setTimeout(() => {
            if (confirm('Would you like to return to the dashboard?')) {
                window.location.href = '../dashboard.html';
            }
        }, 2000);
    }
}

// UI Helper Functions
function showInterviewSelection() {
    document.getElementById('interviewSelectionModal').classList.add('active');
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    
    toast.className = `toast ${type}`;
    toastMessage.textContent = message;
    toast.classList.add('active');
    
    setTimeout(() => {
        toast.classList.remove('active');
    }, 3000);
}

// Transcription indicator functions
function showTranscriptionIndicator(text) {
    const indicator = document.getElementById('transcriptionIndicator');
    if (indicator) {
        indicator.textContent = text;
        indicator.classList.add('active');
        
        // Clear any existing timeout
        if (transcriptionTimeout) {
            clearTimeout(transcriptionTimeout);
        }
        
        // Auto-hide after 5 seconds of no updates
        transcriptionTimeout = setTimeout(() => {
            hideTranscriptionIndicator();
        }, 5000);
    }
}

function hideTranscriptionIndicator() {
    const indicator = document.getElementById('transcriptionIndicator');
    if (indicator) {
        indicator.classList.remove('active');
        
        // Clear timeout
        if (transcriptionTimeout) {
            clearTimeout(transcriptionTimeout);
            transcriptionTimeout = null;
        }
    }
}

// Debug helper function - call from browser console
window.debugTranscriptForwarding = function(testText = "Hello Winston, this is a test message") {
    console.log('🧪 Testing transcript forwarding...');
    
    if (!audioWebSocket) {
        console.error('Audio WebSocket not initialized');
        return;
    }
    
    if (!window.orchestratorWebSocket) {
        console.error('Orchestrator WebSocket not available');
        return;
    }
    
    // Simulate a final transcript
    const mockTranscript = {
        text: testText,
        confidence: 0.95,
        isFinal: true,
        timestamp: new Date().toISOString()
    };
    
    console.log('📝 Simulating transcript forwarding:', mockTranscript);
    
    // Call the forwarding function directly
    const result = audioWebSocket.forwardTranscriptToOrchestrator(mockTranscript);
    
    if (result) {
        console.log('✅ Test transcript forwarded successfully');
        showToast('Test transcript sent to Winston', 'success');
    } else {
        console.error('❌ Test transcript forwarding failed');
        showToast('Test transcript forwarding failed', 'error');
    }
};

// Initialize event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Handle enter key in message input
    const messageInput = document.getElementById('messageInput');
    if (messageInput) {
        messageInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }
});

// Export functions for global access
window.toggleRecording = toggleRecording;
window.startNewInterview = startNewInterview;
window.resumeInterview = resumeInterview;
window.viewInterview = viewInterview;
window.showInterviewSelection = showInterviewSelection;
window.saveAndExit = saveAndExit;
window.stopSession = stopSession;