// Working Auth Page JavaScript with Firebase Integration
// Based on ui-studio's working implementation

// Since we can't use ES6 imports directly in the browser without a bundler,
// we'll use a different approach that works for static HTML

document.addEventListener('DOMContentLoaded', async function() {
    console.log('Initializing authentication...');
    
    // Wait for Firebase to be available (loaded from CDN in HTML)
    if (typeof firebase === 'undefined') {
        console.error('Firebase SDK not loaded. Make sure to include Firebase scripts in HTML.');
        return;
    }
    
    // Get Firebase services from the global firebase object
    const auth = firebase.auth();
    
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
    
    // Handle login form submission
    const loginFormElement = document.querySelector('#login-form form');
    if (loginFormElement) {
        loginFormElement.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = document.querySelector('.login-email').value;
            const password = document.querySelector('.login-password').value;
            
            console.log('Attempting login for:', email);
            showNotification('Logging in...', 'info');
            
            try {
                // Sign in with Firebase
                const userCredential = await auth.signInWithEmailAndPassword(email, password);
                const user = userCredential.user;
                
                console.log('Login successful:', user);
                
                // Store user data
                localStorage.setItem('userName', user.displayName || email.split('@')[0]);
                localStorage.setItem('userEmail', email);
                localStorage.setItem('userId', user.uid);
                localStorage.setItem('isAuthenticated', 'true');
                
                showNotification('Login successful! Redirecting to dashboard...', 'success');
                
                // Redirect to dashboard
                setTimeout(() => {
                    window.location.href = './dashboard.html';
                }, 1500);
                
            } catch (error) {
                console.error('Login error:', error);
                showNotification(getErrorMessage(error), 'error');
            }
        });
    }
    
    // Handle signup form submission
    const signupFormElement = document.querySelector('#signup-form form');
    if (signupFormElement) {
        signupFormElement.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const name = e.target.name.value;
            const email = e.target.email.value;
            const password = e.target.password.value;
            
            // Basic validation
            if (password.length < 6) {
                showNotification('Password must be at least 6 characters', 'error');
                return;
            }
            
            try {
                // Create user with Firebase
                const userCredential = await auth.createUserWithEmailAndPassword(email, password);
                const user = userCredential.user;
                
                // Update display name
                await user.updateProfile({
                    displayName: name
                });
                
                // Send verification email
                await user.sendEmailVerification();
                
                // Store user data
                localStorage.setItem('userName', name);
                localStorage.setItem('userEmail', email);
                
                showNotification('Account created! Please check your email to verify your account.', 'success');
                
                // Redirect to email verification page or dashboard
                setTimeout(() => {
                    window.location.href = './dashboard.html';
                }, 2000);
            } catch (error) {
                console.error('Signup error:', error);
                showNotification(getErrorMessage(error), 'error');
            }
        });
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
            background: ${type === 'error' ? '#ef4444' : type === 'info' ? '#3b82f6' : '#10b981'};
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
        if (type !== 'info') {
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
            case 'auth/invalid-email':
                return 'Please enter a valid email address.';
            case 'auth/weak-password':
                return 'Password should be at least 6 characters.';
            case 'auth/email-already-in-use':
                return 'This email is already registered. Please login instead.';
            case 'auth/network-request-failed':
                return 'Network error. Please check your connection.';
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
                const provider = new firebase.auth.GoogleAuthProvider();
                const result = await auth.signInWithPopup(provider);
                const user = result.user;
                
                showNotification('Welcome to Infitwin! Redirecting to your dashboard...', 'success');
                
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