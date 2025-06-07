// Email Verification Page JavaScript

import { auth } from './firebase-config.js';
import { sendEmailVerification, onAuthStateChanged } from 'firebase/auth';

document.addEventListener('DOMContentLoaded', function() {
    // Get user email from localStorage or auth state
    const storedEmail = localStorage.getItem('userEmail');
    const emailDisplay = document.querySelector('.user-email');
    const resendButton = document.querySelector('.resend-button');
    const skipButton = document.querySelector('.skip-button');
    const checkButton = document.querySelector('.check-inbox-button');
    const notification = document.querySelector('.verification-notification');
    
    let currentUser = null;
    
    // Monitor auth state
    onAuthStateChanged(auth, (user) => {
        if (user) {
            currentUser = user;
            emailDisplay.textContent = user.email;
            
            // Check if already verified
            if (user.emailVerified) {
                showNotification('Email already verified! Redirecting...', 'success');
                setTimeout(() => {
                    window.location.href = './alpha-welcome.html';
                }, 2000);
            }
        } else if (storedEmail) {
            emailDisplay.textContent = storedEmail;
        } else {
            // No user logged in, redirect to auth
            window.location.href = './auth.html';
        }
    });
    
    // Resend verification email
    if (resendButton) {
        resendButton.addEventListener('click', async function() {
            if (!currentUser) {
                showNotification('Please login first to resend verification email', 'error');
                return;
            }
            
            try {
                await sendEmailVerification(currentUser);
                showNotification('Verification email sent! Check your inbox.', 'success');
                
                // Update button state
                resendButton.disabled = true;
                resendButton.textContent = 'Email Sent';
                
                // Re-enable after 60 seconds
                setTimeout(() => {
                    resendButton.disabled = false;
                    resendButton.textContent = 'Resend Email';
                }, 60000);
            } catch (error) {
                console.error('Resend error:', error);
                showNotification(getErrorMessage(error), 'error');
            }
        });
    }
    
    // Check inbox button (refresh verification status)
    if (checkButton) {
        checkButton.addEventListener('click', async function() {
            if (!currentUser) {
                showNotification('Please login first', 'error');
                return;
            }
            
            try {
                // Reload user to get latest verification status
                await currentUser.reload();
                
                if (currentUser.emailVerified) {
                    showNotification('Email verified! Redirecting to welcome page...', 'success');
                    setTimeout(() => {
                        window.location.href = './alpha-welcome.html';
                    }, 2000);
                } else {
                    showNotification('Email not verified yet. Please check your inbox.', 'info');
                }
            } catch (error) {
                console.error('Check error:', error);
                showNotification('Error checking verification status', 'error');
            }
        });
    }
    
    // Skip verification (for testing/demo)
    if (skipButton) {
        skipButton.addEventListener('click', function() {
            // In production, this would be removed or restricted
            showNotification('Skipping verification for demo...', 'info');
            setTimeout(() => {
                window.location.href = './alpha-welcome.html';
            }, 1500);
        });
    }
    
    // Show notification
    function showNotification(message, type = 'info') {
        if (!notification) return;
        
        notification.textContent = message;
        notification.className = `verification-notification ${type} show`;
        
        // Hide after 5 seconds
        setTimeout(() => {
            notification.classList.remove('show');
        }, 5000);
    }
    
    // Get user-friendly error messages
    function getErrorMessage(error) {
        switch (error.code) {
            case 'auth/too-many-requests':
                return 'Too many requests. Please wait a moment before trying again.';
            case 'auth/user-not-found':
                return 'User not found. Please sign up first.';
            case 'auth/network-request-failed':
                return 'Network error. Please check your connection.';
            default:
                return 'An error occurred. Please try again.';
        }
    }
    
    // Auto-check verification status every 5 seconds
    let verificationCheckInterval = setInterval(async () => {
        if (currentUser) {
            await currentUser.reload();
            if (currentUser.emailVerified) {
                clearInterval(verificationCheckInterval);
                showNotification('Email verified! Redirecting...', 'success');
                setTimeout(() => {
                    window.location.href = './alpha-welcome.html';
                }, 2000);
            }
        }
    }, 5000);
    
    // Animation for email icon
    const emailIcon = document.querySelector('.email-icon');
    if (emailIcon) {
        setInterval(() => {
            emailIcon.style.transform = 'scale(1.1)';
            setTimeout(() => {
                emailIcon.style.transform = 'scale(1)';
            }, 500);
        }, 3000);
    }
});