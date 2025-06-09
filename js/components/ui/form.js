/**
 * Unified Form Component System
 * 
 * SINGLE SOURCE OF TRUTH for all form input functionality.
 * Replaces all existing form implementations to prevent duplication.
 * 
 * Usage:
 * import { FormInput, FormGroup, FormValidator } from './components/ui/form.js';
 * 
 * const emailInput = new FormInput({
 *   type: 'email',
 *   name: 'email',
 *   label: 'Email Address',
 *   required: true,
 *   validator: FormValidator.email
 * });
 */

import { BaseComponent } from '../core/base-component.js';
import { ComponentRegistry } from '../core/component-registry.js';

// Register component types to prevent duplicates
ComponentRegistry.registerType('FormInput', FormInput);
ComponentRegistry.registerType('FormGroup', FormGroup);
ComponentRegistry.registerType('FormValidator', FormValidator);

export class FormInput extends BaseComponent {
  constructor(options = {}) {
    super({
      type: 'text', // text, email, password, number, tel, url, date, etc.
      name: '',
      label: '',
      placeholder: '',
      value: '',
      required: false,
      disabled: false,
      readonly: false,
      autofocus: false,
      autocomplete: 'off',
      minLength: null,
      maxLength: null,
      pattern: null,
      helpText: '',
      errorText: '',
      successText: '',
      icon: null,
      iconPosition: 'left', // left, right
      size: 'medium', // small, medium, large
      variant: 'default', // default, filled, outlined
      validator: null, // Custom validation function
      validateOn: 'blur', // blur, change, input
      showPasswordToggle: true, // For password fields
      ...options
    });
    
    // Track validation state
    this.validationTimeout = null;
    this.lastValidValue = null;
  }
  
  createElement() {
    return document.createElement('div');
  }
  
  init() {
    this.buildInputStructure();
    this.setupEventListeners();
    this.updateClasses();
    
    // Set initial state
    this.setState({
      value: this.config.value,
      isValid: null,
      isFocused: false,
      isValidating: false,
      showPassword: false
    });
    
    // Set initial value
    if (this.config.value) {
      this.setValue(this.config.value);
    }
  }
  
