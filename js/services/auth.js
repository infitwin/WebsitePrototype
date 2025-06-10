// Authentication service placeholder
// TODO: Implement actual authentication
console.log('Auth service placeholder loaded');

// Mock auth for development
window.getCurrentUser = function() {
    return {
        id: 'demo-user',
        email: 'demo@infitwin.com',
        name: 'Demo User'
    };
};