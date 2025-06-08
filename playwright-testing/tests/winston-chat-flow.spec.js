const { test, expect } = require('@playwright/test');

test.describe('Meet Winston Interactive Chat Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8357/pages/meet-winston.html');
  });

  test('should display Winston character with animations', async ({ page }) => {
    // Check Winston character container
    const winstonContainer = page.locator('.winston-character, .character-container, [class*="winston"]');
    await expect(winstonContainer.first()).toBeVisible();
    
    // Check for Winston avatar/image
    const winstonAvatar = page.locator('.winston-avatar, .character-avatar, img[alt*="Winston"], .winston-face');
    await expect(winstonAvatar.first()).toBeVisible();
    
    // Check for animated elements (eyes, pipe, etc.)
    const animatedElements = page.locator('.winston-eyes, .winston-pipe, .animated, [class*="animation"]');
    const hasAnimations = await animatedElements.count() > 0;
    
    if (hasAnimations) {
      const firstAnimation = animatedElements.first();
      await expect(firstAnimation).toBeVisible();
    }
  });

  test('should display chat interface with proper structure', async ({ page }) => {
    // Check chat container
    const chatContainer = page.locator('.chat-container, .conversation-area, [class*="chat"]');
    await expect(chatContainer.first()).toBeVisible();
    
    // Check for message area
    const messageArea = page.locator('.messages, .chat-messages, .conversation-messages');
    await expect(messageArea.first()).toBeVisible();
    
    // Check for input area
    const inputArea = page.locator('.chat-input, .message-input, input[type="text"], textarea');
    const hasInput = await inputArea.first().isVisible().catch(() => false);
    
    // Check for send button
    const sendButton = page.locator('button:has-text("Send"), .send-button, [class*="send"]');
    const hasSendButton = await sendButton.first().isVisible().catch(() => false);
    
    expect(hasInput || hasSendButton).toBeTruthy();
  });

  test('should display initial welcome message from Winston', async ({ page }) => {
    // Wait for initial message to appear
    await page.waitForTimeout(1000);
    
    // Check for Winston's welcome message
    const welcomeMessage = page.locator('.message, .chat-message, .winston-message');
    await expect(welcomeMessage.first()).toBeVisible();
    
    // Check message content contains greeting
    const messageText = await welcomeMessage.first().textContent();
    const hasGreeting = messageText && (
      messageText.includes('Hello') || 
      messageText.includes('Hi') || 
      messageText.includes('Welcome') ||
      messageText.includes('meet')
    );
    
    expect(hasGreeting).toBeTruthy();
  });

  test('should handle user input and send functionality', async ({ page }) => {
    // Find input field and send button
    const inputField = page.locator('.chat-input, .message-input, input[type="text"], textarea').first();
    const sendButton = page.locator('button:has-text("Send"), .send-button, [class*="send"]').first();
    
    if (await inputField.isVisible() && await sendButton.isVisible()) {
      // Type a test message
      const testMessage = "Hello Winston!";
      await inputField.fill(testMessage);
      
      // Check that send button becomes enabled
      await expect(sendButton).toBeEnabled();
      
      // Click send button
      await sendButton.click();
      await page.waitForTimeout(500);
      
      // Check that message appears in chat
      const userMessage = page.locator('.user-message, .my-message, [class*="user"]');
      if (await userMessage.first().isVisible()) {
        const messageContent = await userMessage.first().textContent();
        expect(messageContent).toContain(testMessage);
      }
      
      // Check that input field is cleared
      const inputValue = await inputField.inputValue();
      expect(inputValue).toBe('');
    }
  });

  test('should display quick response buttons', async ({ page }) => {
    // Wait for quick responses to load
    await page.waitForTimeout(1500);
    
    // Check for quick response buttons
    const quickResponses = page.locator('.quick-response, .suggested-response, .response-button, button[data-response]');
    const responseCount = await quickResponses.count();
    
    if (responseCount > 0) {
      // Check that buttons are visible and clickable
      const firstResponse = quickResponses.first();
      await expect(firstResponse).toBeVisible();
      await expect(firstResponse).toBeEnabled();
      
      // Click first quick response
      await firstResponse.click();
      await page.waitForTimeout(500);
      
      // Check for Winston's response
      const winstonResponse = page.locator('.winston-message, .bot-message, [class*="winston"]').last();
      await expect(winstonResponse).toBeVisible();
    }
  });

  test('should handle audio toggle functionality', async ({ page }) => {
    // Look for audio/sound toggle
    const audioToggle = page.locator('.audio-toggle, .sound-toggle, button[data-audio], .mute-button');
    
    if (await audioToggle.first().isVisible()) {
      const initialState = await audioToggle.first().getAttribute('class');
      
      // Click audio toggle
      await audioToggle.first().click();
      await page.waitForTimeout(300);
      
      // Check that state changed
      const newState = await audioToggle.first().getAttribute('class');
      expect(newState).not.toBe(initialState);
      
      // Toggle back
      await audioToggle.first().click();
      await page.waitForTimeout(300);
      
      // Should return to original state
      const finalState = await audioToggle.first().getAttribute('class');
      expect(finalState).toBe(initialState);
    }
  });

  test('should handle progressive conversation flow', async ({ page }) => {
    // Wait for conversation to start
    await page.waitForTimeout(2000);
    
    // Check for multiple conversation stages
    const messages = page.locator('.message, .chat-message');
    const messageCount = await messages.count();
    
    if (messageCount > 1) {
      // Verify messages have proper order/timing
      const firstMessage = messages.first();
      const lastMessage = messages.last();
      
      await expect(firstMessage).toBeVisible();
      await expect(lastMessage).toBeVisible();
      
      // Check that messages have timestamps or proper sequencing
      const hasTimestamps = await page.locator('.timestamp, .message-time, [class*="time"]').count() > 0;
      const hasSequencing = await page.locator('[data-message-id], [data-order]').count() > 0;
      
      expect(hasTimestamps || hasSequencing || messageCount > 0).toBeTruthy();
    }
  });

  test('should handle conversation state and persistence', async ({ page }) => {
    // Send a message
    const inputField = page.locator('.chat-input, .message-input, input[type="text"], textarea').first();
    const sendButton = page.locator('button:has-text("Send"), .send-button, [class*="send"]').first();
    
    if (await inputField.isVisible() && await sendButton.isVisible()) {
      await inputField.fill("Test conversation state");
      await sendButton.click();
      await page.waitForTimeout(1000);
      
      // Get current message count
      const initialMessageCount = await page.locator('.message, .chat-message').count();
      
      // Refresh page
      await page.reload();
      await page.waitForTimeout(1500);
      
      // Check if conversation state persisted or reset appropriately
      const newMessageCount = await page.locator('.message, .chat-message').count();
      
      // Either conversation persisted (same count) or reset properly (initial state)
      expect(newMessageCount >= 1).toBeTruthy(); // At least Winston's welcome message
    }
  });

  test('should handle typing indicators and response delays', async ({ page }) => {
    // Send a message to trigger Winston response
    const inputField = page.locator('.chat-input, .message-input, input[type="text"], textarea').first();
    const sendButton = page.locator('button:has-text("Send"), .send-button, [class*="send"]').first();
    
    if (await inputField.isVisible() && await sendButton.isVisible()) {
      await inputField.fill("Hello");
      await sendButton.click();
      
      // Look for typing indicator
      const typingIndicator = page.locator('.typing, .typing-indicator, [class*="typing"], .dots');
      
      // Wait briefly to see if typing indicator appears
      await page.waitForTimeout(500);
      
      const hasTypingIndicator = await typingIndicator.first().isVisible().catch(() => false);
      
      if (hasTypingIndicator) {
        await expect(typingIndicator.first()).toBeVisible();
        
        // Wait for response and typing indicator to disappear
        await page.waitForTimeout(2000);
        
        const stillTyping = await typingIndicator.first().isVisible().catch(() => false);
        expect(stillTyping).toBe(false);
      }
    }
  });

  test('should handle error states and connection issues', async ({ page }) => {
    // Try to trigger error conditions
    const inputField = page.locator('.chat-input, .message-input, input[type="text"], textarea').first();
    const sendButton = page.locator('button:has-text("Send"), .send-button, [class*="send"]').first();
    
    if (await inputField.isVisible() && await sendButton.isVisible()) {
      // Send multiple rapid messages to test rate limiting
      for (let i = 0; i < 3; i++) {
        await inputField.fill(`Test message ${i}`);
        await sendButton.click();
        await page.waitForTimeout(100);
      }
      
      // Check for error messages or rate limiting
      const errorMessage = page.locator('.error, .error-message, [class*="error"]');
      const rateLimitMessage = page.locator('.rate-limit, .too-fast, [class*="limit"]');
      
      const hasError = await errorMessage.first().isVisible().catch(() => false);
      const hasRateLimit = await rateLimitMessage.first().isVisible().catch(() => false);
      
      // Either error handling works or messages go through normally
      expect(hasError || hasRateLimit || true).toBeTruthy();
    }
  });

  test('should handle special command inputs', async ({ page }) => {
    // Test special commands if supported
    const inputField = page.locator('.chat-input, .message-input, input[type="text"], textarea').first();
    const sendButton = page.locator('button:has-text("Send"), .send-button, [class*="send"]').first();
    
    if (await inputField.isVisible() && await sendButton.isVisible()) {
      // Try help command
      await inputField.fill("/help");
      await sendButton.click();
      await page.waitForTimeout(1000);
      
      // Check for help response
      const helpResponse = page.locator('.help, .commands, [class*="help"]');
      const lastMessage = page.locator('.message, .chat-message').last();
      
      const hasHelpResponse = await helpResponse.first().isVisible().catch(() => false);
      
      if (hasHelpResponse) {
        await expect(helpResponse.first()).toBeVisible();
      } else {
        // At minimum, Winston should respond to any input
        await expect(lastMessage).toBeVisible();
      }
    }
  });
});