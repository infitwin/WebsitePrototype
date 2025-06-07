/**
 * Auth Guard Utility
 * 
 * Protects routes by checking authentication status and redirecting
 * unauthenticated users to the login page.
 */

import { auth } from './firebase-config.js';
import { onAuthStateChanged } from 'firebase/auth';

/**
 * Check if user is authenticated
 * @returns {Promise<boolean>} True if authenticated, false otherwise
 */
export async function isAuthenticated() {
    return new Promise((resolve) => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            unsubscribe(); // Unsubscribe after first check
            resolve(!!user);
        });
    });
}

/**
 * Check if user's email is verified
 * @returns {Promise<boolean>} True if verified, false otherwise
 */
export async function isEmailVerified() {
    return new Promise((resolve) => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            unsubscribe(); // Unsubscribe after first check
            resolve(user ? user.emailVerified : false);
        });
    });
}

/**
 * Guard a page - redirect to login if not authenticated
 * @param {Object} options - Guard options
 * @param {boolean} options.requireVerified - Require email verification
 * @param {string} options.redirectTo - Custom redirect URL
 * @param {boolean} options.allowUnverified - Allow unverified emails (for verification page)
 */
export async function guardPage(options = {}) {
    const {
        requireVerified = true,
        redirectTo = '/pages/auth.html',
        allowUnverified = false
    } = options;
    
    try {
        const authenticated = await isAuthenticated();
        
        if (!authenticated) {
            // Redirect to login
            window.location.href = redirectTo;
            return false;
        }
        
        if (requireVerified && !allowUnverified) {
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
    return new Promise((resolve) => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            unsubscribe(); // Unsubscribe after first check
            if (user) {
                // Return sanitized user data
                resolve({
                    uid: user.uid,
                    email: user.email,
                    emailVerified: user.emailVerified,
                    displayName: user.displayName,
                    photoURL: user.photoURL,
                    // Include custom user data from localStorage if available
                    name: localStorage.getItem('userName') || user.displayName || user.email
                });
            } else {
                resolve(null);
            }
        });
    });
}

/**
 * Add auth state listener
 * @param {Function} callback - Called with user object or null
 * @returns {Function} Unsubscribe function
 */
export function onAuthStateChange(callback) {
    return onAuthStateChanged(auth, (user) => {
        if (user) {
            // Pass sanitized user data
            callback({
                uid: user.uid,
                email: user.email,
                emailVerified: user.emailVerified,
                displayName: user.displayName,
                photoURL: user.photoURL,
                name: localStorage.getItem('userName') || user.displayName || user.email
            });
        } else {
            callback(null);
        }
    });
}

/**
 * Sign out the current user
 */
export async function signOut() {
    try {
        await auth.signOut();
        // Clear any local storage
        localStorage.removeItem('userName');
        localStorage.removeItem('userEmail');
        // Redirect to home
        window.location.href = '/';
    } catch (error) {
        console.error('Sign out error:', error);
        throw error;
    }
}