// js/otel-init.js - OpenTelemetry Initialization Script for WebsitePrototype
import WebsitePrototypeOTelConfig from './otel-config.js';
import UITracingService from './services/ui-tracing-service.js';

/**
 * Initialize OpenTelemetry for WebsitePrototype
 * This script should be loaded early in the page lifecycle
 */
class OTelInitializer {
  static tracer = null;
  static tracingService = null;
  static initialized = false;

  /**
   * Initialize OpenTelemetry and set up global tracking
   */
  static async init() {
    if (this.initialized) {
      console.log('🔄 OpenTelemetry already initialized');
      return;
    }

    try {
      console.log('🚀 Starting OpenTelemetry initialization...');
      
      // Initialize OpenTelemetry configuration
      this.tracer = WebsitePrototypeOTelConfig.initialize();
      
      // Create UI tracing service
      this.tracingService = new UITracingService();
      
      // Set up global tracking helpers
      this.setupGlobalTracking();
      
      // Track page load
      this.trackPageLoad();
      
      // Set up navigation tracking
      this.setupNavigationTracking();
      
      // Set up form tracking
      this.setupFormTracking();
      
      // Set up error tracking
      this.setupErrorTracking();
      
      this.initialized = true;
      console.log('✅ OpenTelemetry initialization complete');
      
    } catch (error) {
      console.error('❌ Failed to initialize OpenTelemetry:', error);
    }
  }

  /**
   * Set up global tracking helpers
   */
  static setupGlobalTracking() {
    // Make tracing service available globally
    window.otelTracing = this.tracingService;
    
    // Add global tracking functions
    window.trackUIAction = (component, action, attributes = {}) => {
      this.tracingService.trackUIInteraction(component, action, attributes);
    };
    
    window.trackPageNav = (fromPage, toPage, method = 'click') => {
      this.tracingService.trackPageNavigation(fromPage, toPage, method);
    };
    
    window.trackFormSubmit = (formName, formData = {}) => {
      this.tracingService.trackFormSubmission(formName, formData);
    };
    
    window.trackFileUpload = (fileName, fileSize, fileType) => {
      this.tracingService.trackFileUpload(fileName, fileSize, fileType);
    };
  }

  /**
   * Track initial page load
   */
  static trackPageLoad() {
    const pageName = this.getPageName();
    const loadTime = performance.now();
    
    this.tracingService.trackUIInteraction('Page', 'Load', {
      'page.name': pageName,
      'page.url': window.location.href,
      'page.load_time_ms': Math.round(loadTime),
      'page.referrer': document.referrer || 'direct',
      'viewport.width': window.innerWidth,
      'viewport.height': window.innerHeight,
      'user_agent': navigator.userAgent
    });
  }

  /**
   * Set up automatic navigation tracking
   */
  static setupNavigationTracking() {
    // Track clicks on navigation links
    document.addEventListener('click', (event) => {
      const link = event.target.closest('a[href]');
      if (link) {
        const href = link.getAttribute('href');
        const currentPage = this.getPageName();
        const targetPage = this.extractPageName(href);
        
        if (targetPage && targetPage !== currentPage) {
          this.tracingService.trackPageNavigation(currentPage, targetPage, 'click');
        }
      }
    });

    // Track browser back/forward navigation
    window.addEventListener('popstate', (event) => {
      const currentPage = this.getPageName();
      this.tracingService.trackUIInteraction('Browser', 'Navigate', {
        'navigation.type': 'popstate',
        'page.name': currentPage,
        'page.url': window.location.href
      });
    });
  }

  /**
   * Set up automatic form tracking
   */
  static setupFormTracking() {
    document.addEventListener('submit', (event) => {
      const form = event.target;
      if (form.tagName === 'FORM') {
        const formName = form.id || form.name || form.className || 'unnamed-form';
        const formData = new FormData(form);
        const formFields = {};
        
        // Extract form field names (not values for privacy)
        for (const [key] of formData.entries()) {
          formFields[key] = 'submitted';
        }
        
        this.tracingService.trackFormSubmission(formName, formFields);
      }
    });
  }

  /**
   * Set up error tracking
   */
  static setupErrorTracking() {
    window.addEventListener('error', (event) => {
      this.tracingService.trackUIInteraction('Error', 'JavaScript', {
        'error.message': event.message,
        'error.filename': event.filename,
        'error.line': event.lineno,
        'error.column': event.colno,
        'page.url': window.location.href
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.tracingService.trackUIInteraction('Error', 'UnhandledPromise', {
        'error.reason': event.reason?.toString() || 'Unknown',
        'page.url': window.location.href
      });
    });
  }

  /**
   * Get current page name from URL
   */
  static getPageName() {
    const path = window.location.pathname;
    if (path === '/' || path === '/index.html') return 'home';
    if (path.includes('/pages/')) {
      return path.split('/pages/')[1]?.replace('.html', '') || 'unknown';
    }
    return path.replace(/^\//, '').replace('.html', '') || 'unknown';
  }

  /**
   * Extract page name from href
   */
  static extractPageName(href) {
    if (!href) return null;
    if (href.startsWith('#')) return null; // Hash links
    if (href.startsWith('http') && !href.includes(window.location.hostname)) return null; // External links
    
    try {
      const url = new URL(href, window.location.origin);
      const path = url.pathname;
      
      if (path === '/' || path === '/index.html') return 'home';
      if (path.includes('/pages/')) {
        return path.split('/pages/')[1]?.replace('.html', '') || null;
      }
      return path.replace(/^\//, '').replace('.html', '') || null;
    } catch {
      return null;
    }
  }

  /**
   * Manually force flush spans (for debugging)
   */
  static async flush() {
    return await WebsitePrototypeOTelConfig.forceFlush();
  }

  /**
   * Shutdown OpenTelemetry (for cleanup)
   */
  static async shutdown() {
    return await WebsitePrototypeOTelConfig.shutdown();
  }
}

// Auto-initialize when script loads
document.addEventListener('DOMContentLoaded', () => {
  OTelInitializer.init();
});

// Also initialize immediately if DOM is already loaded
if (document.readyState === 'loading') {
  // Document is still loading, DOMContentLoaded will fire
} else {
  // Document is already loaded
  OTelInitializer.init();
}

// Export for manual control
window.OTelInitializer = OTelInitializer;
export default OTelInitializer;