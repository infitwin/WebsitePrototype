/**
 * Orchestrator WebSocket Service - Vanilla JS Implementation
 * 
 * Ported from ui-studio React hook for WebsitePrototype
 * Implements UI-Orchestrator Guide specifications:
 * - Single /ws endpoint with no path parameters
 * - Message type based routing
 * - Fire-and-forget spans separate from business logic
 */

class OrchestratorWebSocketService {
  constructor(options = {}) {
    this.options = {
      autoReconnect: true,
      reconnectInterval: 5000,
      isDevelopment: false,
      ...options
    };
    
    // State
    this.connected = false;
    this.error = null;
    this.lastMessage = null;
    
    // Internal references
    this.ws = null;
    this.reconnectTimeout = null;
    this.messageHandlers = new Map();
    this.eventHandlers = new Map();
    
    // Interview state
    this.currentInterviewId = null;
    this.currentSessionId = null;
    this.currentUserId = null;      // ADD THIS
    this.currentTwinId = null;      // ADD THIS
    this.currentCorrelationId = null;
    this.wasConnectedBefore = false;
    
    // Session closure tracking
    this.pendingSessionClosure = false;
    
    // Callback properties (similar to React hook pattern)
    this.onInterviewStarted = null;
    this.onQuestionReceived = null;
    this.onAudioChunkRequested = null;
    this.onError = null;
    this.onReconnected = null;
    
    // Set up message handlers
    this.setupMessageHandlers();
    
    // Bind methods
    this.connect = this.connect.bind(this);
    this.disconnect = this.disconnect.bind(this);
    this.sendMessage = this.sendMessage.bind(this);
    this.on = this.on.bind(this);
    this.off = this.off.bind(this);
    this.startInterview = this.startInterview.bind(this);
    this.sendHeartbeat = this.sendHeartbeat.bind(this);
  }

