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

// AI Commands reference for Nexus control
let aiCommands = {};
// Global reference for command execution
window.aiCommands = aiCommands;

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
            
            console.log('🚀 Initializing NexusGraphControl v17.13.0');
            console.log(`Container dimensions: ${containerWidth}x${containerHeight}`);
            
            // Wait for NexusGraphControl to be loaded
            setTimeout(() => {
                if (window.NexusGraphControl && window.NexusGraphControl.NexusGraphControl) {
                    const { NexusGraphControl } = window.NexusGraphControl;
                    
                    // Create React element for NexusGraphControl
                    const nexusElement = React.createElement(NexusGraphControl, {
                        title: 'Memory Interview Graph',
                        data: {
                            nodes: [],
                            edges: []
                        },
                        width: containerWidth,
                        height: containerHeight,
                        // Disable orchestrator for local development to avoid CORS issues
                        orchestratorUrl: null,
                        // Enable for production: orchestratorUrl: window.getBusinessWebSocketUrl ? window.getBusinessWebSocketUrl(false) : null,
                        aiCommands: aiCommands, // Enable AI command handling
                        useExternalMetadataEditor: true,
                        onNodeClick: (node) => console.log('Node selected:', node),
                        onNodeDoubleClick: (node) => {
                            console.log('Node double-clicked, opening metadata editor:', node);
                            openMetadataEditor(node, 'node');
                        },
                        onEdgeClick: (edge) => console.log('Edge selected:', edge),
                        onEdgeDoubleClick: (edge) => {
                            console.log('Edge double-clicked, opening metadata editor:', edge);
                            openMetadataEditor(edge, 'edge');
                        },
                        onDataChange: (newData) => {
                            console.log('Graph data changed:', newData);
                            window.currentGraphData = newData;
                            // Could emit to orchestrator about graph changes
                        },
                        hidePageHeader: true,
                        hideStatusBar: true,
                        controlsAlignment: 'right'
                    });
                    
                    // Render React component
                    const root = ReactDOM.createRoot(graphContainer);
                    root.render(nexusElement);
                    
                    console.log('✅ Interview Nexus Graph Control created successfully');
                    
                    // Store globally for debugging and external access
                    window.interviewNexusViz = root;
                    window.nexusGraphRef = nexusElement;
                } else {
                    console.error('❌ NexusGraphControl not loaded');
                    
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
            
            // Store current graph data globally
            window.currentGraphData = null;

            // Update the entire graph with new data
            window.updateInterviewGraph = function(graphData) {
                if (window.interviewNexusViz && graphData) {
                    console.log('📊 Interview graph updated with new data:', graphData);
                    
                    // Transform Neo4j data to NexusControl format
                    const nexusData = {
                        nodes: (graphData.nodes || []).map(node => ({
                            id: node.id,
                            name: node.properties?.name || node.id,
                            type: mapNeo4jTypeToNexusType(node.labels?.[0]),
                            x: node.properties?.x || Math.random() * 600 + 100,
                            y: node.properties?.y || Math.random() * 600 + 100,
                            properties: node.properties || {}
                        })),
                        edges: (graphData.edges || []).map(edge => ({
                            id: edge.id || `edge_${edge.source || edge.startNode}_${edge.target || edge.endNode}`,
                            source: edge.source || edge.startNode,
                            target: edge.target || edge.endNode,
                            label: edge.type || edge.relationship || 'RELATED_TO',
                            type: edge.relationshipType || 'Personal',
                            properties: edge.properties || {}
                        }))
                    };
                    
                    // Store for future reference
                    window.currentGraphData = nexusData;
                    
                    // Re-render NexusControl with new data
                    const graphContainer = document.getElementById('interview-neo4j-container');
                    if (graphContainer && window.NexusGraphControl) {
                        const { NexusGraphControl } = window.NexusGraphControl;
                        const root = window.interviewNexusViz;
                        
                        root.render(React.createElement(NexusGraphControl, {
                            title: 'Memory Interview Graph',
                            data: nexusData,
                            width: graphContainer.offsetWidth,
                            height: graphContainer.offsetHeight,
                            // Disable orchestrator for local development to avoid CORS issues
                        orchestratorUrl: null,
                        // Enable for production: orchestratorUrl: window.getBusinessWebSocketUrl ? window.getBusinessWebSocketUrl(false) : null,
                            useExternalMetadataEditor: true,
                            onNodeClick: (node) => console.log('Node selected:', node),
                            onNodeDoubleClick: (node) => {
                                console.log('Node double-clicked, opening metadata editor:', node);
                                openMetadataEditor(node, 'node');
                            },
                            onEdgeClick: (edge) => console.log('Edge selected:', edge),
                            onEdgeDoubleClick: (edge) => {
                                console.log('Edge double-clicked, opening metadata editor:', edge);
                                openMetadataEditor(edge, 'edge');
                            },
                            onDataChange: (newData) => {
                                console.log('Graph data changed:', newData);
                                window.currentGraphData = newData;
                            },
                            hidePageHeader: true,
                            hideStatusBar: true,
                            controlsAlignment: 'right'
                        }));
                        
                        console.log('✅ NexusControl updated with', nexusData.nodes.length, 'nodes and', nexusData.edges.length, 'edges');
                    }
                }
            };
            
            // Add incremental updates for real-time changes
            window.addInterviewGraphData = function(updateData) {
                console.log('🔄 Adding graph data:', updateData);
                
                if (!window.currentGraphData || !updateData) {
                    console.warn('No existing graph data or update data');
                    return;
                }
                
                // Merge new nodes
                if (updateData.nodes && updateData.nodes.length > 0) {
                    const newNodes = updateData.nodes.map(node => ({
                        id: node.id,
                        name: node.properties?.name || node.id,
                        type: mapNeo4jTypeToNexusType(node.labels?.[0]),
                        x: node.properties?.x || Math.random() * 600 + 100,
                        y: node.properties?.y || Math.random() * 600 + 100,
                        properties: node.properties || {}
                    }));
                    
                    // Add only new nodes (avoid duplicates)
                    newNodes.forEach(newNode => {
                        if (!window.currentGraphData.nodes.find(n => n.id === newNode.id)) {
                            window.currentGraphData.nodes.push(newNode);
                        }
                    });
                }
                
                // Merge new edges
                if (updateData.edges && updateData.edges.length > 0) {
                    const newEdges = updateData.edges.map(edge => ({
                        id: edge.id || `edge_${edge.source || edge.startNode}_${edge.target || edge.endNode}`,
                        source: edge.source || edge.startNode,
                        target: edge.target || edge.endNode,
                        label: edge.type || edge.relationship || 'RELATED_TO',
                        type: edge.relationshipType || 'Personal',
                        properties: edge.properties || {}
                    }));
                    
                    // Add only new edges (avoid duplicates)
                    newEdges.forEach(newEdge => {
                        if (!window.currentGraphData.edges) {
                            window.currentGraphData.edges = [];
                        }
                        if (!window.currentGraphData.edges.find(e => 
                            e.source === newEdge.source && e.target === newEdge.target)) {
                            window.currentGraphData.edges.push(newEdge);
                        }
                    });
                }
                
                // Re-render with updated data
                window.updateInterviewGraph({
                    nodes: window.currentGraphData.nodes,
                    edges: window.currentGraphData.edges
                });
            };
            
            // Helper function to map Neo4j node types to NexusControl types
            window.mapNeo4jTypeToNexusType = function(neo4jLabel) {
                const typeMap = {
                    'Person': 'person',
                    'Family': 'person',
                    'Event': 'event',
                    'Place': 'place',
                    'Memory': 'thing',
                    'Topic': 'thing',
                    'Experience': 'event',
                    'Organization': 'organization'
                };
                return typeMap[neo4jLabel] || 'person';
            };
            
            // Metadata Editor Integration
            let currentMetadataHandle = null;
            
            window.openMetadataEditor = function(entity, entityType) {
                // Show overlay
                const overlay = document.getElementById('metadata-editor-overlay');
                const container = document.getElementById('metadata-editor-container');
                
                if (!overlay || !container) {
                    console.error('Metadata editor containers not found');
                    return;
                }
                
                overlay.style.display = 'block';
                
                // Close any existing editor
                if (currentMetadataHandle) {
                    currentMetadataHandle.unmount();
                    currentMetadataHandle = null;
                }
                
                // Prepare entity data
                let editorData;
                if (entityType === 'node') {
                    // Map node type to entity type format
                    const entityTypeMap = {
                        'person': 'Person',
                        'organization': 'Organization',
                        'event': 'Event',
                        'place': 'Place',
                        'thing': 'Thing'
                    };
                    
                    editorData = {
                        type: entityTypeMap[entity.type] || 'Person',
                        id: entity.id,
                        name: entity.name || '',
                        ...entity.properties
                    };
                } else {
                    // Handle edge/relationship
                    const { NexusRelationshipEditorWrapper } = window.NexusMetadataEditor;
                    
                    if (NexusRelationshipEditorWrapper && window.currentGraphData) {
                        // Get source and target nodes
                        const sourceNode = window.currentGraphData.nodes.find(n => n.id === entity.source);
                        const targetNode = window.currentGraphData.nodes.find(n => n.id === entity.target);
                        
                        // Render relationship editor
                        const root = ReactDOM.createRoot(container);
                        root.render(
                            React.createElement(NexusRelationshipEditorWrapper, {
                                edgeData: entity,
                                sourceNode: sourceNode,
                                targetNode: targetNode,
                                theme: 'minimal',
                                onSave: (updatedEdge) => {
                                    console.log('Relationship saved:', updatedEdge);
                                    
                                    // Update graph data
                                    if (window.currentGraphData && window.currentGraphData.edges) {
                                        const index = window.currentGraphData.edges.findIndex(e => e.id === updatedEdge.id);
                                        if (index !== -1) {
                                            window.currentGraphData.edges[index] = updatedEdge;
                                            window.updateInterviewGraph(window.currentGraphData);
                                        }
                                    }
                                    
                                    // Close editor
                                    root.unmount();
                                    overlay.style.display = 'none';
                                },
                                onCancel: () => {
                                    root.unmount();
                                    overlay.style.display = 'none';
                                }
                            })
                        );
                        return;
                    }
                }
                
                // Mount node editor
                currentMetadataHandle = window.NexusMetadataEditor.mount(container, {
                    entity: editorData,
                    theme: 'minimal',
                    onSave: (updatedData) => {
                        console.log('Entity saved:', updatedData);
                        
                        // Update node in graph data
                        if (window.currentGraphData && window.currentGraphData.nodes) {
                            const index = window.currentGraphData.nodes.findIndex(n => n.id === updatedData.id);
                            if (index !== -1) {
                                // Update node maintaining graph structure
                                window.currentGraphData.nodes[index] = {
                                    ...window.currentGraphData.nodes[index],
                                    name: updatedData.name,
                                    properties: {
                                        ...updatedData,
                                        type: undefined,
                                        id: undefined,
                                        name: undefined
                                    }
                                };
                                window.updateInterviewGraph(window.currentGraphData);
                            }
                        }
                        
                        // Close editor
                        if (currentMetadataHandle) {
                            currentMetadataHandle.unmount();
                            currentMetadataHandle = null;
                        }
                        overlay.style.display = 'none';
                    },
                    onCancel: () => {
                        if (currentMetadataHandle) {
                            currentMetadataHandle.unmount();
                            currentMetadataHandle = null;
                        }
                        overlay.style.display = 'none';
                    }
                });
            };
            
            // Close metadata editor on overlay click
            document.getElementById('metadata-editor-overlay').addEventListener('click', function(e) {
                if (e.target === this) {
                    if (currentMetadataHandle) {
                        currentMetadataHandle.unmount();
                        currentMetadataHandle = null;
                    }
                    this.style.display = 'none';
                }
            });
            
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
async function initializeAudioWebSocket() {
    return new Promise(async (resolve, reject) => {
        if (!currentSessionId || !currentInterviewId) {
            console.warn('Cannot initialize audio WebSocket: missing session/interview ID');
            reject(new Error('Missing session/interview ID'));
            return;
        }
        
        console.log('Initializing Audio WebSocket for session:', currentSessionId);
        
        // Wait for orchestration endpoints to be available
        let attempts = 0;
        while (typeof window.getAudioWebSocketUrl !== 'function' && attempts < 50) {
            console.log('Waiting for orchestration endpoints to load...');
            await new Promise(r => setTimeout(r, 100));
            attempts++;
        }
        
        if (typeof window.getAudioWebSocketUrl !== 'function') {
            console.error('Failed to load orchestration endpoints after 5 seconds');
            reject(new Error('Orchestration endpoints not available'));
            return;
        }
        
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
            showConnectionBanner(false);
        };
        
        // Add handler for AI graph commands using shared service
        if (window.AICommandHandler) {
            const aiCommandHandler = new window.AICommandHandler(aiCommands, showToast);
            
            // Handle both old and new command types
            orchestratorWebSocket.onGraphCommand = (command) => {
                // Create response callback that sends back via WebSocket
                const sendResponse = (response) => {
                    orchestratorWebSocket.sendMessage('graph_command_response', {
                        ...response,
                        timestamp: new Date().toISOString()
                    });
                };
                
                // Use the shared handler
                aiCommandHandler.handleCommand(command, sendResponse);
            };
            
            // Handle Nexus commands from Winston
            orchestratorWebSocket.onNexusCommand = (command, metadata) => {
                console.log('🎯 Nexus command received in interview.js:', command);
                console.log('📋 Command metadata:', metadata);
                
                // Extract commandId from metadata
                const commandId = metadata?.commandId || `cmd_${Date.now()}`;
                
                // Create response callback that sends back via WebSocket
                const sendResponse = (response) => {
                    // Format according to WebSocket standard with payload/metadata structure
                    orchestratorWebSocket.sendMessage('nexus_command_response', {
                        payload: {
                            ...response,  // The actual Nexus response (result, nodeId, name, etc.)
                            commandId: commandId,
                            timestamp: new Date().toISOString(),
                            metadata: {
                                interviewId: orchestratorWebSocket.currentInterviewId,
                                sessionId: orchestratorWebSocket.currentSessionId,
                                correlationId: metadata?.correlationId || ''
                            }
                        }
                    });
                };
                
                // Use the shared handler
                aiCommandHandler.handleCommand(command, sendResponse);
            };
            
            // Also expose executeCommand for direct access
            window.aiCommands.executeCommand = (command) => {
                const sendResponse = (response) => {
                    console.log('📤 Command response:', response);
                };
                aiCommandHandler.handleCommand(command, sendResponse);
            };
            
            console.log('✅ AI Command Handler initialized with Nexus support');
        } else {
            console.error('❌ AICommandHandler service not loaded');
        }
        
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
        
        // Connect to WebSocket with retry logic for cold starts
        let connected = false;
        const retryAttempts = 3;
        const retryDelays = [3000, 5000, 7000]; // 3s, 5s, 7s - total 15s max
        
        for (let attempt = 0; attempt < retryAttempts && !connected; attempt++) {
            console.log(`🔄 Connection attempt ${attempt + 1} of ${retryAttempts}...`);
            
            // Show user-friendly status
            if (attempt === 0) {
                console.log('Connecting to interview service...');
            } else if (attempt === 1) {
                console.log('Service is starting up, please wait...');
                showToast('Starting interview service, this may take a moment...', 'info');
            } else {
                console.log('Cold start detected, one more moment...');
            }
            
            orchestratorWebSocket.connect();
            
            // Wait for connection with current retry delay
            const waitTime = retryDelays[attempt];
            const checkInterval = 100; // Check every 100ms
            const maxChecks = waitTime / checkInterval;
            let checks = 0;
            
            while (!orchestratorWebSocket.isConnected() && checks < maxChecks) {
                await new Promise(resolve => setTimeout(resolve, checkInterval));
                checks++;
            }
            
            connected = orchestratorWebSocket.isConnected();
            
            if (connected) {
                console.log(`✅ Connected successfully on attempt ${attempt + 1}!`);
                showToast('Connected! Starting your interview...', 'success');
                break;
            } else if (attempt < retryAttempts - 1) {
                console.log(`⏳ Not connected yet, retrying...`);
            }
        }
        
        if (!connected) {
            console.error('❌ Failed to connect after 3 attempts');
            throw new Error('Unable to connect to interview service. Please check your connection and try again.');
        }
        
        // Get authenticated user data
        const userEmail = localStorage.getItem('userEmail');
        const userName = localStorage.getItem('userName');
        
        if (!userEmail) {
            throw new Error('No authenticated user found. Please log in first.');
        }

        // Create user ID from email (remove @ and domain for clean ID)
        const userId = userEmail.split('@')[0].replace(/[^a-zA-Z0-9]/g, '-');
        
        // Use winston as the default interviewer twin
        const twinId = 'winston-interviewer';

        console.log('🔍 Starting interview with authenticated user:', {
            userEmail,
            userName,
            userId,
            twinId
        });

        // Prepare interview data in the correct format for the message builder
        const interviewData = {
            userId: userId,
            twinId: twinId,
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
        
        // Double-check connection before sending
        if (!orchestratorWebSocket.isConnected()) {
            throw new Error('Lost connection to interview service. Please try again.');
        }
        
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
        
        console.log('Loading previous interview...');
        
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
            console.log(`Resumed: ${data.progress}`);
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
    console.log('Opening completed interview in view mode...');
    document.getElementById('interviewSelectionModal').classList.remove('active');
    
    // In a real implementation, this would load the completed interview data
    updateInterviewQuestion("This is a completed interview. You can review the conversation but not add new responses.");
    
    // Disable input controls for view mode
    const inputField = document.getElementById('messageInput');
    const micBtn = document.getElementById('micBtn');
    if (inputField) inputField.disabled = true;
    if (micBtn) micBtn.disabled = true;
    
    console.log('Viewing completed interview - read-only mode');
}

// Session Management
function pauseInterview() {
    console.log('Pausing interview (closing session)...');
    addMessage('Pausing interview...', 'winston');
    
    // Stop any active recording
    if (isRecording) {
        toggleRecording();
    }
    
    // Stop any TTS playback
    if (ttsPlayer) {
        ttsPlayer.stop();
        ttsPlayer.clearQueue();
    }
    
    // Send session close message to orchestrator
    console.log('🔍 DEBUG: Checking connection status:');
    console.log('  - orchestratorWebSocket exists:', !!orchestratorWebSocket);
    console.log('  - isConnected():', orchestratorWebSocket?.isConnected());
    console.log('  - isInterviewActive:', isInterviewActive);
    
    if (orchestratorWebSocket && orchestratorWebSocket.isConnected() && isInterviewActive) {
        // Set up one-time event listener for session closed
        const handleSessionClosed = (data) => {
            console.log('✅ handleSessionClosed called with data:', data);
            addMessage('Interview paused. Your progress has been saved.', 'winston');
            
            // Clear the timeout since we got a response
            if (handleSessionClosed.timeoutId) {
                clearTimeout(handleSessionClosed.timeoutId);
            }
            
            // Remove the listener after handling
            orchestratorWebSocket.off('sessionClosed', handleSessionClosed);
            
            // Complete the pause process
            setTimeout(() => completeInterviewPause(), 2000);
        };
        
        console.log('🔍 DEBUG: Setting up sessionClosed event listener');
        
        // Register the event listener BEFORE sending the message
        orchestratorWebSocket.on('sessionClosed', handleSessionClosed);
        
        // Send the close session message
        const success = orchestratorWebSocket.closeSession('User paused interview');
        
        if (!success) {
            console.warn('Failed to send close session message');
            orchestratorWebSocket.off('sessionClosed', handleSessionClosed);
            addMessage('Failed to close session. Proceeding with cleanup.', 'winston');
            setTimeout(() => completeInterviewPause(), 2000);
        } else {
            // Set a timeout in case we don't get a response
            const timeoutId = setTimeout(() => {
                if (orchestratorWebSocket.pendingSessionClosure) {
                    console.warn('Session close timeout - proceeding anyway');
                    orchestratorWebSocket.off('sessionClosed', handleSessionClosed);
                    addMessage('Session closed locally. Proceeding with cleanup.', 'winston');
                    setTimeout(() => completeInterviewPause(), 2000);
                }
            }, 5000); // Wait 5 seconds for response
            
            // Store timeout ID so we can clear it if we get a response
            handleSessionClosed.timeoutId = timeoutId;
        }
    } else {
        console.log('No active session to close');
        addMessage('No active session. Cleaning up locally.', 'winston');
        setTimeout(() => completeInterviewPause(), 1500);
    }
}

// Helper function to complete the interview pause process
function completeInterviewPause() {
    console.log('Completing interview pause...');
    
    // Mark interview as inactive
    isInterviewActive = false;
    currentInterviewId = null;
    currentSessionId = null;
    
    // Disconnect audio WebSocket
    if (audioWebSocket) {
        audioWebSocket.disconnect();
        audioWebSocket = null;
    }
    
    // Stop idea clouds
    if (cloudInterval) {
        clearInterval(cloudInterval);
        cloudInterval = null;
    }
    
    // Clear idea clouds from UI
    const banner = document.getElementById('ideaClouds');
    if (banner) {
        banner.innerHTML = '';
    }
    activeClouds = [];
    
    // Reset Winston state
    setWinstonState('idle');
    
    // Show prominent session closed message with countdown
    addMessage('<strong style="font-size: 1.2em;">Session is Closed.</strong>', 'winston');
    
    // Countdown to dashboard
    let countdown = 5;
    const countdownInterval = setInterval(() => {
        countdown--;
        if (countdown > 0) {
            // Update the last message with countdown
            const messages = document.getElementById('chatMessages');
            const lastMessage = messages.lastElementChild;
            if (lastMessage && lastMessage.querySelector('.message-content')) {
                lastMessage.querySelector('.message-content').innerHTML = 
                    `<strong style="font-size: 1.2em;">Session is Closed. Moving to dashboard in ${countdown} seconds...</strong>`;
            }
        } else {
            clearInterval(countdownInterval);
            window.location.href = '/pages/dashboard.html';
        }
    }, 1000);
    
    // Initial countdown message
    setTimeout(() => {
        const messages = document.getElementById('chatMessages');
        const lastMessage = messages.lastElementChild;
        if (lastMessage && lastMessage.querySelector('.message-content')) {
            lastMessage.querySelector('.message-content').innerHTML = 
                `<strong style="font-size: 1.2em;">Session is Closed. Moving to dashboard in ${countdown} seconds...</strong>`;
        }
    }, 100);
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
            window.location.href = '/pages/dashboard.html';
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
            ttsPlayer.stop();
            ttsPlayer.clearQueue();
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
                window.location.href = '/pages/dashboard.html';
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
window.pauseInterview = pauseInterview;
window.submitForReview = submitForReview;