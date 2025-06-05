// Winston the Curator - Conversational AI
document.addEventListener('DOMContentLoaded', function() {
    const messagesContainer = document.getElementById('messages');
    const inputArea = document.getElementById('input-area');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const quickResponses = document.getElementById('quick-responses');
    const audioToggle = document.getElementById('audio-toggle');
    
    let conversationStep = 0;
    let userStory = {};
    let audioEnabled = false;
    
    // Winston's conversation flow
    const conversation = [
        {
            winston: "Ah, splendid! Welcome to my study. I'm Winston, your personal story curator. *adjusts spectacles* I must say, I'm rather excited to help you preserve your memories!",
            delay: 1000,
            showInput: false,
            showQuick: true,
            quickOptions: ["Hello Winston!", "Tell me more", "What do we do?"]
        },
        {
            winston: "Right then! I've helped countless fascinating people capture their most treasured stories. Now, shall we start with something delightful? What's a funny story that always makes you smile when you think about it?",
            delay: 2000,
            showInput: true,
            showQuick: true,
            quickOptions: ["I have a funny travel story", "Something embarrassing happened", "A family mishap", "I'd rather share wisdom"]
        }
    ];
    
    // Winston's responses based on user input
    const winstonResponses = {
        greetings: [
            "Lovely to meet you! *tips hat* Now then, shall we dive into your stories?",
            "Capital! I do so enjoy making new acquaintances. Quite ready for an adventure, are we?",
            "Marvelous! Do settle in by the fire. We're going to have such fun together!"
        ],
        encouragement: [
            "Oh my, that sounds absolutely fascinating! Do go on...",
            "Capital! I'm positively riveted. Please, continue!",
            "Splendid! *leans forward with interest* What happened next?",
            "Brilliant! I can already tell this is going to be a wonderful tale."
        ],
        transitions: [
            "Now then, that was delightful! Shall we explore another memory?",
            "Quite wonderful! I suspect you have more treasures to share.",
            "Excellent! You're a natural storyteller. What else comes to mind?"
        ],
        wisdom: [
            "Ah, wisdom! *adjusts pipe* The most precious gift we can leave behind. What would you tell your younger self?",
            "Quite right! Experience is the finest teacher. What life lesson would you pass on?",
            "Brilliant choice! Wisdom shared is wisdom doubled, as they say."
        ]
    };
    
    // Initialize conversation
    function startConversation() {
        setTimeout(() => {
            addWinstonMessage(conversation[0].winston, true);
            setTimeout(() => {
                showQuickResponses(conversation[0].quickOptions);
            }, 2000);
        }, 1000);
    }
    
    // Add Winston's message with typing animation
    function addWinstonMessage(text, isFirst = false) {
        // Show typing indicator
        if (!isFirst) {
            showTypingIndicator();
            setTimeout(() => {
                removeTypingIndicator();
                addMessageToChat('winston', text);
            }, 1500);
        } else {
            addMessageToChat('winston', text);
        }
    }
    
    // Add message to chat
    function addMessageToChat(sender, text) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message';
        
        if (sender === 'winston') {
            messageDiv.innerHTML = `
                <div class="winston-message">
                    <div class="winston-mini-avatar"></div>
                    <div class="winston-bubble">
                        <p class="winston-text">${formatWinstonText(text)}</p>
                    </div>
                </div>
            `;
        } else {
            messageDiv.innerHTML = `
                <div class="user-message">
                    <div class="user-bubble">
                        <p>${text}</p>
                    </div>
                </div>
            `;
        }
        
        messagesContainer.appendChild(messageDiv);
        scrollToBottom();
        
        // Read Winston's messages aloud if audio is enabled
        if (sender === 'winston' && audioEnabled) {
            speakText(text);
        }
    }
    
    // Format Winston's text with British accent markers
    function formatWinstonText(text) {
        return text
            .replace(/\*(.*?)\*/g, '<em class="british-accent">$1</em>')
            .replace(/quite|rather|splendid|capital|brilliant|marvelous/gi, '<span class="british-accent">$&</span>');
    }
    
    // Show typing indicator
    function showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message typing-message';
        typingDiv.innerHTML = `
            <div class="winston-message">
                <div class="winston-mini-avatar"></div>
                <div class="typing-indicator">
                    <span style="font-size: 14px; color: #8B4513;">Winston is typing</span>
                    <div class="typing-dots">
                        <div class="typing-dot"></div>
                        <div class="typing-dot"></div>
                        <div class="typing-dot"></div>
                    </div>
                </div>
            </div>
        `;
        messagesContainer.appendChild(typingDiv);
        scrollToBottom();
    }
    
    // Remove typing indicator
    function removeTypingIndicator() {
        const typingMessage = document.querySelector('.typing-message');
        if (typingMessage) {
            typingMessage.remove();
        }
    }
    
    // Show quick response buttons
    function showQuickResponses(options) {
        quickResponses.innerHTML = '';
        options.forEach(option => {
            const btn = document.createElement('button');
            btn.className = 'quick-btn';
            btn.textContent = option;
            btn.addEventListener('click', () => handleQuickResponse(option));
            quickResponses.appendChild(btn);
        });
        quickResponses.style.display = 'flex';
    }
    
    // Hide quick responses
    function hideQuickResponses() {
        quickResponses.style.display = 'none';
    }
    
    // Handle quick response clicks
    function handleQuickResponse(response) {
        addMessageToChat('user', response);
        hideQuickResponses();
        
        // Check if user wants to save to archive
        if (response.toLowerCase().includes('save this memory')) {
            const lastUserMessage = Array.from(document.querySelectorAll('.user-message')).pop();
            if (lastUserMessage) {
                const memoryContent = lastUserMessage.querySelector('p').textContent;
                addWinstonMessage("Splendid! Let me save this precious memory to your archive. *tips hat* Off we go to see your growing collection!");
                setTimeout(() => {
                    saveToArchive(memoryContent);
                }, 2000);
                return;
            }
        }
        
        handleUserResponse(response);
    }
    
    // Handle user responses
    function handleUserResponse(text) {
        const lowerText = text.toLowerCase();
        
        // Determine Winston's response based on conversation step and content
        if (conversationStep === 0) {
            // Initial greeting responses
            const response = getRandomResponse(winstonResponses.greetings);
            setTimeout(() => {
                addWinstonMessage(conversation[1].winston);
                setTimeout(() => {
                    showInput();
                    showQuickResponses(conversation[1].quickOptions);
                }, 2000);
            }, 1000);
            conversationStep = 1;
        } else if (lowerText.includes('wisdom') || lowerText.includes('advice')) {
            // User wants to share wisdom
            const response = getRandomResponse(winstonResponses.wisdom);
            setTimeout(() => {
                addWinstonMessage(response);
                setTimeout(() => {
                    showInput();
                    userInput.placeholder = "Share your wisdom or life advice...";
                }, 1500);
            }, 1000);
        } else if (lowerText.includes('funny') || lowerText.includes('travel') || lowerText.includes('embarrassing') || lowerText.includes('family')) {
            // User is ready to share a story
            const encouragement = getRandomResponse(winstonResponses.encouragement);
            setTimeout(() => {
                addWinstonMessage(encouragement);
                setTimeout(() => {
                    showInput();
                    userInput.placeholder = "Tell me your story! I'm all ears...";
                }, 1500);
            }, 1000);
        } else if (text.length > 50) {
            // User shared a substantial story
            userStory.content = text;
            const response = getRandomResponse(winstonResponses.transitions);
            setTimeout(() => {
                addWinstonMessage(response + " " + getFollowUpQuestion());
                setTimeout(() => {
                    showSaveOption();
                }, 2000);
            }, 1000);
        } else {
            // General encouragement
            const response = getRandomResponse(winstonResponses.encouragement);
            setTimeout(() => {
                addWinstonMessage(response);
                setTimeout(() => {
                    showInput();
                }, 1500);
            }, 1000);
        }
    }
    
    // Get random response from array
    function getRandomResponse(responses) {
        return responses[Math.floor(Math.random() * responses.length)];
    }
    
    // Get follow-up question
    function getFollowUpQuestion() {
        const questions = [
            "What made that moment so special for you?",
            "How did that experience change you?",
            "What would you tell someone facing a similar situation?",
            "What wisdom did you gain from that experience?"
        ];
        return getRandomResponse(questions);
    }
    
    // Show save option
    function showSaveOption() {
        const saveOptions = [
            "Save this memory to my archive",
            "Add another story",
            "Tell me what happens next"
        ];
        showQuickResponses(saveOptions);
    }
    
    // Handle save to archive
    function saveToArchive(memoryContent) {
        // Store the memory for the archive page
        localStorage.setItem('capturedMemory', JSON.stringify({
            content: memoryContent,
            timestamp: new Date().toISOString(),
            source: 'winston'
        }));
        
        // Navigate to memory archive
        setTimeout(() => {
            window.location.href = 'memory-archive.html';
        }, 1000);
    }
    
    // Show input area
    function showInput() {
        inputArea.style.display = 'block';
        userInput.focus();
    }
    
    // Scroll to bottom of messages
    function scrollToBottom() {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    // Text-to-speech for Winston
    function speakText(text) {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text.replace(/\*(.*?)\*/g, '$1'));
            utterance.rate = 0.9;
            utterance.pitch = 1.1;
            
            // Try to find a British voice
            const voices = speechSynthesis.getVoices();
            const britishVoice = voices.find(voice => 
                voice.lang.includes('en-GB') || 
                voice.name.includes('British') || 
                voice.name.includes('UK')
            );
            
            if (britishVoice) {
                utterance.voice = britishVoice;
            }
            
            speechSynthesis.speak(utterance);
        }
    }
    
    // Handle send button
    sendBtn.addEventListener('click', function() {
        const text = userInput.value.trim();
        if (text) {
            addMessageToChat('user', text);
            hideQuickResponses();
            handleUserResponse(text);
            userInput.value = '';
            inputArea.style.display = 'none';
        }
    });
    
    // Handle enter key
    userInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendBtn.click();
        }
    });
    
    // Handle audio toggle
    audioToggle.addEventListener('click', function() {
        audioEnabled = !audioEnabled;
        const icon = audioToggle.querySelector('.audio-icon');
        const text = audioToggle.querySelector('.audio-text');
        
        if (audioEnabled) {
            icon.textContent = '🔊';
            text.textContent = 'Winston\'s Voice ON';
            audioToggle.style.background = 'rgba(255, 215, 0, 0.2)';
        } else {
            icon.textContent = '🔇';
            text.textContent = 'Winston\'s Voice OFF';
            audioToggle.style.background = 'rgba(255, 248, 231, 0.9)';
        }
    });
    
    // Start the conversation
    startConversation();
});