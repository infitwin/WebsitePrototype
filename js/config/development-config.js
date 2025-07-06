/**
 * Development Configuration
 * Detects local development environment and adjusts settings
 */

window.isDevelopment = function() {
    return window.location.hostname === 'localhost' || 
           window.location.hostname === '127.0.0.1' ||
           window.location.port === '8357';
};

window.getOrchestratorUrl = function() {
    if (window.isDevelopment()) {
        console.log('🔧 Development mode: WebSocket orchestrator disabled');
        return null;
    }
    
    // Production WebSocket URL
    if (window.getBusinessWebSocketUrl) {
        return window.getBusinessWebSocketUrl(false);
    }
    
    return 'wss://intervieworchestrationservice-833139648849.us-central1.run.app/ws';
};

// Log current environment
console.log('Environment:', window.isDevelopment() ? 'Development' : 'Production');