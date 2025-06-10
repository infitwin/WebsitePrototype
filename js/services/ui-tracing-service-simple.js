// js/services/ui-tracing-service-simple.js - Simplified UI Tracing Service
import SimpleOTelConfig from '../otel-config-simple.js';

/**
 * Simplified UI Tracing Service for WebsitePrototype
 * Implements span naming conventions from otel-spans-dual-websocket.md
 * Uses fire-and-forget pattern with direct OTEL collector communication
 */
class SimpleUITracingService {
  constructor() {
    this.serviceName = 'website-prototype';
    // Initialize the simple OTEL config
    SimpleOTelConfig.initialize();
  }

  /**
   * WF-001: UI_interaction:StartButton_Clicked
   * Track user click events for interview start
   */
  trackStartButtonClick(interviewData = {}) {
    return SimpleOTelConfig.createSpan('UI_interaction:StartButton_Clicked', {
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
    return SimpleOTelConfig.createSpan('UI_interaction:RecordButton_Pressed', {
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
   */
  trackUIInteraction(componentName, action, attributes = {}) {
    const spanName = `UI_interaction:${componentName}_${action}`;
    return SimpleOTelConfig.createSpan(spanName, {
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
    SimpleOTelConfig.createSpan('UI_interaction:PageNavigation', {
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
    SimpleOTelConfig.createSpan('UI_interaction:FormSubmission', {
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
    SimpleOTelConfig.createSpan('UI_interaction:FileUpload', {
      'ui.component': 'FileUploader',
      'ui.action': 'Upload',
      'file.name': fileName,
      'file.size': fileSize,
      'file.type': fileType,
      'timestamp': new Date().toISOString()
    });
  }

  /**
   * Track WebSocket send operations
   */
  trackWebSocketSend(spanName, messageData, additionalAttributes = {}) {
    SimpleOTelConfig.createSpan(spanName, {
      'websocket.message.type': messageData.type || 'unknown',
      'websocket.target.service': messageData.target?.service || 'unknown',
      'message.id': messageData.messageId || 'unknown',
      'session.id': messageData.payload?.metadata?.sessionId || 'unknown',
      'interview.id': messageData.payload?.metadata?.interviewId || 'unknown',
      'span.kind': 'client',
      'timestamp': new Date().toISOString(),
      ...additionalAttributes
    });
  }

  /**
   * Track WebSocket receive operations
   */
  trackWebSocketReceive(spanName, messageData, additionalAttributes = {}) {
    SimpleOTelConfig.createSpan(spanName, {
      'websocket.message.type': messageData.type || 'unknown',
      'websocket.source.service': messageData.source?.service || 'unknown',
      'message.id': messageData.messageId || 'unknown',
      'session.id': messageData.payload?.metadata?.sessionId || 'unknown',
      'interview.id': messageData.payload?.metadata?.interviewId || 'unknown',
      'span.kind': 'server',
      'timestamp': new Date().toISOString(),
      ...additionalAttributes
    });
  }

  /**
   * Track page load with performance metrics
   */
  trackPageLoad() {
    const pageName = this.getPageName();
    const loadTime = performance.now();
    
    SimpleOTelConfig.createSpan('UI_interaction:PageLoad', {
      'ui.component': 'Page',
      'ui.action': 'Load',
      'page.name': pageName,
      'page.url': window.location.href,
      'page.load_time_ms': Math.round(loadTime),
      'page.referrer': document.referrer || 'direct',
      'viewport.width': window.innerWidth,
      'viewport.height': window.innerHeight,
      'user_agent': navigator.userAgent,
      'timestamp': new Date().toISOString()
    });
  }

  /**
   * Track errors
   */
  trackError(errorType, errorMessage, additionalData = {}) {
    SimpleOTelConfig.createSpan('UI_interaction:Error', {
      'ui.component': 'Error',
      'ui.action': errorType,
      'error.message': errorMessage,
      'page.url': window.location.href,
      'timestamp': new Date().toISOString(),
      ...additionalData
    });
  }

  /**
   * Get current page name from URL
   */
  getPageName() {
    const path = window.location.pathname;
    if (path === '/' || path === '/index.html') return 'home';
    if (path.includes('/pages/')) {
      return path.split('/pages/')[1]?.replace('.html', '') || 'unknown';
    }
    return path.replace(/^\//, '').replace('.html', '') || 'unknown';
  }

  /**
   * Force flush spans
   */
  async flush() {
    return await SimpleOTelConfig.forceFlush();
  }
}

// Make available globally
window.SimpleUITracingService = SimpleUITracingService;

export default SimpleUITracingService;