/**
 * Safe WebSocket Manager - Vanilla JS Implementation
 * 
 * Ported from ui-studio React app for WebsitePrototype
 * Business logic works independently of connection state, telemetry, or monitoring
 * Everything fails gracefully without affecting core functionality
 */

class SafeWebSocketManager {
  constructor(url, options = {}) {
    this.url = url;
    this.options = {
      reconnectInterval: 5000,
      maxReconnectAttempts: 5,
      heartbeatInterval: 30000,
      messageTimeout: 5000,
      autoReconnect: true,
      queueMessages: true,
      ...options
    };
    
    this.ws = null;
    this.connected = false;
    this.reconnectAttempts = 0;
    this.messageHandlers = new Map();
    this.eventHandlers = new Map();
    this.messageQueue = [];
    this.heartbeatTimer = null;
    this.reconnectTimer = null;
  }

  /**
   * Connect to WebSocket - business logic continues even if connection fails
   */
  connect() {
    try {
      // Clear any existing connection
      this.disconnect();
      
      // Create new WebSocket
      this.ws = new WebSocket(this.url);
      
      // Set up event handlers
      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onclose = this.handleClose.bind(this);
      this.ws.onerror = this.handleError.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
      
      // Log telemetry (safe fallback)
      this.logTelemetry('WebSocket_Connect_Attempt', {
        url: this.url,
        attempt: this.reconnectAttempts + 1
      });
      
    } catch (error) {
      // Connection failed - emit event but don't throw
      this.emit('error', { type: 'connection', error });
      
      // Schedule reconnect if configured
      if (this.options.autoReconnect) {
        this.scheduleReconnect();
      }
    }
  }

  /**
   * Send message - queues if not connected, never throws
   */
  send(type, payload = {}) {
    const message = {
      type,
      payload,
      timestamp: Date.now(),
      messageId: this.generateMessageId()
    };

    // Queue message if not connected
    if (!this.connected || this.ws?.readyState !== WebSocket.OPEN) {
      if (this.options.queueMessages) {
        this.messageQueue.push(message);
        this.emit('queued', message);
      }
      return false; // Indicate message was not sent immediately
    }

    try {
      this.ws.send(JSON.stringify(message));
      
      // Log telemetry (safe fallback)
      this.logTelemetry('Message_Sent', { type, messageId: message.messageId });
      
      return true; // Message sent successfully
    } catch (error) {
      // Send failed - queue if configured
      if (this.options.queueMessages) {
        this.messageQueue.push(message);
        this.emit('queued', message);
      }
      
      // Log error (safe fallback)
      this.logTelemetry('WebSocket_Send_Error', { error: error.message, messageType: type });
      
      return false;
    }
  }

  /**
   * Disconnect gracefully
   */
  disconnect() {
    this.clearTimers();
    
    if (this.ws) {
      try {
        this.ws.close(1000, 'Normal closure');
      } catch (e) {
        // Silent failure
      }
      this.ws = null;
    }
    
    this.connected = false;
    this.reconnectAttempts = 0;
  }

  /**
   * Register message handler
   */
  on(event, handler) {
    if (event.startsWith('message:')) {
      const messageType = event.slice(8);
      if (!this.messageHandlers.has(messageType)) {
        this.messageHandlers.set(messageType, []);
      }
      this.messageHandlers.get(messageType).push(handler);
    } else {
      if (!this.eventHandlers.has(event)) {
        this.eventHandlers.set(event, []);
      }
      this.eventHandlers.get(event).push(handler);
    }
  }

