// Auth Page JavaScript - Working version with CDN Firebase
console.log('Initializing authentication...');

// Wait for Firebase to be available
function waitForFirebase() {
    return new Promise((resolve) => {
        if (window.firebase) {
            resolve();
        } else {
            setTimeout(() => waitForFirebase().then(resolve), 100);
        }
    });
}

// Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyB0SdtkO7ngsXP7B0geafpDv_xEBAujel8",
    authDomain: "infitwin.firebaseapp.com",
    projectId: "infitwin",
    storageBucket: "infitwin.firebasestorage.app",
    messagingSenderId: "833139648849",
    appId: "1:833139648849:web:2768d8e37cf2a318018b70"
};

let auth;

document.addEventListener('DOMContentLoaded', async function() {
    console.log('DOM loaded, waiting for Firebase...');
    
    // Wait for Firebase to be available
    await waitForFirebase();
    console.log('Firebase loaded, initializing app...');
    
    // Initialize Firebase (v8 syntax)
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    auth = firebase.auth();
    
    console.log('Firebase initialized, setting up buttons...');
    
    // Wait for Button component to be available (loaded as module)
    function waitForButton() {
        return new Promise((resolve) => {
            if (window.Button) {
                resolve(window.Button);
            } else {
                setTimeout(() => waitForButton().then(resolve), 100);
            }
        });
    }
    
    const Button = await waitForButton();
    console.log('Button component loaded');
    
    // Initialize buttons using the centralized component
    initializeButtons(Button);
    
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
            
            const isLogin = this.closest('#login-form');
            if (isLogin) {
                handleLogin(e);
            } else {
                handleSignup(e);
            }
        });
    });
    
    console.log('Auth page fully initialized');
    
    function initializeButtons(Button) {
        console.log('Creating buttons...');
        
        // Login Submit Button - PRIORITY FIX
        const loginSubmitContainer = document.getElementById('login-submit-button');
        if (loginSubmitContainer) {
            const loginSubmitBtn = Button.primary({
                text: 'Access Your Memories',
                fullWidth: true,
                htmlType: 'submit'
            });
            loginSubmitContainer.appendChild(loginSubmitBtn.element);
            console.log('✅ Login button created and added');
        } else {
            console.error('❌ login-submit-button container not found');
        }
        
        // Signup Submit Button
        const signupSubmitContainer = document.getElementById('signup-submit-button');
        if (signupSubmitContainer) {
            const signupSubmitBtn = Button.primary({
                text: 'Create Your Archive',
                fullWidth: true,
                htmlType: 'submit'
            });
            signupSubmitContainer.appendChild(signupSubmitBtn.element);
            console.log('✅ Signup button created');
        }
    }
    
    // Email login
    async function handleLogin(e) {
        e.preventDefault();
        console.log('Handling login...');
        
        const email = document.querySelector('.login-email').value;
        const password = document.querySelector('.login-password').value;
        
        if (!email || !password) {
            showNotification('Please enter email and password', 'error');
            return;
        }
        
        try {
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            // Store user data
            localStorage.setItem('userName', user.displayName || email.split('@')[0]);
            localStorage.setItem('userEmail', email);
            
            showNotification('Welcome back! Loading your memories...');
            
            // Redirect to dashboard
            setTimeout(() => {
                window.location.href = './dashboard.html';
            }, 1500);
        } catch (error) {
            console.error('Login error:', error);
            showNotification('Invalid email or password', 'error');
        }
    }
    
    // Email signup
    async function handleSignup(e) {
        e.preventDefault();
        
        const name = document.getElementById('signup-name').value;
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        // Validation
        if (password !== confirmPassword) {
            showNotification('Passwords do not match', 'error');
            return;
        }
        
        try {
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            // Store user data
            localStorage.setItem('userName', name);
            localStorage.setItem('userEmail', email);
            
            showNotification('Account created! Redirecting to your dashboard...');
            
            // Redirect to dashboard
            setTimeout(() => {
                window.location.href = './dashboard.html';
            }, 1500);
        } catch (error) {
            console.error('Signup error:', error);
            showNotification('Failed to create account. Please try again.', 'error');
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
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 1000;
            max-width: 300px;
            ${type === 'error' ? 'background: #EF4444;' : 'background: #10B981;'}
        `;
        
        // Add to page
        document.body.appendChild(notification);
        
        // Remove after delay
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
});