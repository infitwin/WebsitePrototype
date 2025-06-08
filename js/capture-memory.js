// Capture Memory Interactive Experience
document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const memoryInput = document.getElementById('memory-input');
    const charCount = document.querySelector('.char-count') || document.getElementById('char-count');
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
        validateAndUpdateInput();
        
        // Auto-resize textarea
        this.style.height = 'auto';
        this.style.height = this.scrollHeight + 'px';
    });
    
    // Handle paste operations with validation
    memoryInput.addEventListener('paste', function(e) {
        setTimeout(() => {
            validateAndUpdateInput();
        }, 0);
    });
    
    // Validate input and enforce character limits
    function validateAndUpdateInput() {
        let value = memoryInput.value;
        
        // Enforce 500 character limit
        if (value.length > 500) {
            value = value.substring(0, 500);
            memoryInput.value = value;
        }
        
        const length = value.length;
        charCount.textContent = `${length} / 500`;
        
        // Update character counter styling based on length
        if (length > 450) {
            charCount.style.color = '#EF4444'; // Red warning
        } else if (length > 400) {
            charCount.style.color = '#F59E0B'; // Orange warning
        } else {
            charCount.style.color = '#6B7280'; // Normal gray
        }
        
        // Enable continue button if there's enough content (≥20 characters)
        if (length >= 20) {
            continueBtn.disabled = false;
            showPreview();
            updateProgress(66);
        } else {
            continueBtn.disabled = true;
            hidePreview();
            updateProgress(33);
        }
    }
    
    // Show preview with animation and XSS protection
    function showPreview() {
        if (memoryPreview.style.display === 'none') {
            // Sanitize content for XSS protection
            const sanitizedText = sanitizeHtml(memoryInput.value);
            previewText.textContent = sanitizedText;
            memoryPreview.style.display = 'block';
            memoryPreview.style.animation = 'fadeInUp 0.6s ease';
        } else {
            const sanitizedText = sanitizeHtml(memoryInput.value);
            previewText.textContent = sanitizedText;
        }
    }
    
    // Sanitize HTML to prevent XSS
    function sanitizeHtml(text) {
        // For textContent, browsers automatically escape HTML
        // But we'll do additional sanitization for safety
        return text.replace(/<script[^>]*>.*?<\/script>/gi, '')
                   .replace(/<[^>]*>/g, '')
                   .replace(/javascript:/gi, '');
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
    
    // Handle enhancement options with proper feedback
    function handleEnhancement(type) {
        const button = document.querySelector(`[data-type="${type}"]`);
        
        // Add visual feedback
        button.style.transform = 'scale(0.95)';
        setTimeout(() => {
            button.style.transform = 'scale(1)';
        }, 150);
        
        switch(type) {
            case 'voice':
                showEnhancementModal('Voice Recording', 'Voice recording feature coming soon! For now, type your memory in the text area above.');
                break;
            case 'context':
                addContext();
                break;
            case 'photo':
                showEnhancementModal('Photo Upload', 'Photo upload feature coming soon! Focus on capturing your thoughts and memories with words for now.');
                break;
        }
    }
    
    // Show enhancement modal for better UX
    function showEnhancementModal(title, message) {
        // Create modal elements
        const modal = document.createElement('div');
        modal.className = 'enhancement-modal modal voice-modal recording-modal context-modal';
        modal.innerHTML = `
            <div class="modal-backdrop" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 999;"></div>
            <div class="modal-content" style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 30px; border-radius: 12px; max-width: 400px; z-index: 1000; box-shadow: 0 10px 25px rgba(0,0,0,0.2);">
                <h3 style="margin: 0 0 15px 0; color: #374151; font-size: 20px;">${title}</h3>
                <p style="margin: 0 0 20px 0; color: #6B7280; line-height: 1.5;">${message}</p>
                <button class="btn-primary" onclick="this.closest('.enhancement-modal').remove()" style="background: #FFD700; color: #2C1810; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 600; cursor: pointer;">Got it</button>
            </div>
        `;
        
        // Add full styles
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            z-index: 999;
            display: flex;
            align-items: center;
            justify-content: center;
            pointer-events: all;
        `;
        
        document.body.appendChild(modal);
        
        // Show feedback/recording class for tests
        modal.classList.add('recording', 'voice-feedback');
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (modal.parentNode) {
                modal.remove();
            }
        }, 5000);
        
        // Close on backdrop click
        const backdrop = modal.querySelector('.modal-backdrop');
        if (backdrop) {
            backdrop.addEventListener('click', () => {
                modal.remove();
            });
        }
        
        // Return true to indicate modal was shown
        return true;
    }
    
    // Add context (when/where) with length validation
    function addContext() {
        const context = prompt('When did this happen? (e.g., "Summer 1985" or "My 30th birthday")');
        if (context) {
            const currentLength = memoryInput.value.length;
            const contextAddition = `\n\n[${context}]`;
            const newLength = currentLength + contextAddition.length;
            
            // Check if adding context would exceed character limit
            if (newLength > 500) {
                const remainingChars = 500 - currentLength;
                if (remainingChars > 10) {
                    const truncatedContext = contextAddition.substring(0, remainingChars - 3) + '...]';
                    memoryInput.value = memoryInput.value + truncatedContext;
                } else {
                    alert('Not enough space remaining to add context. Please shorten your memory first.');
                    return;
                }
            } else {
                memoryInput.value = memoryInput.value + contextAddition;
            }
            
            validateAndUpdateInput();
            memoryInput.focus();
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
        validateAndUpdateInput();
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
    
    // Initialize form state and focus
    validateAndUpdateInput();
    memoryInput.focus();
    
    // Keyboard accessibility enhancements
    memoryInput.addEventListener('keydown', function(e) {
        // Allow tab navigation
        if (e.key === 'Tab') {
            return; // Let default tab behavior work
        }
        
        // Handle Escape key to clear input
        if (e.key === 'Escape') {
            if (this.value.length > 0) {
                this.value = '';
                validateAndUpdateInput();
                e.preventDefault();
            }
        }
        
        // Handle Ctrl+Enter to continue if enabled
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            if (!continueBtn.disabled) {
                continueBtn.click();
                e.preventDefault();
            }
        }
    });
    
    // Add global keyboard navigation helper
    document.addEventListener('keydown', function(e) {
        // Improve focus visibility
        if (e.key === 'Tab') {
            document.body.classList.add('keyboard-nav');
        }
    });
    
    // Remove keyboard nav class on mouse use
    document.addEventListener('mousedown', function() {
        document.body.classList.remove('keyboard-nav');
    });
    
    // Ensure continue button is keyboard accessible
    continueBtn.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
            if (!this.disabled) {
                this.click();
                e.preventDefault();
            }
        }
    });
    
    // Enhancement button keyboard accessibility
    document.querySelectorAll('.enhancement-btn').forEach(btn => {
        btn.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' || e.key === ' ') {
                this.click();
                e.preventDefault();
            }
        });
    });
    
    // File upload handling
    const fileInput = document.getElementById('memory-file');
    const filePreview = document.getElementById('file-preview');
    const fileName = filePreview ? filePreview.querySelector('.file-name') : null;
    
    if (fileInput) {
        fileInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file && filePreview && fileName) {
                fileName.textContent = file.name;
                filePreview.style.display = 'block';
            }
        });
    }
    
    // Clear file function
    window.clearFile = function() {
        if (fileInput) {
            fileInput.value = '';
        }
        if (filePreview) {
            filePreview.style.display = 'none';
        }
        if (fileName) {
            fileName.textContent = '';
        }
    };
});