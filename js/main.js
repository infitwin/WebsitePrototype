// Infitwin Main JavaScript
// Version: 1.0
// Last Updated: June 2025

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
    // Initialize animations
    initAnimations();
    
    // Handle CTA button click
    const ctaButton = document.querySelector('.hero-cta');
    if (ctaButton) {
        ctaButton.addEventListener('click', handleCTAClick);
    }
    
    // Handle curator orb interaction
    const curatorOrb = document.querySelector('.curator-orb');
    if (curatorOrb) {
        curatorOrb.addEventListener('click', handleCuratorClick);
    }
    
    // Handle smooth scrolling for navigation links
    const navLinks = document.querySelectorAll('a[href^="#"]');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href.startsWith('#') && href.length > 1) {
                e.preventDefault();
                smoothScrollTo(href);
            }
        });
    });
});

// Initialize page animations
function initAnimations() {
    // Add any additional animation initialization here
    console.log('Infitwin page loaded and animations initialized');
}

// Handle CTA button click
function handleCTAClick(e) {
    e.preventDefault();
    console.log('Starting the journey to build a living archive...');
    // Navigate to meet Winston, the story curator
    window.location.href = 'pages/meet-winston.html';
}

// Handle curator orb interaction
function handleCuratorClick(e) {
    e.preventDefault();
    console.log('Curator activated - ready to help tell your story');
    
    // Animate the orb to show it's been activated
    const orb = e.target;
    orb.style.transform = 'scale(1.1)';
    orb.style.boxShadow = '0 0 30px rgba(107, 70, 193, 0.6)';
    
    setTimeout(() => {
        orb.style.transform = 'scale(1)';
        orb.style.boxShadow = '';
    }, 300);
    
    // Navigate to Meet Winston page for curator interaction
    setTimeout(() => {
        window.location.href = 'pages/meet-winston.html';
    }, 500);
}

// Utility function for smooth scrolling
function smoothScrollTo(target, duration = 1000) {
    const targetElement = document.querySelector(target);
    if (!targetElement) return;
    
    const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset;
    const startPosition = window.pageYOffset;
    const distance = targetPosition - startPosition;
    let startTime = null;
    
    function animation(currentTime) {
        if (startTime === null) startTime = currentTime;
        const timeElapsed = currentTime - startTime;
        const run = ease(timeElapsed, startPosition, distance, duration);
        window.scrollTo(0, run);
        if (timeElapsed < duration) requestAnimationFrame(animation);
    }
    
    function ease(t, b, c, d) {
        t /= d / 2;
        if (t < 1) return c / 2 * t * t + b;
        t--;
        return -c / 2 * (t * (t - 2) - 1) + b;
    }
    
    requestAnimationFrame(animation);
}