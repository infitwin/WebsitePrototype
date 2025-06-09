const { test, expect } = require('@playwright/test');

test.describe('Password Cancel Button', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8357/pages/settings.html');
    await page.waitForLoadState('networkidle');
  });

  test('should clear form when cancel button clicked', async ({ page }) => {
    // Find password fields
    const currentPasswordField = page.locator('#currentPassword');
    const newPasswordField = page.locator('#newPassword');
    const confirmPasswordField = page.locator('#confirmPassword');
    
    // Skip if password fields don't exist
    if (!await currentPasswordField.isVisible()) {
      test.skip('Password change form not found on this page');
    }
    
    // Fill all password fields
    await currentPasswordField.fill('MyCurrentPassword123!');
    await newPasswordField.fill('MyNewPassword456!');
    await confirmPasswordField.fill('MyNewPassword456!');
    
    // Verify fields have values
    expect(await currentPasswordField.inputValue()).toBe('MyCurrentPassword123!');
    expect(await newPasswordField.inputValue()).toBe('MyNewPassword456!');
    expect(await confirmPasswordField.inputValue()).toBe('MyNewPassword456!');
    
    // Find and click cancel button in security form
    const cancelButton = page.locator('#securityForm button:has-text("Cancel")');
    await cancelButton.click();
    
    // Verify all fields are cleared
    expect(await currentPasswordField.inputValue()).toBe('');
    expect(await newPasswordField.inputValue()).toBe('');
    expect(await confirmPasswordField.inputValue()).toBe('');
    
    // Verify password strength indicator is hidden
    const passwordStrength = page.locator('#passwordStrength');
    await expect(passwordStrength).not.toHaveClass(/show/);
  });

  test('should clear validation errors when cancel clicked', async ({ page }) => {
    const currentPasswordField = page.locator('#currentPassword');
    const newPasswordField = page.locator('#newPassword');
    const confirmPasswordField = page.locator('#confirmPassword');
    const changePasswordBtn = page.locator('#changePasswordBtn');
    
    if (!await currentPasswordField.isVisible()) {
      test.skip('Password change form not found on this page');
    }
    
    // Try to submit with empty current password to trigger error
    await newPasswordField.fill('NewPassword123!');
    await confirmPasswordField.fill('NewPassword123!');
    await changePasswordBtn.click();
    
    // Verify error is shown
    const errorMessage = page.locator('.form-error').filter({ hasText: 'Current password is required' });
    await expect(errorMessage).toBeVisible();
    
    // Click cancel
    const cancelButton = page.locator('#securityForm button:has-text("Cancel")');
    await cancelButton.click();
    
    // Verify error is cleared
    await expect(errorMessage).not.toBeVisible();
    
    // Verify error class is removed from field
    await expect(currentPasswordField).not.toHaveClass(/error/);
  });

  test('should hide password strength indicator when cancel clicked', async ({ page }) => {
    const newPasswordField = page.locator('#newPassword');
    const passwordStrength = page.locator('#passwordStrength');
    
    if (!await newPasswordField.isVisible()) {
      test.skip('Password field not found on this page');
    }
    
    // Type in new password to show strength indicator
    await newPasswordField.fill('StrongPassword123!');
    
    // Wait for strength indicator to show
    await expect(passwordStrength).toHaveClass(/show/);
    
    // Click cancel
    const cancelButton = page.locator('#securityForm button:has-text("Cancel")');
    await cancelButton.click();
    
    // Verify strength indicator is hidden
    await expect(passwordStrength).not.toHaveClass(/show/);
  });

});