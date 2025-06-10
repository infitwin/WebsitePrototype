/**
 * Unified User Menu Component
 * 
 * SINGLE SOURCE OF TRUTH for all user menu functionality.
 * Replaces all existing user menu implementations to prevent duplication.
 * 
 * Usage:
 * import { UserMenu } from './components/ui/user-menu.js';
 * 
 * const userMenu = new UserMenu({
 *   userName: 'John Doe',
 *   userEmail: 'john@example.com',
 *   avatar: '/path/to/avatar.jpg',
 *   menuItems: [
 *     { icon: '⚙️', text: 'Settings', href: '/settings.html' },
 *     { icon: '📁', text: 'My Files', href: '/my-files.html' }
 *   ]
 * });
 */

import { BaseComponent } from '../core/base-component.js';
import { ComponentRegistry } from '../core/component-registry.js';

export class UserMenu extends BaseComponent {
  constructor(options = {}) {
    super({
      userName: 'Demo User',
      userEmail: 'demo@infitwin.com',
      avatar: null, // URL to avatar image, null for icon fallback
      avatarIcon: '👤',
      position: 'bottom-right', // top-left, top-right, bottom-left, bottom-right
      showEmail: true,
      showAvatar: true,
      trigger: 'click', // click, hover
      menuItems: [
        { icon: '⚙️', text: 'Settings', href: 'settings.html' },
        { icon: '📁', text: 'My Files', href: 'my-files.html' },
        { type: 'divider' },
        { icon: '🚪', text: 'Logout', href: 'auth.html', action: 'logout' }
      ],
      ...options
    });
    
    // Track menu state
    this.isOpen = false;
    this.boundCloseHandler = this.handleOutsideClick.bind(this);
  }
  
  createElement() {
    const userMenu = document.createElement('div');
    userMenu.setAttribute('role', 'menu');
    userMenu.setAttribute('aria-label', 'User menu');
    return userMenu;
  }
  
  init() {
    this.buildUserMenuStructure();
    this.setupEventListeners();
    this.updateClasses();
    
    // Set initial state
    this.setState({
      isOpen: false
    });
  }
  
  buildUserMenuStructure() {
    // Clear existing content
    this.element.innerHTML = '';
    
    // Create trigger button
    this.trigger = this.createChildElement('button', 'infitwin-user-menu__trigger', {
      'aria-expanded': 'false',
      'aria-haspopup': 'menu'
    });
    
    if (this.config.showAvatar) {
      this.avatarElement = this.createChildElement('div', 'infitwin-user-menu__avatar');
      
      if (this.config.avatar) {
        const avatarImg = this.createChildElement('img', 'infitwin-user-menu__avatar-img', {
          src: this.config.avatar,
          alt: this.config.userName
        });
        this.avatarElement.appendChild(avatarImg);
      } else {
        this.avatarElement.textContent = this.config.avatarIcon;
      }
      
      this.trigger.appendChild(this.avatarElement);
    }
    
    // Add user name if not showing avatar or as additional text
    if (!this.config.showAvatar || this.config.showUserName) {
      this.nameElement = this.createChildElement('span', 'infitwin-user-menu__name');
      this.nameElement.textContent = this.config.userName;
      this.trigger.appendChild(this.nameElement);
    }
    
    // Add dropdown indicator
    const indicator = this.createChildElement('span', 'infitwin-user-menu__indicator');
    indicator.textContent = '▼';
    this.trigger.appendChild(indicator);
    
    this.element.appendChild(this.trigger);
    
    // Create dropdown menu
    this.dropdown = this.createChildElement('div', 'infitwin-user-menu__dropdown', {
      role: 'menu',
      'aria-hidden': 'true'
    });
    
    // Add user info header if showing email
    if (this.config.showEmail) {
      this.userInfo = this.createChildElement('div', 'infitwin-user-menu__user-info');
      
      const userNameSpan = this.createChildElement('span', 'infitwin-user-menu__user-name');
      userNameSpan.textContent = this.config.userName;
      this.userInfo.appendChild(userNameSpan);
      
      const userEmailSpan = this.createChildElement('span', 'infitwin-user-menu__user-email');
      userEmailSpan.textContent = this.config.userEmail;
      this.userInfo.appendChild(userEmailSpan);
      
      this.dropdown.appendChild(this.userInfo);
      
      // Add divider after user info
      const divider = this.createChildElement('div', 'infitwin-user-menu__divider');
      this.dropdown.appendChild(divider);
    }
    
    // Add menu items
    this.createMenuItems();
    
    this.element.appendChild(this.dropdown);
    
    // Apply position class
    this.updateClasses();
  }
  
