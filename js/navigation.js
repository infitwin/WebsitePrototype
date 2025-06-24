/**
 * Shared Navigation Component Loader
 * Loads the shared sidebar navigation and handles active states
 */

class NavigationManager {
    constructor() {
        this.currentPage = this.getCurrentPage();
        this.init();
    }

    /**
     * Get current page from URL
     */
    getCurrentPage() {
        const path = window.location.pathname;
        const filename = path.split('/').pop().replace('.html', '');
        
        // Map filenames to data-page values
        const pageMap = {
            'dashboard': 'dashboard',
            'twin-management': 'twin',
            'interview': 'interview',
            'sandbox': 'sandbox',
            'curator': 'curator',
            'interview-transcripts': 'transcripts',
            'talk-to-twin': 'talk',
            'my-files': 'files',
            'file-browser': 'files', // Legacy support
            'settings': 'settings',
            'admin-test-data': 'admin'
        };
        
        return pageMap[filename] || 'dashboard';
    }

    /**
     * Initialize navigation
     */
    async init() {
        await this.loadSharedNavigation();
        this.setActiveState();
        this.setupLogoutHandler();
        this.showAdminLinkIfDevelopment();
        // Don't update user info in navigation - only in dropdown
        // this.updateUserInfo();
    }

    /**
     * Load shared navigation component
     */
    async loadSharedNavigation() {
        try {
            // Find navigation container or create one
            let navContainer = document.querySelector('.sidebar-nav-container');
            
            if (!navContainer) {
                // Look for existing navigation to replace
                const existingNav = document.querySelector('.sidebar-nav, .nav-sidebar');
                if (existingNav) {
                    navContainer = document.createElement('div');
                    navContainer.className = 'sidebar-nav-container';
                    existingNav.parentNode.replaceChild(navContainer, existingNav);
                } else {
                    console.warn('No navigation container found');
                    return;
                }
            }

            // Load shared navigation HTML
            const response = await fetch('../components/shared-sidebar.html');
            if (response.ok) {
                const navigationHTML = await response.text();
                navContainer.innerHTML = navigationHTML;
                console.log('✅ Shared navigation loaded successfully');
            } else {
                console.error('Failed to load shared navigation:', response.status);
            }
        } catch (error) {
            console.error('Error loading shared navigation:', error);
        }
    }

    /**
     * Set active state for current page
     */
    setActiveState() {
        // Remove any existing active states
        document.querySelectorAll('.sidebar-nav-item').forEach(item => {
            item.classList.remove('active');
        });

        // Set active state for current page
        const activeItem = document.querySelector(`[data-page="${this.currentPage}"]`);
        if (activeItem) {
            activeItem.classList.add('active');
        }
    }

    /**
     * Setup logout functionality
     */
    setupLogoutHandler() {
        // Make handleLogout available globally
        window.handleLogout = this.handleLogout.bind(this);
        
        // Make toggleUserMenu available globally
        window.toggleUserMenu = this.toggleUserMenu.bind(this);
        
        // Close user menu when clicking outside
        document.addEventListener('click', this.handleOutsideClick.bind(this));
    }

    /**
     * Handle logout functionality
     */
    handleLogout(event) {
        event.preventDefault();
        
        // Clear user session data
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userName');
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('authToken');
        
        // Clear any other auth-related data
        sessionStorage.clear();
        
        // Show logout confirmation
        console.log('🚪 User logged out successfully');
        
        // Redirect to auth page
        window.location.href = 'auth.html';
    }

    /**
     * Show admin link if in development environment
     */
    showAdminLinkIfDevelopment() {
        // Check if we're in development environment
        const isDevelopment = window.location.hostname === 'localhost' || 
                            window.location.hostname === '127.0.0.1' ||
                            window.location.hostname.includes('dev') ||
                            window.location.port === '8357';
        
        if (isDevelopment) {
            const adminLink = document.querySelector('.admin-only');
            if (adminLink) {
                adminLink.style.display = 'flex';
                console.log('🛠️ Admin link enabled in development environment');
            }
        }
    }

    /**
     * Toggle user menu dropdown
     */
    toggleUserMenu(event) {
        event.preventDefault();
        event.stopPropagation();
        
        const dropdown = document.getElementById('userDropdown');
        if (dropdown) {
            dropdown.classList.toggle('active');
        }
    }

    /**
     * Handle clicks outside user menu to close it
     */
    handleOutsideClick(event) {
        const userMenu = event.target.closest('.sidebar-user-menu');
        const dropdown = document.getElementById('userDropdown');
        
        if (!userMenu && dropdown && dropdown.classList.contains('active')) {
            dropdown.classList.remove('active');
        }
    }

    /**
     * Update user info in navigation
     */
    async updateUserInfo() {
        try {
            // First check localStorage
            const userEmail = localStorage.getItem('userEmail') || sessionStorage.getItem('userEmail');
            const userName = localStorage.getItem('userName') || sessionStorage.getItem('userName');
            
            if (userEmail) {
                // Update all user name/email displays
                const userNameElements = document.querySelectorAll('.user-name, .username, .current-user');
                const userEmailElements = document.querySelectorAll('.user-email');
                
                userNameElements.forEach(el => {
                    el.textContent = userName || userEmail.split('@')[0];
                });
                
                userEmailElements.forEach(el => {
                    el.textContent = userEmail;
                });
                
                console.log('✅ Updated navigation with user:', userEmail);
            } else {
                // Try to get from Firebase auth
                const checkFirebaseAuth = async () => {
                    try {
                        const { auth } = await import('./firebase-config.js');
                        
                        auth.onAuthStateChanged(user => {
                            if (user) {
                                // Update displays with Firebase user
                                const userNameElements = document.querySelectorAll('.user-name, .username, .current-user');
                                const userEmailElements = document.querySelectorAll('.user-email');
                                
                                userNameElements.forEach(el => {
                                    el.textContent = user.displayName || user.email.split('@')[0];
                                });
                                
                                userEmailElements.forEach(el => {
                                    el.textContent = user.email;
                                });
                                
                                console.log('✅ Updated navigation with Firebase user:', user.email);
                                
                                // Save to localStorage for next time
                                localStorage.setItem('userEmail', user.email);
                                localStorage.setItem('userName', user.displayName || user.email.split('@')[0]);
                            }
                        });
                    } catch (error) {
                        console.warn('Could not import Firebase:', error);
                    }
                };
                
                checkFirebaseAuth();
            }
        } catch (error) {
            console.error('Error updating user info:', error);
        }
    }
}

// Auto-initialize only once when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new NavigationManager();
    });
} else {
    // DOM already loaded
    new NavigationManager();
}