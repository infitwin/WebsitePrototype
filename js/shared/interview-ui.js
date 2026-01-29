/**
 * Interview UI Helper Functions
 * Shared UI utilities for interview pages
 */

/**
 * Set Winston orb animation state
 * @param {string} state - State to set: 'idle', 'listening', 'thinking', 'speaking'
 */
export function setWinstonState(state) {
    const orb = document.querySelector('.winston-orb');
    if (orb) {
        orb.className = 'winston-orb ' + state;
    }
}

/**
 * Update the interview question display
 * @param {string} question - The question text to display
 */
export function updateInterviewQuestion(question) {
    const questionElement = document.querySelector('.interview-question');
    if (questionElement && question) {
        questionElement.textContent = question;
    }
}

/**
 * Show or hide the connection status banner
 * @param {boolean} show - Whether to show the banner
 */
export function showConnectionBanner(show) {
    const banner = document.getElementById('connectionBanner');
    if (banner) {
        if (show) {
            banner.classList.add('active');
        } else {
            banner.classList.remove('active');
        }
    }
}

/**
 * Display a toast notification
 * @param {string} message - The message to display
 * @param {string} type - Toast type: 'success' or 'error'
 */
export function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');

    if (toast && toastMessage) {
        toast.className = `toast ${type}`;
        toastMessage.textContent = message;
        toast.classList.add('active');

        setTimeout(() => {
            toast.classList.remove('active');
        }, 3000);
    }
}
