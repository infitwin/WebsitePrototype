/**
 * BaseComponent - Foundation class for all UI components
 * 
 * This class enforces consistent patterns across all components and
 * prevents duplicate implementations by providing shared functionality.
 * 
 * ALL COMPONENTS MUST EXTEND THIS CLASS - no exceptions.
 */

import { ComponentRegistry } from './component-registry.js';
import { validateDesignTokens } from './design-token-validator.js';

export class BaseComponent {
  constructor(options = {}) {
    // Enforce component registration to prevent duplicates
    this.componentType = this.constructor.name;
    ComponentRegistry.register(this.componentType, this);
    
    // Default configuration that all components share
    this.config = {
      id: options.id || this.generateId(),
      className: options.className || '',
      ariaLabel: options.ariaLabel || '',
      disabled: options.disabled || false,
      visible: options.visible !== false, // Default to visible
      ...options
    };
    
    // Shared state management
    this.state = {};
    this.eventListeners = new Map();
    
    // Create DOM element
    this.element = this.createElement();
    this.setupElement();
    
    // Validate design system usage
    this.validateDesignSystem();
    
    // Call component-specific initialization
    this.init();
  }
  
  /**
   * Generate unique ID for component instance
   */
  generateId() {
    return `${this.componentType.toLowerCase()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Create the main DOM element for this component
   * Must be implemented by subclasses
   */
  createElement() {
    throw new Error(`${this.componentType} must implement createElement() method`);
  }
  
  /**
   * Setup base element properties that all components need
   */
  setupElement() {
    if (!this.element) {
      throw new Error(`${this.componentType} createElement() must return a DOM element`);
    }
    
    // Set base attributes
    this.element.id = this.config.id;
    this.element.className = this.getClassName();
    
    if (this.config.ariaLabel) {
      this.element.setAttribute('aria-label', this.config.ariaLabel);
    }
    
    if (this.config.disabled) {
      this.setDisabled(true);
    }
    
    if (!this.config.visible) {
      this.setVisible(false);
    }
  }
  
  /**
   * Get the complete CSS class name for this component
   * Combines base component class with custom classes
   */
  getClassName() {
    const baseClass = `infitwin-${this.componentType.toLowerCase()}`;
    const customClasses = this.config.className || '';
    return `${baseClass} ${customClasses}`.trim();
  }
  
  /**
   * Component-specific initialization
   * Override in subclasses
   */
  init() {
    // Override in subclasses
  }
  
  /**
   * Validate that component uses design system tokens
   */
  validateDesignSystem() {
    const isProduction = typeof process !== 'undefined' 
      ? process.env.NODE_ENV === 'production'
      : false; // In browser, assume not production
      
    if (!isProduction) {
      validateDesignTokens(this.element, this.componentType);
    }
  }
  
  /**
   * Event Management
   */
  addEventListener(event, handler, options = {}) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    
    const listener = { handler, options };
    this.eventListeners.get(event).push(listener);
    this.element.addEventListener(event, handler, options);
    
    return () => this.removeEventListener(event, handler);
  }
  
  removeEventListener(event, handler) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.findIndex(l => l.handler === handler);
      if (index > -1) {
        listeners.splice(index, 1);
        this.element.removeEventListener(event, handler);
      }
    }
  }
  
  /**
   * State Management
   */
  setState(newState) {
    const prevState = { ...this.state };
    this.state = { ...this.state, ...newState };
    this.onStateChange(prevState, this.state);
  }
  
  getState() {
    return { ...this.state };
  }
  
  /**
   * Called when state changes - override in subclasses
   */
  onStateChange(prevState, newState) {
    // Override in subclasses to react to state changes
  }
  
  /**
   * Common Component Methods
   */
  setDisabled(disabled) {
    this.config.disabled = disabled;
    
    if (disabled) {
      this.element.setAttribute('disabled', '');
      this.element.setAttribute('aria-disabled', 'true');
      this.element.classList.add('disabled');
    } else {
      this.element.removeAttribute('disabled');
      this.element.removeAttribute('aria-disabled');
      this.element.classList.remove('disabled');
    }
  }
  
  setVisible(visible) {
    this.config.visible = visible;
    
    if (visible) {
      this.element.classList.remove('hidden');
      this.element.removeAttribute('aria-hidden');
    } else {
      this.element.classList.add('hidden');
      this.element.setAttribute('aria-hidden', 'true');
    }
  }
  
  addClass(className) {
    this.element.classList.add(className);
  }
  
  removeClass(className) {
    this.element.classList.remove(className);
  }
  
  hasClass(className) {
    return this.element.classList.contains(className);
  }
  
  /**
   * Lifecycle Methods
   */
  mount(container) {
    if (typeof container === 'string') {
      container = document.querySelector(container);
    }
    
    if (!container) {
      throw new Error(`Cannot mount ${this.componentType}: container not found`);
    }
    
    container.appendChild(this.element);
    this.onMount();
  }
  
  unmount() {
    if (this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    this.onUnmount();
  }
  
  onMount() {
    // Override in subclasses
  }
  
  onUnmount() {
    // Override in subclasses
  }
  
  /**
   * Cleanup - removes all event listeners and component registration
   */
  destroy() {
    // Remove all event listeners
    this.eventListeners.forEach((listeners, event) => {
      listeners.forEach(({ handler }) => {
        this.element.removeEventListener(event, handler);
      });
    });
    this.eventListeners.clear();
    
    // Remove from DOM
    this.unmount();
    
    // Unregister component
    ComponentRegistry.unregister(this.componentType, this);
    
    // Call subclass cleanup
    this.onDestroy();
  }
  
  onDestroy() {
    // Override in subclasses for custom cleanup
  }
  
  /**
   * Utility method to create child elements with design system classes
   */
  createChildElement(tag, className = '', attributes = {}) {
    const element = document.createElement(tag);
    
    if (className) {
      element.className = className;
    }
    
    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });
    
    return element;
  }
  
  /**
   * Debug information for development
   */
  getDebugInfo() {
    return {
      componentType: this.componentType,
      id: this.config.id,
      config: this.config,
      state: this.state,
      element: this.element,
      eventListeners: Array.from(this.eventListeners.keys())
    };
  }
}