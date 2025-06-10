// js/services/orchestrator-websocket-instrumented.js - OpenTelemetry Instrumented WebSocket
import UITracingService from './ui-tracing-service.js';

/**
 * OpenTelemetry Instrumented Orchestrator WebSocket
 * Extends existing OrchestratorWebSocketService with OpenTelemetry spans
 * Uses fire-and-forget pattern to avoid blocking business logic
 */
class InstrumentedOrchestratorWebSocket {
  constructor(options = {}) {
    this.tracingService = new UITracingService();
    this.options = options;
    
    // Create the underlying WebSocket service
    this.wsService = new window.OrchestratorWebSocketService(options);
    
    // Set up OpenTelemetry instrumentation
    this.setupTracing();
    
    // Proxy all public methods and properties
    this.setupProxy();
  }

  /**
   * Set up OpenTelemetry tracing for WebSocket operations
   */
  setupTracing() {
    // Override the original fireSendSpan method with OpenTelemetry
    const originalFireSendSpan = this.wsService.fireSendSpan.bind(this.wsService);
    this.wsService.fireSendSpan = (messageType, payload) => {
      // Call original method for compatibility
      originalFireSendSpan(messageType, payload);
      
      // Add OpenTelemetry spans
      this.trackSendMessage(messageType, payload);
    };

    // Override the original fireReceiveSpan method with OpenTelemetry
    const originalFireReceiveSpan = this.wsService.fireReceiveSpan.bind(this.wsService);
    this.wsService.fireReceiveSpan = (messageType, parsedMessage) => {
      // Call original method for compatibility
      originalFireReceiveSpan(messageType, parsedMessage);
      
      // Add OpenTelemetry spans
      this.trackReceiveMessage(messageType, parsedMessage);
    };

    // Override startInterview to add UI interaction tracking
    const originalStartInterview = this.wsService.startInterview.bind(this.wsService);
    this.wsService.startInterview = (params) => {
      // Track the UI interaction (WF-001: UI_interaction:StartButton_Clicked)
      this.tracingService.trackStartButtonClick({
        type: params.interviewType || 'unknown',
        userId: params.userId,
        twinId: params.twinId
      });
      
      // Call original method
      return originalStartInterview(params);
    };

    // Override sendAudioChunk to add audio tracking
    const originalSendAudioChunk = this.wsService.sendAudioChunk.bind(this.wsService);
    this.wsService.sendAudioChunk = (audioChunk) => {
      // Track audio chunk send (WF-021: UI_sending_to_AudioProcessingService:SendAudioChunk)
      this.tracingService.trackAudioChunkSend({
        type: 'SendAudioChunk',
        target: { service: 'AudioProcessingService' },
        messageId: `audio-chunk-${audioChunk.chunkNumber}`,
        chunkSize: audioChunk.size,
        format: audioChunk.mimeType,
        payload: {
          metadata: {
            sessionId: this.wsService.currentInterviewId,
            interviewId: this.wsService.currentInterviewId
          }
        }
      });
      
      // Call original method
      return originalSendAudioChunk(audioChunk);
    };
  }

  /**
   * Track sending messages with OpenTelemetry spans
   */
  trackSendMessage(messageType, payload) {
    const messageData = {
      type: messageType,
      target: { service: 'Orchestrator' },
      messageId: `msg-${Date.now()}`,
      payload: { metadata: payload?.metadata || {} }
    };

    switch (messageType) {
      case 'StartInterview':
        // WF-002: UI_sending_to_Orchestrator:StartInterview
        this.tracingService.trackStartInterviewSend(messageData);
        break;
        
      case 'RequestTextToSpeech':
        // WF-044: UI_sending_to_AudioProcessingService:RequestTextToSpeech
        this.tracingService.trackTextToSpeechRequest(messageData);
        break;
        
      default:
        // Generic WebSocket send tracking
        this.tracingService.trackWebSocketSend(`UI_sending_to_Orchestrator:${messageType}`, messageData);
        break;
    }
  }

  /**
   * Track receiving messages with OpenTelemetry spans
   */
  trackReceiveMessage(messageType, parsedMessage) {
    const messageData = {
      type: messageType,
      source: { service: 'Orchestrator' },
      messageId: parsedMessage.messageId || `received-${Date.now()}`,
      payload: { metadata: parsedMessage }
    };

    switch (messageType) {
      case 'InterviewStarted':
        // WF-013: UI_local:ReceiveInterviewStarted
        this.tracingService.trackReceiveInterviewStarted({
          ...messageData,
          status: parsedMessage.status || 'started'
        });
        break;
        
      case 'SendQuestion':
        // WF-043: UI_local:ReceiveQuestionText
        this.tracingService.trackReceiveQuestionText({
          ...messageData,
          questionText: parsedMessage.questionText || '',
          questionType: parsedMessage.questionType || 'unknown'
        });
        break;
        
      case 'ReturnAudioChunks':
        // WF-048: UI_local:ReceiveAudioChunks
        this.tracingService.trackReceiveAudioChunks({
          ...messageData,
          totalChunks: parsedMessage.totalChunks || 0,
          audioFormat: parsedMessage.audioFormat || 'unknown'
        });
        break;
        
      default:
        // Generic WebSocket receive tracking
        this.tracingService.trackWebSocketReceive(`UI_local:Receive${messageType}`, messageData);
        break;
    }
  }

  /**
   * Track UI interactions beyond WebSocket messages
   */
  trackUIInteraction(componentName, action, attributes = {}) {
    this.tracingService.trackUIInteraction(componentName, action, attributes);
  }

  /**
   * Track page navigation
   */
  trackPageNavigation(fromPage, toPage, method = 'click') {
    this.tracingService.trackPageNavigation(fromPage, toPage, method);
  }

  /**
   * Track form submissions
   */
  trackFormSubmission(formName, formData = {}) {
    this.tracingService.trackFormSubmission(formName, formData);
  }

  /**
   * Track file uploads
   */
  trackFileUpload(fileName, fileSize, fileType) {
    this.tracingService.trackFileUpload(fileName, fileSize, fileType);
  }

  /**
   * Set up proxy to forward all calls to underlying WebSocket service
   */
  setupProxy() {
    // Proxy all methods and properties
    return new Proxy(this, {
      get(target, prop) {
        // If the property exists on the target, return it
        if (prop in target) {
          return target[prop];
        }
        
        // Otherwise, proxy to the underlying WebSocket service
        const value = target.wsService[prop];
        
        // If it's a function, bind it to the WebSocket service
        if (typeof value === 'function') {
          return value.bind(target.wsService);
        }
        
        return value;
      },
      
      set(target, prop, value) {
        // If setting a property that exists on target, set it there
        if (prop in target || prop.startsWith('_') || prop === 'wsService') {
          target[prop] = value;
          return true;
        }
        
        // Otherwise, set it on the underlying service
        target.wsService[prop] = value;
        return true;
      }
    });
  }
}

/**
 * Factory function to create instrumented WebSocket
 */
function createInstrumentedOrchestratorWebSocket(options = {}) {
  return new InstrumentedOrchestratorWebSocket(options);
}

// Export for use in other modules
window.InstrumentedOrchestratorWebSocket = InstrumentedOrchestratorWebSocket;
window.createInstrumentedOrchestratorWebSocket = createInstrumentedOrchestratorWebSocket;

export { InstrumentedOrchestratorWebSocket, createInstrumentedOrchestratorWebSocket };
export default InstrumentedOrchestratorWebSocket;