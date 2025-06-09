/**
 * Unified Avatar Component System
 * 
 * SINGLE SOURCE OF TRUTH for all avatar/profile picture functionality.
 * Replaces all existing avatar implementations to prevent duplication.
 * 
 * Usage:
 * import { Avatar, AvatarGroup } from './components/ui/avatar.js';
 * 
 * const avatar = new Avatar({
 *   src: '/path/to/image.jpg',
 *   name: 'John Doe',
 *   size: 'large',
 *   shape: 'circle'
 * });
 */

import { BaseComponent } from '../core/base-component.js';
import { ComponentRegistry } from '../core/component-registry.js';

// Register component types to prevent duplicates
ComponentRegistry.registerType('Avatar', Avatar);
ComponentRegistry.registerType('AvatarGroup', AvatarGroup);

export class Avatar extends BaseComponent {
  constructor(options = {}) {
    super({
      src: null, // Image URL
      name: '', // User name for initials fallback
      size: 'medium', // small, medium, large, xlarge, custom
      customSize: null, // If size is 'custom', specify in pixels
      shape: 'circle', // circle, square, rounded
      status: null, // online, offline, busy, away
      statusPosition: 'bottom-right', // top-left, top-right, bottom-left, bottom-right
      showInitials: true, // Show initials if no image
      backgroundColor: null, // Custom background color, otherwise generated from name
      textColor: null, // Custom text color for initials
      alt: '', // Alt text for accessibility
      loading: 'lazy', // lazy, eager
      fallbackIcon: null, // Icon to show if no image and no name
      onClick: null, // Click handler
      href: null, // Make avatar a link
      target: null, // Link target
      ...options
    });
    
    // Cache for generated colors
    this.colorCache = new Map();
  }
  
  createElement() {
    // Create wrapper element - could be a link or div
    const element = this.config.href 
      ? document.createElement('a')
      : document.createElement('div');
    
    // Set href and target for links
    if (this.config.href) {
      element.href = this.config.href;
      if (this.config.target) {
        element.target = this.config.target;
        if (this.config.target === '_blank') {
          element.rel = 'noopener noreferrer';
        }
      }
    }
    
    // Make clickable if onClick provided
    if (this.config.onClick) {
      element.setAttribute('role', 'button');
      element.setAttribute('tabindex', '0');
    }
    
    return element;
  }
  
  init() {
    this.buildAvatarContent();
    this.setupEventListeners();
    this.updateClasses();
    this.applySize();
    
    // Set initial state
    this.setState({
      imageLoaded: false,
      imageError: false
    });
    
    // Load image if provided
    if (this.config.src) {
      this.loadImage();
    }
  }
  
  buildAvatarContent() {
    // Clear existing content
    this.element.innerHTML = '';
    
    // Create inner container
    this.innerContainer = this.createChildElement('div', 'infitwin-avatar__inner');
    
    // Add content based on priority: image > initials > icon
    if (this.config.src && !this.state.imageError) {
      this.createImageElement();
    } else if (this.config.name && this.config.showInitials) {
      this.createInitialsElement();
    } else if (this.config.fallbackIcon) {
      this.createIconElement();
    } else {
      // Default user icon
      this.createDefaultIcon();
    }
    
    this.element.appendChild(this.innerContainer);
    
    // Add status indicator if specified
    if (this.config.status) {
      this.createStatusIndicator();
    }
  }
  
  createImageElement() {
    this.imageElement = this.createChildElement('img', 'infitwin-avatar__image');
    this.imageElement.alt = this.config.alt || this.config.name || 'User avatar';
    this.imageElement.loading = this.config.loading;
    
    // Don't set src yet if we're lazy loading
    if (this.config.loading === 'eager' || this.isInViewport()) {
      this.imageElement.src = this.config.src;
    }
    
    this.innerContainer.appendChild(this.imageElement);
  }
  
  createInitialsElement() {
    this.initialsElement = this.createChildElement('span', 'infitwin-avatar__initials');
    this.initialsElement.textContent = this.getInitials(this.config.name);
    
    // Apply background color
    const backgroundColor = this.config.backgroundColor || this.generateColorFromName(this.config.name);
    this.innerContainer.style.backgroundColor = backgroundColor;
    
    // Apply text color
    const textColor = this.config.textColor || this.getContrastingTextColor(backgroundColor);
    this.initialsElement.style.color = textColor;
    
    this.innerContainer.appendChild(this.initialsElement);
  }
  