  /**
   * Remove handler
   */
  off(event, handler) {
    if (event.startsWith('message:')) {
      const messageType = event.slice(8);
      const handlers = this.messageHandlers.get(messageType) || [];
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    } else {
      const handlers = this.eventHandlers.get(event) || [];
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  // Private methods

  handleOpen(event) {
    this.connected = true;
    this.reconnectAttempts = 0;
    
    // Start heartbeat
    this.startHeartbeat();
    
    // Process queued messages
    this.processMessageQueue();
    
    // Emit event
    this.emit('connected', event);
    
    // Log telemetry (safe fallback)
    this.logTelemetry('WebSocket_Connected', { sessionId: this.options.sessionId });
  }

  handleClose(event) {
    this.connected = false;
    this.clearTimers();
    
    // Emit event
    this.emit('disconnected', { code: event.code, reason: event.reason });
    
    // Log telemetry (safe fallback)
    this.logTelemetry('WebSocket_Disconnected', { code: event.code, reason: event.reason });
    
    // Schedule reconnect if configured and not a normal closure
    if (this.options.autoReconnect && event.code !== 1000) {
      this.scheduleReconnect();
    }
  }

  handleError(error) {
    // Emit error event
    this.emit('error', { type: 'websocket', error });
    
    // Log error (safe fallback)
    this.logTelemetry('WebSocket_Error', { error: error.message || 'Unknown error' });
  }

  handleMessage(event) {
    try {
      const message = JSON.parse(event.data);
      
      // Log telemetry (safe fallback)
      this.logTelemetry('Message_Received', { 
        type: message.type, 
        correlationId: message.correlationId 
      });
      
      // Emit raw message event
      this.emit('message', message);
      
      // Call specific message handlers
      const handlers = this.messageHandlers.get(message.type) || [];
      handlers.forEach(handler => {
        try {
          handler(message.payload, message);
        } catch (error) {
          // Handler error - don't let it break other handlers
          console.error(`Handler error for ${message.type}:`, error);
          this.logTelemetry('Message_Handler_Error', {
            messageType: message.type,
            error: error.message
          });
        }
      });
      
    } catch (error) {
      // Parse error - emit but don't throw
      this.emit('error', { type: 'parse', error, data: event.data });
      this.logTelemetry('Message_Parse_Error', { error: error.message });
    }
  }

  emit(event, data) {
    const handlers = this.eventHandlers.get(event) || [];
    handlers.forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        // Handler error - log but don't propagate
        console.error(`Event handler error for ${event}:`, error);
      }
    });
  }

  startHeartbeat() {
    if (this.options.heartbeatInterval > 0) {
      this.heartbeatTimer = setInterval(() => {
        if (this.connected) {
          this.send('heartbeat', { timestamp: Date.now() });
        }
      }, this.options.heartbeatInterval);
    }
  }

  scheduleReconnect() {
    if (this.reconnectAttempts >= this.options.maxReconnectAttempts) {
      this.emit('reconnectFailed', { attempts: this.reconnectAttempts });
      return;
    }
    
    this.reconnectAttempts++;
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, this.options.reconnectInterval);
  }

  processMessageQueue() {
    while (this.messageQueue.length > 0 && this.connected) {
      const message = this.messageQueue.shift();
      try {
        this.ws.send(JSON.stringify(message));
        this.logTelemetry('Queued_Message_Sent', { 
          type: message.type, 
          messageId: message.messageId 
        });
      } catch (error) {
        // Failed to send queued message - re-queue
        this.messageQueue.unshift(message);
        break;
      }
    }
  }

  clearTimers() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  generateMessageId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Safe telemetry logging - never throws
   */
  logTelemetry(action, data = {}) {
    try {
      // Console logging as fallback (can be replaced with actual telemetry)
      console.log(`[WebSocket Telemetry] ${action}:`, data);
      
      // Future: Replace with actual telemetry service
      // if (window.telemetryHelper) {
      //   window.telemetryHelper.trackUserAction(action, data);
      // }
    } catch (error) {
      // Silent failure - telemetry should never break functionality
    }
  }

  // Convenience methods

  isConnected() {
    return this.connected && this.ws?.readyState === WebSocket.OPEN;
  }

  getQueueSize() {
    return this.messageQueue.length;
  }

  clearQueue() {
    this.messageQueue = [];
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
}

// Factory function for easy creation
function createSafeWebSocket(url, options = {}) {
  return new SafeWebSocketManager(url, options);
}

// Export for use in other modules
window.SafeWebSocketManager = SafeWebSocketManager;
window.createSafeWebSocket = createSafeWebSocket;