/**
 * Interview UI Components - Transcript display and formatting
 */

import { 
    getInterviewSessions,
    getInterviewMessages,
    deleteInterviewSession,
    searchInterviewMessages,
    exportInterviewTranscript,
    getInterviewStats,
    formatDate,
    formatTime,
    formatDuration
} from './interview-service.js';

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
 * Initialize the interview transcript page
 */
export function initializeInterviewPage() {
    createInterviewSessionsList();
    setupInterviewEventListeners();
}

/**
 * Create the interview sessions list
 */
export async function createInterviewSessionsList() {
    const container = document.getElementById('interviewSessionsList');
    if (!container) return;

    // Show loading state
    container.innerHTML = `
        <div class="loading-sessions">
            <div class="spinner"></div>
            <span>Loading interview sessions...</span>
        </div>
    `;

    try {
        const sessions = await getInterviewSessions();
        
        if (sessions.length === 0) {
            container.innerHTML = `
                <div class="empty-sessions">
                    <div class="empty-icon">🎤</div>
                    <h3>No Interview Sessions</h3>
                    <p>Start your first interview to begin building your digital twin</p>
                    <button class="start-interview-btn" onclick="window.location.href='talk-to-twin.html'">
                        Start Interview
                    </button>
                </div>
            `;
            return;
        }

        // Render sessions
        container.innerHTML = sessions.map(session => `
            <div class="session-card" data-session-id="${session.id}">
                <div class="session-header">
                    <div class="session-info">
                        <h3 class="session-title">${session.title}</h3>
                        <div class="session-meta">
                            <span class="session-date">${formatDate(session.createdAt)}</span>
                            <span class="session-duration">${formatDuration(session.duration)}</span>
                            <span class="session-messages">${session.messageCount} messages</span>
                        </div>
                    </div>
                    <div class="session-actions">
                        <button class="action-btn view-btn" onclick="viewTranscript('${session.id}')">
                            <span>👁️</span> View
                        </button>
                        <button class="action-btn export-btn" onclick="exportTranscript('${session.id}')">
                            <span>📄</span> Export
                        </button>
                        <button class="action-btn delete-btn" onclick="deleteSession('${session.id}')">
                            <span>🗑️</span> Delete
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error loading sessions:', error);
        container.innerHTML = `
            <div class="error-sessions">
                <div class="error-icon">⚠️</div>
                <h3>Unable to Load Sessions</h3>
                <p>There was an error loading your interview sessions</p>
                <button class="retry-btn" onclick="createInterviewSessionsList()">Retry</button>
            </div>
        `;
    }
}

/**
 * View a specific transcript
 */
export async function viewTranscript(sessionId) {
    const modal = document.getElementById('transcriptModal');
    const modalContent = modal.querySelector('.transcript-content');
    
    // Show modal
    modal.style.display = 'flex';
    
    // Show loading state
    modalContent.innerHTML = `
        <div class="loading-transcript">
            <div class="spinner"></div>
            <span>Loading transcript...</span>
        </div>
    `;

    try {
        // Get session and messages
        const sessions = await getInterviewSessions();
        const session = sessions.find(s => s.id === sessionId);
        const messages = await getInterviewMessages(sessionId);
        const stats = getInterviewStats(messages);

        if (!session) {
            throw new Error('Session not found');
        }

        // Render transcript
        modalContent.innerHTML = `
            <div class="transcript-header">
                <div class="transcript-title">
                    <h2>${session.title}</h2>
                    <div class="transcript-meta">
                        <span>${formatDate(session.createdAt)}</span>
                        <span>${formatDuration(session.duration)}</span>
                        <span>${stats.totalMessages} messages</span>
                        <span>${stats.totalWords} words</span>
                    </div>
                </div>
                <div class="transcript-actions">
                    <div class="search-box">
                        <input type="text" id="transcriptSearch" placeholder="Search in transcript...">
                        <button onclick="searchInTranscript('${sessionId}')">🔍</button>
                    </div>
                    <button class="action-btn" onclick="exportTranscript('${sessionId}')">
                        📄 Export
                    </button>
                    <button class="action-btn delete-btn" onclick="deleteSession('${sessionId}')">
                        🗑️ Delete
                    </button>
                </div>
            </div>
            <div class="transcript-messages" id="transcriptMessages">
                ${renderMessages(messages)}
            </div>
        `;

        // Setup search functionality
        const searchInput = document.getElementById('transcriptSearch');
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                searchInTranscript(sessionId, e.target.value);
            }, 300);
        });

    } catch (error) {
        console.error('Error loading transcript:', error);
        modalContent.innerHTML = `
            <div class="error-transcript">
                <div class="error-icon">⚠️</div>
                <h3>Unable to Load Transcript</h3>
                <p>There was an error loading this interview transcript</p>
            </div>
        `;
    }
}

/**
 * Render messages in the transcript
 */
function renderMessages(messages) {
    return messages.map(message => `
        <div class="message-item ${message.speaker}">
            <div class="message-header">
                <span class="speaker-name">${message.speaker === 'user' ? 'You' : 'Infitwin AI'}</span>
                <span class="message-time">${formatTime(message.timestamp)}</span>
            </div>
            <div class="message-content">${message.content}</div>
        </div>
    `).join('');
}

/**
 * Search within transcript
 */
export async function searchInTranscript(sessionId, searchTerm = null) {
    const searchInput = document.getElementById('transcriptSearch');
    const term = searchTerm || searchInput.value;
    const messagesContainer = document.getElementById('transcriptMessages');

    if (!term || term.trim().length < 2) {
        // Show all messages if search is cleared
        const allMessages = await getInterviewMessages(sessionId);
        messagesContainer.innerHTML = renderMessages(allMessages);
        return;
    }

    try {
        const matchingMessages = await searchInterviewMessages(sessionId, term);
        
        if (matchingMessages.length === 0) {
            messagesContainer.innerHTML = `
                <div class="no-search-results">
                    <div class="search-icon">🔍</div>
                    <p>No messages found containing "${term}"</p>
                </div>
            `;
            return;
        }

        // Highlight search terms in results
        const highlightedMessages = matchingMessages.map(message => ({
            ...message,
            content: highlightSearchTerm(message.content, term)
        }));

        messagesContainer.innerHTML = `
            <div class="search-results-header">
                <p>Found ${matchingMessages.length} message(s) containing "${term}"</p>
            </div>
            ${renderMessages(highlightedMessages)}
        `;

    } catch (error) {
        console.error('Error searching transcript:', error);
        messagesContainer.innerHTML = `
            <div class="search-error">
                <p>Error searching transcript. Please try again.</p>
            </div>
        `;
    }
}

/**
 * Highlight search term in text
 */
function highlightSearchTerm(text, term) {
    if (!text || !term) return text;
    
    const regex = new RegExp(`(${term})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
}

/**
 * Export transcript
 */
window.exportTranscript = async function(sessionId) {
    try {
        const sessions = await getInterviewSessions();
        const session = sessions.find(s => s.id === sessionId);
        const messages = await getInterviewMessages(sessionId);
        
        if (!session || !messages) {
            throw new Error('Session or messages not found');
        }
        
        const success = exportInterviewTranscript(session, messages);
        
        if (success) {
            showNotification('Transcript exported successfully!', 'success');
        } else {
            throw new Error('Export failed');
        }
        
    } catch (error) {
        console.error('Error exporting transcript:', error);
        showNotification('Failed to export transcript', 'error');
    }
};

/**
 * Delete session
 */
window.deleteSession = async function(sessionId) {
    if (!confirm('Are you sure you want to delete this interview session? This action cannot be undone.')) {
        return;
    }
    
    try {
        await deleteInterviewSession(sessionId);
        showNotification('Interview session deleted successfully', 'success');
        
        // Close modal if open
        const modal = document.getElementById('transcriptModal');
        if (modal && modal.style.display === 'flex') {
            modal.style.display = 'none';
        }
        
        // Refresh sessions list
        await createInterviewSessionsList();
        
    } catch (error) {
        console.error('Error deleting session:', error);
        showNotification('Failed to delete interview session', 'error');
    }
};

/**
 * View transcript global function
 */
window.viewTranscript = viewTranscript;

/**
 * Search in transcript global function
 */
window.searchInTranscript = searchInTranscript;

/**
 * Setup event listeners
 */
function setupInterviewEventListeners() {
    // Close modal
    const modal = document.getElementById('transcriptModal');
    const closeBtn = modal?.querySelector('.modal-close');
    
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }
    
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }
}