  createIconElement() {
    this.iconElement = this.createChildElement('span', 'infitwin-avatar__icon');
    
    if (typeof this.config.fallbackIcon === 'string') {
      this.iconElement.innerHTML = this.config.fallbackIcon;
    } else if (this.config.fallbackIcon instanceof HTMLElement) {
      this.iconElement.appendChild(this.config.fallbackIcon.cloneNode(true));
    }
    
    this.innerContainer.appendChild(this.iconElement);
  }
  
  createDefaultIcon() {
    this.iconElement = this.createChildElement('span', 'infitwin-avatar__icon');
    // Simple SVG user icon
    this.iconElement.innerHTML = `
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
      </svg>
    `;
    this.innerContainer.appendChild(this.iconElement);
  }
  
  createStatusIndicator() {
    this.statusElement = this.createChildElement('span', 'infitwin-avatar__status');
    this.statusElement.classList.add(`infitwin-avatar__status--${this.config.status}`);
    this.statusElement.classList.add(`infitwin-avatar__status--${this.config.statusPosition}`);
    this.statusElement.setAttribute('aria-label', `Status: ${this.config.status}`);
    this.element.appendChild(this.statusElement);
  }
  
  getInitials(name) {
    if (!name) return '';
    
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    
    // Take first letter of first and last name
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  
  generateColorFromName(name) {
    if (!name) return 'var(--color-background-secondary)';
    
    // Check cache first
    if (this.colorCache.has(name)) {
      return this.colorCache.get(name);
    }
    
    // Generate a hash from the name
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Convert to HSL color with good saturation and lightness
    const hue = Math.abs(hash) % 360;
    const saturation = 65; // Consistent saturation for pleasant colors
    const lightness = 55; // Consistent lightness for good contrast
    
    const color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    this.colorCache.set(name, color);
    
    return color;
  }
  
  getContrastingTextColor(backgroundColor) {
    // Simple contrast calculation
    // For HSL colors, we can check the lightness
    const match = backgroundColor.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
    if (match) {
      const lightness = parseInt(match[3]);
      return lightness > 50 ? 'var(--color-text-primary)' : 'var(--color-text-inverse)';
    }
    
    // Default to white text
    return 'var(--color-text-inverse)';
  }
  
  updateClasses() {
    // Remove existing modifier classes
    this.element.className = this.getClassName();
    
    // Add size class
    if (this.config.size !== 'custom') {
      this.element.classList.add(`infitwin-avatar--${this.config.size}`);
    }
    
    // Add shape class
    this.element.classList.add(`infitwin-avatar--${this.config.shape}`);
    
    // Add interactive class if clickable
    if (this.config.onClick || this.config.href) {
      this.element.classList.add('infitwin-avatar--interactive');
    }
    
    // Add state classes
    if (this.state.imageLoaded) {
      this.element.classList.add('infitwin-avatar--loaded');
    }
    
    if (this.state.imageError) {
      this.element.classList.add('infitwin-avatar--error');
    }
  }
  
  applySize() {
    if (this.config.size === 'custom' && this.config.customSize) {
      const size = `${this.config.customSize}px`;
      this.element.style.width = size;
      this.element.style.height = size;
      this.element.style.fontSize = `${this.config.customSize * 0.4}px`; // Scale font size
    }
  }
  
  setupEventListeners() {
    // Click handler
    if (this.config.onClick) {
      this.addEventListener('click', (e) => {
        if (!this.config.href) {
          e.preventDefault();
        }
        this.config.onClick(e);
      });
      
      // Keyboard support
      this.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.config.onClick(e);
        }
      });
    }
    
    // Intersection observer for lazy loading
    if (this.config.src && this.config.loading === 'lazy') {
      this.setupLazyLoading();
    }
  }
  
  setupLazyLoading() {
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.loadImage();
            observer.unobserve(this.element);
          }
        });
      }, {
        rootMargin: '50px'
      });
      
      observer.observe(this.element);
    } else {
      // Fallback for browsers without IntersectionObserver
      this.loadImage();
    }
  }
  
  isInViewport() {
    const rect = this.element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }
  
  loadImage() {
    if (!this.config.src || this.imageElement?.src) return;
    
    const img = new Image();
    
    img.onload = () => {
      this.setState({ imageLoaded: true, imageError: false });
      if (this.imageElement) {
        this.imageElement.src = this.config.src;
      } else {
        // Rebuild content to show image
        this.buildAvatarContent();
      }
      this.updateClasses();
      
      this.element.dispatchEvent(new CustomEvent('avatar:loaded', {
        detail: { avatar: this }
      }));
    };
    
    img.onerror = () => {
      this.setState({ imageLoaded: false, imageError: true });
      // Rebuild content to show fallback
      this.buildAvatarContent();
      this.updateClasses();
      
      this.element.dispatchEvent(new CustomEvent('avatar:error', {
        detail: { avatar: this }
      }));
    };
    
    img.src = this.config.src;
  }
  
  // Public methods
  setSrc(src) {
    this.config.src = src;
    this.setState({ imageLoaded: false, imageError: false });
    this.buildAvatarContent();
    if (src) {
      this.loadImage();
    }
  }
  
  setName(name) {
    this.config.name = name;
    if (!this.config.src || this.state.imageError) {
      this.buildAvatarContent();
    }
  }
  
  setStatus(status) {
    const hadStatus = !!this.config.status;
    this.config.status = status;
    
    if (status && !hadStatus) {
      this.createStatusIndicator();
    } else if (!status && hadStatus && this.statusElement) {
      this.statusElement.remove();
      this.statusElement = null;
    } else if (this.statusElement) {
      // Update existing status
      this.statusElement.className = 'infitwin-avatar__status';
      this.statusElement.classList.add(`infitwin-avatar__status--${status}`);
      this.statusElement.classList.add(`infitwin-avatar__status--${this.config.statusPosition}`);
    }
  }
  
  setSize(size, customSize = null) {
    this.config.size = size;
    this.config.customSize = customSize;
    this.updateClasses();
    this.applySize();
  }
}

