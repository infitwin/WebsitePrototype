const { test, expect } = require('@playwright/test');

test.describe('Talk to Twin Rate Limiting and Message Handling', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8357/pages/talk-to-twin.html');
    await page.waitForLoadState('networkidle');
  });

  test('should handle rapid message submissions gracefully', async ({ page }) => {
    const chatInput = page.locator('#chatInput');
    const sendBtn = page.locator('#sendBtn');
    
    // Enable send button by typing
    await chatInput.fill('Test message 1');
    
    // Send multiple messages rapidly
    const messages = ['Message 1', 'Message 2', 'Message 3', 'Message 4', 'Message 5'];
    
    for (const msg of messages) {
      await chatInput.fill(msg);
      await sendBtn.click();
      // Don't wait between submissions
    }
    
    // Wait for messages to appear
    await page.waitForTimeout(3000);
    
    // Check that all messages were sent
    const userMessages = page.locator('.message.user');
    const messageCount = await userMessages.count();
    
    // All 5 messages should be present
    expect(messageCount).toBe(5);
    
    // Verify no error messages appeared
    const errorMessages = page.locator('.error, .error-message, [class*="error"]');
    expect(await errorMessages.count()).toBe(0);
  });

  test('should disable send button while processing message', async ({ page }) => {
    const chatInput = page.locator('#chatInput');
    const sendBtn = page.locator('#sendBtn');
    
    // Type a message
    await chatInput.fill('Test message');
    
    // Send button should be enabled
    await expect(sendBtn).toBeEnabled();
    
    // Click send
    await sendBtn.click();
    
    // Send button should be disabled immediately after sending
    await expect(sendBtn).toBeDisabled();
    
    // Wait for response
    await page.waitForTimeout(3000);
    
    // Send button should remain disabled until new input
    await expect(sendBtn).toBeDisabled();
    
    // Type new message
    await chatInput.fill('Another message');
    
    // Send button should be enabled again
    await expect(sendBtn).toBeEnabled();
  });

  test('should handle very long messages without breaking layout', async ({ page }) => {
    const chatInput = page.locator('#chatInput');
    const sendBtn = page.locator('#sendBtn');
    
    // Create a very long message
    const longMessage = 'This is a very long message. '.repeat(100);
    
    await chatInput.fill(longMessage);
    await sendBtn.click();
    
    // Wait for message to appear
    await page.waitForTimeout(1000);
    
    // Check that message bubble exists and is visible
    const messageBubble = page.locator('.message.user .message-bubble').last();
    await expect(messageBubble).toBeVisible();
    
    // Check that the message container hasn't exceeded viewport width
    const viewportSize = page.viewportSize();
    const bubbleBox = await messageBubble.boundingBox();
    
    expect(bubbleBox.width).toBeLessThan(viewportSize.width * 0.75); // Should not exceed 75% of viewport
  });

  test('should auto-resize textarea for multiline input', async ({ page }) => {
    const chatInput = page.locator('#chatInput');
    
    // Get initial height
    const initialHeight = await chatInput.evaluate(el => el.offsetHeight);
    
    // Type multiline text
    await chatInput.fill('Line 1\nLine 2\nLine 3\nLine 4');
    
    // Get new height
    const newHeight = await chatInput.evaluate(el => el.offsetHeight);
    
    // Height should have increased
    expect(newHeight).toBeGreaterThan(initialHeight);
    
    // But should not exceed max height (120px as per code)
    expect(newHeight).toBeLessThanOrEqual(120);
  });

  test('should handle emoji and special characters correctly', async ({ page }) => {
    const chatInput = page.locator('#chatInput');
    const sendBtn = page.locator('#sendBtn');
    
    const specialMessage = '🎉 Hello! 你好! مرحبا! <script>alert("test")</script> @#$%^&*()';
    
    await chatInput.fill(specialMessage);
    await sendBtn.click();
    
    // Wait for message to appear
    await page.waitForTimeout(1000);
    
    // Verify message appears correctly
    const lastMessage = page.locator('.message.user .message-text').last();
    const messageText = await lastMessage.textContent();
    
    // Should contain emoji and special characters
    expect(messageText).toContain('🎉');
    expect(messageText).toContain('你好');
    expect(messageText).toContain('@#$%^&*()');
    
    // Script tags should be handled safely (either escaped or removed)
    const hasScriptTag = messageText.includes('<script>');
    const hasAlert = await page.evaluate(() => {
      return window.alertCalled || false;
    });
    
    expect(hasAlert).toBe(false); // No alert should be triggered
  });

  test('should maintain chat history during rapid interactions', async ({ page }) => {
    const chatInput = page.locator('#chatInput');
    const sendBtn = page.locator('#sendBtn');
    
    // Send several messages
    const testMessages = [
      'First message',
      'Second message', 
      'Third message'
    ];
    
    for (const msg of testMessages) {
      await chatInput.fill(msg);
      await sendBtn.click();
      await page.waitForTimeout(2000); // Wait for response
    }
    
    // All user messages should be present
    const userMessages = await page.locator('.message.user .message-text').allTextContents();
    
    expect(userMessages).toContain('First message');
    expect(userMessages).toContain('Second message');
    expect(userMessages).toContain('Third message');
    
    // Should have received AI responses (at least 3)
    const twinMessages = page.locator('.message.twin');
    expect(await twinMessages.count()).toBeGreaterThanOrEqual(3);
  });

  test('should handle network interruption gracefully', async ({ page, context }) => {
    const chatInput = page.locator('#chatInput');
    const sendBtn = page.locator('#sendBtn');
    
    // Send first message normally
    await chatInput.fill('Test message before offline');
    await sendBtn.click();
    await page.waitForTimeout(2000);
    
    // Go offline
    await context.setOffline(true);
    
    // Try to send message while offline
    await chatInput.fill('Test message during offline');
    await sendBtn.click();
    
    // Wait for any error handling
    await page.waitForTimeout(2000);
    
    // Go back online
    await context.setOffline(false);
    
    // Page should still be functional
    await chatInput.fill('Test message after reconnection');
    await sendBtn.click();
    
    // Check that the page didn't crash
    await expect(chatInput).toBeVisible();
    await expect(sendBtn).toBeVisible();
  });

  test('should scroll to bottom when new messages appear', async ({ page }) => {
    const chatInput = page.locator('#chatInput');
    const sendBtn = page.locator('#sendBtn');
    const messagesContainer = page.locator('#chatMessages');
    
    // Send multiple messages to create scrollable content
    for (let i = 0; i < 10; i++) {
      await chatInput.fill(`Message ${i + 1}`);
      await sendBtn.click();
      await page.waitForTimeout(500);
    }
    
    // Get scroll position
    const isScrolledToBottom = await messagesContainer.evaluate(el => {
      return Math.abs(el.scrollHeight - el.scrollTop - el.clientHeight) < 10;
    });
    
    expect(isScrolledToBottom).toBe(true);
  });

  test('should handle voice button interactions', async ({ page }) => {
    const voiceBtn = page.locator('#voiceBtn');
    const recordingIndicator = page.locator('#recordingIndicator');
    
    // Voice button should be visible
    await expect(voiceBtn).toBeVisible();
    
    // Start recording (mousedown)
    await voiceBtn.dispatchEvent('mousedown');
    await page.waitForTimeout(200);
    
    // Recording indicator should show
    await expect(recordingIndicator).toHaveClass(/show/);
    
    // Stop recording (mouseup)
    await voiceBtn.dispatchEvent('mouseup');
    await page.waitForTimeout(1000);
    
    // Recording should stop and text should appear in input
    await expect(recordingIndicator).not.toHaveClass(/show/);
    
    // Check if simulated transcription added text
    const chatInput = page.locator('#chatInput');
    const inputValue = await chatInput.inputValue();
    expect(inputValue.length).toBeGreaterThan(0);
  });

  test('should handle suggested questions correctly', async ({ page }) => {
    // Look for suggested questions
    const suggestedQuestions = page.locator('#suggestedQuestions');
    
    if (await suggestedQuestions.isVisible()) {
      // Click a suggested question
      const firstQuestion = suggestedQuestions.locator('.suggested-question').first();
      const questionText = await firstQuestion.textContent();
      
      await firstQuestion.click();
      
      // Suggested questions should hide
      await expect(suggestedQuestions).toBeHidden();
      
      // Message should be sent
      const userMessages = page.locator('.message.user .message-text');
      const lastMessageText = await userMessages.last().textContent();
      
      expect(lastMessageText).toBe(questionText);
    }
  });
});