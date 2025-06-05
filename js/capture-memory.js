// Capture Memory Interactive Experience
document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const memoryInput = document.getElementById('memory-input');
    const charCount = document.querySelector('.char-count');
    const continueBtn = document.getElementById('continue-btn');
    const memoryPreview = document.getElementById('memory-preview');
    const previewText = document.getElementById('preview-text');
    const saveModal = document.getElementById('save-modal');
    const miniPreview = document.getElementById('mini-preview');
    const progressFill = document.querySelector('.progress-fill');
    
    // Alternative prompts for "Try Another"
    const prompts = [
        {
            icon: "✨",
            question: "What's one piece of wisdom you'd want to pass on?",
            helper: "Think of advice you'd give to your younger self or future generations",
            placeholder: "For example: 'Take more risks when you're young. The biggest regrets come from chances not taken...'"
        },
        {
            icon: "🌅",
            question: "What moment changed the direction of your life?",
            helper: "A decision, meeting, or experience that set you on a new path",
            placeholder: "For example: 'The day I decided to quit my job and start my own business...'"
        },
        {
            icon: "💫",
            question: "What's the most important lesson life taught you?",
            helper: "Something you learned through experience, not from books",
            placeholder: "For example: 'Success isn't about reaching the destination, it's about who you become along the way...'"
        },
        {
            icon: "🎯",
            question: "What dream are you still working towards?",
            helper: "A goal or aspiration that keeps you moving forward",
            placeholder: "For example: 'I've always wanted to write a book that helps people...'"
        }
    ];
    
    let currentPromptIndex = 0;
    
    // Character count and input handling
    memoryInput.addEventListener('input', function() {
        const length = this.value.length;
        charCount.textContent = `${length} / 500`;
        
        // Enable continue button if there's content
        if (length > 20) {
            continueBtn.disabled = false;
            showPreview();
            updateProgress(66);
        } else {
            continueBtn.disabled = true;
            hidePreview();
            updateProgress(33);
        }
        
        // Auto-resize textarea
        this.style.height = 'auto';
        this.style.height = this.scrollHeight + 'px';
    });
    
    // Show preview with animation
    function showPreview() {
        if (memoryPreview.style.display === 'none') {
            previewText.textContent = memoryInput.value;
            memoryPreview.style.display = 'block';
            memoryPreview.style.animation = 'fadeInUp 0.6s ease';
        } else {
            previewText.textContent = memoryInput.value;
        }
    }
    
    // Hide preview
    function hidePreview() {
        memoryPreview.style.display = 'none';
    }
    
    // Update progress bar
    function updateProgress(percent) {
        progressFill.style.width = percent + '%';
    }
    
    // Continue button click
    continueBtn.addEventListener('click', function() {
        showSaveModal();
    });
    
    // Show save modal
    function showSaveModal() {
        miniPreview.textContent = memoryInput.value.substring(0, 100) + '...';
        saveModal.style.display = 'block';
        updateProgress(100);
    }
    
    // Modal backdrop click to close
    document.querySelector('.modal-backdrop').addEventListener('click', function() {
        saveModal.style.display = 'none';
        updateProgress(66);
    });
    
    // Enhancement buttons
    document.querySelectorAll('.enhancement-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const type = this.getAttribute('data-type');
            handleEnhancement(type);
        });
    });
    
    // Handle enhancement options
    function handleEnhancement(type) {
        switch(type) {
            case 'voice':
                alert('Voice recording feature coming soon! For now, type your memory.');
                break;
            case 'context':
                addContext();
                break;
            case 'photo':
                alert('Photo upload feature coming soon! Focus on your words for now.');
                break;
        }
    }
    
    // Add context (when/where)
    function addContext() {
        const context = prompt('When did this happen? (e.g., "Summer 1985" or "My 30th birthday")');
        if (context) {
            memoryInput.value = memoryInput.value + `\n\n[${context}]`;
            memoryInput.dispatchEvent(new Event('input'));
        }
    }
    
    // Try another prompt
    window.tryAnother = function() {
        currentPromptIndex = (currentPromptIndex + 1) % prompts.length;
        const newPrompt = prompts[currentPromptIndex];
        
        // Update prompt content with animation
        const promptCard = document.querySelector('.memory-prompt-card');
        promptCard.style.animation = 'fadeInUp 0.6s ease';
        
        document.querySelector('.prompt-icon').textContent = newPrompt.icon;
        document.querySelector('.prompt-question h2').textContent = newPrompt.question;
        document.querySelector('.prompt-helper').textContent = newPrompt.helper;
        memoryInput.placeholder = newPrompt.placeholder;
        
        // Clear input and reset
        memoryInput.value = '';
        memoryInput.dispatchEvent(new Event('input'));
        memoryInput.focus();
    };
    
    // Auth button handlers
    document.querySelector('.auth-google').addEventListener('click', function() {
        // In real app, this would initiate Google OAuth
        console.log('Google auth clicked');
        alert('Google authentication would happen here. For demo, proceeding to dashboard...');
        window.location.href = '../dashboard.html'; // Future dashboard page
    });
    
    document.querySelector('.auth-email').addEventListener('click', function() {
        // In real app, this would show email signup form
        console.log('Email auth clicked');
        alert('Email signup would happen here. For demo, proceeding to dashboard...');
        window.location.href = '../dashboard.html'; // Future dashboard page
    });
    
    // Social proof counter animation
    let proofCount = 2847;
    setInterval(() => {
        proofCount += Math.floor(Math.random() * 3);
        document.querySelector('.proof-text').textContent = `${proofCount.toLocaleString()} memories captured today`;
    }, 5000);
    
    // Focus on textarea when page loads
    memoryInput.focus();
});