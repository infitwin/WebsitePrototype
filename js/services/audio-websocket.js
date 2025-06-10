/**
 * Audio WebSocket Service for direct audio streaming
 * Connects to AudioProcessingService for speech-to-text
 * Based on websocket-messages.md architecture
 */

class AudioWebSocketService {
  constructor(options = {}) {
    this.options = {
      autoReconnect: true,
      reconnectInterval: 5000,
      isDevelopment: false,
      ...options
    };
    
    // State
    this.connected = false;
    this.ws = null;
    this.reconnectTimeout = null;
    this.currentSessionId = null;
    this.currentInterviewId = null;
    
    // Callbacks
    this.onTranscriptReceived = null;
    this.onError = null;
    this.onConnected = null;
    this.onDisconnected = null;
  }

  /**
   * Connect to the Audio Processing Service
   */
  connect(sessionId, interviewId) {
    if (this.ws?.readyState === WebSocket.OPEN || 
        this.ws?.readyState === WebSocket.CONNECTING) {
      return;
    }

    this.currentSessionId = sessionId;
    this.currentInterviewId = interviewId;
    
    const wsUrl = getAudioWebSocketUrl(this.options.isDevelopment);
    
    try {
      console.log('Connecting to Audio WebSocket:', wsUrl);
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = (event) => {
        console.log('Connected to Audio Processing Service');
        this.connected = true;
        
        // Send initial configuration message
        this.sendInitialConfig();
        
        if (this.onConnected) {
          this.onConnected();
        }
      };

      this.ws.onmessage = (event) => {
        try {
          // Check if it's a binary message
          if (event.data instanceof Blob) {
            // Handle binary audio response
            this.handleBinaryMessage(event.data);
          } else {
            // Handle JSON message
            const message = JSON.parse(event.data);
            this.handleMessage(message);
          }
        } catch (err) {
          this.logger.error('Failed to process audio message:', err);
          if (this.onError) {
            this.onError(err);
          }
        }
      };

      this.ws.onerror = (event) => {
        this.logger.error('Audio WebSocket error:', event);
        if (this.onError) {
          this.onError(new Error('Audio WebSocket connection error'));
        }
      };

      this.ws.onclose = (event) => {
        console.log('Audio WebSocket closed:', event.code, event.reason);
        this.connected = false;
        
        if (this.onDisconnected) {
          this.onDisconnected();
        }
        
        // Auto-reconnect if not a normal closure
        if (this.options.autoReconnect && event.code !== 1000) {
          this.reconnectTimeout = setTimeout(() => {
            console.log('Attempting to reconnect audio WebSocket...');
            this.connect(this.currentSessionId, this.currentInterviewId);
          }, this.options.reconnectInterval);
        }
      };
      
    } catch (err) {
      this.logger.error('Failed to create Audio WebSocket:', err);
      if (this.onError) {
        this.onError(err);
      }
    }
  }

  /**
   * Send initial configuration for audio processing
   */
  sendInitialConfig() {
    // Validate that we have proper session info before sending config
    if (!this.currentSessionId || this.currentSessionId === 'pending****') {
      console.warn('⚠️ Audio config delayed - waiting for valid session ID');
      // Try again in 1 second
      setTimeout(() => this.sendInitialConfig(), 1000);
      return;
    }

    const configMessage = {
      messageId: `ui-audio-config-${Date.now()}`,
      type: 'AudioConfig',
      timestamp: new Date().toISOString(),
      source: {
        service: 'UI',
        instanceId: 'browser-session-' + Math.random().toString(36).substr(2, 9)
      },
      target: {
        service: 'AudioProcessingService'
      },
      payload: {
        sessionId: this.currentSessionId,
        interviewId: this.currentInterviewId,
        turnId: 'pending****',
        audioConfig: {
          sampleRate: 16000,
          encoding: 'LINEAR16',
          language: 'en-US',
          channels: 1,
          bitsPerSample: 16
        },
        processingMode: 'speech-to-text'
      }
    };

    this.send(configMessage);
    console.log('📤 Sent audio configuration with session:', this.currentSessionId);
    console.log('Config details:', configMessage);
  }