  buildInputStructure() {
    // Clear existing content
    this.element.innerHTML = '';
    
    // Create label if provided
    if (this.config.label) {
      this.labelElement = this.createChildElement('label', 'infitwin-form__label');
      this.labelElement.textContent = this.config.label;
      if (this.config.required) {
        const requiredMark = this.createChildElement('span', 'infitwin-form__required');
        requiredMark.textContent = ' *';
        requiredMark.setAttribute('aria-label', 'required');
        this.labelElement.appendChild(requiredMark);
      }
      this.element.appendChild(this.labelElement);
    }
    
    // Create input wrapper
    this.inputWrapper = this.createChildElement('div', 'infitwin-form__input-wrapper');
    
    // Add icon if specified (left position)
    if (this.config.icon && this.config.iconPosition === 'left') {
      this.addIcon();
    }
    
    // Create input element
    this.input = document.createElement('input');
    this.input.className = 'infitwin-form__input';
    this.input.type = this.config.type;
    this.input.name = this.config.name;
    this.input.id = this.config.id || `input-${this.config.name}-${Date.now()}`;
    
    // Set label association
    if (this.labelElement) {
      this.labelElement.setAttribute('for', this.input.id);
    }
    
    // Set input attributes
    if (this.config.placeholder) this.input.placeholder = this.config.placeholder;
    if (this.config.required) this.input.required = true;
    if (this.config.disabled) this.input.disabled = true;
    if (this.config.readonly) this.input.readOnly = true;
    if (this.config.autofocus) this.input.autofocus = true;
    if (this.config.autocomplete) this.input.autocomplete = this.config.autocomplete;
    if (this.config.minLength) this.input.minLength = this.config.minLength;
    if (this.config.maxLength) this.input.maxLength = this.config.maxLength;
    if (this.config.pattern) this.input.pattern = this.config.pattern;
    
    // Set ARIA attributes
    if (this.config.helpText) {
      this.input.setAttribute('aria-describedby', `${this.input.id}-help`);
    }
    if (this.config.errorText) {
      this.input.setAttribute('aria-describedby', `${this.input.id}-error`);
    }
    
    this.inputWrapper.appendChild(this.input);
    
    // Add icon if specified (right position)
    if (this.config.icon && this.config.iconPosition === 'right') {
      this.addIcon();
    }
    
    // Add password toggle for password fields
    if (this.config.type === 'password' && this.config.showPasswordToggle) {
      this.addPasswordToggle();
    }
    
    // Add validation indicator
    this.validationIndicator = this.createChildElement('span', 'infitwin-form__validation-indicator');
    this.inputWrapper.appendChild(this.validationIndicator);
    
    this.element.appendChild(this.inputWrapper);
    
    // Create help text container
    this.helpTextContainer = this.createChildElement('div', 'infitwin-form__help-container');
    
    if (this.config.helpText) {
      this.helpTextElement = this.createChildElement('small', 'infitwin-form__help-text', {
        id: `${this.input.id}-help`
      });
      this.helpTextElement.textContent = this.config.helpText;
      this.helpTextContainer.appendChild(this.helpTextElement);
    }
    
    // Error text element (hidden by default)
    this.errorTextElement = this.createChildElement('small', 'infitwin-form__error-text', {
      id: `${this.input.id}-error`,
      'aria-live': 'polite'
    });
    this.errorTextElement.style.display = 'none';
    this.helpTextContainer.appendChild(this.errorTextElement);
    
    // Success text element (hidden by default)
    this.successTextElement = this.createChildElement('small', 'infitwin-form__success-text', {
      'aria-live': 'polite'
    });
    this.successTextElement.style.display = 'none';
    this.helpTextContainer.appendChild(this.successTextElement);
    
    this.element.appendChild(this.helpTextContainer);
  }
  
  addIcon() {
    this.iconElement = this.createChildElement('span', 'infitwin-form__icon');
    
    if (typeof this.config.icon === 'string') {
      this.iconElement.innerHTML = this.config.icon;
    } else if (this.config.icon instanceof HTMLElement) {
      this.iconElement.appendChild(this.config.icon.cloneNode(true));
    }
    
    this.inputWrapper.appendChild(this.iconElement);
  }
  
  addPasswordToggle() {
    this.passwordToggle = this.createChildElement('button', 'infitwin-form__password-toggle', {
      type: 'button',
      'aria-label': 'Toggle password visibility'
    });
    this.passwordToggle.innerHTML = '👁️';
    this.inputWrapper.appendChild(this.passwordToggle);
    
    this.passwordToggle.addEventListener('click', () => {
      this.togglePasswordVisibility();
    });
  }
  
  togglePasswordVisibility() {
    const showPassword = !this.state.showPassword;
    this.setState({ showPassword });
    
    if (showPassword) {
      this.input.type = 'text';
      this.passwordToggle.innerHTML = '👁️‍🗨️';
    } else {
      this.input.type = 'password';
      this.passwordToggle.innerHTML = '👁️';
    }
  }
  
  updateClasses() {
    // Remove existing modifier classes
    this.element.className = this.getClassName();
    
    // Add size class
    this.element.classList.add(`infitwin-form--${this.config.size}`);
    
    // Add variant class
    this.element.classList.add(`infitwin-form--${this.config.variant}`);
    
    // Add state classes
    if (this.state.isFocused) {
      this.element.classList.add('infitwin-form--focused');
    }
    
    if (this.state.isValid === true) {
      this.element.classList.add('infitwin-form--valid');
    } else if (this.state.isValid === false) {
      this.element.classList.add('infitwin-form--invalid');
    }
    
    if (this.state.isValidating) {
      this.element.classList.add('infitwin-form--validating');
    }
    
    if (this.config.disabled) {
      this.element.classList.add('infitwin-form--disabled');
    }
    
    if (this.state.value) {
      this.element.classList.add('infitwin-form--has-value');
    }
  }
  
