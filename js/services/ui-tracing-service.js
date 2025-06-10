// js/services/ui-tracing-service.js - UI Interaction Spans for WebsitePrototype
import { trace, context } from '@opentelemetry/api';

/**
 * UI Tracing Service for WebsitePrototype
 * Implements span naming conventions from otel-spans-dual-websocket.md
 * Uses fire-and-forget pattern to avoid blocking UI interactions
 */
class UITracingService {
  constructor() {
    this.tracer = trace.getTracer('website-prototype-ui', '1.0.0');
    this.serviceName = 'website-prototype';
  }

  /**
   * WF-001: UI_interaction:StartButton_Clicked
   * Track user click events for interview start
   */
  trackStartButtonClick(interviewData = {}) {
    return this.createInteractionSpan('UI_interaction:StartButton_Clicked', {
      'ui.component': 'StartButton',
      'ui.action': 'Clicked',
      'interview.type': interviewData.type || 'unknown',
      'user.id': interviewData.userId || 'anonymous',
      'twin.id': interviewData.twinId || 'unknown',
      'page.url': window.location.pathname,
      'timestamp': new Date().toISOString()
    });
  }

  /**
   * WF-020: UI_interaction:RecordButton_Pressed
   * Track recording initiation events
   */
  trackRecordButtonPress(sessionData = {}) {
    return this.createInteractionSpan('UI_interaction:RecordButton_Pressed', {
      'ui.component': 'RecordButton',
      'ui.action': 'Pressed',
      'session.id': sessionData.sessionId || 'unknown',
      'interview.id': sessionData.interviewId || 'unknown',
      'page.url': window.location.pathname,
      'timestamp': new Date().toISOString()
    });
  }

  /**
   * Generic UI interaction tracking
   * For buttons, clicks, form submissions, etc.
   */
  trackUIInteraction(componentName, action, attributes = {}) {
    const spanName = `UI_interaction:${componentName}_${action}`;
    return this.createInteractionSpan(spanName, {
      'ui.component': componentName,
      'ui.action': action,
      'page.url': window.location.pathname,
      'timestamp': new Date().toISOString(),
      ...attributes
    });
  }

  /**
   * WF-002: UI_sending_to_Orchestrator:StartInterview
   * Track WebSocket message sends to Orchestrator
   */
  trackStartInterviewSend(messageData) {
    this.trackWebSocketSend('UI_sending_to_Orchestrator:StartInterview', messageData, {
      'websocket.target': 'Orchestrator',
      'websocket.action': 'StartInterview'
    });
  }

  /**
   * WF-021: UI_sending_to_AudioProcessingService:SendAudioChunk
   * Track audio chunk sends to AudioProcessingService
   */
  trackAudioChunkSend(messageData) {
    this.trackWebSocketSend('UI_sending_to_AudioProcessingService:SendAudioChunk', messageData, {
      'websocket.target': 'AudioProcessingService',
      'websocket.action': 'SendAudioChunk',
      'audio.chunk.size': messageData.chunkSize || 'unknown',
      'audio.format': messageData.format || 'unknown'
    });
  }

  /**
   * WF-044: UI_sending_to_AudioProcessingService:RequestTextToSpeech
   * Track text-to-speech requests
   */
  trackTextToSpeechRequest(messageData) {
    this.trackWebSocketSend('UI_sending_to_AudioProcessingService:RequestTextToSpeech', messageData, {
      'websocket.target': 'AudioProcessingService',
      'websocket.action': 'RequestTextToSpeech',
      'tts.text.length': messageData.text?.length || 0,
      'tts.voice': messageData.voice || 'default'
    });
  }

  /**
   * WF-013: UI_local:ReceiveInterviewStarted
   * Track receiving responses from services
   */
  trackReceiveInterviewStarted(messageData) {
    this.trackWebSocketReceive('UI_local:ReceiveInterviewStarted', messageData, {
      'websocket.source': 'Orchestrator',
      'interview.status': messageData.status || 'unknown'
    });
  }

  /**
   * WF-043: UI_local:ReceiveQuestionText
   * Track receiving question text from Orchestrator
   */
  trackReceiveQuestionText(messageData) {
    this.trackWebSocketReceive('UI_local:ReceiveQuestionText', messageData, {
      'websocket.source': 'Orchestrator',
      'question.length': messageData.questionText?.length || 0,
      'question.type': messageData.questionType || 'unknown'
    });
  }

  /**
   * WF-048: UI_local:ReceiveAudioChunks
   * Track receiving audio chunks from AudioProcessingService
   */
  trackReceiveAudioChunks(messageData) {
    this.trackWebSocketReceive('UI_local:ReceiveAudioChunks', messageData, {
      'websocket.source': 'AudioProcessingService',
      'audio.chunks.count': messageData.totalChunks || 0,
      'audio.format': messageData.audioFormat || 'unknown'
    });
  }

