// js/otel-config-simple.js - Simplified OpenTelemetry Configuration
// Uses fetch to send spans directly to OTEL collector

/**
 * Simplified OpenTelemetry Configuration for WebsitePrototype
 * Sends spans directly to the OTEL collector via fetch API
 * Compatible with existing browser without npm dependencies
 */
class SimpleOTelConfig {
  static SERVICE_NAME = 'website-prototype';
  static SERVICE_VERSION = '1.0.0';
  static OTEL_ENDPOINT = 'https://otel-collector-service-833139648849.us-central1.run.app/v1/traces';
  
  static initialized = false;
  static spans = [];
  static batchTimeout = null;

  /**
   * Initialize simple OpenTelemetry configuration
   */
  static initialize() {
    if (this.initialized) {
      console.log('🔄 Simple OpenTelemetry already initialized');
      return this;
    }

    try {
      console.log('🚀 Initializing Simple OpenTelemetry for WebsitePrototype...');
      
      // Set up periodic span flushing
      this.setupPeriodicFlush();
      
      // Set up page unload flush
      this.setupUnloadFlush();
      
      this.initialized = true;
      console.log('✅ Simple OpenTelemetry initialized successfully');
      console.log(`📊 Endpoint: ${this.OTEL_ENDPOINT}`);
      console.log(`🏷️  Service: ${this.SERVICE_NAME} v${this.SERVICE_VERSION}`);
      
      return this;
      
    } catch (error) {
      console.error('❌ Failed to initialize Simple OpenTelemetry:', error);
      return this;
    }
  }

  /**
   * Create a span and add it to the batch
   */
  static createSpan(spanName, attributes = {}) {
    const span = {
      traceId: this.generateTraceId(),
      spanId: this.generateSpanId(),
      name: spanName,
      kind: 'SPAN_KIND_INTERNAL',
      startTimeUnixNano: this.getCurrentTimeNanos(),
      endTimeUnixNano: this.getCurrentTimeNanos(),
      attributes: [
        { key: 'service.name', value: { stringValue: this.SERVICE_NAME } },
        { key: 'service.version', value: { stringValue: this.SERVICE_VERSION } },
        { key: 'service.namespace', value: { stringValue: 'infitwin' } },
        { key: 'deployment.environment', value: { stringValue: this.getEnvironment() } },
        ...Object.entries(attributes).map(([key, value]) => ({
          key,
          value: { stringValue: String(value) }
        }))
      ],
      status: { code: 'STATUS_CODE_OK' }
    };

    this.spans.push(span);
    
    // Batch flush after collecting spans
    this.scheduleBatchFlush();
    
    return span;
  }

  /**
   * Schedule a batch flush
   */
  static scheduleBatchFlush() {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
    }
    
    this.batchTimeout = setTimeout(() => {
      this.flushSpans();
    }, 500); // 500ms delay for batching
  }

  /**
   * Flush spans to OTEL collector
   */
  static async flushSpans() {
    if (this.spans.length === 0) return;

    const spansToSend = [...this.spans];
    this.spans = []; // Clear the batch

    const otlpPayload = {
      resourceSpans: [{
        resource: {
          attributes: [
            { key: 'service.name', value: { stringValue: this.SERVICE_NAME } },
            { key: 'service.version', value: { stringValue: this.SERVICE_VERSION } },
            { key: 'service.namespace', value: { stringValue: 'infitwin' } },
            { key: 'deployment.environment', value: { stringValue: this.getEnvironment() } }
          ]
        },
        scopeSpans: [{
          scope: {
            name: `${this.SERVICE_NAME}-tracer`,
            version: this.SERVICE_VERSION
          },
          spans: spansToSend
        }]
      }]
    };

    try {
      const response = await fetch(this.OTEL_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(otlpPayload)
      });

      if (response.ok) {
        console.log(`📤 Sent ${spansToSend.length} spans to OTEL collector`);
      } else {
        console.warn(`⚠️ Failed to send spans: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('❌ Error sending spans to OTEL collector:', error);
    }
  }

  /**
   * Set up periodic flushing
   */
  static setupPeriodicFlush() {
    setInterval(() => {
      if (this.spans.length > 0) {
        this.flushSpans();
      }
    }, 5000); // Flush every 5 seconds
  }

  /**
   * Set up flush on page unload
   */
  static setupUnloadFlush() {
    window.addEventListener('beforeunload', () => {
      if (this.spans.length > 0) {
        // Use sendBeacon for reliable delivery on page unload
        const payload = JSON.stringify({
          resourceSpans: [{
            resource: {
              attributes: [
                { key: 'service.name', value: { stringValue: this.SERVICE_NAME } }
              ]
            },
            scopeSpans: [{
              scope: { name: `${this.SERVICE_NAME}-tracer` },
              spans: this.spans
            }]
          }]
        });
        
        navigator.sendBeacon(this.OTEL_ENDPOINT, payload);
      }
    });
  }

  /**
   * Generate a random trace ID (32 hex characters)
   */
  static generateTraceId() {
    return Array.from({ length: 32 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  }

  /**
   * Generate a random span ID (16 hex characters)
   */
  static generateSpanId() {
    return Array.from({ length: 16 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  }

  /**
   * Get current time in nanoseconds
   */
  static getCurrentTimeNanos() {
    return String(Date.now() * 1000000); // Convert milliseconds to nanoseconds
  }

  /**
   * Get current environment
   */
  static getEnvironment() {
    if (typeof window !== 'undefined' && window.location) {
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'development';
      }
      if (window.location.hostname.includes('run.app')) {
        return 'production';
      }
    }
    return 'unknown';
  }

  /**
   * Force flush all spans immediately
   */
  static async forceFlush() {
    return await this.flushSpans();
  }
}

// Make available globally
window.SimpleOTelConfig = SimpleOTelConfig;

export default SimpleOTelConfig;