// js/otel-config.js - OpenTelemetry Configuration for WebsitePrototype
// Using CDN imports for OpenTelemetry libraries

/**
 * WebsitePrototype OpenTelemetry Configuration
 * Uses same versions and endpoint as InterviewSessionManager (1.33.0)
 * Connects to cloud OTEL collector for distributed tracing
 */
class WebsitePrototypeOTelConfig {
  static SERVICE_NAME = 'website-prototype';
  static SERVICE_VERSION = '1.0.0';
  static OTEL_ENDPOINT = 'https://otel-collector-service-833139648849.us-central1.run.app/v1/traces';

  static tracer = null;
  static provider = null;
  static initialized = false;

  /**
   * Initialize OpenTelemetry for the WebsitePrototype frontend
   * @returns {Tracer} OpenTelemetry tracer instance
   */
  static initialize() {
    if (this.initialized) {
      console.log('🔄 OpenTelemetry already initialized');
      return this.tracer;
    }

    try {
      console.log('🚀 Initializing OpenTelemetry for WebsitePrototype...');

      // Create resource with service identification
      const resource = new Resource({
        'service.name': this.SERVICE_NAME,
        'service.version': this.SERVICE_VERSION,
        'service.namespace': 'infitwin',
        'deployment.environment': this.getEnvironment()
      });

      // Create tracer provider
      this.provider = new WebTracerProvider({ resource });

      // Create OTLP exporter with cloud endpoint
      const exporter = new OTLPTraceExporter({
        url: this.OTEL_ENDPOINT,
        headers: {
          'Content-Type': 'application/json',
        },
        // Add timeout for browser reliability
        timeoutMillis: 10000
      });

      // Add batch span processor with web-optimized settings
      this.provider.addSpanProcessor(new BatchSpanProcessor(exporter, {
        maxExportBatchSize: 10,       // Small batches for browser
        scheduledDelayMillis: 500,    // Fast export for immediate feedback
        exportTimeoutMillis: 5000,    // 5 second timeout
        maxQueueSize: 100             // Reasonable queue size
      }));

      // Register the provider globally
      trace.setGlobalTracerProvider(this.provider);

      // Auto-instrument web APIs (fetch, XMLHttpRequest, document load, user interactions)
      registerInstrumentations({
        instrumentations: [
          new DocumentLoadInstrumentation(),
          new UserInteractionInstrumentation(),
          new FetchInstrumentation({
            // Only instrument specific requests to avoid noise
            ignoreUrls: [/localhost:8080\/(?!api)/, /\.js$/, /\.css$/, /\.png$/, /\.jpg$/, /\.gif$/]
          }),
          new XMLHttpRequestInstrumentation()
        ]
      });

      // Get tracer for manual instrumentation
      this.tracer = trace.getTracer(this.SERVICE_NAME, this.SERVICE_VERSION);
      this.initialized = true;

      console.log('✅ OpenTelemetry initialized successfully');
      console.log(`📊 Endpoint: ${this.OTEL_ENDPOINT}`);
      console.log(`🏷️  Service: ${this.SERVICE_NAME} v${this.SERVICE_VERSION}`);
      
      return this.tracer;
      
    } catch (error) {
      console.error('❌ Failed to initialize OpenTelemetry:', error);
      this.tracer = trace.getTracer('noop'); // Return no-op tracer on failure
      return this.tracer;
    }
  }

  /**
   * Get the current environment
   * @returns {string} Environment name
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
   * Get the initialized tracer
   * @returns {Tracer} OpenTelemetry tracer
   */
  static getTracer() {
    if (!this.initialized) {
      return this.initialize();
    }
    return this.tracer;
  }

  /**
   * Force flush all pending spans
   * @returns {Promise<boolean>} Success status
   */
  static async forceFlush() {
    if (this.provider) {
      try {
        await this.provider.forceFlush();
        console.log('🔄 OpenTelemetry spans flushed');
        return true;
      } catch (error) {
        console.error('❌ Failed to flush spans:', error);
        return false;
      }
    }
    return false;
  }

  /**
   * Shutdown OpenTelemetry gracefully
   */
  static async shutdown() {
    if (this.provider) {
      try {
        await this.provider.shutdown();
        console.log('🛑 OpenTelemetry shut down');
      } catch (error) {
        console.error('❌ Error during shutdown:', error);
      }
    }
  }
}

export default WebsitePrototypeOTelConfig;