/**
 * Avatar Group - Container for multiple avatars with overlap
 */
export class AvatarGroup extends BaseComponent {
  constructor(options = {}) {
    super({
      avatars: [], // Array of avatar configs
      max: 5, // Maximum avatars to show
      size: 'medium', // Size for all avatars
      overlap: 0.3, // Overlap amount (0-1)
      showExcess: true, // Show +X indicator for hidden avatars
      excessPosition: 'end', // start, end
      spacing: null, // Custom spacing between avatars (overrides overlap)
      ...options
    });
    
    this.avatarInstances = [];
  }
  
  createElement() {
    return document.createElement('div');
  }
  
  init() {
    this.element.classList.add('infitwin-avatar-group');
    this.element.style.setProperty('--avatar-overlap', this.config.overlap);
    
    if (this.config.spacing !== null) {
      this.element.style.setProperty('--avatar-spacing', `${this.config.spacing}px`);
    }
    
    this.renderAvatars();
  }
  
  renderAvatars() {
    // Clear existing avatars
    this.element.innerHTML = '';
    this.avatarInstances = [];
    
    const visibleAvatars = this.config.avatars.slice(0, this.config.max);
    const hiddenCount = Math.max(0, this.config.avatars.length - this.config.max);
    
    // Add excess indicator at start if configured
    if (hiddenCount > 0 && this.config.showExcess && this.config.excessPosition === 'start') {
      this.addExcessIndicator(hiddenCount);
    }
    
    // Add visible avatars
    visibleAvatars.forEach((avatarConfig, index) => {
      const avatar = new Avatar({
        ...avatarConfig,
        size: this.config.size
      });
      
      // Apply z-index for proper stacking
      avatar.element.style.zIndex = visibleAvatars.length - index;
      
      this.avatarInstances.push(avatar);
      this.element.appendChild(avatar.element);
    });
    
    // Add excess indicator at end if configured
    if (hiddenCount > 0 && this.config.showExcess && this.config.excessPosition === 'end') {
      this.addExcessIndicator(hiddenCount);
    }
  }
  
  addExcessIndicator(count) {
    const excess = new Avatar({
      name: `+${count}`,
      size: this.config.size,
      showInitials: true,
      backgroundColor: 'var(--color-background-secondary)',
      textColor: 'var(--color-text-secondary)'
    });
    
    excess.element.classList.add('infitwin-avatar-group__excess');
    excess.element.setAttribute('title', `${count} more`);
    
    this.element.appendChild(excess.element);
  }
  
  addAvatar(avatarConfig) {
    this.config.avatars.push(avatarConfig);
    this.renderAvatars();
  }
  
  removeAvatar(index) {
    this.config.avatars.splice(index, 1);
    this.renderAvatars();
  }
  
  setAvatars(avatars) {
    this.config.avatars = avatars;
    this.renderAvatars();
  }
}

// Export convenience methods for creating avatars
export function createAvatar(options) {
  return new Avatar(options);
}

export function createAvatarGroup(options) {
  return new AvatarGroup(options);
}