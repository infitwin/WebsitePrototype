// Shared View (Read-Only) JavaScript

// Sample memory data for demo
const sampleMemories = {
    'Family': {
        title: 'Family Vacation - 1985',
        content: 'Our trip to the Grand Canyon was unforgettable. The kids were amazed by the vastness of it all. We spent three days exploring different viewpoints and taking countless photos.',
        date: 'July 15, 1985',
        location: 'Grand Canyon, Arizona'
    },
    'Travel': {
        title: 'European Adventure - 1972',
        content: 'My first trip to Europe was a dream come true. Paris, Rome, Barcelona - each city had its own magic. The art, the food, the people - everything was incredible.',
        date: 'September 3, 1972',
        location: 'Various, Europe'
    },
    'Career': {
        title: 'First Day at IBM - 1968',
        content: 'Walking into the IBM headquarters for the first time, I felt both nervous and excited. Little did I know this would be the start of a 30-year journey.',
        date: 'March 18, 1968',
        location: 'Armonk, New York'
    },
    'Hobbies': {
        title: 'Piano Recital - 1990',
        content: 'After years of practice, I finally performed Chopin\'s Ballade No. 1 at the community center. The applause made all those hours worthwhile.',
        date: 'December 10, 1990',
        location: 'Community Center, Portland'
    }
};

// Graph zoom functionality
let currentScale = 1;
const graphVisual = document.querySelector('.graph-visual');

document.getElementById('zoomIn').addEventListener('click', () => {
    currentScale = Math.min(currentScale + 0.2, 2);
    graphVisual.style.transform = `scale(${currentScale})`;
});

document.getElementById('zoomOut').addEventListener('click', () => {
    currentScale = Math.max(currentScale - 0.2, 0.5);
    graphVisual.style.transform = `scale(${currentScale})`;
});

document.getElementById('resetView').addEventListener('click', () => {
    currentScale = 1;
    graphVisual.style.transform = 'scale(1)';
});

// Memory node interactions
const memoryNodes = document.querySelectorAll('.memory-node');
const memoryPreview = document.getElementById('memoryPreview');
const closePreview = document.getElementById('closePreview');

memoryNodes.forEach(node => {
    node.addEventListener('click', (e) => {
        e.stopPropagation();
        const memoryType = node.nextElementSibling.textContent;
        showMemoryPreview(memoryType);
    });
});

function showMemoryPreview(type) {
    const memory = sampleMemories[type];
    if (!memory) return;
    
    const previewHeader = memoryPreview.querySelector('.preview-header h3');
    const previewContent = memoryPreview.querySelector('.preview-content p');
    const previewMeta = memoryPreview.querySelector('.preview-meta');
    
    previewHeader.textContent = memory.title;
    previewContent.textContent = memory.content;
    previewMeta.innerHTML = `
        <span>📅 ${memory.date}</span>
        <span>📍 ${memory.location}</span>
    `;
    
    memoryPreview.style.display = 'block';
}

// Close preview
closePreview.addEventListener('click', () => {
    memoryPreview.style.display = 'none';
});

// Click outside to close preview
document.addEventListener('click', (e) => {
    if (!memoryPreview.contains(e.target) && !e.target.closest('.memory-node')) {
        memoryPreview.style.display = 'none';
    }
});

// Locked node interactions
const lockedNodes = document.querySelectorAll('.locked-node');
lockedNodes.forEach(node => {
    node.addEventListener('click', (e) => {
        e.stopPropagation();
        showLockedMessage();
    });
});

function showLockedMessage() {
    const overlay = document.querySelector('.graph-overlay');
    overlay.innerHTML = '<p>This memory is private. Only the owner can access it.</p>';
    overlay.style.background = 'rgba(255, 0, 0, 0.7)';
    
    setTimeout(() => {
        overlay.innerHTML = '<p>Click nodes to explore shared memories</p>';
        overlay.style.background = 'rgba(0, 0, 0, 0.7)';
    }, 2000);
}

// Smooth scroll for CTA
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

// Track conversion clicks
document.querySelectorAll('.create-own-btn, .btn-primary').forEach(btn => {
    btn.addEventListener('click', () => {
        console.log('Conversion tracked: User clicked to create own twin');
        // Integration point: Track conversion analytics
    });
});

// Disable right-click on graph (read-only protection)
document.querySelector('.graph-container').addEventListener('contextmenu', (e) => {
    e.preventDefault();
    return false;
});

// Show tooltips for disabled items
document.querySelectorAll('.disabled').forEach(item => {
    item.addEventListener('mouseenter', (e) => {
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.textContent = item.getAttribute('title') || 'Owner only';
        tooltip.style.cssText = `
            position: absolute;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            z-index: 1000;
            pointer-events: none;
        `;
        
        document.body.appendChild(tooltip);
        
        const rect = item.getBoundingClientRect();
        tooltip.style.left = rect.left + 'px';
        tooltip.style.top = (rect.bottom + 5) + 'px';
        
        item.addEventListener('mouseleave', () => {
            tooltip.remove();
        }, { once: true });
    });
});

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    console.log('Shared view initialized - Read-only mode active');
    
    // Check for shared token in URL
    const urlParams = new URLSearchParams(window.location.search);
    const shareToken = urlParams.get('token');
    
    if (shareToken) {
        console.log('Share token detected:', shareToken);
        // Integration point: Validate share token and load appropriate data
    }
});