  /**
   * Send audio chunk to the service
   */
  sendAudioChunk(audioData, chunkIndex, isFinal = false) {
    if (!this.isConnected()) {
      console.warn('Cannot send audio chunk: Audio WebSocket not connected');
      return false;
    }

    try {
      // Create header for binary message
      const header = {
        chunkIndex: chunkIndex,
        sessionId: this.currentSessionId,
        turnId: 'pending****',
        timestamp: new Date().toISOString(),
        isFinal: isFinal
      };

      // Pad header to 200 bytes
      const headerStr = JSON.stringify(header).padEnd(200, ' ');
      
      // Convert audio data to Uint8Array
      let binaryData;
      if (typeof audioData === 'string') {
        // Base64 string - convert to binary
        const binaryString = atob(audioData);
        binaryData = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          binaryData[i] = binaryString.charCodeAt(i);
        }
      } else if (audioData instanceof ArrayBuffer) {
        // ArrayBuffer - convert to Uint8Array
        binaryData = new Uint8Array(audioData);
      } else if (audioData instanceof Uint8Array) {
        // Already Uint8Array
        binaryData = audioData;
      } else {
        throw new Error('Unsupported audio data type: ' + typeof audioData);
      }

      // Combine header and audio data
      const headerBytes = new TextEncoder().encode(headerStr);
      
      // Validate sizes before combining
      console.log(`Audio chunk ${chunkIndex}: header=${headerBytes.length}bytes, audio=${binaryData.length}bytes`);
      
      const combinedData = new Uint8Array(headerBytes.length + binaryData.length);
      
      try {
        combinedData.set(headerBytes, 0);
        combinedData.set(binaryData, headerBytes.length);
      } catch (error) {
        console.error('Buffer combination error:', {
          headerLength: headerBytes.length,
          audioLength: binaryData.length,
          combinedLength: combinedData.length,
          error
        });
        throw error;
      }

      // Send as binary frame
      this.ws.send(combinedData);
      
      console.log(`Sent audio chunk ${chunkIndex} (${binaryData.length} bytes)`);
      return true;
      
    } catch (error) {
      console.error('Failed to send audio chunk:', error);
      if (this.onError) {
        this.onError(error);
      }
      return false;
    }
  }

  /**
   * Handle incoming messages
   */
  handleMessage(message) {
    console.log('Audio service message:', message.type, message);
    
    // Handle different message types
    switch (message.type) {
      case 'ConnectionEstablished':
        console.log('Audio service connection confirmed');
        break;
        
      case 'AudioChunkReceived':
        console.log('Audio chunk acknowledged:', message.payload);
        break;
        
      case 'AudioChunkProcessed':
        // Handle accumulating status and successful processing
        const status = message.payload?.status;
        if (status === 'accumulating') {
          console.log('Audio chunk accumulating for recognition');
        } else {
          console.log('Audio chunk processed:', message.payload);
        }
        break;
        
      case 'TranscriptionResult':
      case 'ForwardTranscript':
        console.log('TranscriptionResult received:', message);
        if (this.onTranscriptReceived) {
          const transcript = message.payload?.content?.transcript || message.payload?.transcript;
          console.log('Extracted transcript:', transcript);
          if (transcript) {
            this.onTranscriptReceived({
              text: transcript.text || transcript,
              confidence: transcript.confidence,
              isFinal: transcript.isFinal !== false,
              timestamp: message.timestamp
            });
          } else {
            console.warn('No transcript found in message:', message);
          }
        }
        break;
        
      case 'TranscriptionProgress':
        // Interim transcription results
        if (this.onTranscriptReceived && message.payload?.partialTranscript) {
          this.onTranscriptReceived({
            text: message.payload.partialTranscript,
            confidence: message.payload.confidence || 0,
            isFinal: false,
            timestamp: message.timestamp
          });
        }
        break;
        
      case 'Error':
      case 'AudioProcessingError':
        console.error('Audio service error - full payload:', JSON.stringify(message.payload, null, 2));
        // Extract error details
        const errorMessage = message.payload?.error?.message || 
                            message.payload?.message || 
                            message.payload?.description ||
                            'Audio processing error';
        const errorCode = message.payload?.error?.code || 
                         message.payload?.code ||
                         'UNKNOWN_ERROR';
        
        console.error(`🔴 Audio Error [${errorCode}]: ${errorMessage}`);
        
        // Don't call onError callback for every error to avoid spam
        // Only call for severe errors
        if (errorCode !== 'SPEECH_NOT_DETECTED' && this.onError) {
          this.onError(new Error(`${errorCode}: ${errorMessage}`));
        }
        break;
        
      default:
        console.log('Unhandled audio message type:', message.type);
    }
  }

  /**
   * Handle binary messages (future: audio responses)
   */
  handleBinaryMessage(blob) {
    // For now, just log
    console.log('Received binary message from audio service:', blob.size, 'bytes');
  }

  /**
   * Send a JSON message
   */
  send(message) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('Audio WebSocket not connected');
      return false;
    }

    try {
      this.ws.send(JSON.stringify(message));
      return true;
    } catch (err) {
      console.error('Failed to send audio message:', err);
      return false;
    }
  }

  /**
   * Disconnect from the service
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
  }

  isConnected() {
    return this.connected && this.ws?.readyState === WebSocket.OPEN;
  }
}

// Export for use
window.AudioWebSocketService = AudioWebSocketService;