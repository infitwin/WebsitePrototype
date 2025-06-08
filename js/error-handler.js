/**
 * Error Handler - Centralized error handling and notification system
 */

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
 * Notification types and their configurations
 */
const NOTIFICATION_TYPES = {
    success: {
        color: COLORS.green,
        icon: '✅',
        duration: 4000
    },
    error: {
        color: COLORS.red,
        icon: '❌',
        duration: 6000
    },
    warning: {
        color: COLORS.yellow,
        icon: '⚠️',
        duration: 5000
    },
    info: {
        color: COLORS.blue,
        icon: 'ℹ️',
        duration: 4000
    }
};

/**
 * Global notification container
 */
let notificationContainer = null;

/**
 * Initialize the notification system
 */
export function initializeErrorHandler() {
    createNotificationContainer();
    setupGlobalErrorHandling();
    addNotificationStyles();
}

/**
 * Create the notification container
 */
function createNotificationContainer() {
    if (notificationContainer) return;
    
    notificationContainer = document.createElement('div');
    notificationContainer.id = 'notification-container';
    notificationContainer.className = 'notification-container';
    document.body.appendChild(notificationContainer);
}

/**
 * Show a toast notification
 */
export function showNotification(message, type = 'info', options = {}) {
    if (!notificationContainer) {
        initializeErrorHandler();
    }
    
    const config = NOTIFICATION_TYPES[type] || NOTIFICATION_TYPES.info;
    const notificationId = 'notification-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    
    const notification = document.createElement('div');
    notification.id = notificationId;
    notification.className = `notification notification-${type}`;
    
    // Build notification content
    let actionButtons = '';
    if (options.actions && options.actions.length > 0) {
        actionButtons = options.actions.map(action => 
            `<button class="notification-action" data-action="${action.id}">${action.label}</button>`
        ).join('');
    }
    
    notification.innerHTML = `
        <div class="notification-content">
            <div class="notification-icon">${config.icon}</div>
            <div class="notification-body">
                <div class="notification-message">${message}</div>
                ${options.details ? `<div class="notification-details">${options.details}</div>` : ''}
                ${actionButtons ? `<div class="notification-actions">${actionButtons}</div>` : ''}
            </div>
            <button class="notification-close" aria-label="Close notification">
                <span>✕</span>
            </button>
        </div>
        <div class="notification-progress"></div>
    `;
    
    // Set notification style
    notification.style.setProperty('--notification-color', config.color);
    
    // Add to container
    notificationContainer.appendChild(notification);
    
    // Animate in
    requestAnimationFrame(() => {
        notification.classList.add('notification-visible');
    });
    
    // Setup event listeners
    setupNotificationEvents(notification, options);
    
    // Auto dismiss if not persistent
    const duration = options.duration !== undefined ? options.duration : config.duration;
    if (duration > 0) {
        startProgressTimer(notification, duration);
        setTimeout(() => {
            dismissNotification(notificationId);
        }, duration);
    }
    
    return notificationId;
}

/**
 * Setup notification event listeners
 */
function setupNotificationEvents(notification, options) {
    // Close button
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        dismissNotification(notification.id);
    });
    
    // Action buttons
    const actionBtns = notification.querySelectorAll('.notification-action');
    actionBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const actionId = e.target.dataset.action;
            if (options.onAction) {
                options.onAction(actionId);
            }
            dismissNotification(notification.id);
        });
    });
    
    // Click to dismiss (optional)
    if (options.clickToDismiss !== false) {
        notification.addEventListener('click', (e) => {
            if (e.target === notification || e.target.classList.contains('notification-content')) {
                dismissNotification(notification.id);
            }
        });
    }
}

/**
 * Start progress timer animation
 */
function startProgressTimer(notification, duration) {
    const progressBar = notification.querySelector('.notification-progress');
    if (progressBar) {
        progressBar.style.animationDuration = `${duration}ms`;
        progressBar.classList.add('notification-progress-active');
    }
}

/**
 * Dismiss a notification
 */
export function dismissNotification(notificationId) {
    const notification = document.getElementById(notificationId);
    if (!notification) return;
    
    notification.classList.add('notification-dismissing');
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 300);
}

/**
 * Clear all notifications
 */
