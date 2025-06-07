// Knowledge Symphony Dashboard JavaScript

import { guardPage, getCurrentUser, signOut } from './auth-guard.js';
import { getUserMemories } from './memory-service.js';

document.addEventListener('DOMContentLoaded', async function() {
    // Check authentication
    const allowed = await guardPage({
        requireVerified: true,
        redirectTo: '/pages/auth.html'
    });
    
    if (!allowed) {
        return; // Stop execution if not authenticated
    }
    
    // Initialize dashboard
    await initializeDashboard();
    setupEventListeners();
    animateElements();
});

// Initialize dashboard with user data
async function initializeDashboard() {
    try {
        // Get current user
        const currentUser = await getCurrentUser();
        if (currentUser) {
            updateUserInfo(currentUser);
            await loadMemoryCounts(currentUser.uid);
        }
    } catch (error) {
        console.error('Error initializing dashboard:', error);
    }
}

// Update user information in UI
function updateUserInfo(user) {
    const userName = document.getElementById('userName');
    const userAvatar = document.getElementById('userAvatar');
    
    if (userName) {
        userName.textContent = user.name || user.email || 'User';
    }
    
    if (userAvatar && user.name) {
        const initials = user.name.split(' ').map(n => n[0]).join('');
        userAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=3498DB&color=FFFFFF`;
    }
}

// Load memory counts for each category
async function loadMemoryCounts(userId) {
    try {
        // For now, use mock data until we implement category filtering
        const mockCounts = {
            recent: 12,
            moments: 34,
            people: 28,
            places: 19,
            projects: 7,
            insights: 15
        };
        
        // Update UI with counts
        Object.keys(mockCounts).forEach(category => {
            const countElement = document.getElementById(`${category}Count`);
            if (countElement) {
                animateCount(countElement, mockCounts[category]);
            }
        });
        
        // In production, this would fetch real data:
        // const memories = await getUserMemories(userId);
        // categorizeAndCount(memories);
    } catch (error) {
        console.error('Error loading memory counts:', error);
    }
}

// Animate count numbers
function animateCount(element, finalValue) {
    const duration = 1000;
    const steps = 30;
    const increment = finalValue / steps;
    let current = 0;
    let step = 0;
    
    const timer = setInterval(() => {
        current += increment;
        step++;
        
        if (step >= steps) {
            element.textContent = finalValue;
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current);
        }
    }, duration / steps);
}

// Setup event listeners
function setupEventListeners() {
    // Sidebar navigation
    const sidebarItems = document.querySelectorAll('.sidebar-nav-item');
    sidebarItems.forEach(item => {
        item.addEventListener('click', function() {
            const page = this.dataset.page;
            handleSidebarNavigation(page);
        });
    });
    
    // Category tiles
    const tiles = document.querySelectorAll('.category-tile');
    tiles.forEach(tile => {
        tile.addEventListener('click', function() {
            const category = this.dataset.category;
            handleCategoryClick(category);
        });
    });
    
    // Add memory button
    const addMemoryBtn = document.getElementById('addMemoryBtn');
    if (addMemoryBtn) {
        addMemoryBtn.addEventListener('click', handleAddMemory);
    }
    
    // User info click (for menu/logout)
    const userInfo = document.querySelector('.user-info');
    if (userInfo) {
        userInfo.addEventListener('click', handleUserMenuClick);
    }
}

// Handle sidebar navigation
function handleSidebarNavigation(page) {
    // Remove active class from all items
    document.querySelectorAll('.sidebar-nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Add active class to clicked item
    document.querySelector(`[data-page="${page}"]`).classList.add('active');
    
    // Navigate to appropriate page
    const pageUrls = {
        dashboard: '/pages/dashboard.html',
        memories: '#', // Placeholder
        people: '#', // Placeholder  
        explore: '/pages/explore.html',
        talk: '/pages/talk-to-twin.html',
        settings: '/pages/settings.html'
    };
    
    if (pageUrls[page] && pageUrls[page] !== '#') {
        window.location.href = pageUrls[page];
    } else {
        showNotification(`${page.charAt(0).toUpperCase() + page.slice(1)} page coming soon!`);
    }
}

// Handle category tile clicks
function handleCategoryClick(category) {
    console.log(`Clicked category: ${category}`);
    
    // Show loading state
    const tile = document.querySelector(`[data-category="${category}"]`);
    tile.classList.add('tile-loading');
    
    // Navigate to appropriate page or show category view
    setTimeout(() => {
        tile.classList.remove('tile-loading');
        
        // For now, show alert. In production, navigate to category page
        const messages = {
            recent: 'Viewing your recent memories from the last 7 days...',
            moments: 'Exploring your key life moments...',
            people: 'Discovering connections with people in your life...',
            places: 'Journeying through places you\'ve been...',
            projects: 'Reviewing your achievements and projects...',
            insights: 'Uncovering patterns and themes in your memories...'
        };
        
        showNotification(messages[category] || 'Loading category...');
    }, 800);
}

// Handle add memory button click
function handleAddMemory() {
    // Navigate to Winston interview
    window.location.href = '../pages/meet-winston.html';
}

// Handle user menu click
function handleUserMenuClick() {
    // Create dropdown menu
    const existingMenu = document.querySelector('.user-dropdown');
    if (existingMenu) {
        existingMenu.remove();
        return;
    }
    
    const dropdown = document.createElement('div');
    dropdown.className = 'user-dropdown';
    dropdown.innerHTML = `
        <div class="dropdown-item" id="profileBtn">
            <span>👤</span> Profile
        </div>
        <div class="dropdown-item" id="settingsBtn">
            <span>⚙️</span> Settings
        </div>
        <div class="dropdown-divider"></div>
        <div class="dropdown-item" id="logoutBtn">
            <span>🚪</span> Logout
        </div>
    `;
    
    // Style the dropdown
    dropdown.style.cssText = `
        position: absolute;
        top: 60px;
        right: 2rem;
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        padding: 0.5rem 0;
        min-width: 180px;
        z-index: 200;
    `;
    
    document.querySelector('.symphony-nav').appendChild(dropdown);
    
    // Add click handlers
    document.getElementById('profileBtn')?.addEventListener('click', () => {
        showNotification('Profile page coming soon!');
        dropdown.remove();
    });
    
    document.getElementById('settingsBtn')?.addEventListener('click', () => {
        window.location.href = '../pages/settings.html';
    });
    
    document.getElementById('logoutBtn')?.addEventListener('click', async () => {
        if (confirm('Are you sure you want to logout?')) {
            await signOut();
        }
    });
    
    // Close dropdown when clicking outside
    setTimeout(() => {
        document.addEventListener('click', function closeDropdown(e) {
            if (!dropdown.contains(e.target) && !e.target.closest('.user-info')) {
                dropdown.remove();
                document.removeEventListener('click', closeDropdown);
            }
        });
    }, 100);
}

// Show notification
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existing = document.querySelector('.dashboard-notification');
    if (existing) {
        existing.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = `dashboard-notification ${type}`;
    notification.textContent = message;
    
    // Style the notification
    notification.style.cssText = `
        position: fixed;
        bottom: 2rem;
        left: 50%;
        transform: translateX(-50%);
        background: ${type === 'success' ? '#27AE60' : '#3498DB'};
        color: white;
        padding: 1rem 2rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        z-index: 1000;
        animation: slideUp 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Remove after delay
    setTimeout(() => {
        notification.style.animation = 'slideDown 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Animate elements on load
function animateElements() {
    // Add animation classes
    const tiles = document.querySelectorAll('.category-tile');
    tiles.forEach((tile, index) => {
        tile.style.opacity = '0';
        setTimeout(() => {
            tile.style.opacity = '1';
        }, 100 * index);
    });
}

// Add animation keyframes
const style = document.createElement('style');
style.textContent = `
    @keyframes slideUp {
        from {
            transform: translateX(-50%) translateY(100%);
            opacity: 0;
        }
        to {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
        }
    }
    
    @keyframes slideDown {
        from {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
        }
        to {
            transform: translateX(-50%) translateY(100%);
            opacity: 0;
        }
    }
    
    .dropdown-item {
        padding: 0.75rem 1.5rem;
        cursor: pointer;
        transition: background-color 0.2s;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.9rem;
        color: #2C3E50;
    }
    
    .dropdown-item:hover {
        background-color: #F5F8FA;
    }
    
    .dropdown-divider {
        height: 1px;
        background: #E1E8ED;
        margin: 0.5rem 0;
    }
`;
document.head.appendChild(style);