  setupEventListeners() {
    // Focus events
    this.input.addEventListener('focus', () => {
      this.setState({ isFocused: true });
      this.updateClasses();
      this.element.dispatchEvent(new CustomEvent('form:focus', {
        detail: { input: this }
      }));
    });
    
    this.input.addEventListener('blur', () => {
      this.setState({ isFocused: false });
      this.updateClasses();
      
      if (this.config.validateOn === 'blur') {
        this.validate();
      }
      
      this.element.dispatchEvent(new CustomEvent('form:blur', {
        detail: { input: this }
      }));
    });
    
    // Input events
    this.input.addEventListener('input', (e) => {
      this.setState({ value: e.target.value });
      this.updateClasses();
      
      if (this.config.validateOn === 'input') {
        this.debouncedValidate();
      }
      
      this.element.dispatchEvent(new CustomEvent('form:input', {
        detail: { input: this, value: e.target.value }
      }));
    });
    
    this.input.addEventListener('change', (e) => {
      if (this.config.validateOn === 'change') {
        this.validate();
      }
      
      this.element.dispatchEvent(new CustomEvent('form:change', {
        detail: { input: this, value: e.target.value }
      }));
    });
  }
  
  debouncedValidate() {
    clearTimeout(this.validationTimeout);
    this.validationTimeout = setTimeout(() => {
      this.validate();
    }, 300);
  }
  
  async validate() {
    // Skip validation if disabled
    if (this.config.disabled) return true;
    
    const value = this.state.value;
    
    // Check required
    if (this.config.required && !value) {
      this.setError('This field is required');
      return false;
    }
    
    // Check HTML5 validation
    if (!this.input.checkValidity()) {
      this.setError(this.input.validationMessage);
      return false;
    }
    
    // Run custom validator if provided
    if (this.config.validator && typeof this.config.validator === 'function') {
      this.setState({ isValidating: true });
      this.updateClasses();
      
      try {
        const result = await this.config.validator(value, this);
        
        if (result === true) {
          this.setValid();
          return true;
        } else if (result === false) {
          this.setError('Invalid value');
          return false;
        } else if (typeof result === 'string') {
          this.setError(result);
          return false;
        }
      } catch (error) {
        console.error('Validation error:', error);
        this.setError('Validation failed');
        return false;
      } finally {
        this.setState({ isValidating: false });
        this.updateClasses();
      }
    }
    
    // No errors found
    this.setValid();
    return true;
  }
  
  setError(message) {
    this.setState({ isValid: false });
    this.config.errorText = message;
    this.errorTextElement.textContent = message;
    this.errorTextElement.style.display = 'block';
    this.successTextElement.style.display = 'none';
    if (this.helpTextElement) {
      this.helpTextElement.style.display = 'none';
    }
    this.input.setAttribute('aria-invalid', 'true');
    this.updateClasses();
  }
  
  setValid(message = null) {
    this.setState({ isValid: true });
    this.errorTextElement.style.display = 'none';
    
    if (message || this.config.successText) {
      this.successTextElement.textContent = message || this.config.successText;
      this.successTextElement.style.display = 'block';
      if (this.helpTextElement) {
        this.helpTextElement.style.display = 'none';
      }
    } else {
      this.successTextElement.style.display = 'none';
      if (this.helpTextElement) {
        this.helpTextElement.style.display = 'block';
      }
    }
    
    this.input.setAttribute('aria-invalid', 'false');
    this.updateClasses();
  }
  
  clearValidation() {
    this.setState({ isValid: null });
    this.errorTextElement.style.display = 'none';
    this.successTextElement.style.display = 'none';
    if (this.helpTextElement) {
      this.helpTextElement.style.display = 'block';
    }
    this.input.removeAttribute('aria-invalid');
    this.updateClasses();
  }
  
  setValue(value) {
    this.input.value = value;
    this.setState({ value });
    this.updateClasses();
  }
  
  getValue() {
    return this.state.value;
  }
  