export function clearAllNotifications() {
    if (!notificationContainer) return;
    
    const notifications = notificationContainer.querySelectorAll('.notification');
    notifications.forEach(notification => {
        dismissNotification(notification.id);
    });
}

/**
 * Show modal error dialog
 */
export function showErrorModal(title, message, options = {}) {
    const modalId = 'error-modal-' + Date.now();
    
    const modal = document.createElement('div');
    modal.id = modalId;
    modal.className = 'error-modal';
    
    modal.innerHTML = `
        <div class="error-modal-backdrop"></div>
        <div class="error-modal-content">
            <div class="error-modal-header">
                <div class="error-modal-icon">
                    <span>${options.icon || '⚠️'}</span>
                </div>
                <h2 class="error-modal-title">${title}</h2>
            </div>
            <div class="error-modal-body">
                <p class="error-modal-message">${message}</p>
                ${options.details ? `<div class="error-modal-details">${options.details}</div>` : ''}
                ${options.technicalInfo ? `
                    <details class="error-modal-technical">
                        <summary>Technical Details</summary>
                        <pre>${options.technicalInfo}</pre>
                    </details>
                ` : ''}
            </div>
            <div class="error-modal-footer">
                ${options.primaryAction ? `
                    <button class="error-modal-btn error-modal-btn-primary" data-action="primary">
                        ${options.primaryAction.label}
                    </button>
                ` : ''}
                <button class="error-modal-btn error-modal-btn-secondary" data-action="close">
                    ${options.closeLabel || 'OK'}
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Animate in
    requestAnimationFrame(() => {
        modal.classList.add('error-modal-visible');
    });
    
    // Setup event listeners
    const closeModal = () => {
        modal.classList.add('error-modal-dismissing');
        setTimeout(() => {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
        }, 300);
    };
    
    // Close on backdrop click
    modal.querySelector('.error-modal-backdrop').addEventListener('click', closeModal);
    
    // Button actions
    modal.querySelectorAll('.error-modal-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const action = e.target.dataset.action;
            
            if (action === 'primary' && options.primaryAction && options.primaryAction.handler) {
                options.primaryAction.handler();
            } else if (action === 'close' && options.onClose) {
                options.onClose();
            }
            
            closeModal();
        });
    });
    
    // Escape key to close
    const escapeHandler = (e) => {
        if (e.key === 'Escape') {
            closeModal();
            document.removeEventListener('keydown', escapeHandler);
        }
    };
    document.addEventListener('keydown', escapeHandler);
    
    return modalId;
}

/**
 * Show inline validation error
 */
export function showFieldError(fieldElement, message, options = {}) {
    clearFieldError(fieldElement);
    
    const errorId = 'field-error-' + Date.now();
    const errorElement = document.createElement('div');
    errorElement.id = errorId;
    errorElement.className = 'field-error';
    errorElement.textContent = message;
    
    // Position error element
    if (options.position === 'before') {
        fieldElement.parentNode.insertBefore(errorElement, fieldElement);
    } else {
        fieldElement.parentNode.insertBefore(errorElement, fieldElement.nextSibling);
    }
    
    // Add error class to field
    fieldElement.classList.add('field-has-error');
    fieldElement.setAttribute('aria-describedby', errorId);
    
    // Auto-clear on input
    if (options.clearOnInput !== false) {
        const clearHandler = () => {
            clearFieldError(fieldElement);
            fieldElement.removeEventListener('input', clearHandler);
            fieldElement.removeEventListener('change', clearHandler);
        };
        
        fieldElement.addEventListener('input', clearHandler);
        fieldElement.addEventListener('change', clearHandler);
    }
    
    return errorId;
}

/**
 * Clear field error
 */
export function clearFieldError(fieldElement) {
    const existingError = fieldElement.parentNode.querySelector('.field-error');
    if (existingError) {
        existingError.remove();
    }
    
    fieldElement.classList.remove('field-has-error');
    fieldElement.removeAttribute('aria-describedby');
}

/**
 * Validate form field
 */
export function validateField(fieldElement, validators = []) {
    const value = fieldElement.value.trim();
    
    for (const validator of validators) {
        const result = validator(value, fieldElement);
        if (result !== true) {
            showFieldError(fieldElement, result);
            return false;
        }
    }
    
    clearFieldError(fieldElement);
    return true;
}

/**
 * Common validators
 */
export const validators = {
    required: (value) => value.length > 0 || 'This field is required',
    
    email: (value) => {
        if (!value) return true; // Allow empty for optional fields
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value) || 'Please enter a valid email address';
    },
    
    minLength: (min) => (value) => 
        value.length >= min || `Must be at least ${min} characters`,
    
    maxLength: (max) => (value) => 
        value.length <= max || `Must be no more than ${max} characters`,
    
    fileSize: (maxSizeMB) => (value, element) => {
        if (element.type !== 'file' || !element.files.length) return true;
        const file = element.files[0];
        const maxBytes = maxSizeMB * 1024 * 1024;
        return file.size <= maxBytes || `File must be smaller than ${maxSizeMB}MB`;
    },
    
    fileType: (allowedTypes) => (value, element) => {
        if (element.type !== 'file' || !element.files.length) return true;
        const file = element.files[0];
        return allowedTypes.includes(file.type) || 
               `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`;
    }
};

/**
 * Setup global error handling
 */
function setupGlobalErrorHandling() {
    // Catch unhandled Promise rejections
    window.addEventListener('unhandledrejection', (event) => {
        console.error('Unhandled promise rejection:', event.reason);
        
        showNotification(
            'An unexpected error occurred',
            'error',
            {
                details: 'The application encountered an unexpected error. Please try again.',
                actions: [
                    { id: 'reload', label: 'Reload Page' }
                ],
                onAction: (actionId) => {
                    if (actionId === 'reload') {
                        window.location.reload();
                    }
                }
            }
        );
    });
    
    // Catch JavaScript errors
    window.addEventListener('error', (event) => {
        console.error('JavaScript error:', event.error);
        
        // Don't show notifications for every minor error
        if (event.error && event.error.message && 
            !event.error.message.includes('Script error') &&
            !event.error.message.includes('Non-Error promise rejection')) {
            
            showNotification(
                'Something went wrong',
                'error',
                {
                    details: 'Please refresh the page or try again later.',
                    duration: 8000
                }
            );
        }
    });
}

/**
 * Add notification styles to the page
 */
function addNotificationStyles() {
    if (document.getElementById('error-handler-styles')) return;
    
    const styles = document.createElement('style');
    styles.id = 'error-handler-styles';
    styles.textContent = `
        /* Notification Container */
        .notification-container {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            pointer-events: none;
            max-width: 400px;
            width: 100%;
        }
        
        /* Notification Base */
        .notification {
            background: ${COLORS.white};
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
            margin-bottom: 12px;
            pointer-events: auto;
            transform: translateX(100%);
            opacity: 0;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            overflow: hidden;
            border-left: 4px solid var(--notification-color);
        }
        
        .notification-visible {
            transform: translateX(0);
            opacity: 1;
        }
        
        .notification-dismissing {
            transform: translateX(100%);
            opacity: 0;
        }
        
        /* Notification Content */
        .notification-content {
            display: flex;
            align-items: flex-start;
            padding: 16px;
            gap: 12px;
        }
        
        .notification-icon {
            font-size: 20px;
            flex-shrink: 0;
            margin-top: 2px;
        }
        
        .notification-body {
            flex: 1;
            min-width: 0;
        }
        
        .notification-message {
            font-weight: 500;
            color: ${COLORS.textPrimary};
            margin-bottom: 4px;
            line-height: 1.4;
        }
        
        .notification-details {
            font-size: 14px;
            color: ${COLORS.textSecondary};
            line-height: 1.4;
            margin-bottom: 8px;
        }
        
        .notification-actions {
            display: flex;
            gap: 8px;
            margin-top: 8px;
        }
        
        .notification-action {
            background: var(--notification-color);
            color: white;
            border: none;
            padding: 6px 12px;
            border-radius: 6px;
            font-size: 13px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
        }
        
        .notification-action:hover {
            opacity: 0.9;
            transform: translateY(-1px);
        }
        
        .notification-close {
            background: none;
            border: none;
            color: ${COLORS.textSecondary};
            cursor: pointer;
            padding: 4px;
            border-radius: 4px;
            transition: all 0.2s ease;
            flex-shrink: 0;
            height: 24px;
            width: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .notification-close:hover {
            background: ${COLORS.background};
            color: ${COLORS.textPrimary};
        }
        
        /* Progress Bar */
        .notification-progress {
            position: absolute;
            bottom: 0;
            left: 0;
            height: 3px;
            background: var(--notification-color);
            transform: translateX(-100%);
            transition: transform linear;
        }
        
        .notification-progress-active {
            transform: translateX(0);
        }
        
        /* Error Modal */
        .error-modal {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 10001;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            opacity: 0;
            transition: opacity 0.3s ease;
        }
        
        .error-modal-visible {
            opacity: 1;
        }
        
        .error-modal-dismissing {
            opacity: 0;
        }
        
        .error-modal-backdrop {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(4px);
        }
        
        .error-modal-content {
            background: ${COLORS.white};
            border-radius: 16px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            max-width: 500px;
            width: 100%;
            position: relative;
            transform: scale(0.9) translateY(20px);
            transition: transform 0.3s ease;
        }
        
        .error-modal-visible .error-modal-content {
            transform: scale(1) translateY(0);
        }
        
        .error-modal-header {
            padding: 24px 24px 16px;
            text-align: center;
            border-bottom: 1px solid ${COLORS.border};
        }
        
        .error-modal-icon {
            font-size: 48px;
            margin-bottom: 12px;
        }
        
        .error-modal-title {
            margin: 0;
            color: ${COLORS.textPrimary};
            font-size: 20px;
            font-weight: 600;
        }
        
        .error-modal-body {
            padding: 20px 24px;
        }
        
        .error-modal-message {
            color: ${COLORS.textPrimary};
            line-height: 1.5;
            margin: 0 0 16px 0;
        }
        
        .error-modal-details {
            background: ${COLORS.background};
            padding: 12px;
            border-radius: 8px;
            font-size: 14px;
            color: ${COLORS.textSecondary};
            margin-bottom: 16px;
        }
        
        .error-modal-technical {
            margin-top: 16px;
        }
        
        .error-modal-technical summary {
            cursor: pointer;
            font-weight: 500;
            color: ${COLORS.textSecondary};
            margin-bottom: 8px;
        }
        
        .error-modal-technical pre {
            background: #f8f9fa;
            padding: 12px;
            border-radius: 6px;
            font-size: 12px;
            overflow-x: auto;
            color: #666;
        }
        
        .error-modal-footer {
            padding: 16px 24px 24px;
            display: flex;
            gap: 12px;
            justify-content: flex-end;
        }
        
        .error-modal-btn {
            padding: 10px 20px;
            border-radius: 8px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
            border: none;
        }
        
        .error-modal-btn-primary {
            background: ${COLORS.red};
            color: white;
        }
        
        .error-modal-btn-primary:hover {
            background: #DC2626;
            transform: translateY(-1px);
        }
        
        .error-modal-btn-secondary {
            background: ${COLORS.background};
            color: ${COLORS.textPrimary};
            border: 1px solid ${COLORS.border};
        }
        
        .error-modal-btn-secondary:hover {
            background: ${COLORS.white};
            transform: translateY(-1px);
        }
        
        /* Field Validation */
        .field-error {
            color: ${COLORS.red};
            font-size: 14px;
            margin-top: 4px;
            margin-bottom: 8px;
            display: flex;
            align-items: center;
            gap: 6px;
        }
        
        .field-error::before {
            content: '⚠️';
            font-size: 14px;
        }
        
        .field-has-error {
            border-color: ${COLORS.red} !important;
            box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1) !important;
        }
        
        /* Mobile Responsive */
        @media (max-width: 768px) {
            .notification-container {
                left: 20px;
                right: 20px;
                max-width: none;
            }
            
            .error-modal {
                padding: 16px;
            }
            
            .error-modal-content {
                max-width: none;
                width: 100%;
            }
            
            .error-modal-footer {
                flex-direction: column-reverse;
            }
            
            .error-modal-btn {
                width: 100%;
            }
        }
    `;
    
    document.head.appendChild(styles);
}

// Auto-initialize when script loads
document.addEventListener('DOMContentLoaded', initializeErrorHandler);

// Export all functions
export {
    initializeErrorHandler,
    showNotification,
    dismissNotification,
    clearAllNotifications,
    showErrorModal,
    showFieldError,
    clearFieldError,
    validateField,
    validators
};