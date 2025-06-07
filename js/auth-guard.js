/**
 * Auth Guard Utility
 * 
 * Protects routes by checking authentication status and redirecting
 * unauthenticated users to the login page.
 */

// TODO: Import Firebase auth when SDK is added
// import { auth } from './firebase-config.js';
// import { onAuthStateChanged } from 'firebase/auth';

/**
 * Check if user is authenticated
 * @returns {Promise<boolean>} True if authenticated, false otherwise
 */
export async function isAuthenticated() {
    // TODO: Replace with Firebase auth check
    // return new Promise((resolve) => {
    //     onAuthStateChanged(auth, (user) => {
    //         resolve(!!user);
    //     });
    // });
    
    // Temporary: Check localStorage (to be replaced)
    const authData = localStorage.getItem('infitwin_auth');
    return Promise.resolve(!!authData);
}

/**
 * Check if user's email is verified
 * @returns {Promise<boolean>} True if verified, false otherwise
 */
export async function isEmailVerified() {
    // TODO: Replace with Firebase check
    // return new Promise((resolve) => {
    //     onAuthStateChanged(auth, (user) => {
    //         resolve(user ? user.emailVerified : false);
    //     });
    // });
    
    // Temporary implementation
    return Promise.resolve(true);
}

/**
 * Guard a page - redirect to login if not authenticated
 * @param {Object} options - Guard options
 * @param {boolean} options.requireVerified - Require email verification
 * @param {string} options.redirectTo - Custom redirect URL
 */
export async function guardPage(options = {}) {
    const {
        requireVerified = true,
        redirectTo = '/pages/auth.html'
    } = options;
    
    try {
        const authenticated = await isAuthenticated();
        
        if (!authenticated) {
            // Redirect to login
            window.location.href = redirectTo;
            return false;
        }
        
        if (requireVerified) {
            const verified = await isEmailVerified();
            if (!verified) {
                // Redirect to email verification
                window.location.href = '/pages/email-verification.html';
                return false;
            }
        }
        
        return true;
    } catch (error) {
        console.error('Auth guard error:', error);
        window.location.href = redirectTo;
        return false;
    }
}

/**
 * Get current user data
 * @returns {Promise<Object|null>} User object or null
 */
export async function getCurrentUser() {
    // TODO: Replace with Firebase implementation
    // return new Promise((resolve) => {
    //     onAuthStateChanged(auth, (user) => {
    //         resolve(user);
    //     });
    // });
    
    // Temporary implementation
    const authData = localStorage.getItem('infitwin_auth');
    if (authData) {
        try {
            return JSON.parse(authData);
        } catch {
            return null;
        }
    }
    return null;
}

/**
 * Add auth state listener
 * @param {Function} callback - Called with user object or null
 * @returns {Function} Unsubscribe function
 */
export function onAuthStateChange(callback) {
    // TODO: Replace with Firebase implementation
    // return onAuthStateChanged(auth, callback);
    
    // Temporary implementation
    const checkAuth = () => {
        const authData = localStorage.getItem('infitwin_auth');
        callback(authData ? JSON.parse(authData) : null);
    };
    
    // Check immediately
    checkAuth();
    
    // Check on storage events
    const handler = (e) => {
        if (e.key === 'infitwin_auth') {
            checkAuth();
        }
    };
    
    window.addEventListener('storage', handler);
    
    // Return unsubscribe function
    return () => {
        window.removeEventListener('storage', handler);
    };
}