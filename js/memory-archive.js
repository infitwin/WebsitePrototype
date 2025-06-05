// Memory Archive - Interactive Neo4J-style visualization
document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const memoryGraph = document.getElementById('memory-graph');
    const capturedMemory = document.getElementById('captured-memory');
    const connectionLines = document.querySelector('.connection-lines');
    
    // Initialize the archive
    initializeArchive();
    drawConnections();
    
    // Get captured memory from Winston (if available)
    function initializeArchive() {
        // Try to get memory from localStorage (passed from Winston)
        const winstonMemory = localStorage.getItem('capturedMemory');
        if (winstonMemory) {
            const memoryData = JSON.parse(winstonMemory);
            displayCapturedMemory(memoryData);
        } else {
            // Fallback content
            capturedMemory.innerHTML = `
                <p><em>"This is the beginning of something beautiful. Your first memory has been captured, and this is just the start of your incredible journey through time and experience."</em></p>
            `;
        }
        
        // Animate nodes appearing
        animateNodesAppearance();
    }
    
    // Display the memory captured by Winston
    function displayCapturedMemory(memoryData) {
        const content = memoryData.content || memoryData;
        const truncated = content.length > 150 ? content.substring(0, 150) + '...' : content;
        
        capturedMemory.innerHTML = `
            <p><strong>"${truncated}"</strong></p>
            <p class="memory-insight">Your stories are the threads that weave the tapestry of your legacy.</p>
        `;
    }
    
    // Animate nodes appearing in sequence
    function animateNodesAppearance() {
        const nodes = document.querySelectorAll('.memory-node');
        nodes.forEach((node, index) => {
            setTimeout(() => {
                node.classList.add('visible');
            }, index * 300);
        });
    }
    
    // Draw curved connections between nodes
    function drawConnections() {
        const centralNode = document.querySelector('.central-node');
        const futureNodes = document.querySelectorAll('.future-node');
        
        // Get positions
        const centralRect = centralNode.getBoundingClientRect();
        const graphRect = memoryGraph.getBoundingClientRect();
        
        const centralX = centralRect.left - graphRect.left + centralRect.width / 2;
        const centralY = centralRect.top - graphRect.top + centralRect.height / 2;
        
        // Clear existing paths
        connectionLines.innerHTML = connectionLines.querySelector('defs').outerHTML;
        
        // Draw connections to each future node
        futureNodes.forEach((node, index) => {
            setTimeout(() => {
                const nodeRect = node.getBoundingClientRect();
                const nodeX = nodeRect.left - graphRect.left + nodeRect.width / 2;
                const nodeY = nodeRect.top - graphRect.top + nodeRect.height / 2;
                
                drawCurvedPath(centralX, centralY, nodeX, nodeY, index);
            }, 1000 + (index * 200));
        });
    }
    
    // Draw a curved path between two points
    function drawCurvedPath(x1, y1, x2, y2, index) {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        
        // Calculate control points for a gentle curve
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        const offsetX = (y2 - y1) * 0.2; // Perpendicular offset for curve
        const offsetY = (x1 - x2) * 0.2;
        
        const d = `M ${x1} ${y1} Q ${midX + offsetX} ${midY + offsetY} ${x2} ${y2}`;
        
        path.setAttribute('d', d);
        path.setAttribute('stroke', 'url(#connectionGradient)');
        path.setAttribute('stroke-width', '2');
        path.setAttribute('fill', 'none');
        path.setAttribute('opacity', '0');
        path.setAttribute('stroke-dasharray', '5,5');
        path.style.animation = `pathDraw 1s ease ${index * 0.2}s forwards`;
        
        connectionLines.appendChild(path);
    }
    
    // Add CSS animation for path drawing
    const style = document.createElement('style');
    style.textContent = `
        @keyframes pathDraw {
            0% { 
                opacity: 0;
                stroke-dashoffset: 100;
            }
            100% { 
                opacity: 0.6;
                stroke-dashoffset: 0;
            }
        }
    `;
    document.head.appendChild(style);
    
    // Node hover interactions
    document.querySelectorAll('.memory-node').forEach(node => {
        node.addEventListener('mouseenter', function() {
            this.style.transform += ' scale(1.05)';
            
            // Show tooltip or info
            const type = this.getAttribute('data-type');
            if (type && type !== 'story') {
                showNodeTooltip(this, type);
            }
        });
        
        node.addEventListener('mouseleave', function() {
            this.style.transform = this.style.transform.replace(' scale(1.05)', '');
            hideNodeTooltip();
        });
    });
    
    // Show tooltip for future nodes
    function showNodeTooltip(node, type) {
        const tooltips = {
            wisdom: "Share life lessons and advice you've learned",
            family: "Capture precious moments with loved ones",
            achievement: "Document your proudest accomplishments",
            travel: "Record adventures and journeys"
        };
        
        const tooltip = document.createElement('div');
        tooltip.className = 'node-tooltip';
        tooltip.textContent = tooltips[type] || 'Explore this memory type';
        tooltip.style.cssText = `
            position: absolute;
            top: -40px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 8px 12px;
            border-radius: 8px;
            font-size: 0.8rem;
            white-space: nowrap;
            z-index: 100;
            pointer-events: none;
        `;
        
        node.style.position = 'relative';
        node.appendChild(tooltip);
    }
    
    // Hide tooltip
    function hideNodeTooltip() {
        document.querySelectorAll('.node-tooltip').forEach(tooltip => {
            tooltip.remove();
        });
    }
    
    // Handle window resize
    window.addEventListener('resize', function() {
        setTimeout(drawConnections, 100);
    });
    
    // Counter animation
    animateStats();
    
    function animateStats() {
        const statNumbers = document.querySelectorAll('.stat-number');
        statNumbers.forEach(stat => {
            if (stat.textContent !== '∞') {
                const finalValue = parseInt(stat.textContent);
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
});

// Navigation functions
function proceedToSignup() {
    // Store current state and navigate to signup
    console.log('Proceeding to signup...');
    
    // Show signup options (this could be a modal or new page)
    showSignupModal();
}

function exploreFeatures() {
    // Show features preview
    console.log('Exploring features...');
    
    // Could navigate to features page or show modal
    alert('Features exploration coming soon! For now, continue building your archive.');
}

function showSignupModal() {
    // Create signup modal
    const modal = document.createElement('div');
    modal.className = 'signup-modal';
    modal.innerHTML = `
        <div class="modal-backdrop">
            <div class="modal-content">
                <h2>Continue Your Journey</h2>
                <p>Create your account to save your memories and build your complete archive.</p>
                
                <div class="signup-options">
                    <button class="auth-btn google-btn" onclick="signupWithGoogle()">
                        <span>📧</span> Continue with Google
                    </button>
                    <button class="auth-btn email-btn" onclick="signupWithEmail()">
                        <span>✉️</span> Continue with Email
                    </button>
                </div>
                
                <button class="close-modal" onclick="closeSignupModal()">×</button>
            </div>
        </div>
    `;
    
    // Add modal styles
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
    `;
    
    document.body.appendChild(modal);
    
    // Add backdrop styles
    const backdrop = modal.querySelector('.modal-backdrop');
    backdrop.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(10px);
    `;
    
    // Add content styles
    const content = modal.querySelector('.modal-content');
    content.style.cssText = `
        background: white;
        padding: 40px;
        border-radius: 20px;
        max-width: 400px;
        width: 90%;
        text-align: center;
        position: relative;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    `;
    
    // Style buttons
    modal.querySelectorAll('.auth-btn').forEach(btn => {
        btn.style.cssText = `
            width: 100%;
            padding: 16px;
            margin: 8px 0;
            border: 2px solid #ddd;
            border-radius: 12px;
            background: white;
            cursor: pointer;
            font-size: 1rem;
            transition: all 0.3s ease;
        `;
    });
    
    // Style close button
    const closeBtn = modal.querySelector('.close-modal');
    closeBtn.style.cssText = `
        position: absolute;
        top: 15px;
        right: 20px;
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        color: #666;
    `;
}

function closeSignupModal() {
    const modal = document.querySelector('.signup-modal');
    if (modal) {
        modal.remove();
    }
}

function signupWithGoogle() {
    alert('Google signup would happen here. For demo, proceeding to dashboard...');
    window.location.href = '../dashboard.html'; // Future dashboard page
}

function signupWithEmail() {
    alert('Email signup would happen here. For demo, proceeding to dashboard...');
    window.location.href = '../dashboard.html'; // Future dashboard page
}