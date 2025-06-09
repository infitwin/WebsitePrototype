const { test, expect } = require('@playwright/test');

test.describe('Password Validation Edge Cases', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8357/pages/settings.html');
    await page.waitForLoadState('networkidle');
  });

  test('should require current password field to be filled', async ({ page }) => {
    // Find password fields
    const currentPasswordField = page.locator('#currentPassword');
    const newPasswordField = page.locator('#newPassword');
    const confirmPasswordField = page.locator('#confirmPassword');
    const changePasswordBtn = page.locator('#changePasswordBtn');
    
    // Skip if password fields don't exist
    if (!await currentPasswordField.isVisible()) {
      test.skip('Password change form not found on this page');
    }
    
    // Fill only new passwords, leave current password empty
    await newPasswordField.fill('NewPassword123!');
    await confirmPasswordField.fill('NewPassword123!');
    
    // Try to submit
    await changePasswordBtn.click();
    
    // Should show error for current password field
    const errorSelectors = [
      'text=/current password.*required/i',
      '.error:has-text("Current password")',
      '.field-error',
      'text="Current password is required"'
    ];
    
    let errorFound = false;
    for (const selector of errorSelectors) {
      if (await page.locator(selector).first().isVisible().catch(() => false)) {
        errorFound = true;
        break;
      }
    }
    expect(errorFound).toBeTruthy();
  });

  test('should enforce minimum password length of 8 characters', async ({ page }) => {
    const currentPasswordField = page.locator('#currentPassword');
    const newPasswordField = page.locator('#newPassword');
    const confirmPasswordField = page.locator('#confirmPassword');
    const changePasswordBtn = page.locator('#changePasswordBtn');
    
    if (!await currentPasswordField.isVisible()) {
      test.skip('Password change form not found on this page');
    }
    
    // Test passwords that are too short
    const shortPasswords = ['a', 'ab', 'abc', 'abcd', 'abcde', 'abcdef', 'abcdefg']; // 1-7 chars
    
    for (const shortPassword of shortPasswords) {
      await currentPasswordField.fill('currentpass');
      await newPasswordField.fill(shortPassword);
      await confirmPasswordField.fill(shortPassword);
      
      await changePasswordBtn.click();
      
      // Should show error about minimum length
      const errorSelectors = [
        'text=/password.*8.*characters/i',
        'text=/at least 8/i',
        '.error',
        'text="Password must be at least 8 characters"'
      ];
      
      let errorFound = false;
      for (const selector of errorSelectors) {
        if (await page.locator(selector).first().isVisible().catch(() => false)) {
          errorFound = true;
          break;
        }
      }
      expect(errorFound).toBeTruthy();
      
      // Clear fields for next iteration
      await newPasswordField.clear();
      await confirmPasswordField.clear();
    }
  });

  test('should reject password change when passwords do not match', async ({ page }) => {
    const currentPasswordField = page.locator('#currentPassword');
    const newPasswordField = page.locator('#newPassword');
    const confirmPasswordField = page.locator('#confirmPassword');
    const changePasswordBtn = page.locator('#changePasswordBtn');
    
    if (!await currentPasswordField.isVisible()) {
      test.skip('Password change form not found on this page');
    }
    
    // Test various mismatched password combinations
    const mismatchTests = [
      { newPassword: 'Password123!', confirmPassword: 'Password123@' },
      { newPassword: 'Password123!', confirmPassword: 'password123!' }, // Case difference
      { newPassword: 'Password123!', confirmPassword: 'Password123! ' }, // Trailing space
      { newPassword: 'Password123!', confirmPassword: ' Password123!' }, // Leading space
      { newPassword: 'Password123!', confirmPassword: 'Password124!' }, // Different number
    ];
    
    for (const testCase of mismatchTests) {
      await currentPasswordField.fill('currentpass');
      await newPasswordField.fill(testCase.newPassword);
      await confirmPasswordField.fill(testCase.confirmPassword);
      
      await changePasswordBtn.click();
      
      // Should show mismatch error
      const errorSelectors = [
        'text=/passwords.*not.*match/i',
        'text=/do not match/i',
        '.error',
        'text="Passwords do not match"'
      ];
      
      let errorFound = false;
      for (const selector of errorSelectors) {
        if (await page.locator(selector).first().isVisible().catch(() => false)) {
          errorFound = true;
          break;
        }
      }
      expect(errorFound).toBeTruthy();
      
      // Clear fields for next test
      await newPasswordField.clear();
      await confirmPasswordField.clear();
    }
  });

  test('should validate password strength criteria correctly', async ({ page }) => {
    const newPasswordField = page.locator('#newPassword');
    const strengthIndicator = page.locator('#passwordStrength, .password-strength, .strength-meter');
    
    if (!await newPasswordField.isVisible()) {
      test.skip('Password field not found on this page');
    }
    
    // Test different password strength levels
    const passwordTests = [
      {
        password: 'weakpass',
        expectedStrength: 'weak',
        description: 'weak password (no numbers, no uppercase, no special chars)'
      },
      {
        password: 'weakpass1',
        expectedStrength: 'fair',
        description: 'fair password (has lowercase and numbers)'
      },
      {
        password: 'WeakPass1',
        expectedStrength: 'good', 
        description: 'good password (has lowercase, uppercase, and numbers)'
      },
      {
        password: 'StrongPass123!',
        expectedStrength: 'strong',
        description: 'strong password (has all character types)'
      }
    ];
    
    for (const testCase of passwordTests) {
      await newPasswordField.fill(testCase.password);
      await page.waitForTimeout(300); // Allow strength calculation
      
      // Check if strength indicator is visible
      if (await strengthIndicator.first().isVisible()) {
        // Look for strength indicators
        const strengthText = page.locator('.strength-text, .password-strength-text');
        const strengthClasses = [
          `.strength-${testCase.expectedStrength}`,
          `.${testCase.expectedStrength}`,
          `[class*="${testCase.expectedStrength}"]`
        ];
        
        let strengthFound = false;
        for (const strengthClass of strengthClasses) {
          if (await page.locator(strengthClass).first().isVisible().catch(() => false)) {
            strengthFound = true;
            break;
          }
        }
        
        // Also check text content
        if (!strengthFound && await strengthText.first().isVisible()) {
          const text = await strengthText.first().textContent();
          if (text && text.toLowerCase().includes(testCase.expectedStrength)) {
            strengthFound = true;
          }
        }
        
        expect(strengthFound).toBeTruthy();
      }
    }
  });

  test('should handle special characters in passwords correctly', async ({ page }) => {
    const currentPasswordField = page.locator('#currentPassword');
    const newPasswordField = page.locator('#newPassword');
    const confirmPasswordField = page.locator('#confirmPassword');
    const changePasswordBtn = page.locator('#changePasswordBtn');
    
    if (!await currentPasswordField.isVisible()) {
      test.skip('Password change form not found on this page');
    }
    
    // Test passwords with various special characters
    const specialCharPasswords = [
      'Password123!',
      'Password123@',
      'Password123#',
      'Password123$',
      'Password123%',
      'Password123^',
      'Password123&',
      'Password123*',
      'Password123(',
      'Password123)',
      'Password123-',
      'Password123_',
      'Password123=',
      'Password123+',
      'Password123[',
      'Password123]',
      'Password123{',
      'Password123}',
      'Password123|',
      'Password123\\',
      'Password123:',
      'Password123;',
      'Password123"',
      'Password123\'',
      'Password123<',
      'Password123>',
      'Password123,',
      'Password123.',
      'Password123?',
      'Password123/',
      'Password123~',
      'Password123`'
    ];
    
    // Test a few representative special character passwords
    const testPasswords = specialCharPasswords.slice(0, 5);
    
    for (const password of testPasswords) {
      await currentPasswordField.fill('currentpass');
      await newPasswordField.fill(password);
      await confirmPasswordField.fill(password);
      
      await changePasswordBtn.click();
      await page.waitForTimeout(500);
      
      // Should either succeed or show loading state (not validation error)
      const validationErrorSelectors = [
        'text=/password.*8.*characters/i',
        'text=/passwords.*not.*match/i'
      ];
      
      let hasValidationError = false;
      for (const selector of validationErrorSelectors) {
        if (await page.locator(selector).first().isVisible().catch(() => false)) {
          hasValidationError = true;
          break;
        }
      }
      
      // Should not have basic validation errors for properly formatted passwords
      expect(hasValidationError).toBeFalsy();
      
      // Clear fields for next test
      await newPasswordField.clear();
      await confirmPasswordField.clear();
      await currentPasswordField.clear();
      await page.waitForTimeout(200);
    }
  });

  test('should handle unicode and international characters in passwords', async ({ page }) => {
    const currentPasswordField = page.locator('#currentPassword');
    const newPasswordField = page.locator('#newPassword');
    const confirmPasswordField = page.locator('#confirmPassword');
    const changePasswordBtn = page.locator('#changePasswordBtn');
    
    if (!await currentPasswordField.isVisible()) {
      test.skip('Password change form not found on this page');
    }
    
    // Test passwords with unicode characters
    const unicodePasswords = [
      'Pássword123!', // Portuguese
      'Påssword123!', // Nordic
      'Пароль123!',   // Cyrillic
      'パスワード123!',  // Japanese
      '密码Password123!', // Chinese
      'Contraseña123!', // Spanish
      'Mót_de_passe123!' // French with underscores
    ];
    
    for (const password of unicodePasswords) {
      await currentPasswordField.fill('currentpass');
      await newPasswordField.fill(password);
      await confirmPasswordField.fill(password);
      
      await changePasswordBtn.click();
      await page.waitForTimeout(500);
      
      // Should handle unicode characters without crashing
      // Check that form is still functional (no JS errors broke the page)
      const buttonStillVisible = await changePasswordBtn.isVisible();
      expect(buttonStillVisible).toBeTruthy();
      
      // Clear fields
      await newPasswordField.clear();
      await confirmPasswordField.clear();
      await currentPasswordField.clear();
      await page.waitForTimeout(200);
    }
  });

  test('should handle extremely long passwords gracefully', async ({ page }) => {
    const currentPasswordField = page.locator('#currentPassword');
    const newPasswordField = page.locator('#newPassword');
    const confirmPasswordField = page.locator('#confirmPassword');
    
    if (!await currentPasswordField.isVisible()) {
      test.skip('Password change form not found on this page');
    }
    
    // Test very long password
    const longPassword = 'A'.repeat(1000) + '1!'; // 1002 characters
    
    await currentPasswordField.fill('currentpass');
    await newPasswordField.fill(longPassword);
    await confirmPasswordField.fill(longPassword);
    
    // Should handle long input without crashing
    const fieldValue = await newPasswordField.inputValue();
    expect(fieldValue.length).toBeGreaterThan(100);
    
    // Form should still be functional
    const buttonVisible = await page.locator('#changePasswordBtn').isVisible();
    expect(buttonVisible).toBeTruthy();
  });

  test('should handle rapid typing and input changes without errors', async ({ page }) => {
    const newPasswordField = page.locator('#newPassword');
    const confirmPasswordField = page.locator('#confirmPassword');
    
    if (!await newPasswordField.isVisible()) {
      test.skip('Password field not found on this page');
    }
    
    // Rapidly type and clear passwords to test debouncing/validation
    const rapidPasswords = [
      'a',
      'ab', 
      'abc',
      'abcd',
      'abcde',
      'abcdef',
      'abcdefgh',
      'Password1',
      'Password12',
      'Password123',
      'Password123!'
    ];
    
    for (const password of rapidPasswords) {
      await newPasswordField.fill(password);
      await confirmPasswordField.fill(password);
      await page.waitForTimeout(50); // Very short wait to simulate rapid typing
    }
    
    // Should not have crashed and should still be functional
    const finalValue = await newPasswordField.inputValue();
    expect(finalValue).toBe('Password123!');
    
    // Strength indicator should still work
    const strengthIndicator = page.locator('#passwordStrength, .password-strength');
    if (await strengthIndicator.first().isVisible()) {
      // Should show strong password indication
      const hasStrongIndication = await page.locator('.strength-strong, .strong, [class*="strong"]').first().isVisible().catch(() => false);
      expect(hasStrongIndication).toBeTruthy();
    }
  });

});