  /**
   * Set up default message handlers
   */
  setupMessageHandlers() {
    // Handle InterviewStarted
    this.messageHandlers.set('InterviewStarted', (parsedMessage, rawMessage) => {
      console.log('InterviewStarted handler called with:', parsedMessage);
      
      // Extract IDs from the parsed message (which includes flattened payload data)
      this.currentInterviewId = parsedMessage.interviewId;
      this.currentSessionId = parsedMessage.sessionId || parsedMessage.sessionDetails?.sessionId;
      this.currentUserId = parsedMessage.userId;      // ADD THIS
      this.currentTwinId = parsedMessage.twinId;      // ADD THIS
      this.currentCorrelationId = parsedMessage.correlationId;
      
      console.log('Interview IDs set:', {
        interviewId: this.currentInterviewId,
        sessionId: this.currentSessionId,
        userId: this.currentUserId,
        twinId: this.currentTwinId,
        correlationId: this.currentCorrelationId
      });
      
      // Request initial graph data for interview
      this.requestInterviewGraphData();
      
      if (this.onInterviewStarted) {
        this.onInterviewStarted(parsedMessage);
      }
    });
    
    // Handle SendQuestion (AI responses from orchestrator)
    this.messageHandlers.set('SendQuestion', (parsedMessage) => {
      console.log('SendQuestion received:', parsedMessage);
      if (this.onQuestionReceived) {
        this.onQuestionReceived(parsedMessage);
      }
    });
    
    // Handle AIResponse (alternative message type for AI responses)
    this.messageHandlers.set('AIResponse', (parsedMessage) => {
      console.log('AIResponse received:', parsedMessage);
      if (this.onQuestionReceived) {
        this.onQuestionReceived(parsedMessage);
      }
    });
    
    // Handle ReturnAudioChunks
    this.messageHandlers.set('ReturnAudioChunks', (parsedMessage) => {
      if (this.onAudioChunkRequested) {
        this.onAudioChunkRequested(parsedMessage);
      }
    });
    
    // Handle ForwardTranscript from AudioProcessingService
    this.messageHandlers.set('ForwardTranscript', (parsedMessage) => {
      console.log('ForwardTranscript received from AudioProcessingService:', parsedMessage);
      
      // Extract transcript data
      const transcript = parsedMessage.payload?.content?.transcript;
      if (transcript && transcript.text) {
        // The orchestrator will process this and send back AI response
        console.log('User transcript being processed by orchestrator:', transcript.text);
        
        // Note: The orchestrator backend should send the transcript back to UI
        // for display after recording it in SessionManager
      }
    });
    
    // Handle TranscriptionResult
    this.messageHandlers.set('TranscriptionResult', (parsedMessage) => {
      console.log('Transcription received:', parsedMessage);
      if (this.onTranscriptionReceived) {
        this.onTranscriptionReceived(parsedMessage);
      }
    });
    
    // Handle SendMessage responses (AI-generated responses from IDIS)
    this.messageHandlers.set('MessageSaved', (parsedMessage) => {
      console.log('Message saved confirmation received:', parsedMessage);
      // This confirms the transcript was processed by the backend
    });
    
    // Handle errors from message processing
    this.messageHandlers.set('ProcessingError', (parsedMessage) => {
      console.error('Message processing error:', parsedMessage);
      if (this.onError) {
        this.onError(new Error(`Processing error: ${parsedMessage.error || 'Unknown error'}`));
      }
    });
    
    // Handle connection confirmation from orchestrator
    this.messageHandlers.set('connection', (parsedMessage) => {
      console.log('Orchestrator connection confirmed:', parsedMessage);
      // Connection acknowledgment from orchestrator
    });
    
    // Handle initial graph data
    this.messageHandlers.set('GraphDataResponse', (parsedMessage) => {
      console.log('Graph data received:', parsedMessage);
      if (window.updateInterviewGraph) {
        window.updateInterviewGraph(parsedMessage.data);
      }
    });

    // Handle real-time graph updates
    this.messageHandlers.set('GraphUpdate', (parsedMessage) => {
      console.log('Graph update received:', parsedMessage);
      if (window.addInterviewGraphData) {
        window.addInterviewGraphData(parsedMessage.data);
      }
    });
    
    // Handle state update responses
    this.messageHandlers.set('state_updated', (parsedMessage) => {
      console.log('🔍 DEBUG: state_updated message received:', parsedMessage);
      console.log('🔍 DEBUG: parsedMessage.data:', parsedMessage.data);
      
      const newState = parsedMessage.data?.state;
      const success = parsedMessage.data?.success;
      
      console.log('🔍 DEBUG: newState:', newState, 'success:', success);
      
      if (newState === 'closed' && success) {
        console.log('✅ Session closed successfully, emitting event');
        
        // Always emit the event, regardless of callback
        this.emit('sessionClosed', { success: true, state: newState });
        
        // Also call callback if it exists
        if (this.onSessionClosed) {
          this.onSessionClosed({ success: true });
        }
        
        // Clear the pending flag
        this.pendingSessionClosure = false;
      } else {
        console.log('⚠️ State update received but not a successful close:', newState, success);
      }
    });
    
    // Handle any other message types
    this.messageHandlers.set('default', (parsedMessage, rawMessage) => {
      console.log('Unhandled message type:', rawMessage.type, parsedMessage);
    });
  }

