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
            'explore': 'explore', 
            'interview': 'interview',
            'curator': 'curator',
            'interview-transcripts': 'transcripts',
            'talk-to-twin': 'talk',
            'my-files': 'files',
            'file-browser': 'files', // Legacy support
            'settings': 'settings'
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
}

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new NavigationManager();
});

// Also initialize immediately if DOM is already loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new NavigationManager();
    });
} else {
    new NavigationManager();
}