  setDisabled(disabled) {
    this.config.disabled = disabled;
    this.input.disabled = disabled;
    this.updateClasses();
  }
  
  focus() {
    this.input.focus();
  }
  
  blur() {
    this.input.blur();
  }
  
  reset() {
    this.setValue('');
    this.clearValidation();
  }
}

/**
 * Form Group - Container for form inputs with consistent spacing
 */
export class FormGroup extends BaseComponent {
  constructor(options = {}) {
    super({
      inputs: [],
      layout: 'vertical', // vertical, horizontal, inline
      gap: 'medium', // small, medium, large
      ...options
    });
  }
  
  createElement() {
    return document.createElement('div');
  }
  
  init() {
    this.element.classList.add(`infitwin-form-group--${this.config.layout}`);
    this.element.classList.add(`infitwin-form-group--gap-${this.config.gap}`);
    this.addInputs();
  }
  
  addInputs() {
    this.config.inputs.forEach(inputConfig => {
      const input = new FormInput(inputConfig);
      this.element.appendChild(input.element);
    });
  }
  
  addInput(inputConfig) {
    const input = new FormInput(inputConfig);
    this.element.appendChild(input.element);
    return input;
  }
  
  async validateAll() {
    const inputs = this.element.querySelectorAll('.infitwin-form');
    const results = [];
    
    for (const inputElement of inputs) {
      const input = inputElement.__component;
      if (input && input.validate) {
        const isValid = await input.validate();
        results.push({ input, isValid });
      }
    }
    
    return results;
  }
  
  getValues() {
    const values = {};
    const inputs = this.element.querySelectorAll('.infitwin-form');
    
    inputs.forEach(inputElement => {
      const input = inputElement.__component;
      if (input && input.config.name) {
        values[input.config.name] = input.getValue();
      }
    });
    
    return values;
  }
}

/**
 * Form Validator - Common validation functions
 */
export class FormValidator {
  static email(value) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value) || 'Please enter a valid email address';
  }
  
  static url(value) {
    try {
      new URL(value);
      return true;
    } catch {
      return 'Please enter a valid URL';
    }
  }
  
  static phone(value) {
    const phoneRegex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
    return phoneRegex.test(value) || 'Please enter a valid phone number';
  }
  
  static minLength(min) {
    return (value) => {
      return value.length >= min || `Must be at least ${min} characters`;
    };
  }
  
  static maxLength(max) {
    return (value) => {
      return value.length <= max || `Must be no more than ${max} characters`;
    };
  }
  
  static pattern(regex, message = 'Invalid format') {
    return (value) => {
      return regex.test(value) || message;
    };
  }
  
  static passwordStrength(value) {
    if (value.length < 8) {
      return 'Password must be at least 8 characters';
    }
    
    let strength = 0;
    if (/[a-z]/.test(value)) strength++;
    if (/[A-Z]/.test(value)) strength++;
    if (/[0-9]/.test(value)) strength++;
    if (/[^a-zA-Z0-9]/.test(value)) strength++;
    
    if (strength < 3) {
      return 'Password must contain at least 3 of: lowercase, uppercase, numbers, symbols';
    }
    
    return true;
  }
  
  static match(otherInput) {
    return (value, currentInput) => {
      const otherValue = otherInput.getValue();
      return value === otherValue || 'Values do not match';
    };
  }
  
  static async unique(checkFunction, message = 'This value is already taken') {
    return async (value) => {
      const isUnique = await checkFunction(value);
      return isUnique || message;
    };
  }
  
  static compose(...validators) {
    return async (value, input) => {
      for (const validator of validators) {
        const result = await validator(value, input);
        if (result !== true) {
          return result;
        }
      }
      return true;
    };
  }
}

// Export convenience method for creating form from configuration
export function createForm(config) {
  const formGroup = new FormGroup({
    layout: config.layout || 'vertical',
    gap: config.gap || 'medium'
  });
  
  if (config.inputs) {
    config.inputs.forEach(inputConfig => {
      formGroup.addInput(inputConfig);
    });
  }
  
  return formGroup;
}