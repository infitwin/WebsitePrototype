/**
 * Dashboard Widgets - Activity Feed and Quick Actions
 */

import { auth, db } from './firebase-config.js';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { getUserFiles } from './file-service.js';

// Project color scheme from CLAUDE.md
const COLORS = {
    primary: '#6B46C1',
    green: '#10B981',
    yellow: '#FFD700',
    blue: '#3B82F6',
    red: '#EF4444',
    textPrimary: '#374151',
    textSecondary: '#6B7280',
    border: '#E5E7EB',
    background: '#F3F4F6',
    white: '#FFFFFF'
};

/**
 * Create Activity Feed Widget
 */
export function createActivityFeedWidget(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
        <div class="activity-widget">
            <div class="widget-header">
                <div class="widget-icon">📋</div>
                <div class="widget-title">
                    <h4>Recent Activity</h4>
                    <span class="widget-subtitle">Your latest actions</span>
                </div>
            </div>
            <div class="activity-list" id="activityList">
                <div class="loading-activity">
                    <div class="spinner"></div>
                    <span>Loading activities...</span>
                </div>
            </div>
            <div class="widget-footer">
                <a href="interview-transcripts.html" class="view-all-link">View All Activities →</a>
            </div>
        </div>
        <style>
            .activity-widget {
                background: ${COLORS.white};
                padding: 1.5rem;
                border-radius: 12px;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                display: flex;
                flex-direction: column;
                height: 100%;
            }
            .widget-header {
                display: flex;
                align-items: center;
                gap: 1rem;
                margin-bottom: 1.5rem;
            }
            .widget-icon {
                font-size: 32px;
            }
            .widget-title h4 {
                margin: 0;
                color: ${COLORS.textPrimary};
                font-size: 18px;
            }
            .widget-subtitle {
                color: ${COLORS.textSecondary};
                font-size: 14px;
            }
            .activity-list {
                flex: 1;
                overflow-y: auto;
                max-height: 300px;
            }
            .activity-item {
                display: flex;
                align-items: flex-start;
                gap: 1rem;
                padding: 1rem;
                border-bottom: 1px solid ${COLORS.border};
                transition: background 0.2s ease;
            }
            .activity-item:hover {
                background: ${COLORS.background};
            }
            .activity-item:last-child {
                border-bottom: none;
            }
            .activity-icon {
                font-size: 20px;
                width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: ${COLORS.background};
                border-radius: 50%;
                flex-shrink: 0;
            }
            .activity-content {
                flex: 1;
            }
            .activity-text {
                color: ${COLORS.textPrimary};
                font-size: 14px;
                margin-bottom: 0.25rem;
            }
            .activity-time {
                color: ${COLORS.textSecondary};
                font-size: 12px;
            }
            .loading-activity {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 1rem;
                padding: 3rem;
                color: ${COLORS.textSecondary};
            }
            .spinner {
                width: 20px;
                height: 20px;
                border: 2px solid ${COLORS.border};
                border-top-color: ${COLORS.primary};
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
            .widget-footer {
                margin-top: 1rem;
                padding-top: 1rem;
                border-top: 1px solid ${COLORS.border};
                text-align: center;
            }
            .view-all-link {
                color: ${COLORS.primary};
                text-decoration: none;
                font-size: 14px;
                font-weight: 500;
                transition: color 0.2s ease;
            }
            .view-all-link:hover {
                color: #5A34B8;
            }
            .empty-activity {
                text-align: center;
                padding: 3rem;
                color: ${COLORS.textSecondary};
            }
            .empty-icon {
                font-size: 48px;
                margin-bottom: 1rem;
                opacity: 0.5;
            }
        </style>
    `;

    loadActivityFeed(container);
}

async function loadActivityFeed(container) {
    const listContainer = container.querySelector('#activityList');
    
    try {
        if (!auth.currentUser) {
            listContainer.innerHTML = `
                <div class="empty-activity">
                    <div class="empty-icon">🔒</div>
                    <p>Please sign in to view activities</p>
                </div>
            `;
            return;
        }

        // Get recent activities (mock data for now, will connect to real data later)
        const activities = await getRecentActivities();

        if (activities.length === 0) {
            listContainer.innerHTML = `
                <div class="empty-activity">
                    <div class="empty-icon">📭</div>
                    <p>No recent activities</p>
                </div>
            `;
            return;
        }

        listContainer.innerHTML = activities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon">${activity.icon}</div>
                <div class="activity-content">
                    <div class="activity-text">${activity.text}</div>
                    <div class="activity-time">${formatTimeAgo(activity.timestamp)}</div>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error loading activity feed:', error);
        listContainer.innerHTML = `
            <div class="empty-activity">
                <div class="empty-icon">⚠️</div>
                <p>Unable to load activities</p>
            </div>
        `;
    }
}

async function getRecentActivities() {
    // This would normally query Firestore for real activity data
    // For now, return mock activities
    const mockActivities = [
        {
            icon: '📤',
            text: 'Uploaded presentation.pdf',
            timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 min ago
            type: 'file_upload'
        },
        {
            icon: '🎤',
            text: 'Completed interview session',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
            type: 'interview'
        },
        {
            icon: '📚',
            text: 'Created new memory: Summer Vacation',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
            type: 'memory_created'
        },
        {
            icon: '👥',
            text: 'Updated twin settings',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
            type: 'twin_update'
        },
        {
            icon: '🔗',
            text: 'Shared twin with John Doe',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 days ago
            type: 'twin_shared'
        }
    ];

    // In production, this would query Firestore:
    /*
    const activitiesRef = collection(db, 'activities');
    const q = query(
        activitiesRef,
        where('userId', '==', auth.currentUser.uid),
        orderBy('timestamp', 'desc'),
        limit(5)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    */

    return mockActivities;
}

/**
 * Create Quick Actions Widget
 */
export function createQuickActionsWidget(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
        <div class="quickactions-widget">
            <div class="widget-header">
                <div class="widget-icon">⚡</div>
                <div class="widget-title">
                    <h4>Quick Actions</h4>
                    <span class="widget-subtitle">Common tasks</span>
                </div>
            </div>
            <div class="actions-grid">
                <button class="quick-action-btn" onclick="window.location.href='file-browser.html'">
                    <span class="action-emoji">📤</span>
                    <span class="action-label">Upload Files</span>
                </button>
                <button class="quick-action-btn" onclick="window.location.href='interview.html'">
                    <span class="action-emoji">🎤</span>
                    <span class="action-label">Start Interview</span>
                </button>
                <button class="quick-action-btn" onclick="window.location.href='memory-archive.html'">
                    <span class="action-emoji">📚</span>
                    <span class="action-label">Create Memory</span>
                </button>
                <button class="quick-action-btn" onclick="window.location.href='twin-management.html'">
                    <span class="action-emoji">👥</span>
                    <span class="action-label">Manage Twin</span>
                </button>
                <button class="quick-action-btn" onclick="window.location.href='curator.html'">
                    <span class="action-emoji">🎨</span>
                    <span class="action-label">Curator</span>
                </button>
                <button class="quick-action-btn" onclick="shareInfitwin()">
                    <span class="action-emoji">🔗</span>
                    <span class="action-label">Share Twin</span>
                </button>
            </div>
        </div>
        <style>
            .quickactions-widget {
                background: ${COLORS.white};
                padding: 1.5rem;
                border-radius: 12px;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                height: 100%;
            }
            .actions-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 1rem;
            }
            .quick-action-btn {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 0.5rem;
                padding: 1.5rem 1rem;
                background: ${COLORS.background};
                border: 1px solid ${COLORS.border};
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.2s ease;
                position: relative;
                overflow: hidden;
            }
            .quick-action-btn::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 3px;
                background: ${COLORS.yellow};
                transform: translateY(-100%);
                transition: transform 0.2s ease;
            }
            .quick-action-btn:hover {
                background: ${COLORS.white};
                transform: translateY(-2px);
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .quick-action-btn:hover::before {
                transform: translateY(0);
            }
            .action-emoji {
                font-size: 24px;
            }
            .action-label {
                font-size: 13px;
                font-weight: 500;
                color: ${COLORS.textPrimary};
                text-align: center;
            }
            @media (max-width: 480px) {
                .actions-grid {
                    grid-template-columns: repeat(2, 1fr);
                }
            }
        </style>
    `;
}

// Helper function to format time ago
function formatTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    
    const intervals = {
        year: 31536000,
        month: 2592000,
        week: 604800,
        day: 86400,
        hour: 3600,
        minute: 60
    };
    
    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
        const interval = Math.floor(seconds / secondsInUnit);
        if (interval >= 1) {
            return interval === 1 ? `1 ${unit} ago` : `${interval} ${unit}s ago`;
        }
    }
    
    return 'Just now';
}

// Share function placeholder
window.shareInfitwin = function() {
    alert('Share functionality coming soon! This will allow you to share your digital twin with others.');
};

// Export functions
export { formatTimeAgo };