  /**
   * Page navigation tracking
   */
  trackPageNavigation(fromPage, toPage, navigationMethod = 'click') {
    this.createInteractionSpan('UI_interaction:PageNavigation', {
      'ui.component': 'Navigation',
      'ui.action': 'Navigate',
      'navigation.from': fromPage,
      'navigation.to': toPage,
      'navigation.method': navigationMethod,
      'timestamp': new Date().toISOString()
    });
  }

  /**
   * Form submission tracking
   */
  trackFormSubmission(formName, formData = {}) {
    this.createInteractionSpan('UI_interaction:FormSubmission', {
      'ui.component': formName,
      'ui.action': 'Submit',
      'form.fields.count': Object.keys(formData).length,
      'timestamp': new Date().toISOString()
    });
  }

  /**
   * File upload tracking
   */
  trackFileUpload(fileName, fileSize, fileType) {
    this.createInteractionSpan('UI_interaction:FileUpload', {
      'ui.component': 'FileUploader',
      'ui.action': 'Upload',
      'file.name': fileName,
      'file.size': fileSize,
      'file.type': fileType,
      'timestamp': new Date().toISOString()
    });
  }

  /**
   * Fire-and-forget span creation for WebSocket sends
   */
  trackWebSocketSend(spanName, messageData, additionalAttributes = {}) {
    // Use fire-and-forget pattern to avoid blocking UI
    setTimeout(() => {
      try {
        const span = this.tracer.startSpan(spanName, {
          attributes: {
            'websocket.message.type': messageData.type || 'unknown',
            'websocket.target.service': messageData.target?.service || 'unknown',
            'message.id': messageData.messageId || 'unknown',
            'session.id': messageData.payload?.metadata?.sessionId || 'unknown',
            'interview.id': messageData.payload?.metadata?.interviewId || 'unknown',
            'service.name': this.serviceName,
            'span.kind': 'client',
            'timestamp': new Date().toISOString(),
            ...additionalAttributes
          }
        });
        
        // End span immediately for fire-and-forget
        span.end();
      } catch (error) {
        console.warn('Failed to create WebSocket send span:', error);
      }
    }, 0);
  }

  /**
   * Fire-and-forget span creation for WebSocket receives
   */
  trackWebSocketReceive(spanName, messageData, additionalAttributes = {}) {
    // Use fire-and-forget pattern to avoid blocking UI
    setTimeout(() => {
      try {
        const span = this.tracer.startSpan(spanName, {
          attributes: {
            'websocket.message.type': messageData.type || 'unknown',
            'websocket.source.service': messageData.source?.service || 'unknown',
            'message.id': messageData.messageId || 'unknown',
            'session.id': messageData.payload?.metadata?.sessionId || 'unknown',
            'interview.id': messageData.payload?.metadata?.interviewId || 'unknown',
            'service.name': this.serviceName,
            'span.kind': 'server',
            'timestamp': new Date().toISOString(),
            ...additionalAttributes
          }
        });
        
        // End span immediately for fire-and-forget
        span.end();
      } catch (error) {
        console.warn('Failed to create WebSocket receive span:', error);
      }
    }, 0);
  }

  /**
   * Create UI interaction span with proper context
   */
  createInteractionSpan(spanName, attributes = {}) {
    try {
      const span = this.tracer.startSpan(spanName, {
        attributes: {
          'service.name': this.serviceName,
          'span.kind': 'internal',
          ...attributes
        }
      });
      
      // End span immediately for UI interactions (fire-and-forget)
      span.end();
      
      return span;
    } catch (error) {
      console.warn('Failed to create UI interaction span:', error);
      return null;
    }
  }

  /**
   * Create a span with duration tracking for longer operations
   */
  startTimedSpan(spanName, attributes = {}) {
    try {
      return this.tracer.startSpan(spanName, {
        attributes: {
          'service.name': this.serviceName,
          'span.kind': 'internal',
          'timestamp': new Date().toISOString(),
          ...attributes
        }
      });
    } catch (error) {
      console.warn('Failed to create timed span:', error);
      return null;
    }
  }

  /**
   * End a timed span with additional attributes
   */
  endTimedSpan(span, additionalAttributes = {}) {
    if (span) {
      try {
        // Add any final attributes
        Object.entries(additionalAttributes).forEach(([key, value]) => {
          span.setAttributes({ [key]: value });
        });
        
        span.end();
      } catch (error) {
        console.warn('Failed to end timed span:', error);
      }
    }
  }
}

export default UITracingService;