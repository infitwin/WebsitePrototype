/**
 * Chat Interface Functions
 * Shared chat message handling for interview pages
 */

/**
 * Add a message to the chat interface
 * @param {string} text - The message text
 * @param {string} sender - The sender: 'user' or 'winston'
 */
export function addMessage(text, sender) {
    const messagesContainer = document.getElementById('chatMessages');
    if (!messagesContainer) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = 'message' + (sender === 'user' ? ' user-message' : '');

    // Create message content element
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    messageContent.textContent = text; // Use textContent to safely escape HTML

    if (sender === 'winston') {
        const winstonOrb = document.createElement('div');
        winstonOrb.className = 'winston-orb';
        winstonOrb.textContent = '\uD83C\uDFA9'; // Top hat emoji

        messageDiv.appendChild(winstonOrb);
        messageDiv.appendChild(messageContent);
    } else {
        messageDiv.appendChild(messageContent);
    }

    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}
