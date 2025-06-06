// Error Page JavaScript

// Get error information from URL parameters or session
function getErrorInfo() {
    const urlParams = new URLSearchParams(window.location.search);
    const errorCode = urlParams.get('code') || '500';
    const errorPath = urlParams.get('path') || window.location.pathname;
    
    // Generate request ID
    const requestId = generateRequestId();
    
    // Get current time
    const errorTime = new Date().toISOString();
    
    return {
        code: errorCode,
        path: errorPath,
        requestId: requestId,
        time: errorTime
    };
}

// Generate a unique request ID
function generateRequestId() {
    return 'REQ-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase();
}

// Update error details on page
function updateErrorDetails() {
    const errorInfo = getErrorInfo();
    
    // Update error code
    const errorCodeElement = document.getElementById('errorCode');
    if (errorCodeElement) {
        errorCodeElement.textContent = errorInfo.code;
    }
    
    // Update technical details
    document.getElementById('errorTime').textContent = errorInfo.time;
    document.getElementById('requestId').textContent = errorInfo.requestId;
    document.getElementById('errorPath').textContent = errorInfo.path;
    
    // Update support email subject
    const errorSubject = document.getElementById('errorSubject');
    if (errorSubject) {
        errorSubject.textContent = errorInfo.requestId;
    }
    
    // Update mailto link
    const supportLink = document.querySelector('.support-link');
    if (supportLink) {
        const subject = `Error ${errorInfo.code} - Request ID: ${errorInfo.requestId}`;
        const body = `Error Details:\n\nCode: ${errorInfo.code}\nPath: ${errorInfo.path}\nTime: ${errorInfo.time}\nRequest ID: ${errorInfo.requestId}\n\nPlease describe what you were doing when the error occurred:`;
        
        supportLink.href = `mailto:support@infitwin.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    }
}

// Toggle technical details
function setupDetailsToggle() {
    const toggleButton = document.getElementById('toggleDetails');
    const detailsContent = document.getElementById('detailsContent');
    
    toggleButton.addEventListener('click', () => {
        const isOpen = detailsContent.style.display === 'block';
        
        if (isOpen) {
            detailsContent.style.display = 'none';
            toggleButton.classList.remove('open');
            toggleButton.querySelector('span').textContent = 'Show technical details';
        } else {
            detailsContent.style.display = 'block';
            toggleButton.classList.add('open');
            toggleButton.querySelector('span').textContent = 'Hide technical details';
        }
    });
}

// Custom error messages based on error code
function customizeErrorMessage() {
    const errorCode = document.getElementById('errorCode').textContent;
    const titleElement = document.querySelector('.error-title');
    const descriptionElement = document.querySelector('.error-description');
    
    const errorMessages = {
        '404': {
            title: 'Page Not Found',
            description: 'The memory you\'re looking for seems to have wandered off. Let\'s get you back on track.'
        },
        '403': {
            title: 'Access Denied',
            description: 'This memory is locked. You might need permission from the owner to view it.'
        },
        '401': {
            title: 'Authentication Required',
            description: 'Please log in to access your digital twin and memories.'
        },
        '500': {
            title: 'Oops! Something went wrong',
            description: 'Your digital twin encountered an unexpected error. Don\'t worry, no memories were lost!'
        },
        '503': {
            title: 'Service Temporarily Unavailable',
            description: 'We\'re performing some maintenance on your digital twin. Please check back in a few minutes.'
        }
    };
    
    const errorInfo = errorMessages[errorCode] || errorMessages['500'];
    
    if (titleElement) titleElement.textContent = errorInfo.title;
    if (descriptionElement) descriptionElement.textContent = errorInfo.description;
}

// Log error to console for debugging
function logError() {
    const errorInfo = getErrorInfo();
    console.error('Error Page Loaded:', {
        code: errorInfo.code,
        path: errorInfo.path,
        requestId: errorInfo.requestId,
        time: errorInfo.time,
        userAgent: navigator.userAgent,
        referrer: document.referrer
    });
    
    // Integration point: Send error telemetry to monitoring service
}

// Retry logic for temporary errors
function setupRetryButton() {
    const retryButton = document.querySelector('.btn-primary');
    if (retryButton) {
        retryButton.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Add loading state
            retryButton.textContent = 'Retrying...';
            retryButton.disabled = true;
            
            // Attempt to go back or reload
            setTimeout(() => {
                if (document.referrer && document.referrer !== window.location.href) {
                    window.location.href = document.referrer;
                } else {
                    window.location.reload();
                }
            }, 1000);
        });
    }
}

// Initialize error page
document.addEventListener('DOMContentLoaded', () => {
    updateErrorDetails();
    setupDetailsToggle();
    customizeErrorMessage();
    logError();
    setupRetryButton();
    
    // Check if coming from a specific error
    const referrer = document.referrer;
    if (referrer) {
        console.log('User came from:', referrer);
    }
});