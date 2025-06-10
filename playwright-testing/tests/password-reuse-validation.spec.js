const { test, expect } = require('@playwright/test');

test.describe('Password Reuse Validation', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8357/pages/settings.html');
    await page.waitForLoadState('networkidle');
  });

  test('should prevent reusing current password', async ({ page }) => {
    // Find password fields
    const currentPasswordField = page.locator('#currentPassword');
    const newPasswordField = page.locator('#newPassword');
    const confirmPasswordField = page.locator('#confirmPassword');
    const changePasswordBtn = page.locator('#changePasswordBtn');
    
    // Skip if password fields don't exist
    if (!await currentPasswordField.isVisible()) {
      test.skip('Password change form not found on this page');
    }
    
    // Use the same password for current and new password
    const testPassword = '123456'; // Using the known test password
    
    await currentPasswordField.fill(testPassword);
    await newPasswordField.fill(testPassword);
    await confirmPasswordField.fill(testPassword);
    
    // Try to submit the form
    await changePasswordBtn.click();
    await page.waitForTimeout(1000);
    
    // Should show error message preventing password reuse
    const errorSelectors = [
      'text=/cannot.*reuse.*current.*password/i',
      'text=/new password.*same.*current/i',
      'text=/choose.*different.*password/i',
      'text=/password.*must.*different/i',
      '.error:has-text("password")',
      '.form-error',
      '#passwordError',
      '.password-reuse-error'
    ];
    
    let errorFound = false;
    for (const selector of errorSelectors) {
      if (await page.locator(selector).first().isVisible().catch(() => false)) {
        errorFound = true;
        break;
      }
    }
    
    if (!errorFound) {
      // Take screenshot to help debug
      await page.screenshot({ path: 'password-reuse-not-prevented.png', fullPage: true });
    }
    
    expect(errorFound).toBeTruthy();
  });

  test('should allow password change when new password is different', async ({ page }) => {
    const currentPasswordField = page.locator('#currentPassword');
    const newPasswordField = page.locator('#newPassword');
    const confirmPasswordField = page.locator('#confirmPassword');
    const changePasswordBtn = page.locator('#changePasswordBtn');
    
    if (!await currentPasswordField.isVisible()) {
      test.skip('Password change form not found on this page');
    }
    
    // Use different passwords
    await currentPasswordField.fill('123456');
    await newPasswordField.fill('NewPassword123!');
    await confirmPasswordField.fill('NewPassword123!');
    
    await changePasswordBtn.click();
    await page.waitForTimeout(1000);
    
    // Should NOT show password reuse error
    const reuseErrorSelectors = [
      'text=/cannot.*reuse.*current.*password/i',
      'text=/new password.*same.*current/i',
      'text=/choose.*different.*password/i',
      'text=/password.*must.*different/i'
    ];
    
    let reuseErrorFound = false;
    for (const selector of reuseErrorSelectors) {
      if (await page.locator(selector).first().isVisible().catch(() => false)) {
        reuseErrorFound = true;
        break;
      }
    }
    
    expect(reuseErrorFound).toBeFalsy();
  });

  test('should show clear error message when passwords are identical', async ({ page }) => {
    const currentPasswordField = page.locator('#currentPassword');
    const newPasswordField = page.locator('#newPassword');
    const confirmPasswordField = page.locator('#confirmPassword');
    const changePasswordBtn = page.locator('#changePasswordBtn');
    
    if (!await currentPasswordField.isVisible()) {
      test.skip('Password change form not found on this page');
    }
    
    // Test various scenarios where passwords are the same
    const testScenarios = [
      {
        current: '123456',
        new: '123456',
        description: 'exact same password'
      },
      {
        current: 'Password123!',
        new: 'Password123!',
        description: 'complex identical password'
      }
    ];
    
    for (const scenario of testScenarios) {
      await currentPasswordField.fill(scenario.current);
      await newPasswordField.fill(scenario.new);
      await confirmPasswordField.fill(scenario.new);
      
      await changePasswordBtn.click();
      await page.waitForTimeout(500);
      
      // Check for clear error message
      const hasError = await page.locator('.error, .form-error, [class*="error"]').first().isVisible().catch(() => false);
      
      if (!hasError) {
        await page.screenshot({ 
          path: `password-reuse-no-error-${scenario.description.replace(/\s+/g, '-')}.png`,
          fullPage: true 
        });
      }
      
      expect(hasError).toBeTruthy();
      
      // Clear fields for next test
      await currentPasswordField.clear();
      await newPasswordField.clear();
      await confirmPasswordField.clear();
      await page.waitForTimeout(200);
    }
  });
});