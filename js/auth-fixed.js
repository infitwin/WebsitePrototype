// Fixed Auth Page JavaScript with Firebase Integration

// Import Firebase from CDN
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { 
    getAuth,
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword,
    sendEmailVerification,
    GoogleAuthProvider,
    signInWithPopup,
    sendPasswordResetEmail
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyB0SdtkO7ngsXP7B0geafpDv_xEBAujel8",
    authDomain: "infitwin.firebaseapp.com",
    projectId: "infitwin",
    storageBucket: "infitwin.firebasestorage.app",
    messagingSenderId: "833139648849",
    appId: "1:833139648849:web:2768d8e37cf2a318018b70",
    measurementId: "G-PEJN4ZMCZ6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

document.addEventListener('DOMContentLoaded', function() {
    console.log('Auth page loaded, Firebase initialized');
    
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
    
    // Handle login
    async function handleLogin(formData) {
        const email = formData.get('email');
        const password = formData.get('password');
        
        console.log('Attempting login for:', email);
        showNotification('Logging in...');
        
        try {
            // Sign in with Firebase
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            console.log('Login successful:', user);
            
            // Store user data
            localStorage.setItem('userName', user.displayName || email.split('@')[0]);
            localStorage.setItem('userEmail', email);
            localStorage.setItem('userId', user.uid);
            localStorage.setItem('isAuthenticated', 'true');
            
            showNotification('Login successful! Redirecting to dashboard...');
            
            // Redirect to dashboard
            setTimeout(() => {
                window.location.href = './dashboard.html';
            }, 1500);
            
        } catch (error) {
            console.error('Login error:', error);
            showNotification(getErrorMessage(error), 'error');
        }
    }
    
    // Handle signup
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
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            padding: 16px 32px;
            background: ${type === 'error' ? '#ef4444' : '#10b981'};
            color: white;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        notification.textContent = message;
        
        // Add to page
        document.body.appendChild(notification);
        
        // Remove after delay
        if (type !== 'loading') {
            setTimeout(() => {
                notification.style.opacity = '0';
                notification.style.transition = 'opacity 0.3s ease';
                setTimeout(() => notification.remove(), 300);
            }, 3000);
        }
    }
    
    // Get user-friendly error messages
    function getErrorMessage(error) {
        switch (error.code) {
            case 'auth/invalid-credential':
            case 'auth/wrong-password':
            case 'auth/user-not-found':
                return 'Invalid email or password. Please try again.';
            case 'auth/email-already-in-use':
                return 'This email is already registered. Please login instead.';
            case 'auth/invalid-email':
                return 'Please enter a valid email address.';
            case 'auth/weak-password':
                return 'Password should be at least 6 characters.';
            case 'auth/network-request-failed':
                return 'Network error. Please check your connection.';
            case 'auth/too-many-requests':
                return 'Too many failed attempts. Please try again later.';
            default:
                return 'Authentication error: ' + error.message;
        }
    }
    
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
                localStorage.setItem('userId', user.uid);
                localStorage.setItem('isAuthenticated', 'true');
                
                // Redirect to dashboard
                setTimeout(() => {
                    window.location.href = './dashboard.html';
                }, 1500);
            } catch (error) {
                console.error('Google auth error:', error);
                showNotification(getErrorMessage(error), 'error');
            }
        });
    });
});