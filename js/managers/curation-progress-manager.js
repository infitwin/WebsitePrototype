// Extracted from curator.html - Curation Progress Manager

export class CurationProgressManager {
    constructor() {
        this.totalMemories = 20; // Default value, will be updated
        this.curatedMemories = 3; // Default value
        this.init();
    }

    init() {
        this.updateDisplay();
    }

    setTotalMemories(total) {
        this.totalMemories = total;
        this.updateDisplay();
    }

    setCuratedMemories(curated) {
        this.curatedMemories = Math.max(0, Math.min(curated, this.totalMemories));
        this.updateDisplay();
    }

    incrementCurated() {
        this.setCuratedMemories(this.curatedMemories + 1);
    }

    decrementCurated() {
        this.setCuratedMemories(this.curatedMemories - 1);
    }

    getProgress() {
        return this.totalMemories > 0 ? (this.curatedMemories / this.totalMemories) * 100 : 0;
    }

    updateDisplay() {
        const percentage = Math.round(this.getProgress());
        const percentageElement = document.getElementById('curationPercentage');
        const fillElement = document.getElementById('curationProgressFill');
        const countElement = document.getElementById('curationCount');

        if (percentageElement) {
            percentageElement.textContent = `${percentage}%`;
        }

        if (fillElement) {
            fillElement.style.width = `${percentage}%`;
        }

        if (countElement) {
            countElement.textContent = `${this.curatedMemories} of ${this.totalMemories} memories curated`;
        }

        // Update progress bar color based on completion
        if (fillElement) {
            if (percentage === 100) {
                fillElement.style.background = 'linear-gradient(135deg, #10B981 0%, #059669 100%)'; // Green when complete
            } else if (percentage >= 75) {
                fillElement.style.background = 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)'; // Blue when almost done
            } else {
                fillElement.style.background = 'linear-gradient(135deg, #6B46C1 0%, #9333EA 100%)'; // Purple default
            }
        }
    }

    // Simulate progress changes for demo
    simulateProgress() {
        let current = 0;
        const interval = setInterval(() => {
            current += Math.floor(Math.random() * 3) + 1;
            this.setCuratedMemories(current);

            if (current >= this.totalMemories) {
                clearInterval(interval);
                console.log('Curation complete!');
            }
        }, 2000);
    }
}
