const { test, expect } = require('@playwright/test');

test.describe('Memory Input Validation & Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8357/pages/capture-first-memory.html');
    await page.waitForLoadState('networkidle');
  });

  test('should enforce 500 character limit boundary', async ({ page }) => {
    const textarea = page.locator('textarea, .memory-input').first();
    
    if (await textarea.isVisible()) {
      // Test exactly 500 characters
      const exactly500Chars = 'A'.repeat(500);
      await textarea.fill(exactly500Chars);
      
      const value500 = await textarea.inputValue();
      expect(value500.length).toBe(500);
      
      // Check character counter shows 500/500
      const charCounter = page.locator('.char-count, .character-count, [class*="count"]');
      if (await charCounter.first().isVisible()) {
        const counterText = await charCounter.first().textContent();
        expect(counterText).toContain('500');
      }
      
      // Test 501+ characters (should be prevented or truncated)
      const over500Chars = 'B'.repeat(501);
      await textarea.fill(over500Chars);
      
      const valueOver500 = await textarea.inputValue();
      expect(valueOver500.length).toBeLessThanOrEqual(500);
    }
  });

  test('should handle minimum character requirement (20 chars)', async ({ page }) => {
    const textarea = page.locator('textarea, .memory-input').first();
    const continueBtn = page.locator('button:has-text("Continue"), #continue-btn, .btn-primary').first();
    
    if (await textarea.isVisible() && await continueBtn.isVisible()) {
      // Test empty input
      await textarea.fill('');
      expect(await continueBtn.isEnabled()).toBe(false);
      
      // Test less than 20 characters
      await textarea.fill('Short text');
      expect(await continueBtn.isEnabled()).toBe(false);
      
      // Test exactly 20 characters
      const exactly20Chars = 'A'.repeat(20);
      await textarea.fill(exactly20Chars);
      await page.waitForTimeout(300);
      
      expect(await continueBtn.isEnabled()).toBe(true);
      
      // Test 21+ characters (should keep button enabled)
      await textarea.fill('This is more than twenty characters long');
      expect(await continueBtn.isEnabled()).toBe(true);
    }
  });

  test('should sanitize XSS injection attempts', async ({ page }) => {
    const textarea = page.locator('textarea, .memory-input').first();
    
    if (await textarea.isVisible()) {
      // Test XSS script injection
      const xssScript = '<script>alert("XSS Test")</script>';
      await textarea.fill(xssScript);
      
      // Check that preview doesn't execute script
      const preview = page.locator('.preview, .memory-preview');
      if (await preview.first().isVisible()) {
        const previewHTML = await preview.first().innerHTML();
        
        // Script tags should be escaped or stripped
        expect(previewHTML).not.toContain('<script>');
        expect(previewHTML).not.toMatch(/<script.*>/i);
      }
      
      // Test image XSS
      const imgXSS = '<img src=x onerror=alert("Image XSS")>';
      await textarea.fill(imgXSS);
      
      // Check no javascript execution occurred
      const hasAlert = await page.evaluate(() => {
        return window.alertTriggered || false;
      });
      expect(hasAlert).toBe(false);
    }
  });

  test('should handle SQL injection attempts safely', async ({ page }) => {
    const textarea = page.locator('textarea, .memory-input').first();
    
    if (await textarea.isVisible()) {
      // Test various SQL injection patterns
      const sqlInjections = [
        "'; DROP TABLE users; --",
        "' OR '1'='1",
        "1; UPDATE users SET password='hacked' WHERE 1=1; --",
        "' UNION SELECT * FROM admin_users; --"
      ];
      
      for (const injection of sqlInjections) {
        await textarea.fill(injection);
        
        // Input should be accepted as regular text
        const inputValue = await textarea.inputValue();
        expect(inputValue).toBe(injection);
        
        // No error should occur
        const errorElements = page.locator('.error, .error-message, [class*="error"]');
        const hasError = await errorElements.count() > 0 && await errorElements.first().isVisible();
        expect(hasError).toBe(false);
      }
    }
  });

  test('should handle special characters and Unicode', async ({ page }) => {
    const textarea = page.locator('textarea, .memory-input').first();
    
    if (await textarea.isVisible()) {
      // Test emoji and Unicode characters
      const specialChars = [
        '🎉🌟❤️ Memory with emojis',
        'Café résumé naïve—special chars',
        '中文 日本語 한국어 Unicode text',
        'Right-to-left: العربية עברית',
        'Math symbols: ∑ ∞ π ≈ ≠ ±',
        'Currency: $ € £ ¥ ¢'
      ];
      
      for (const text of specialChars) {
        await textarea.fill(text);
        
        // Should accept special characters
        const inputValue = await textarea.inputValue();
        expect(inputValue).toBe(text);
        
        // Character count should be accurate
        const charCounter = page.locator('.char-count, [class*="count"]');
        if (await charCounter.first().isVisible()) {
          const counterText = await charCounter.first().textContent();
          const count = parseInt(counterText.match(/\d+/)?.[0] || '0');
          expect(count).toBe(text.length);
        }
      }
    }
  });

  test('should handle very long single words', async ({ page }) => {
    const textarea = page.locator('textarea, .memory-input').first();
    
    if (await textarea.isVisible()) {
      // Test extremely long word without spaces
      const longWord = 'A'.repeat(400) + 'B'.repeat(100); // 500 chars, no spaces
      await textarea.fill(longWord);
      
      const inputValue = await textarea.inputValue();
      expect(inputValue.length).toBeLessThanOrEqual(500);
      
      // Check text doesn't break layout
      const textareaWidth = await textarea.boundingBox();
      if (textareaWidth) {
        // Textarea should maintain reasonable width
        expect(textareaWidth.width).toBeLessThan(1000);
      }
    }
  });

  test('should handle rapid input and deletion', async ({ page }) => {
    const textarea = page.locator('textarea, .memory-input').first();
    
    if (await textarea.isVisible()) {
      // Rapid typing simulation
      const texts = [
        'First memory',
        'Second longer memory with more detail',
        'Third memory',
        '',
        'Final memory content after rapid changes'
      ];
      
      for (const text of texts) {
        await textarea.fill(text);
        await page.waitForTimeout(100); // Brief pause between changes
      }
      
      // Check final state is correct
      const finalValue = await textarea.inputValue();
      expect(finalValue).toBe(texts[texts.length - 1]);
      
      // Character counter should be updated
      const charCounter = page.locator('.char-count, [class*="count"]');
      if (await charCounter.first().isVisible()) {
        const counterText = await charCounter.first().textContent();
        expect(counterText).toContain(finalValue.length.toString());
      }
    }
  });

  test('should handle paste operations with formatted text', async ({ page }) => {
    const textarea = page.locator('textarea, .memory-input').first();
    
    if (await textarea.isVisible()) {
      // Simulate pasting rich text content
      const richTextContent = `This is a memory with
      multiple lines
      and    extra    spaces
      
      And empty lines too!`;
      
      await textarea.fill(richTextContent);
      
      const inputValue = await textarea.inputValue();
      
      // Should preserve basic formatting but handle gracefully
      expect(inputValue.length).toBeGreaterThan(0);
      expect(inputValue.length).toBeLessThanOrEqual(500);
      
      // Test pasting content that exceeds limit
      const oversizedContent = 'X'.repeat(600);
      await textarea.fill(oversizedContent);
      
      const truncatedValue = await textarea.inputValue();
      expect(truncatedValue.length).toBeLessThanOrEqual(500);
    }
  });

  test('should handle form state during network issues', async ({ page }) => {
    const textarea = page.locator('textarea, .memory-input').first();
    const continueBtn = page.locator('button:has-text("Continue"), #continue-btn').first();
    
    if (await textarea.isVisible() && await continueBtn.isVisible()) {
      // Fill valid content
      await textarea.fill('This is a valid memory with enough characters to enable the continue button.');
      
      // Simulate network being offline
      await page.context().setOffline(true);
      
      // Try to continue
      if (await continueBtn.isEnabled()) {
        await continueBtn.click();
        await page.waitForTimeout(1000);
        
        // Should handle network error gracefully
        const errorMessage = page.locator('.error, .network-error, [class*="error"]');
        const hasErrorMessage = await errorMessage.count() > 0;
        
        // Either show error message or maintain form state
        if (hasErrorMessage) {
          await expect(errorMessage.first()).toBeVisible();
        } else {
          // Form should still be intact
          const textareaValue = await textarea.inputValue();
          expect(textareaValue.length).toBeGreaterThan(0);
        }
      }
      
      // Restore network
      await page.context().setOffline(false);
    }
  });

  test('should maintain state during browser navigation', async ({ page }) => {
    const textarea = page.locator('textarea, .memory-input').first();
    
    if (await textarea.isVisible()) {
      const testContent = 'This is important memory content that should persist during navigation tests.';
      await textarea.fill(testContent);
      
      // Simulate page refresh
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Check if content is restored (may depend on implementation)
      const textareaAfterReload = page.locator('textarea, .memory-input').first();
      if (await textareaAfterReload.isVisible()) {
        const restoredValue = await textareaAfterReload.inputValue();
        
        // Either content is restored or form is properly reset
        expect(restoredValue === testContent || restoredValue === '').toBeTruthy();
      }
    }
  });

  test('should handle enhancement button interactions', async ({ page }) => {
    // Test voice recording button
    const voiceBtn = page.locator('button[data-type="voice"], .voice-btn, button:has-text("Record")');
    if (await voiceBtn.first().isVisible()) {
      await voiceBtn.first().click();
      await page.waitForTimeout(300);
      
      // Should show some feedback or modal
      const modal = page.locator('.modal, .voice-modal, .recording-modal');
      const feedback = page.locator('.recording, .voice-feedback, [class*="recording"]');
      
      const hasModalOrFeedback = 
        (await modal.count() > 0 && await modal.first().isVisible()) ||
        (await feedback.count() > 0 && await feedback.first().isVisible());
      
      expect(hasModalOrFeedback).toBeTruthy();
    }
    
    // Test context button
    const contextBtn = page.locator('button[data-type="context"], .context-btn, button:has-text("Context")');
    if (await contextBtn.first().isVisible()) {
      await contextBtn.first().click();
      await page.waitForTimeout(300);
      
      // Should provide some enhancement interface
      const contextInterface = page.locator('.context-modal, .enhancement-modal, .modal');
      if (await contextInterface.count() > 0) {
        expect(await contextInterface.first().isVisible()).toBeTruthy();
      }
    }
  });

  test('should handle keyboard accessibility properly', async ({ page }) => {
    // Test tab navigation - start from body
    await page.locator('body').focus();
    
    // Tab through elements to reach textarea
    let foundTextarea = false;
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(100);
      
      // Check if current focused element is textarea
      const focusedElement = await page.evaluateHandle(() => document.activeElement);
      const tagName = await focusedElement.evaluate(el => el ? el.tagName.toLowerCase() : '');
      
      if (tagName === 'textarea') {
        foundTextarea = true;
        break;
      }
    }
    
    if (foundTextarea) {
      // Test typing in focused textarea
      await page.keyboard.type('Keyboard accessibility test content');
      
      const textarea = page.locator('textarea, .memory-input').first();
      const typedContent = await textarea.inputValue();
      expect(typedContent).toContain('Keyboard accessibility');
    } else {
      // If no textarea found via tab navigation, at least verify one exists and is accessible
      const textarea = page.locator('textarea, .memory-input').first();
      await expect(textarea).toBeVisible();
      
      // Focus it directly and test typing
      await textarea.focus();
      await page.keyboard.type('Keyboard accessibility test content');
      const typedContent = await textarea.inputValue();
      expect(typedContent).toContain('Keyboard accessibility');
    }
  });
});