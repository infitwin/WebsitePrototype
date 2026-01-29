/**
 * Idea Clouds Manager
 * Creates dreamy floating cloud prompts in a banner area
 */

export class IdeaCloudsManager {
    /**
     * Create an IdeaCloudsManager
     * @param {string} containerSelector - CSS selector for the cloud banner container
     */
    constructor(containerSelector) {
        this.containerSelector = containerSelector;
        this.container = null;
        this.cloudInterval = null;
        this.activeClouds = [];
        this.usedPositions = [];

        // Default idea prompts
        this.ideaPrompts = [
            "Tell us about your first pet",
            "Describe a perfect day",
            "Share a family recipe",
            "Childhood home?",
            "Favorite teacher",
            "Wedding day",
            "Travel adventure",
            "Proudest moment?",
            "Best friend",
            "Family tradition"
        ];

        // Fixed positions to prevent overlap
        this.allPositions = [
            { left: '8%', top: '12px' },
            { left: '30%', top: '8px' },
            { left: '55%', top: '15px' },
            { left: '78%', top: '10px' }
        ];
    }

    /**
     * Set custom idea prompts
     * @param {string[]} prompts - Array of prompt strings
     */
    setPrompts(prompts) {
        if (Array.isArray(prompts) && prompts.length > 0) {
            this.ideaPrompts = prompts;
        }
    }

    /**
     * Create a single dreamy cloud element
     */
    createCloud() {
        this.container = document.querySelector(this.containerSelector);
        if (!this.container) return;

        const prompt = this.ideaPrompts[Math.floor(Math.random() * this.ideaPrompts.length)];

        const cloud = document.createElement('div');
        cloud.className = 'idea-cloud';
        cloud.textContent = prompt;

        // Find available position
        const availablePositions = this.allPositions.filter(pos =>
            !this.usedPositions.some(used => used.left === pos.left)
        );

        if (availablePositions.length === 0) return; // No space

        const pos = availablePositions[Math.floor(Math.random() * availablePositions.length)];
        cloud.style.left = pos.left;
        cloud.style.top = pos.top;

        this.usedPositions.push(pos);
        this.container.appendChild(cloud);
        this.activeClouds.push({ cloud, position: pos });

        // Gentle fade in
        setTimeout(() => cloud.classList.add('visible'), 500);

        // Gentle fade out and remove
        setTimeout(() => {
            cloud.classList.remove('visible');
            setTimeout(() => {
                if (this.container && this.container.contains(cloud)) {
                    this.container.removeChild(cloud);
                    this.activeClouds = this.activeClouds.filter(c => c.cloud !== cloud);
                    this.usedPositions = this.usedPositions.filter(p => p !== pos);
                }
            }, 3000); // 3 second fade out
        }, 45000 + Math.random() * 30000); // 45-75 seconds visible
    }

    /**
     * Start the idea clouds animation
     */
    start() {
        // Start with 2 clouds, spaced out
        setTimeout(() => this.createCloud(), 1000);
        setTimeout(() => this.createCloud(), 8000);

        // Add new clouds slowly
        this.cloudInterval = setInterval(() => {
            if (this.activeClouds.length < 3) {
                this.createCloud();
            }
        }, 25000); // Every 25 seconds
    }

    /**
     * Stop the idea clouds animation
     */
    stop() {
        if (this.cloudInterval) {
            clearInterval(this.cloudInterval);
            this.cloudInterval = null;
        }

        // Remove all active clouds
        this.activeClouds.forEach(({ cloud }) => {
            if (this.container && this.container.contains(cloud)) {
                this.container.removeChild(cloud);
            }
        });

        this.activeClouds = [];
        this.usedPositions = [];
    }

    /**
     * Clear all clouds immediately
     */
    clear() {
        this.stop();
    }
}
