// Auth Page JavaScript with Firebase Integration

import { auth } from './firebase-config.js';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword,
    sendEmailVerification,
    GoogleAuthProvider,
    signInWithPopup,
    sendPasswordResetEmail
} from 'firebase/auth';

document.addEventListener('DOMContentLoaded', function() {
    // Tab switching functionality
    const tabButtons = document.querySelectorAll('.tab-button');
    const signupForm = document.getElementById('signup-form');
    const loginForm = document.getElementById('login-form');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-tab');
            
            // Update active tab
            tabButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Show corresponding form
            if (targetTab === 'signup') {
                signupForm.classList.remove('hidden');
                loginForm.classList.add('hidden');
            } else {
                loginForm.classList.remove('hidden');
                signupForm.classList.add('hidden');
            }
        });
    });
    
    // Google Auth Handler
    const googleButtons = document.querySelectorAll('.google-auth-button');
    googleButtons.forEach(button => {
        button.addEventListener('click', async function(e) {
            e.preventDefault();
            
            try {
                const provider = new GoogleAuthProvider();
                const result = await signInWithPopup(auth, provider);
                const user = result.user;
                
                showNotification('Welcome to Infitwin! Redirecting to your dashboard...');
                
                // Store user data
                localStorage.setItem('userName', user.displayName || user.email);
                localStorage.setItem('userEmail', user.email);
                
                // Redirect to dashboard
                setTimeout(() => {
                    window.location.href = './pages/dashboard.html';
                }, 1500);
            } catch (error) {
                console.error('Google auth error:', error);
                showNotification(getErrorMessage(error), 'error');
            }
        });
    });
    
    // Form submissions
    const forms = document.querySelectorAll('.auth-form');
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(form);
            const isSignup = form.closest('#signup-form') !== null;
            
            if (isSignup) {
                handleSignup(formData);
            } else {
                handleLogin(formData);
            }
        });
    });
    
    // Handle signup with Firebase
    async function handleSignup(formData) {
        const name = formData.get('name');
        const email = formData.get('email');
        const password = formData.get('password');
        
        // Basic validation
        if (password.length < 8) {
            showNotification('Password must be at least 8 characters', 'error');
            return;
        }
        
        try {
            // Create user with Firebase
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            // Send verification email
            await sendEmailVerification(user);
            
            // Store user data
            localStorage.setItem('userName', name);
            localStorage.setItem('userEmail', email);
            
            showNotification('Account created! Please check your email to verify your account.');
            
            // Redirect to email verification page
            setTimeout(() => {
                window.location.href = './email-verification.html';
            }, 2000);
        } catch (error) {
            console.error('Signup error:', error);
            showNotification(getErrorMessage(error), 'error');
        }
    }
    
    // Handle login with Firebase
    async function handleLogin(formData) {
        const email = formData.get('email');
        const password = formData.get('password');
        const remember = formData.get('remember');
        
        try {
            // Sign in with Firebase
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            // Check if email is verified
            if (!user.emailVerified) {
                showNotification('Please verify your email before logging in. Check your inbox.', 'error');
                await auth.signOut();
                return;
            }
            
            // Store user data
            localStorage.setItem('userName', user.displayName || email.split('@')[0]);
            localStorage.setItem('userEmail', email);
            
            showNotification('Welcome back! Loading your memories...');
            
            // Redirect to dashboard
            setTimeout(() => {
                window.location.href = './pages/dashboard.html';
            }, 1500);
        } catch (error) {
            console.error('Login error:', error);
            showNotification(getErrorMessage(error), 'error');
        }
    }
    
    // Show notification
    function showNotification(message, type = 'success') {
        // Remove existing notifications
        const existing = document.querySelector('.auth-notification');
        if (existing) {
            existing.remove();
        }
        
        // Create notification
        const notification = document.createElement('div');
        notification.className = `auth-notification ${type}`;
        notification.textContent = message;
        
        // Add to page
        document.querySelector('.auth-card').appendChild(notification);
        
        // Remove after delay
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
    
    // Get user-friendly error messages
    function getErrorMessage(error) {
        switch (error.code) {
            case 'auth/email-already-in-use':
                return 'This email is already registered. Please login instead.';
            case 'auth/invalid-email':
                return 'Please enter a valid email address.';
            case 'auth/weak-password':
                return 'Password should be at least 6 characters.';
            case 'auth/user-not-found':
                return 'No account found with this email.';
            case 'auth/wrong-password':
                return 'Incorrect password. Please try again.';
            case 'auth/network-request-failed':
                return 'Network error. Please check your connection.';
            case 'auth/too-many-requests':
                return 'Too many failed attempts. Please try again later.';
            case 'auth/popup-closed-by-user':
                return 'Google sign-in was cancelled.';
            default:
                return 'An error occurred. Please try again.';
        }
    }
    
    // Password visibility toggle
    const passwordInputs = document.querySelectorAll('input[type="password"]');
    passwordInputs.forEach(input => {
        const wrapper = document.createElement('div');
        wrapper.className = 'password-wrapper';
        input.parentNode.insertBefore(wrapper, input);
        wrapper.appendChild(input);
        
        const toggle = document.createElement('button');
        toggle.type = 'button';
        toggle.className = 'password-toggle';
        toggle.innerHTML = '👁️';
        toggle.setAttribute('aria-label', 'Toggle password visibility');
        wrapper.appendChild(toggle);
        
        toggle.addEventListener('click', function() {
            if (input.type === 'password') {
                input.type = 'text';
                toggle.innerHTML = '👁️‍🗨️';
            } else {
                input.type = 'password';
                toggle.innerHTML = '👁️';
            }
        });
    });
    
    // Forgot password handler
    const forgotLink = document.querySelector('.forgot-link');
    if (forgotLink) {
        forgotLink.addEventListener('click', async function(e) {
            e.preventDefault();
            
            const email = document.querySelector('.login-email').value;
            if (!email) {
                showNotification('Please enter your email address first', 'error');
                return;
            }
            
            try {
                await sendPasswordResetEmail(auth, email);
                showNotification('Password reset email sent! Check your inbox.');
            } catch (error) {
                console.error('Password reset error:', error);
                showNotification(getErrorMessage(error), 'error');
            }
        });
    }
    
    // Check for redirect from Memory Archive
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('action') === 'build-archive') {
        // Switch to signup tab
        document.querySelector('[data-tab="signup"]').click();
        showNotification('Create your account to start building your memory archive!', 'info');
    }
});

