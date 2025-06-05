// Auth Page JavaScript

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
        button.addEventListener('click', function(e) {
            e.preventDefault();
            // In production, this would initiate OAuth flow
            console.log('Google auth clicked');
            // For demo, just show message
            showNotification('Google authentication would happen here');
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
    
    // Handle signup
    function handleSignup(formData) {
        const name = formData.get('name');
        const email = formData.get('email');
        const password = formData.get('password');
        
        // Basic validation
        if (password.length < 8) {
            showNotification('Password must be at least 8 characters', 'error');
            return;
        }
        
        // In production, this would make API call
        console.log('Signup:', { name, email });
        showNotification('Welcome to Infitwin! Redirecting to your dashboard...');
        
        // Simulate redirect after delay
        setTimeout(() => {
            // Would redirect to dashboard
            window.location.href = './dashboard.html';
        }, 2000);
    }
    
    // Handle login
    function handleLogin(formData) {
        const email = formData.get('email');
        const password = formData.get('password');
        const remember = formData.get('remember');
        
        // In production, this would make API call
        console.log('Login:', { email, remember: !!remember });
        showNotification('Welcome back! Loading your memories...');
        
        // Simulate redirect after delay
        setTimeout(() => {
            // Would redirect to dashboard
            window.location.href = './dashboard.html';
        }, 2000);
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
    
    // Password visibility toggle (optional enhancement)
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
        forgotLink.addEventListener('click', function(e) {
            e.preventDefault();
            showNotification('Password reset functionality coming soon');
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