  /**
   * Connect to the Orchestrator WebSocket
   */
  connect() {
    if (this.ws?.readyState === WebSocket.OPEN || 
        this.ws?.readyState === WebSocket.CONNECTING) {
      return;
    }

    const wsUrl = getBusinessWebSocketUrl(this.options.isDevelopment);
    
    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = (event) => {
        console.log('Connected to Orchestrator');
        const isReconnection = this.wasConnectedBefore;
        this.connected = true;
        this.error = null;
        this.wasConnectedBefore = true;
        this.emit('connected', event);
        
        // Call onReconnected callback if this is a reconnection
        if (isReconnection && this.onReconnected) {
          this.onReconnected();
        }
        
        // Fire telemetry (safe fallback)
        this.logTelemetry('Orchestrator_Connected', { url: wsUrl });
      };

      this.ws.onmessage = (event) => {
        try {
          const rawMessage = JSON.parse(event.data);
          this.lastMessage = rawMessage;
          
          console.log('📨 WebSocket message received:', rawMessage.type, rawMessage);
          
          // Parse the message for easier access
          const parsedMessage = this.parseMessage(rawMessage);
          
          // Fire receive spans based on message type (safe fallback)
          this.fireReceiveSpan(rawMessage.type, parsedMessage);
          
          // Emit raw message event
          this.emit('message', rawMessage);
          
          // Call registered handler with both raw and parsed message
          let handler = this.messageHandlers.get(rawMessage.type);
          if (!handler) {
            console.log('⚠️ No handler for message type:', rawMessage.type);
            // Use default handler for unknown message types
            handler = this.messageHandlers.get('default');
          }
          
          if (handler) {
            try {
              console.log('🔄 Calling handler for:', rawMessage.type);
              handler(parsedMessage, rawMessage);
            } catch (error) {
              console.error(`Handler error for ${rawMessage.type}:`, error);
              this.logTelemetry('Message_Handler_Error', {
                messageType: rawMessage.type,
                error: error.message
              });
            }
          }
          
        } catch (err) {
          console.error('Failed to parse message:', err);
          this.emit('error', { type: 'parse', error: err, data: event.data });
        }
      };

      this.ws.onerror = (event) => {
        console.error('WebSocket error:', event);
        this.error = 'Connection error';
        this.emit('error', { type: 'connection', error: event });
        
        // Call onError callback
        if (this.onError) {
          this.onError(new Error('WebSocket connection error'));
        }
        
        this.logTelemetry('Orchestrator_Error', { error: 'Connection error' });
      };

      this.ws.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason);
        this.connected = false;
        this.emit('disconnected', { code: event.code, reason: event.reason });
        
        // Fire disconnection span
        this.logTelemetry('Orchestrator_Disconnected', { 
          code: event.code, 
          reason: event.reason 
        });
        
