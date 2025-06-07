// Dashboard JavaScript

import { guardPage, getCurrentUser, signOut } from './auth-guard.js';

document.addEventListener('DOMContentLoaded', async function() {
    // Check authentication
    const allowed = await guardPage({
        requireVerified: true,
        redirectTo: '/pages/auth.html'
    });
    
    if (!allowed) {
        return; // Stop execution if not authenticated
    }
    
    // Get current user from Firebase
    const currentUser = await getCurrentUser();
    
    // Prepare user data
    const userData = {
        name: currentUser?.name || 'User',
        email: currentUser?.email || 'user@example.com',
        memoryCount: 47,
        photoCount: 234,
        familyCount: 8,
        streak: 15
    };

    // Update user info in the UI
    updateUserInfo(userData);

    // Handle navigation items
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            if (!this.classList.contains('active')) {
                // Remove active from all items
                navItems.forEach(nav => nav.classList.remove('active'));
                // Add active to clicked item
                this.classList.add('active');
                
                // Handle navigation based on clicked item
                const navText = this.querySelector('.nav-text').textContent;
                handleNavigation(navText);
            }
        });
    });

    // Handle action buttons
    document.querySelector('.action-button.primary').addEventListener('click', function() {
        // Navigate to memory creation (Winston interview)
        showToast('Starting memory creation...', 'info');
        setTimeout(() => {
            window.location.href = '../pages/meet-winston.html';
        }, 1000);
    });

    document.querySelector('.action-button.secondary').addEventListener('click', function() {
        showToast('Photo upload feature coming soon!', 'info');
    });

    // Handle quick action cards
    document.querySelectorAll('.quick-action-card').forEach(card => {
        card.addEventListener('click', function() {
            const actionTitle = this.querySelector('h4').textContent;
            handleQuickAction(actionTitle);
        });
    });

    // Handle memory cards
    document.querySelectorAll('.memory-card').forEach(card => {
        card.addEventListener('click', function() {
            const memoryTitle = this.querySelector('.memory-title').textContent;
            showToast(`Opening memory: ${memoryTitle}`, 'info');
        });
    });

    // Handle user menu
    document.querySelector('.user-menu').addEventListener('click', function() {
        toggleUserDropdown();
    });

    // Handle notifications
    document.querySelector('.nav-button.notifications').addEventListener('click', function() {
        showToast('You have 3 new family member activities', 'info');
    });

    // Animate stats on page load
    animateStats();

    // Check for achievements
    checkAchievements(userData);
});

// Update user information in the UI
function updateUserInfo(userData) {
    // Update user name
    const userName = document.querySelector('.user-name');
    if (userName) {
        userName.textContent = userData.name;
    }

    // Update welcome message
    const welcomeTitle = document.querySelector('.welcome-title');
    if (welcomeTitle) {
        welcomeTitle.textContent = `Welcome back, ${userData.name}! 👋`;
    }

    // Update avatar
    const userAvatar = document.querySelector('.user-avatar');
    if (userAvatar) {
        userAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name)}&background=FFD700&color=2C1810`;
    }

    // Update stats
    const statNumbers = document.querySelectorAll('.stat-number');
    if (statNumbers.length >= 4) {
        statNumbers[0].textContent = userData.memoryCount;
        statNumbers[1].textContent = userData.photoCount;
        statNumbers[2].textContent = userData.familyCount;
        statNumbers[3].textContent = userData.streak;
    }
}

// Handle navigation
function handleNavigation(navItem) {
    switch(navItem) {
        case 'Dashboard':
            // Already on dashboard
            break;
        case 'New Memory':
            window.location.href = '../pages/meet-winston.html';
            break;
        case 'My Memories':
            showToast('My Memories page coming soon!', 'info');
            break;
        case 'Family Tree':
            showToast('Family Tree feature coming soon!', 'info');
            break;
        case 'Life Timeline':
            showToast('Life Timeline feature coming soon!', 'info');
            break;
        case 'Settings':
            // For now, show logout option
            if (confirm('Would you like to logout?')) {
                signOut();
            }
            break;
    }
}

// Handle quick actions
function handleQuickAction(action) {
    switch(action) {
        case 'Voice Memory':
            window.location.href = '../pages/meet-winston.html';
            break;
        case 'Write Memory':
            showToast('Written memory feature coming soon!', 'info');
            break;
        case 'Organize':
            showToast('Memory organization feature coming soon!', 'info');
            break;
        case 'Share':
            showToast('Family sharing feature coming soon!', 'info');
            break;
    }
}

// Animate statistics
function animateStats() {
    const statNumbers = document.querySelectorAll('.stat-number');
    statNumbers.forEach(stat => {
        const finalValue = parseInt(stat.textContent);
        if (!isNaN(finalValue)) {
            let currentValue = 0;
            const increment = finalValue / 30;
            const counter = setInterval(() => {
                currentValue += increment;
                if (currentValue >= finalValue) {
                    stat.textContent = finalValue;
                    clearInterval(counter);
                } else {
                    stat.textContent = Math.floor(currentValue);
                }
            }, 50);
        }
    });
}

// Check for achievements
function checkAchievements(userData) {
    // Check if user has reached certain milestones
    if (userData.memoryCount === 50) {
        setTimeout(() => {
            showAchievement('Memory Keeper!', 'You\'ve captured 50 memories!');
        }, 3000);
    } else if (userData.streak === 15) {
        setTimeout(() => {
            showAchievement('Dedicated Archivist!', '15 day streak achieved!');
        }, 2000);
    }
}

// Show achievement toast
function showAchievement(title, message) {
    const toast = document.getElementById('achievement-toast');
    if (toast) {
        toast.querySelector('h4').textContent = title;
        toast.querySelector('p').textContent = message;
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 5000);
    }
}

// Show general toast notification
function showToast(message, type = 'success') {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast-notification ${type}`;
    toast.textContent = message;
    
    // Style the toast
    toast.style.cssText = `
        position: fixed;
        bottom: 2rem;
        left: 50%;
        transform: translateX(-50%) translateY(150%);
        background: ${type === 'success' ? '#10B981' : type === 'error' ? '#EF4444' : '#3B82F6'};
        color: white;
        padding: 1rem 2rem;
        border-radius: 8px;
        font-weight: 500;
        transition: transform 0.3s;
        z-index: 1000;
    `;
    
    document.body.appendChild(toast);
    
    // Show toast
    setTimeout(() => {
        toast.style.transform = 'translateX(-50%) translateY(0)';
    }, 100);
    
    // Hide and remove toast
    setTimeout(() => {
        toast.style.transform = 'translateX(-50%) translateY(150%)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Toggle user dropdown (placeholder for future implementation)
function toggleUserDropdown() {
    showToast('User menu coming soon!', 'info');
}

// Mobile sidebar toggle
function toggleSidebar() {
    const sidebar = document.querySelector('.dashboard-sidebar');
    sidebar.classList.toggle('open');
}

// Add mobile menu button handler if needed
const mobileMenuButton = document.querySelector('.mobile-menu-button');
if (mobileMenuButton) {
    mobileMenuButton.addEventListener('click', toggleSidebar);
}

// Handle logout (from user dropdown when implemented)
function handleLogout() {
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    window.location.href = '../pages/auth.html';
}