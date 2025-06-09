/**
 * Unified Button Component
 * 
 * SINGLE SOURCE OF TRUTH for all button functionality.
 * Replaces all existing button implementations to prevent duplication.
 * 
 * Usage:
 * import { Button } from './components/ui/button.js';
 * 
 * const button = new Button({
 *   text: 'Save Changes',
 *   type: 'primary',
 *   size: 'large',
 *   onClick: () => saveForm()
 * });
 */

import { BaseComponent } from '../core/base-component.js';
import { ComponentRegistry } from '../core/component-registry.js';

// Register component type to prevent duplicates
ComponentRegistry.registerType('Button', Button);

export class Button extends BaseComponent {
  constructor(options = {}) {
    super({
      text: '',
      type: 'secondary', // primary, secondary, tertiary, danger, success, warning
      size: 'medium', // small, medium, large
      icon: null, // Icon element or HTML string
      iconPosition: 'left', // left, right
      loading: false,
      fullWidth: false,
      htmlType: 'button', // button, submit, reset
      href: null, // If provided, creates a link instead of button
      target: null, // For links: _blank, _self, etc.
      onClick: null,
      ...options
    });
    
    // Track loading state
    this.loadingPromise = null;
  }
  
  createElement() {
    // Create button or link based on configuration
    const element = this.config.href 
      ? document.createElement('a')
      : document.createElement('button');
    
    // Set type for buttons
    if (!this.config.href) {
      element.type = this.config.htmlType;
    }
    
    // Set href and target for links
    if (this.config.href) {
      element.href = this.config.href;
      if (this.config.target) {
        element.target = this.config.target;
      }
      // Add rel="noopener" for security when target="_blank"
      if (this.config.target === '_blank') {
        element.rel = 'noopener noreferrer';
      }
    }
    
    return element;
  }
  
  init() {
    this.buildButtonContent();
    this.setupEventListeners();
    this.updateClasses();
    
    // Set initial state
    this.setState({
      loading: this.config.loading
    });
  }
  
  buildButtonContent() {
    // Clear existing content
    this.element.innerHTML = '';
    
    // Create content wrapper
    this.contentWrapper = this.createChildElement('span', 'infitwin-button__content');
    
    // Add icon if specified
    if (this.config.icon && this.config.iconPosition === 'left') {
      this.addIcon();
    }
    
    // Add text
    if (this.config.text) {
      this.textElement = this.createChildElement('span', 'infitwin-button__text');
      this.textElement.textContent = this.config.text;
      this.contentWrapper.appendChild(this.textElement);
    }
    
    // Add icon if specified (right position)
    if (this.config.icon && this.config.iconPosition === 'right') {
      this.addIcon();
    }
    
    this.element.appendChild(this.contentWrapper);
  }
  
  addIcon() {
    this.iconElement = this.createChildElement('span', 'infitwin-button__icon');
    
    if (typeof this.config.icon === 'string') {
      this.iconElement.innerHTML = this.config.icon;
    } else if (this.config.icon instanceof HTMLElement) {
      this.iconElement.appendChild(this.config.icon.cloneNode(true));
    }
    
    this.contentWrapper.appendChild(this.iconElement);
  }
  
  updateClasses() {
    // Remove existing modifier classes but keep base class
    this.element.className = this.getClassName();
    
    // Add type class
    this.element.classList.add(`infitwin-button--${this.config.type}`);
    
    // Add size class
    this.element.classList.add(`infitwin-button--${this.config.size}`);
    
    // Add modifier classes
    if (this.config.fullWidth) {
      this.element.classList.add('infitwin-button--full-width');
    }
    
    if (this.state.loading) {
      this.element.classList.add('infitwin-button--loading');
    }
    
    // Add icon-only class if no text
    if (this.config.icon && !this.config.text) {
      this.element.classList.add('infitwin-button--icon-only');
    }
  }
  