        // Auto-reconnect after 5 seconds if not a normal closure
        if (this.options.autoReconnect && event.code !== 1000) {
          this.reconnectTimeout = setTimeout(() => {
            console.log('Attempting to reconnect...');
            this.connect();
          }, this.options.reconnectInterval);
        }
      };
      
    } catch (err) {
      console.error('Failed to create WebSocket:', err);
      this.error = err.message;
      this.emit('error', { type: 'creation', error: err });
    }
  }

  /**
   * Disconnect from the Orchestrator
   */
  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    
    this.connected = false;
    this.error = null;
  }

  /**
   * Send a message to the Orchestrator
   */
  sendMessage(messageType, payload) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('WebSocket not connected');
      return false;
    }

    try {
      const message = {
        type: messageType,
        payload: payload
      };

      // Fire span for sending (safe fallback)
      this.fireSendSpan(messageType, payload);

      this.ws.send(JSON.stringify(message));
      this.emit('messageSent', { type: messageType, payload });
      
      return true;
    } catch (err) {
      console.error('Failed to send message:', err);
      this.emit('error', { type: 'send', error: err, messageType });
      return false;
    }
  }

  /**
   * Register a message handler for a specific message type
   */
  on(event, handler) {
    if (event.startsWith('message:')) {
      const messageType = event.slice(8);
      this.messageHandlers.set(messageType, handler);
    } else {
      if (!this.eventHandlers.has(event)) {
        this.eventHandlers.set(event, []);
      }
      this.eventHandlers.get(event).push(handler);
    }
  }

  /**
   * Remove a handler
   */
  off(event, handler) {
    if (event.startsWith('message:')) {
      const messageType = event.slice(8);
      this.messageHandlers.delete(messageType);
    } else {
      const handlers = this.eventHandlers.get(event) || [];
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Start an interview with proper message structure
   */
  startInterview(params) {
    // Fire start button click span (safe fallback)
    this.logTelemetry('Start_Button_Click', {
      userId: params.userId,
      twinId: params.twinId
    });
    
    // Use EXACT format from websocket-messages.md documentation
    const correlationId = params.correlationId || `corr-${Date.now()}`;
    const timestamp = new Date().toISOString();
    const instanceId = 'browser-session-' + Math.random().toString(36).substr(2, 9);
    
    const message = {
      messageId: `msg-${Date.now()}`,
      type: 'StartInterview',
      timestamp: timestamp,
      source: {
        service: 'UI',
        instanceId: instanceId
      },
      target: {
        service: 'Orchestrator'
      },
      payload: {
        metadata: {
          requestId: `req-${Date.now()}`,
          interviewId: 'pending****',
          sessionId: 'pending****',
          correlationId: correlationId,
          userId: params.userId,
          twinId: params.twinId,
          timestamp: timestamp,
          senderTarget: 'UI',
          recipientTarget: 'Orchestrator'
        },
        interviewData: {
          interviewStage: 'openInterview',
          interviewType: params.interviewType || 'personal-history'
        },
        content: {
          action: 'start',
          preferences: {
            language: 'en-US',
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
          }
        }
      }
    };
    
    console.log('Sending StartInterview message (following websocket-messages.md):', message);
    
    try {
      this.ws.send(JSON.stringify(message));
      
      this.logTelemetry('Start_Interview_Send', {
        correlationId: correlationId,
        userId: params.userId,
        twinId: params.twinId
      });
      
      return true;
    } catch (error) {
      console.error('Failed to send StartInterview message:', error);
      return false;
    }
  }

  /**
   * Send heartbeat
   */
  sendHeartbeat() {
    const message = {
      type: 'Heartbeat',
      timestamp: new Date().toISOString()
    };
    return this.sendMessage(message.type, message);
  }

  // Private methods

  /**
   * Emit events to registered handlers
   */
  emit(event, data) {
    const handlers = this.eventHandlers.get(event) || [];
    handlers.forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        console.error(`Event handler error for ${event}:`, error);
      }
    });
  }

  /**
   * Fire send span telemetry (safe fallback)
   */
  fireSendSpan(messageType, payload) {
    try {
      if (messageType === 'StartInterview') {
        this.logTelemetry('Start_Interview_Send', {
          interviewId: payload?.metadata?.interviewId,
          correlationId: payload?.metadata?.correlationId,
          userId: payload?.metadata?.userId,
          twinId: payload?.metadata?.twinId
        });
      }
    } catch (error) {
      // Silent failure - telemetry should never break functionality
    }
  }

  /**
   * Fire receive span telemetry (safe fallback)
   */
  fireReceiveSpan(messageType, parsedMessage) {
    try {
      switch (messageType) {
        case 'InterviewStarted':
          this.logTelemetry('Receive_Interview_Started', {
            interviewId: parsedMessage.interviewId,
            sessionId: parsedMessage.sessionId,
            correlationId: parsedMessage.correlationId
          });
          break;
          
        case 'SendQuestion':
          this.logTelemetry('Receive_Question_Text', {
            interviewId: parsedMessage.interviewId,
            correlationId: parsedMessage.correlationId
          });
          break;
          
        case 'ReturnAudioChunks':
          this.logTelemetry('Receive_Audio_Chunks', {
            interviewId: parsedMessage.interviewId,
            correlationId: parsedMessage.correlationId
          });
          break;
      }
    } catch (error) {
      // Silent failure - telemetry should never break functionality
    }
  }

  /**
   * Safe telemetry logging - never throws
   */
  logTelemetry(action, data = {}) {
    try {
      console.log(`[Orchestrator Telemetry] ${action}:`, data);
      
      // Future: Replace with actual telemetry service
      // if (window.telemetryHelper) {
      //   window.telemetryHelper.trackUserAction(action, data);
      // }
    } catch (error) {
      // Silent failure - telemetry should never break functionality
    }
  }

  /**
   * Send audio chunk to orchestrator for processing
   */
  sendAudioChunk(audioChunk) {
    if (!this.isConnected()) {
      console.warn('Cannot send audio chunk: WebSocket not connected');
      return false;
    }

    if (!this.currentInterviewId) {
      console.warn('Cannot send audio chunk: No active interview');
      return false;
    }

    try {
      // For now, skip the message builder and create the message directly
      // since we're dealing with base64 strings, not ArrayBuffers
      const message = {
        type: 'SendAudioChunk',
        payload: {
          metadata: {
            interviewId: this.currentInterviewId,
            sessionId: this.currentInterviewId,
            correlationId: this.currentCorrelationId,
            chunkIndex: audioChunk.chunkNumber,
            timestamp: new Date().toISOString(),
            isFirstChunk: audioChunk.chunkNumber === 1,
            isLastChunk: false
          },
          data: {
            audioData: audioChunk.audio, // Base64 string
            audioConfig: audioChunk.chunkNumber === 1 ? {
              sampleRate: 16000,
              channels: 1,
              encoding: 'webm-opus', // Based on the mimeType from recorder
              languageCode: 'en-US'
            } : null,
            chunkMetadata: {
              size: audioChunk.size,
              mimeType: audioChunk.mimeType,
              duration: null
            }
          }
        }
      };

      this.sendMessage(message.type, message.payload);
      
      this.logTelemetry('Send_Audio_Chunk', {
        interviewId: this.currentInterviewId,
        chunkNumber: audioChunk.chunkNumber,
        size: audioChunk.size
      });
      
      return true;
      
    } catch (error) {
      console.error('Failed to send audio chunk:', error);
      this.emit('error', { type: 'send_audio_chunk', error });
      return false;
    }
  }

  // Convenience methods

  isConnected() {
    return this.connected && this.ws?.readyState === WebSocket.OPEN;
  }

  getConnectionState() {
    if (!this.ws) return 'disconnected';
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING: return 'connecting';
      case WebSocket.OPEN: return 'connected';
      case WebSocket.CLOSING: return 'closing';
      case WebSocket.CLOSED: return 'disconnected';
      default: return 'unknown';
    }
  }

  getLastMessage() {
    return this.lastMessage;
  }

  getError() {
    return this.error;
  }

  /**
   * Parse orchestrator message to extract common fields
   */
  parseMessage(rawMessage) {
    if (!rawMessage || typeof rawMessage !== 'object') {
      return rawMessage;
    }
    
    // Extract common fields from various message formats
    const parsed = {
      type: rawMessage.type,
      timestamp: rawMessage.timestamp,
      ...rawMessage
    };
    
    // Extract nested payload data if present
    if (rawMessage.payload) {
      // Extract metadata fields
      if (rawMessage.payload.metadata) {
        parsed.interviewId = rawMessage.payload.metadata.interviewId;
        parsed.sessionId = rawMessage.payload.metadata.sessionId;
        parsed.correlationId = rawMessage.payload.metadata.correlationId;
        parsed.userId = rawMessage.payload.metadata.userId;
        parsed.twinId = rawMessage.payload.metadata.twinId;
      }
      
      // Extract content fields
      if (rawMessage.payload.content) {
        Object.assign(parsed, rawMessage.payload.content);
      }
      
      // Extract other payload fields
      Object.keys(rawMessage.payload).forEach(key => {
        if (key !== 'metadata' && key !== 'content' && !(key in parsed)) {
          parsed[key] = rawMessage.payload[key];
        }
      });
    }
    
    return parsed;
  }

  /**
   * Request graph data with flexible scope
   */
  requestGraphData(scope = 'interview') {
    if (!this.currentUserId || !this.currentTwinId) {
      console.error('Missing required IDs for graph data request', {
        currentUserId: this.currentUserId,
        currentTwinId: this.currentTwinId
      });
      throw new Error('Cannot request graph data - missing userId or twinId. Authentication may be broken.');
    }
    
    // Build filter based on scope
    const filter = {
      userId: this.currentUserId,
      twinId: this.currentTwinId
    };
    
    // Only add interviewId filter for interview scope
    if (scope === 'interview' && this.currentInterviewId) {
      filter.interviewId = this.currentInterviewId;
    }
    
    const message = {
      type: 'RequestGraphData',
      payload: {
        metadata: {
          userId: this.currentUserId,
          twinId: this.currentTwinId,
          interviewId: this.currentInterviewId || null,
          correlationId: generateCorrelationId(),
          timestamp: new Date().toISOString()
        },
        data: {
          scope: scope, // 'interview' or 'all'
          filter: filter
        }
      }
    };
    
    try {
      this.ws.send(JSON.stringify(message));
      console.log(`Sent RequestGraphData (${scope}):`, message);
      return true;
    } catch (error) {
      console.error('Failed to send graph data request:', error);
      return false;
    }
  }

  /**
   * Convenience method for requesting interview-specific graph data
   */
  requestInterviewGraphData() {
    return this.requestGraphData('interview');
  }

  /**
   * Convenience method for requesting all graph data
   */
  requestAllGraphData() {
    return this.requestGraphData('all');
  }

  /**
   * Send state update message to orchestrator
   * @param {string} state - State to update to ('pause', 'resume', 'close')
   * @param {string} reason - Optional reason (only used for 'close')
   * @returns {boolean} Success status
   */
  sendStateUpdate(state, reason = null) {
    if (!this.isConnected()) {
      console.warn(`Cannot send state update '${state}': WebSocket not connected`);
      return false;
    }

    try {
      const message = {
        type: 'state_update',
        data: {
          state: state
        }
      };
      
      if (reason && state === 'close') {
        message.data.reason = reason;
      }
      
      console.log(`Sending state update: ${state}`, message);
      console.log('🔍 DEBUG: WebSocket readyState:', this.ws.readyState);
      console.log('🔍 DEBUG: Message being sent:', JSON.stringify(message));
      
      this.ws.send(JSON.stringify(message));
      console.log('🔍 DEBUG: Message sent successfully');
      
      return true;
    } catch (error) {
      console.error(`Failed to send state update '${state}':`, error);
      return false;
    }
  }

  /**
   * Close the current session
   * @param {string} reason - Optional reason for closing
   * @returns {boolean} Success status
   */
  closeSession(reason = 'User requested close') {
    this.pendingSessionClosure = true;
    return this.sendStateUpdate('close', reason);
  }

  /**
   * Send user text message to orchestrator
   */
  sendUserTextMessage(text) {
    if (!this.isConnected()) {
      console.error('Cannot send text message: Not connected');
      return false;
    }
    
    if (!this.currentInterviewId) {
      console.error('Cannot send text message: No active interview');
      throw new Error('No active interview - currentInterviewId is null');
    }
    
    if (!this.currentUserId || !this.currentTwinId) {
      console.error('Cannot send text message: Missing user/twin IDs', {
        currentUserId: this.currentUserId,
        currentTwinId: this.currentTwinId
      });
      throw new Error('Missing required IDs - authentication may be broken');
    }
    
    // Follow the ForwardTranscript pattern from websocket-messages.md
    const timestamp = new Date().toISOString();
    const message = {
      messageId: `ui-text-${Date.now()}`,
      type: 'ForwardTranscript',
      timestamp: timestamp,
      source: {
        service: 'UI',
        instanceId: 'browser-session-' + Math.random().toString(36).substr(2, 9)
      },
      target: {
        service: 'Orchestrator'
      },
      payload: {
        metadata: {
          requestId: `req-${Date.now()}`,
          interviewId: this.currentInterviewId,
          sessionId: this.currentSessionId || this.currentInterviewId,
          turnId: 'pending****',
          userId: this.currentUserId,
          twinId: this.currentTwinId,
          timestamp: timestamp,
          senderTarget: 'UI',
          recipientTarget: 'Orchestrator'
        },
        interviewData: {
          interviewStage: 'onGoing',
          sessionStatus: 'active',
          turnSequence: 1
        },
        content: {
          transcript: {
            text: text,
            confidence: 1.0,
            language: 'en-US',
            duration: 0,
            isFinal: true
          }
        }
      }
    };
    
    try {
      this.ws.send(JSON.stringify(message));
      console.log('Sent ForwardTranscript:', message);
      return true;
    } catch (error) {
      console.error('Failed to send text message:', error);
      return false;
    }
  }
}

// Factory function for easy creation
function createOrchestratorWebSocket(options = {}) {
  return new OrchestratorWebSocketService(options);
}

// Export for use in other modules
window.OrchestratorWebSocketService = OrchestratorWebSocketService;
window.createOrchestratorWebSocket = createOrchestratorWebSocket;