// Add notification styles dynamically
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    .auth-notification {
        position: absolute;
        top: -60px;
        left: 50%;
        transform: translateX(-50%);
        padding: 1rem 2rem;
        background: #4CAF50;
        color: white;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 500;
        animation: slideDown 0.3s ease;
        z-index: 1000;
    }
    
    .auth-notification.error {
        background: #f44336;
    }
    
    .auth-notification.info {
        background: #2196F3;
    }
    
    .auth-notification.fade-out {
        animation: slideUp 0.3s ease;
    }
    
    @keyframes slideDown {
        from {
            transform: translateX(-50%) translateY(-20px);
            opacity: 0;
        }
        to {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
        }
    }
    
    @keyframes slideUp {
        from {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
        }
        to {
            transform: translateX(-50%) translateY(-20px);
            opacity: 0;
        }
    }
    
    .password-wrapper {
        position: relative;
    }
    
    .password-toggle {
        position: absolute;
        right: 1rem;
        top: 50%;
        transform: translateY(-50%);
        background: none;
        border: none;
        cursor: pointer;
        font-size: 1.2rem;
        opacity: 0.5;
        transition: opacity 0.2s;
    }
    
    .password-toggle:hover {
        opacity: 0.8;
    }
`;
document.head.appendChild(notificationStyles);