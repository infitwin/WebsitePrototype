/**
 * Unified Modal Component
 * 
 * SINGLE SOURCE OF TRUTH for all modal/popup functionality.
 * Replaces all existing modal implementations to prevent duplication.
 * 
 * Usage:
 * import { Modal } from './components/ui/modal.js';
 * 
 * const modal = new Modal({
 *   title: 'Confirm Action',
 *   content: 'Are you sure?',
 *   type: 'warning',
 *   size: 'medium'
 * });
 * modal.show();
 */

import { BaseComponent } from '../core/base-component.js';
import { ComponentRegistry } from '../core/component-registry.js';

// Register component type to prevent duplicates
ComponentRegistry.registerType('Modal', Modal);

export class Modal extends BaseComponent {
  constructor(options = {}) {
    super({
      size: 'medium', // small, medium, large, full
      type: 'default', // default, danger, warning, info, success
      closable: true,
      closeOnEscape: true,
      closeOnBackdrop: true,
      focusOnShow: true,
      restoreFocus: true,
      ...options
    });
    
    // Track focus for restoration
    this.previousActiveElement = null;
    
    // Track body scroll position
    this.originalBodyOverflow = null;
    this.originalBodyPosition = null;
    this.originalScrollTop = null;
  }
  
  createElement() {
    const modal = document.createElement('div');
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('tabindex', '-1');
    
    if (this.config.title) {
      modal.setAttribute('aria-labelledby', `${this.config.id}-title`);
    }
    
    if (this.config.content && typeof this.config.content === 'string') {
      modal.setAttribute('aria-describedby', `${this.config.id}-content`);
    }
    
    return modal;
  }
  
  init() {
    this.buildModalStructure();
    this.setupEventListeners();
    this.setupKeyboardNavigation();
    
    // Set initial state
    this.setState({
      isOpen: false,
      isLoading: false
    });
  }
  
  buildModalStructure() {
    // Clear any existing content
    this.element.innerHTML = '';
    
    // Create content container
    this.contentContainer = this.createChildElement('div', 'infitwin-modal__content');
    
    // Create header
    if (this.config.title || this.config.closable) {
      this.header = this.createChildElement('div', 'infitwin-modal__header');
      
      if (this.config.title) {
        this.titleElement = this.createChildElement('h2', 'infitwin-modal__title', {
          id: `${this.config.id}-title`
        });
        this.titleElement.textContent = this.config.title;
        this.header.appendChild(this.titleElement);
      }
      
      if (this.config.closable) {
        this.closeButton = this.createChildElement('button', 'infitwin-modal__close', {
          'aria-label': 'Close modal',
          type: 'button'
        });
        this.closeButton.innerHTML = '×';
        this.header.appendChild(this.closeButton);
      }
      
      this.contentContainer.appendChild(this.header);
    }
    
    // Create body
    this.body = this.createChildElement('div', 'infitwin-modal__body');
    if (this.config.content) {
      if (typeof this.config.content === 'string') {
        this.body.innerHTML = this.config.content;
        this.body.setAttribute('id', `${this.config.id}-content`);
      } else if (this.config.content instanceof HTMLElement) {
        this.body.appendChild(this.config.content);
      }
    }
    this.contentContainer.appendChild(this.body);
    
    // Create footer if actions are provided
    if (this.config.actions && this.config.actions.length > 0) {
      this.footer = this.createChildElement('div', 'infitwin-modal__footer');
      this.createActionButtons();
      this.contentContainer.appendChild(this.footer);
    }
    
    this.element.appendChild(this.contentContainer);
    
    // Apply size and type classes
    this.updateClasses();
  }
  
  createActionButtons() {
    this.config.actions.forEach((action, index) => {
      const button = this.createChildElement('button', 'infitwin-button', {
        type: 'button'
      });
      
      // Apply button type class
      const buttonType = action.type || 'secondary';
      button.classList.add(`infitwin-button--${buttonType}`);
      
      button.textContent = action.text || 'Action';
      
      if (action.disabled) {
        button.disabled = true;
      }
      
      // Add click handler
      button.addEventListener('click', () => {
        if (action.action && typeof action.action === 'function') {
          const result = action.action();
          
          // If action returns a promise, handle loading state
          if (result && typeof result.then === 'function') {
            this.setLoading(true);
            result
              .then(() => {
                if (action.closeOnAction !== false) {
                  this.hide();
                }
              })
              .catch((error) => {
                console.error('Modal action failed:', error);
              })
              .finally(() => {
                this.setLoading(false);
              });
          } else {
            // Synchronous action
            if (action.closeOnAction !== false) {
              this.hide();
            }
          }
        } else {
          // Default behavior: close modal
          this.hide();
        }
      });
      
      this.footer.appendChild(button);
      
      // Focus first primary button when modal opens
      if (buttonType === 'primary' && !this.primaryButton) {
        this.primaryButton = button;
      }
    });
  }
  
  updateClasses() {
    // Remove existing modifier classes
    this.element.className = this.getClassName();
    
    // Add size class
    this.element.classList.add(`infitwin-modal--${this.config.size}`);
    
    // Add type class
    if (this.config.type !== 'default') {
      this.element.classList.add(`infitwin-modal--${this.config.type}`);
    }
    
    // Add loading class if needed
    if (this.state.isLoading) {
      this.element.classList.add('infitwin-modal--loading');
    }
  }
  