  createMenuItems() {
    this.config.menuItems.forEach((item, index) => {
      if (item.type === 'divider') {
        const divider = this.createChildElement('div', 'infitwin-user-menu__divider');
        this.dropdown.appendChild(divider);
        return;
      }
      
      const menuItem = this.createChildElement('a', 'infitwin-user-menu__item', {
        role: 'menuitem',
        href: item.href || '#'
      });
      
      if (item.icon) {
        const iconSpan = this.createChildElement('span', 'infitwin-user-menu__item-icon');
        iconSpan.textContent = item.icon;
        menuItem.appendChild(iconSpan);
      }
      
      const textSpan = this.createChildElement('span', 'infitwin-user-menu__item-text');
      textSpan.textContent = item.text;
      menuItem.appendChild(textSpan);
      
      // Add special handling for logout
      if (item.action === 'logout') {
        menuItem.classList.add('infitwin-user-menu__item--logout');
        menuItem.addEventListener('click', (e) => {
          e.preventDefault();
          this.handleLogout();
        });
      }
      
      this.dropdown.appendChild(menuItem);
    });
  }
  
  updateClasses() {
    // Remove existing modifier classes
    this.element.className = this.getClassName();
    
    // Add position class
    this.element.classList.add(`infitwin-user-menu--${this.config.position}`);
    
    // Add open class if needed
    if (this.state.isOpen) {
      this.element.classList.add('infitwin-user-menu--open');
    }
  }
  
  setupEventListeners() {
    // Trigger click/hover
    if (this.config.trigger === 'click') {
      this.trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggle();
      });
    } else if (this.config.trigger === 'hover') {
      this.element.addEventListener('mouseenter', () => this.open());
      this.element.addEventListener('mouseleave', () => this.close());
    }
    
    // Keyboard navigation
    this.trigger.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.toggle();
      } else if (e.key === 'Escape') {
        this.close();
      }
    });
    
    // Menu item keyboard navigation
    this.dropdown.addEventListener('keydown', (e) => {
      const items = Array.from(this.dropdown.querySelectorAll('.infitwin-user-menu__item'));
      const currentIndex = items.indexOf(document.activeElement);
      
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
        items[nextIndex].focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
        items[prevIndex].focus();
      } else if (e.key === 'Escape') {
        this.close();
        this.trigger.focus();
      }
    });
  }
  
  open() {
    if (this.state.isOpen) return;
    
    this.setState({ isOpen: true });
    this.updateClasses();
    
    this.trigger.setAttribute('aria-expanded', 'true');
    this.dropdown.setAttribute('aria-hidden', 'false');
    
    // Add outside click listener
    setTimeout(() => {
      document.addEventListener('click', this.boundCloseHandler);
    }, 0);
    
    // Emit event
    this.element.dispatchEvent(new CustomEvent('usermenu:open', {
      detail: { userMenu: this }
    }));
  }
  
  close() {
    if (!this.state.isOpen) return;
    
    this.setState({ isOpen: false });
    this.updateClasses();
    
    this.trigger.setAttribute('aria-expanded', 'false');
    this.dropdown.setAttribute('aria-hidden', 'true');
    
    // Remove outside click listener
    document.removeEventListener('click', this.boundCloseHandler);
    
    // Emit event
    this.element.dispatchEvent(new CustomEvent('usermenu:close', {
      detail: { userMenu: this }
    }));
  }
  
  toggle() {
    if (this.state.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }
  
  handleOutsideClick(event) {
    if (!this.element.contains(event.target)) {
      this.close();
    }
  }
  
  handleLogout() {
    // Clear user session data
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('authToken');
    
    // Clear any other auth-related data
    sessionStorage.clear();
    
    // Emit logout event for other components to handle
    this.element.dispatchEvent(new CustomEvent('usermenu:logout', {
      detail: { userMenu: this }
    }));
    
    // Show logout confirmation
    console.log('🚪 User logged out successfully');
    
    // Redirect to auth page
    window.location.href = 'auth.html';
  }
  
  updateUserInfo(userData) {
    this.config.userName = userData.userName || this.config.userName;
    this.config.userEmail = userData.userEmail || this.config.userEmail;
    this.config.avatar = userData.avatar || this.config.avatar;
    
    // Rebuild if needed
    this.buildUserMenuStructure();
  }
  
  setMenuItems(menuItems) {
    this.config.menuItems = menuItems;
    this.buildUserMenuStructure();
  }
  
  onDestroy() {
    // Clean up event listeners
    document.removeEventListener('click', this.boundCloseHandler);
  }
}

// Register component type to prevent duplicates (after class declaration)
ComponentRegistry.registerType('UserMenu', UserMenu);

// Export convenience methods
export function createUserMenu(options = {}) {
  return new UserMenu(options);
}