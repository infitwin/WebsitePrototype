/**
 * Orchestration service endpoints configuration
 * Ported from ui-studio for WebsitePrototype
 * 
 * CRITICAL: These URLs must match exactly with ui-studio (DO NOT MODIFY)
 */

const ORCHESTRATION_ENDPOINTS = {
  // Base URLs
  API_BASE: 'https://api.infitwin.com',
  
  // WebSocket endpoints - EXACT URLs from ui-studio
  ORCHESTRATOR_WS: 'wss://intervieworchestrationservice-833139648849.us-central1.run.app/ws',
  AUDIO_WS: 'wss://audioprocessingservice-833139648849.us-central1.run.app/audio/ws',
  
  // REST API endpoints
  STATE_MANAGER: 'https://interview-session-manager-833139648849.us-central1.run.app/api/interview/state',
  ARTIFACT_PROCESSOR: 'https://artifact-processor-nfnrbhgy5a-uc.a.run.app/process-artifact',
  
  // Development endpoints (for local testing)
  DEV: {
    API_BASE: 'http://localhost:8000',
    ORCHESTRATOR_WS: 'ws://localhost:8000/ws',
    AUDIO_WS: 'ws://localhost:8001/audio/ws',
    STATE_MANAGER: 'http://localhost:8000/api/interview/state',
    ARTIFACT_PROCESSOR: 'http://localhost:8080/process-artifact'
  }
};

/**
 * Get the business WebSocket URL (no path parameters per spec)
 * @param {boolean} isDevelopment - Whether to use development endpoints
 * @returns {string} WebSocket URL
 */
function getBusinessWebSocketUrl(isDevelopment = false) {
  // In WebsitePrototype, we default to production (unlike React app)
  return isDevelopment ? 
    ORCHESTRATION_ENDPOINTS.DEV.ORCHESTRATOR_WS : 
    ORCHESTRATION_ENDPOINTS.ORCHESTRATOR_WS;
}

/**
 * Get the audio WebSocket URL (for future audio service)
 * @param {boolean} isDevelopment - Whether to use development endpoints
 * @returns {string} WebSocket URL
 */
function getAudioWebSocketUrl(isDevelopment = false) {
  return isDevelopment ? 
    ORCHESTRATION_ENDPOINTS.DEV.AUDIO_WS : 
    ORCHESTRATION_ENDPOINTS.AUDIO_WS;
}

/**
 * Returns the appropriate endpoints based on environment
 * @param {boolean} isDevelopment - Whether to use development endpoints
 * @returns {Object} Endpoint configuration object
 */
function getEndpoints(isDevelopment = false) {
  if (isDevelopment) {
    return {
      API_BASE: ORCHESTRATION_ENDPOINTS.DEV.API_BASE,
      ORCHESTRATOR_WS: ORCHESTRATION_ENDPOINTS.DEV.ORCHESTRATOR_WS,
      AUDIO_WS: ORCHESTRATION_ENDPOINTS.DEV.AUDIO_WS,
      STATE_MANAGER: ORCHESTRATION_ENDPOINTS.DEV.STATE_MANAGER,
      ARTIFACT_PROCESSOR: ORCHESTRATION_ENDPOINTS.DEV.ARTIFACT_PROCESSOR
    };
  }
  
  return {
    API_BASE: ORCHESTRATION_ENDPOINTS.API_BASE,
    ORCHESTRATOR_WS: ORCHESTRATION_ENDPOINTS.ORCHESTRATOR_WS,
    AUDIO_WS: ORCHESTRATION_ENDPOINTS.AUDIO_WS,
    STATE_MANAGER: ORCHESTRATION_ENDPOINTS.STATE_MANAGER,
    ARTIFACT_PROCESSOR: ORCHESTRATION_ENDPOINTS.ARTIFACT_PROCESSOR
  };
}

// Export for use in other modules
window.ORCHESTRATION_ENDPOINTS = ORCHESTRATION_ENDPOINTS;
window.getBusinessWebSocketUrl = getBusinessWebSocketUrl;
window.getAudioWebSocketUrl = getAudioWebSocketUrl;
window.getEndpoints = getEndpoints;

// ES Module exports
export { ORCHESTRATION_ENDPOINTS, getBusinessWebSocketUrl, getAudioWebSocketUrl, getEndpoints };