  setupEventListeners() {
    // Close button
    if (this.closeButton) {
      this.closeButton.addEventListener('click', () => this.hide());
    }
    
    // Backdrop click
    if (this.config.closeOnBackdrop) {
      this.addEventListener('click', (e) => {
        if (e.target === this.element) {
          this.hide();
        }
      });
    }
    
    // Escape key
    if (this.config.closeOnEscape) {
      this.escapeHandler = (e) => {
        if (e.key === 'Escape' && this.state.isOpen) {
          this.hide();
        }
      };
      document.addEventListener('keydown', this.escapeHandler);
    }
  }
  
  setupKeyboardNavigation() {
    // Tab trapping
    this.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        this.trapFocus(e);
      }
    });
  }
  
  trapFocus(e) {
    const focusableElements = this.element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  }
  
  show() {
    if (this.state.isOpen) return;
    
    // Store current focus
    if (this.config.restoreFocus) {
      this.previousActiveElement = document.activeElement;
    }
    
    // Prevent body scroll
    this.preventBodyScroll();
    
    // Add to DOM if not already there
    if (!this.element.parentNode) {
      document.body.appendChild(this.element);
    }
    
    // Show modal
    this.setState({ isOpen: true });
    this.element.classList.add('show');
    
    // Focus management
    if (this.config.focusOnShow) {
      this.focusModal();
    }
    
    // Emit event
    this.element.dispatchEvent(new CustomEvent('modal:show', {
      detail: { modal: this }
    }));
  }
  
  hide() {
    if (!this.state.isOpen) return;
    
    // Hide modal
    this.setState({ isOpen: false });
    this.element.classList.remove('show');
    
    // Restore body scroll
    this.restoreBodyScroll();
    
    // Restore focus
    if (this.config.restoreFocus && this.previousActiveElement) {
      this.previousActiveElement.focus();
      this.previousActiveElement = null;
    }
    
    // Remove from DOM after animation
    setTimeout(() => {
      if (this.element.parentNode && !this.state.isOpen) {
        this.element.parentNode.removeChild(this.element);
      }
    }, 200);
    
    // Emit event
    this.element.dispatchEvent(new CustomEvent('modal:hide', {
      detail: { modal: this }
    }));
  }
  
  focusModal() {
    // Focus order: primary button -> close button -> modal itself
    if (this.primaryButton) {
      this.primaryButton.focus();
    } else if (this.closeButton) {
      this.closeButton.focus();
    } else {
      this.element.focus();
    }
  }
  
  preventBodyScroll() {
    this.originalBodyOverflow = document.body.style.overflow;
    this.originalBodyPosition = document.body.style.position;
    this.originalScrollTop = window.pageYOffset;
    
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${this.originalScrollTop}px`;
    document.body.style.width = '100%';
  }
  
  restoreBodyScroll() {
    document.body.style.overflow = this.originalBodyOverflow || '';
    document.body.style.position = this.originalBodyPosition || '';
    document.body.style.top = '';
    document.body.style.width = '';
    
    if (this.originalScrollTop) {
      window.scrollTo(0, this.originalScrollTop);
    }
  }
  
  setLoading(loading) {
    this.setState({ isLoading: loading });
    this.updateClasses();
  }
  
  setTitle(title) {
    this.config.title = title;
    if (this.titleElement) {
      this.titleElement.textContent = title;
    }
  }
  
  setContent(content) {
    this.config.content = content;
    if (this.body) {
      if (typeof content === 'string') {
        this.body.innerHTML = content;
      } else if (content instanceof HTMLElement) {
        this.body.innerHTML = '';
        this.body.appendChild(content);
      }
    }
  }
  
  onDestroy() {
    // Clean up escape key listener
    if (this.escapeHandler) {
      document.removeEventListener('keydown', this.escapeHandler);
    }
    
    // Restore body scroll if modal was open
    if (this.state.isOpen) {
      this.restoreBodyScroll();
    }
    
    // Restore focus
    if (this.previousActiveElement) {
      this.previousActiveElement.focus();
    }
  }
  
  // Static methods for common modal types
  static confirm(options = {}) {
    return new Modal({
      type: 'warning',
      size: 'small',
      title: options.title || 'Confirm',
      content: options.message || 'Are you sure?',
      actions: [
        { text: 'Cancel', type: 'secondary' },
        { text: options.confirmText || 'Confirm', type: 'primary', action: options.onConfirm }
      ],
      ...options
    });
  }
  
  static alert(options = {}) {
    return new Modal({
      type: options.type || 'info',
      size: 'small',
      title: options.title || 'Alert',
      content: options.message || '',
      actions: [
        { text: 'OK', type: 'primary' }
      ],
      ...options
    });
  }
  
  static loading(options = {}) {
    const modal = new Modal({
      size: 'small',
      title: options.title || 'Loading...',
      content: options.message || 'Please wait...',
      closable: false,
      closeOnEscape: false,
      closeOnBackdrop: false,
      ...options
    });
    
    modal.setLoading(true);
    return modal;
  }
}

// Export convenience methods
export const ModalConfirm = Modal.confirm;
export const ModalAlert = Modal.alert;
export const ModalLoading = Modal.loading;