  setupEventListeners() {
    if (this.config.onClick && typeof this.config.onClick === 'function') {
      this.addEventListener('click', (e) => {
        // Prevent default for links if onClick is provided
        if (this.config.href) {
          e.preventDefault();
        }
        
        // Don't trigger if loading or disabled
        if (this.state.loading || this.config.disabled) {
          return;
        }
        
        const result = this.config.onClick(e);
        
        // Handle promises (async operations)
        if (result && typeof result.then === 'function') {
          this.setLoading(true);
          this.loadingPromise = result;
          
          result
            .then((value) => {
              this.element.dispatchEvent(new CustomEvent('button:success', {
                detail: { button: this, result: value }
              }));
            })
            .catch((error) => {
              this.element.dispatchEvent(new CustomEvent('button:error', {
                detail: { button: this, error }
              }));
              console.error('Button action failed:', error);
            })
            .finally(() => {
              this.setLoading(false);
              this.loadingPromise = null;
            });
        }
      });
    }
  }
  
  setText(text) {
    this.config.text = text;
    if (this.textElement) {
      this.textElement.textContent = text;
    } else {
      // Rebuild if text was added to an icon-only button
      this.buildButtonContent();
    }
    this.updateClasses();
  }
  
  setIcon(icon) {
    this.config.icon = icon;
    this.buildButtonContent();
    this.updateClasses();
  }
  
  setType(type) {
    this.config.type = type;
    this.updateClasses();
  }
  
  setSize(size) {
    this.config.size = size;
    this.updateClasses();
  }
  
  setLoading(loading) {
    this.setState({ loading });
    this.updateClasses();
    
    // Update disabled state
    if (loading) {
      this.element.setAttribute('aria-busy', 'true');
      this.setDisabled(true);
    } else {
      this.element.removeAttribute('aria-busy');
      this.setDisabled(this.config.disabled);
    }
  }
  
  setFullWidth(fullWidth) {
    this.config.fullWidth = fullWidth;
    this.updateClasses();
  }
  
  setHref(href, target = null) {
    if (this.element.tagName === 'BUTTON') {
      // Need to recreate as link
      const newElement = document.createElement('a');
      newElement.className = this.element.className;
      newElement.innerHTML = this.element.innerHTML;
      
      if (this.element.parentNode) {
        this.element.parentNode.replaceChild(newElement, this.element);
      }
      
      this.element = newElement;
    }
    
    this.config.href = href;
    this.config.target = target;
    
    this.element.href = href;
    if (target) {
      this.element.target = target;
      if (target === '_blank') {
        this.element.rel = 'noopener noreferrer';
      }
    }
    
    this.setupEventListeners();
  }
  
  // Simulate click programmatically
  click() {
    if (!this.state.loading && !this.config.disabled) {
      this.element.click();
    }
  }
  
  // Cancel loading operation if possible
  cancelLoading() {
    if (this.loadingPromise && typeof this.loadingPromise.cancel === 'function') {
      this.loadingPromise.cancel();
    }
    this.setLoading(false);
  }
  
  onStateChange(prevState, newState) {
    // React to state changes
    if (prevState.loading !== newState.loading) {
      // Emit loading state change event
      this.element.dispatchEvent(new CustomEvent('button:loading-change', {
        detail: { button: this, loading: newState.loading }
      }));
    }
  }
  
  // Static factory methods for common button types
  static primary(options = {}) {
    return new Button({ ...options, type: 'primary' });
  }
  
  static secondary(options = {}) {
    return new Button({ ...options, type: 'secondary' });
  }
  
  static danger(options = {}) {
    return new Button({ ...options, type: 'danger' });
  }
  
  static success(options = {}) {
    return new Button({ ...options, type: 'success' });
  }
  
  static link(options = {}) {
    return new Button({ ...options, type: 'tertiary' });
  }
  
  static icon(options = {}) {
    return new Button({ ...options, text: '', type: 'tertiary' });
  }
}

/**
 * Button Group - Container for grouped buttons
 */
export class ButtonGroup extends BaseComponent {
  constructor(options = {}) {
    super({
      buttons: [],
      ...options
    });
  }
  
  createElement() {
    return document.createElement('div');
  }
  
  init() {
    this.element.classList.add('infitwin-button-group');
    this.addButtons();
  }
  
  addButtons() {
    this.config.buttons.forEach(buttonConfig => {
      const button = new Button(buttonConfig);
      this.element.appendChild(button.element);
    });
  }
  
  addButton(buttonConfig) {
    const button = new Button(buttonConfig);
    this.element.appendChild(button.element);
    return button;
  }
}

// Register ButtonGroup
ComponentRegistry.registerType('ButtonGroup', ButtonGroup);