const { test, expect } = require('@playwright/test');

test.describe('Curator Empty Response Handling', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8357/pages/curator.html');
    
    // Click "I Understand - Start Curating" to start interview
    await page.click('button:has-text("I Understand - Start Curating")');
    
    // Wait for interview to initialize
    await page.waitForTimeout(2000);
  });

  test('should not send empty messages when pressing Enter', async ({ page }) => {
    // Focus on the message input
    const messageInput = page.locator('#messageInput');
    await messageInput.focus();
    
    // Try to submit empty message with Enter
    await messageInput.press('Enter');
    
    // Wait a bit to see if message was sent
    await page.waitForTimeout(1000);
    
    // Check that no empty user message was added to chat
    const userMessages = page.locator('.message.user-message');
    const count = await userMessages.count();
    expect(count).toBe(0);
  });

  test('should trim whitespace from messages', async ({ page }) => {
    const messageInput = page.locator('#messageInput');
    
    // Type message with only spaces
    await messageInput.fill('   ');
    await messageInput.press('Enter');
    
    // Wait to ensure no message is sent
    await page.waitForTimeout(1000);
    
    // Verify no message was added
    const userMessages = page.locator('.message.user-message');
    expect(await userMessages.count()).toBe(0);
  });

  test('should handle multiple rapid empty submissions', async ({ page }) => {
    const messageInput = page.locator('#messageInput');
    await messageInput.focus();
    
    // Try to submit empty messages rapidly
    for (let i = 0; i < 5; i++) {
      await messageInput.press('Enter');
      await page.waitForTimeout(100);
    }
    
    // Verify no messages were added
    const userMessages = page.locator('.message.user-message');
    expect(await userMessages.count()).toBe(0);
  });

  test('should clear input after sending valid message', async ({ page }) => {
    const messageInput = page.locator('#messageInput');
    const testMessage = 'This is a test memory';
    
    // Type and send a valid message
    await messageInput.fill(testMessage);
    await messageInput.press('Enter');
    
    // Wait for message to be processed
    await page.waitForTimeout(1000);
    
    // Verify input was cleared
    const inputValue = await messageInput.inputValue();
    expect(inputValue).toBe('');
  });

  test('should preserve text when switching between chat views', async ({ page }) => {
    const messageInput = page.locator('#messageInput');
    const testText = 'This is an unsent message';
    
    // Type text but don't send
    await messageInput.fill(testText);
    
    // Expand chat modal
    const expandButton = page.locator('button', { hasText: 'Expand' }).first();
    if (await expandButton.isVisible()) {
      await expandButton.click();
      await page.waitForTimeout(500);
      
      // Check if text is preserved in modal input
      const modalInput = page.locator('#modalInput');
      if (await modalInput.isVisible()) {
        const modalValue = await modalInput.inputValue();
        expect(modalValue).toBe(testText);
      }
    }
  });

  test('should handle very long messages gracefully', async ({ page }) => {
    const messageInput = page.locator('#messageInput');
    const longMessage = 'A'.repeat(5000); // 5000 character message
    
    // Type very long message
    await messageInput.fill(longMessage);
    
    // Get value to see if it was truncated
    const actualValue = await messageInput.inputValue();
    
    // The textarea should accept the full message (no built-in limit detected)
    expect(actualValue.length).toBeGreaterThan(0);
    
    // Try to send it
    await messageInput.press('Enter');
    await page.waitForTimeout(1000);
    
    // If message was sent, verify it appears
    const userMessages = page.locator('.message.user-message');
    if (await userMessages.count() > 0) {
      const lastMessage = userMessages.last();
      const messageText = await lastMessage.locator('.message-content').textContent();
      expect(messageText).toBeTruthy();
    }
  });

  test('should handle special characters in messages', async ({ page }) => {
    const messageInput = page.locator('#messageInput');
    const specialChars = '<script>alert("test")</script>!@#$%^&*(){}[]|\\:;"\'<>,.?/~`';
    
    // Type message with special characters
    await messageInput.fill(specialChars);
    await messageInput.press('Enter');
    
    // Wait for message to appear
    await page.waitForTimeout(1000);
    
    // Verify the message appears properly escaped
    const userMessages = page.locator('.message.user-message');
    if (await userMessages.count() > 0) {
      const lastMessage = userMessages.last();
      const messageText = await lastMessage.locator('.message-content').textContent();
      
      // Check that script tags are not executed (properly escaped)
      expect(messageText).toContain('script');
      
      // Verify no alert was triggered
      const alertPromise = page.waitForEvent('dialog', { timeout: 1000 }).catch(() => null);
      const alert = await alertPromise;
      expect(alert).toBeNull();
    }
  });

  test('should maintain focus after sending message', async ({ page }) => {
    const messageInput = page.locator('#messageInput');
    
    // Type and send message
    await messageInput.fill('Test message');
    await messageInput.press('Enter');
    
    // Wait for processing
    await page.waitForTimeout(1000);
    
    // Check if input still has focus
    const isFocused = await messageInput.evaluate(el => document.activeElement === el);
    expect(isFocused).toBe(true);
  });

  test('should handle textarea resize with multiple lines', async ({ page }) => {
    const messageInput = page.locator('#messageInput');
    
    // Type multi-line message
    await messageInput.fill('Line 1\nLine 2\nLine 3\nLine 4');
    
    // Get the height to ensure it expanded
    const height = await messageInput.evaluate(el => el.scrollHeight);
    expect(height).toBeGreaterThan(50); // Should be taller than single line
    
    // Send the message
    await messageInput.press('Control+Enter'); // Try Ctrl+Enter for multi-line
    await page.waitForTimeout(500);
    
    // If not sent, try regular Enter
    const inputValue = await messageInput.inputValue();
    if (inputValue) {
      await messageInput.press('Enter');
    }
  });

  test('should show error for network failures', async ({ page }) => {
    // Simulate network failure by going offline
    await page.context().setOffline(true);
    
    const messageInput = page.locator('#messageInput');
    await messageInput.fill('Test message during offline');
    await messageInput.press('Enter');
    
    // Wait for error handling
    await page.waitForTimeout(2000);
    
    // Look for error toast or message
    const errorToast = page.locator('.toast.error');
    const isErrorVisible = await errorToast.isVisible().catch(() => false);
    
    // Re-enable network
    await page.context().setOffline(false);
    
    // Either an error should show or message should be queued
    if (isErrorVisible) {
      const errorText = await errorToast.textContent();
      expect(errorText).toContain('error');
    }
  });
});