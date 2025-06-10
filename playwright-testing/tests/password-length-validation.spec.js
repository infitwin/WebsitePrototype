const { test, expect } = require('@playwright/test');

test.describe('Password Length Validation - Issue #31', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8357/pages/auth.html');
    await page.waitForLoadState('networkidle');
    
    // Switch to signup tab
    await page.click('[data-tab="signup"]');
    await page.waitForTimeout(100);
  });

  test('should reject password with exactly 7 characters', async ({ page }) => {
    // Fill signup form with 7-character password
    await page.fill('#signup-name', 'Test User');
    await page.fill('#signup-email', 'test@example.com');
    await page.fill('#signup-password', 'Pass123'); // 7 characters
    await page.fill('#confirmPassword', 'Pass123');
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Wait for notification to appear
    await page.waitForTimeout(1000);
    
    // Check for custom validation message (not browser default)
    const notificationSelectors = [
      'text=/Password must be at least 8 characters/i',
      'text=/at least 8 characters/i',
      '.auth-notification'
    ];
    
    let customNotificationFound = false;
    let notificationText = '';
    
    for (const selector of notificationSelectors) {
      try {
        const element = await page.locator(selector).first();
        if (await element.isVisible()) {
          notificationText = await element.textContent();
          console.log(`Found notification: "${notificationText}"`);
          if (notificationText.includes('at least 8 characters')) {
            customNotificationFound = true;
            break;
          }
        }
      } catch (e) {
        // Selector not found, continue
      }
    }
    
    // Should NOT show browser default message
    const browserDefaultMessage = await page.locator('text=/you are currently using.*characters/i').first().isVisible().catch(() => false);
    
    // Take screenshot for debugging
    if (!customNotificationFound) {
      await page.screenshot({ path: 'password-length-validation-issue.png', fullPage: true });
    }
    
    console.log('Custom notification found:', customNotificationFound);
    console.log('Browser default message visible:', browserDefaultMessage);
    console.log('Notification text:', notificationText);
    
    expect(customNotificationFound).toBeTruthy();
    expect(browserDefaultMessage).toBeFalsy();
  });

  test('should accept password with 8 or more characters', async ({ page }) => {
    // Fill signup form with valid 8-character password
    await page.fill('#signup-name', 'Test User');
    await page.fill('#signup-email', 'test@example.com');
    await page.fill('#signup-password', 'Password123!'); // Valid password
    await page.fill('#confirmPassword', 'Password123!');
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Wait for either success or Firebase error (which is expected in test)
    await page.waitForTimeout(2000);
    
    // Should not show length validation error
    const lengthError = await page.locator('text=/at least 8 characters/i').first().isVisible().catch(() => false);
    
    expect(lengthError).toBeFalsy();
  });
});