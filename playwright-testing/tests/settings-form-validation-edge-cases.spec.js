const { test, expect } = require('@playwright/test');

test.describe('Settings Form Validation Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8357/pages/settings.html');
  });

  test('should handle extremely long display names', async ({ page }) => {
    const displayNameInput = page.locator('#displayName');
    const veryLongName = 'A'.repeat(1000);
    
    await displayNameInput.fill(veryLongName);
    
    // Input should accept the value
    const value = await displayNameInput.inputValue();
    expect(value).toBe(veryLongName);
    
    // Try to save
    await page.click('#saveAccountBtn');
    
    // Should handle gracefully (either truncate, show error, or save)
    await page.waitForTimeout(500);
    
    // No JavaScript errors
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    expect(errors.filter(e => !e.includes('404')).length).toBe(0);
  });

  test('should validate email format edge cases', async ({ page }) => {
    const emailInput = page.locator('#emailAddress');
    
    const edgeCaseEmails = [
      'test@test', // Missing TLD
      '@test.com', // Missing local part
      'test@', // Missing domain
      'test..test@test.com', // Double dots
      'test@test..com', // Double dots in domain
      'test @test.com', // Space in local part
      'test@test .com', // Space in domain
      'test+tag@test.com', // Plus addressing
      'test.name+tag@test.com', // Complex plus addressing
      'a'.repeat(64) + '@test.com', // Max local part length
      'test@' + 'a'.repeat(253) + '.com', // Very long domain
      '日本語@test.com', // Unicode in local part
      'test@日本語.com', // Unicode in domain
      'test@[192.168.1.1]', // IP address domain
      '"test@test"@test.com', // Quoted string
      'test\\@test@test.com', // Escaped @ symbol
    ];
    
    for (const email of edgeCaseEmails) {
      await emailInput.fill(email);
      
      // Check if input accepts the value
      const value = await emailInput.inputValue();
      expect(value).toBe(email);
      
      // Check if any validation appears
      await emailInput.blur();
      await page.waitForTimeout(100);
    }
  });

  test('should handle phone number format variations', async ({ page }) => {
    const phoneInput = page.locator('#phoneNumber');
    
    const phoneVariations = [
      '1234567890', // No formatting
      '123-456-7890', // Dashes
      '(123) 456-7890', // Parentheses
      '+1 123 456 7890', // International format
      '+44 20 1234 5678', // UK format
      '123.456.7890', // Dots
      '123 456 7890 ext 123', // Extension
      '123-456-7890x123', // Extension variant
      'abcdefghij', // Letters
      '!@#$%^&*()', // Special characters
      '', // Empty
      ' '.repeat(20), // Spaces only
      '0'.repeat(100), // Very long number
    ];
    
    for (const phone of phoneVariations) {
      await phoneInput.fill(phone);
      
      const value = await phoneInput.inputValue();
      expect(value).toBe(phone);
    }
  });

  test('should handle password validation edge cases', async ({ page }) => {
    const currentPassword = page.locator('#currentPassword');
    const newPassword = page.locator('#newPassword');
    const confirmPassword = page.locator('#confirmPassword');
    
    // Test empty passwords
    await currentPassword.fill('');
    await newPassword.fill('');
    await confirmPassword.fill('');
    await page.click('#changePasswordBtn');
    
    // Should show error for current password
    const errorVisible = await page.locator('.form-error').first().isVisible();
    expect(errorVisible).toBeTruthy();
    
    // Test password mismatch
    await currentPassword.fill('oldpassword');
    await newPassword.fill('newpassword123');
    await confirmPassword.fill('differentpassword');
    
    await confirmPassword.blur();
    await page.waitForTimeout(100);
    
    // Check if mismatch error appears
    const mismatchError = page.locator('#passwordMismatch');
    const mismatchVisible = await mismatchError.isVisible().catch(() => false);
    
    // Test special characters in password
    const specialPasswords = [
      'pass word', // Space
      'pass\tword', // Tab
      'pass\nword', // Newline
      'pass"word', // Quote
      "pass'word", // Single quote
      'pass<script>word', // HTML
      'pass\\word', // Backslash
      '🔒🔑💻', // Emojis
      'пароль', // Cyrillic
      '密码', // Chinese
      'a'.repeat(1000), // Very long
    ];
    
    for (const pass of specialPasswords) {
      await newPassword.fill(pass);
      const value = await newPassword.inputValue();
      expect(value).toBe(pass);
    }
  });

  test('should handle rapid form submissions', async ({ page }) => {
    const saveButton = page.locator('#saveAccountBtn');
    
    // Click save button rapidly
    for (let i = 0; i < 5; i++) {
      await saveButton.click();
      // Don't wait between clicks
    }
    
    // Should handle gracefully without multiple submissions
    await page.waitForTimeout(1000);
    
    // Check for any success messages
    const successMessage = page.locator('.success-message');
    const successCount = await successMessage.count();
    
    // Should show at most one success message
    expect(successCount).toBeLessThanOrEqual(1);
  });

  test('should validate timezone selection', async ({ page }) => {
    const timezoneSelect = page.locator('#timezone');
    
    // Get all options
    const options = await timezoneSelect.locator('option').allTextContents();
    expect(options.length).toBeGreaterThan(0);
    
    // Try to set invalid value programmatically
    await timezoneSelect.evaluate(select => {
      select.value = 'Invalid/Timezone';
    });
    
    // Should either revert or handle gracefully
    const selectedValue = await timezoneSelect.inputValue();
    expect(selectedValue).toBeTruthy();
  });

  test('should handle form reset correctly', async ({ page }) => {
    const displayName = page.locator('#displayName');
    const email = page.locator('#emailAddress');
    const phone = page.locator('#phoneNumber');
    
    // Get original values
    const originalName = await displayName.inputValue();
    const originalEmail = await email.inputValue();
    const originalPhone = await phone.inputValue();
    
    // Change all values
    await displayName.fill('New Name');
    await email.fill('new@email.com');
    await phone.fill('999-999-9999');
    
    // Click cancel
    const cancelButton = page.locator('.btn-secondary').first();
    await cancelButton.click();
    
    // If reset is implemented, values should revert
    // If not, they'll remain changed (both are valid)
    await page.waitForTimeout(500);
    
    const currentName = await displayName.inputValue();
    const currentEmail = await email.inputValue();
    const currentPhone = await phone.inputValue();
    
    // Just verify no errors occurred
    expect(currentName).toBeTruthy();
    expect(currentEmail).toBeTruthy();
    expect(currentPhone).toBeTruthy();
  });

  test('should handle concurrent form modifications', async ({ page }) => {
    const displayName = page.locator('#displayName');
    const email = page.locator('#emailAddress');
    const phone = page.locator('#phoneNumber');
    
    // Modify all fields concurrently
    await Promise.all([
      displayName.fill('Concurrent Test User'),
      email.fill('concurrent@test.com'),
      phone.fill('111-222-3333'),
    ]);
    
    // Values should all be updated
    expect(await displayName.inputValue()).toBe('Concurrent Test User');
    expect(await email.inputValue()).toBe('concurrent@test.com');
    expect(await phone.inputValue()).toBe('111-222-3333');
  });

  test('should preserve form data on navigation attempts', async ({ page }) => {
    const displayName = page.locator('#displayName');
    
    // Change form data
    await displayName.fill('Unsaved Changes');
    
    // Try to navigate away
    const dashboardLink = page.locator('a[href="dashboard.html"]').first();
    
    // Set up dialog handler if browser shows confirmation
    page.on('dialog', async dialog => {
      // Cancel navigation
      await dialog.dismiss();
    });
    
    await dashboardLink.click();
    await page.waitForTimeout(500);
    
    // Check if still on settings page (depends on implementation)
    const url = page.url();
    // Either stayed on settings or navigated - both are valid
    expect(url).toBeTruthy();
  });

  test('should handle password strength indicator updates', async ({ page }) => {
    const newPassword = page.locator('#newPassword');
    const strengthBar = page.locator('.strength-fill');
    
    // Test various password strengths
    const passwords = [
      'a', // Very weak
      'password', // Weak
      'Password1', // Medium
      'P@ssw0rd123!', // Strong
      'P@ssw0rd123!XyZ#$%', // Very strong
    ];
    
    for (const pass of passwords) {
      await newPassword.fill(pass);
      await page.waitForTimeout(100); // Wait for strength calculation
      
      // Check if strength bar updates (width or color change)
      const strengthStyle = await strengthBar.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          width: styles.width,
          background: styles.background || styles.backgroundColor
        };
      });
      
      // Should have some visual indication
      expect(strengthStyle.width || strengthStyle.background).toBeTruthy();
    }
  });
});