/**
 * Show notification
 */
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button class="notification-close">✕</button>
    `;
    
    // Style notification
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? COLORS.green : type === 'error' ? COLORS.red : COLORS.blue};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        z-index: 1000;
        display: flex;
        align-items: center;
        gap: 1rem;
        animation: slideIn 0.3s ease;
    `;
    
    // Add animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
    
    // Add to page
    document.body.appendChild(notification);
    
    // Setup close button
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.style.cssText = `
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        font-size: 16px;
    `;
    
    const closeNotification = () => {
        notification.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    };
    
    closeBtn.addEventListener('click', closeNotification);
    
    // Auto dismiss after 5 seconds
    setTimeout(closeNotification, 5000);
}

// Add CSS for transcript modal and components
const transcriptStyles = document.createElement('style');
transcriptStyles.textContent = `
    /* Loading and error states */
    .loading-sessions, .loading-transcript {
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
    
    .empty-sessions, .error-sessions, .error-transcript {
        text-align: center;
        padding: 3rem;
    }
    
    .empty-icon, .error-icon {
        font-size: 4rem;
        margin-bottom: 1rem;
        opacity: 0.5;
    }
    
    .empty-sessions h3, .error-sessions h3, .error-transcript h3 {
        color: ${COLORS.textPrimary};
        margin-bottom: 0.5rem;
    }
    
    .empty-sessions p, .error-sessions p, .error-transcript p {
        color: ${COLORS.textSecondary};
        margin-bottom: 1.5rem;
    }
    
    .start-interview-btn, .retry-btn {
        background: ${COLORS.yellow};
        color: ${COLORS.textPrimary};
        border: none;
        padding: 0.75rem 1.5rem;
        border-radius: 8px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
    }
    
    .start-interview-btn:hover, .retry-btn:hover {
        background: #FFC107;
        transform: translateY(-1px);
    }
    
    /* Session cards */
    .session-card {
        background: ${COLORS.white};
        border-radius: 12px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        margin-bottom: 1rem;
        transition: all 0.2s ease;
    }
    
    .session-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    
    .session-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1.5rem;
    }
    
    .session-title {
        color: ${COLORS.textPrimary};
        margin: 0 0 0.5rem 0;
        font-size: 1.125rem;
    }
    
    .session-meta {
        display: flex;
        gap: 1rem;
        font-size: 0.875rem;
        color: ${COLORS.textSecondary};
    }
    
    .session-actions {
        display: flex;
        gap: 0.5rem;
    }
    
    .action-btn {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        padding: 0.5rem 1rem;
        background: ${COLORS.background};
        border: 1px solid ${COLORS.border};
        border-radius: 6px;
        font-size: 0.875rem;
        cursor: pointer;
        transition: all 0.2s ease;
    }
    
    .action-btn:hover {
        background: ${COLORS.white};
        transform: translateY(-1px);
    }
    
    .view-btn:hover {
        border-color: ${COLORS.blue};
    }
    
    .export-btn:hover {
        border-color: ${COLORS.yellow};
    }
    
    .delete-btn:hover {
        border-color: ${COLORS.red};
        color: ${COLORS.red};
    }
    
    /* Transcript modal */
    .transcript-modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: none;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        padding: 2rem;
    }
    
    .transcript-modal-content {
        background: ${COLORS.white};
        border-radius: 12px;
        max-width: 90vw;
        max-height: 90vh;
        width: 1000px;
        height: 800px;
        display: flex;
        flex-direction: column;
        overflow: hidden;
    }
    
    .transcript-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
    }
    
    .transcript-header {
        padding: 1.5rem;
        border-bottom: 1px solid ${COLORS.border};
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 1rem;
    }
    
    .transcript-title h2 {
        margin: 0 0 0.5rem 0;
        color: ${COLORS.textPrimary};
    }
    
    .transcript-meta {
        display: flex;
        gap: 1rem;
        font-size: 0.875rem;
        color: ${COLORS.textSecondary};
    }
    
    .transcript-actions {
        display: flex;
        gap: 1rem;
        align-items: center;
    }
    
    .search-box {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    
    .search-box input {
        padding: 0.5rem;
        border: 1px solid ${COLORS.border};
        border-radius: 6px;
        width: 200px;
    }
    
    .search-box button {
        background: none;
        border: none;
        font-size: 1.2rem;
        cursor: pointer;
    }
    
    .transcript-messages {
        flex: 1;
        overflow-y: auto;
        padding: 1rem;
    }
    
    .message-item {
        margin-bottom: 1.5rem;
        padding: 1rem;
        border-radius: 8px;
        border-left: 3px solid transparent;
    }
    
    .message-item.user {
        background: ${COLORS.background};
        border-left-color: ${COLORS.blue};
    }
    
    .message-item.ai {
        background: ${COLORS.white};
        border: 1px solid ${COLORS.border};
        border-left-color: ${COLORS.primary};
    }
    
    .message-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.5rem;
    }
    
    .speaker-name {
        font-weight: 600;
        color: ${COLORS.textPrimary};
    }
    
    .message-time {
        font-size: 0.875rem;
        color: ${COLORS.textSecondary};
    }
    
    .message-content {
        color: ${COLORS.textPrimary};
        line-height: 1.5;
    }
    
    .message-content mark {
        background: ${COLORS.yellow};
        padding: 0.1rem 0.2rem;
        border-radius: 3px;
    }
    
    .search-results-header {
        padding: 1rem;
        background: ${COLORS.background};
        border-radius: 8px;
        margin-bottom: 1rem;
        color: ${COLORS.textSecondary};
        font-size: 0.875rem;
    }
    
    .no-search-results, .search-error {
        text-align: center;
        padding: 3rem;
        color: ${COLORS.textSecondary};
    }
    
    .search-icon {
        font-size: 3rem;
        margin-bottom: 1rem;
        opacity: 0.5;
    }
    
    /* Modal close button */
    .modal-close {
        position: absolute;
        top: 1rem;
        right: 1rem;
        width: 40px;
        height: 40px;
        border: none;
        background: rgba(0, 0, 0, 0.05);
        border-radius: 50%;
        cursor: pointer;
        font-size: 1.5rem;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10;
    }
    
    .modal-close:hover {
        background: rgba(0, 0, 0, 0.1);
    }
    
    @media (max-width: 768px) {
        .session-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
        }
        
        .session-meta {
            flex-direction: column;
            gap: 0.25rem;
        }
        
        .transcript-header {
            flex-direction: column;
            align-items: flex-start;
        }
        
        .transcript-actions {
            flex-direction: column;
            align-items: flex-start;
            width: 100%;
        }
        
        .search-box {
            width: 100%;
        }
        
        .search-box input {
            flex: 1;
        }
    }
`;

document.head.appendChild(transcriptStyles);