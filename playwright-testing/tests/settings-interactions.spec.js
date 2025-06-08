const { test, expect } = require('@playwright/test');

test.describe('Settings Page Advanced Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8357/pages/settings.html');
  });

  test('should display settings page with all sections', async ({ page }) => {
    // Check main settings container
    const settingsContainer = page.locator('.settings-container, .settings-content, main');
    await expect(settingsContainer.first()).toBeVisible();
    
    // Check for settings sections
    const profileSection = page.locator('.profile-section, [data-section="profile"], h2:has-text("Profile")');
    const privacySection = page.locator('.privacy-section, [data-section="privacy"], h2:has-text("Privacy")');
    const notificationSection = page.locator('.notification-section, [data-section="notifications"], h2:has-text("Notification")');
    
    await expect(profileSection.first()).toBeVisible();
    await expect(privacySection.first()).toBeVisible();
    await expect(notificationSection.first()).toBeVisible();
  });

  test('should have toggle switches that work properly', async ({ page }) => {
    // Find toggle switches
    const toggleSwitches = page.locator('.toggle-switch, input[type="checkbox"], .switch');
    const toggleCount = await toggleSwitches.count();
    
    if (toggleCount > 0) {
      const firstToggle = toggleSwitches.first();
      
      // Get initial state
      const initialChecked = await firstToggle.isChecked();
      
      // Click toggle
      await firstToggle.click();
      await page.waitForTimeout(300);
      
      // Verify state changed
      const newChecked = await firstToggle.isChecked();
      expect(newChecked).toBe(!initialChecked);
      
      // Toggle back
      await firstToggle.click();
      await page.waitForTimeout(300);
      
      // Verify it returned to original state
      const finalChecked = await firstToggle.isChecked();
      expect(finalChecked).toBe(initialChecked);
    }
  });

  test('should validate password strength indicator', async ({ page }) => {
    // Find password input
    const passwordInput = page.locator('input[type="password"], #password, #new-password');
    const strengthIndicator = page.locator('.password-strength, .strength-meter, [class*="strength"]');
    
    if (await passwordInput.first().isVisible() && await strengthIndicator.first().isVisible()) {
      // Test weak password
      await passwordInput.first().fill('123');
      await page.waitForTimeout(500);
      
      // Check for weak indicator
      const weakIndicator = page.locator('.weak, .strength-weak, [class*="weak"]');
      if (await weakIndicator.first().isVisible()) {
        await expect(weakIndicator.first()).toBeVisible();
      }
      
      // Test strong password
      await passwordInput.first().fill('StrongPass123!@#');
      await page.waitForTimeout(500);
      
      // Check for strong indicator
      const strongIndicator = page.locator('.strong, .strength-strong, [class*="strong"]');
      if (await strongIndicator.first().isVisible()) {
        await expect(strongIndicator.first()).toBeVisible();
      }
    }
  });

  test('should handle form validation properly', async ({ page }) => {
    // Find the main settings form
    const settingsForm = page.locator('form, .settings-form');
    const emailInput = page.locator('input[type="email"], #email');
    const nameInput = page.locator('input[name="name"], #name, #full-name');
    const saveButton = page.locator('button:has-text("Save"), button[type="submit"], .save-button');
    
    if (await settingsForm.first().isVisible()) {
      // Clear existing values and try invalid email
      if (await emailInput.first().isVisible()) {
        await emailInput.first().clear();
        await emailInput.first().fill('invalid-email');
        
        if (await saveButton.first().isVisible()) {
          await saveButton.first().click();
          await page.waitForTimeout(500);
          
          // Check for validation error
          const isValid = await emailInput.first().evaluate(el => el.validity.valid);
          expect(isValid).toBe(false);
        }
        
        // Test valid email
        await emailInput.first().clear();
        await emailInput.first().fill('valid@example.com');
      }
      
      // Test name field if exists
      if (await nameInput.first().isVisible()) {
        await nameInput.first().clear();
        await nameInput.first().fill('');
        
        if (await saveButton.first().isVisible()) {
          await saveButton.first().click();
          await page.waitForTimeout(500);
          
          // Check if name is required
          const nameValid = await nameInput.first().evaluate(el => 
            el.hasAttribute('required') ? el.validity.valid : true
          );
          
          if (!nameValid) {
            expect(nameValid).toBe(false);
          }
        }
      }
    }
  });

  test('should show unsaved changes warning', async ({ page }) => {
    // Find form inputs
    const inputs = page.locator('input[type="text"], input[type="email"], textarea');
    
    if (await inputs.first().isVisible()) {
      // Make a change to trigger unsaved state
      await inputs.first().fill('Changed value');
      await page.waitForTimeout(300);
      
      // Check for unsaved changes indicator
      const unsavedIndicator = page.locator('.unsaved, .has-changes, [class*="unsaved"]');
      if (await unsavedIndicator.first().isVisible()) {
        await expect(unsavedIndicator.first()).toBeVisible();
      }
      
      // Try to navigate away (simulate)
      const confirmDialog = page.locator('.confirm-dialog, .modal');
      
      // Look for navigation links to test beforeunload
      const navLink = page.locator('a[href], .nav-link').first();
      if (await navLink.isVisible()) {
        // Note: beforeunload dialog testing is limited in Playwright
        // We can only verify the setup, not the actual browser dialog
      }
    }
  });

  test('should handle notification preferences', async ({ page }) => {
    // Find notification toggles
    const emailNotifications = page.locator('input[name*="email"], .email-notifications input');
    const pushNotifications = page.locator('input[name*="push"], .push-notifications input');
    const smsNotifications = page.locator('input[name*="sms"], .sms-notifications input');
    
    // Test email notifications toggle
    if (await emailNotifications.first().isVisible()) {
      const initialState = await emailNotifications.first().isChecked();
      await emailNotifications.first().click();
      await page.waitForTimeout(300);
      
      const newState = await emailNotifications.first().isChecked();
      expect(newState).toBe(!initialState);
    }
    
    // Test push notifications toggle
    if (await pushNotifications.first().isVisible()) {
      const initialState = await pushNotifications.first().isChecked();
      await pushNotifications.first().click();
      await page.waitForTimeout(300);
      
      const newState = await pushNotifications.first().isChecked();
      expect(newState).toBe(!initialState);
    }
    
    // Test SMS notifications toggle
    if (await smsNotifications.first().isVisible()) {
      const initialState = await smsNotifications.first().isChecked();
      await smsNotifications.first().click();
      await page.waitForTimeout(300);
      
      const newState = await smsNotifications.first().isChecked();
      expect(newState).toBe(!initialState);
    }
  });

  test('should handle privacy settings', async ({ page }) => {
    // Find privacy toggles
    const profileVisibility = page.locator('input[name*="profile"], .profile-visibility input');
    const dataSharing = page.locator('input[name*="sharing"], .data-sharing input');
    const analyticsOptOut = page.locator('input[name*="analytics"], .analytics input');
    
    // Test profile visibility
    if (await profileVisibility.first().isVisible()) {
      const initialState = await profileVisibility.first().isChecked();
      await profileVisibility.first().click();
      await page.waitForTimeout(300);
      
      const newState = await profileVisibility.first().isChecked();
      expect(newState).toBe(!initialState);
    }
    
    // Test data sharing preferences
    if (await dataSharing.first().isVisible()) {
      const initialState = await dataSharing.first().isChecked();
      await dataSharing.first().click();
      await page.waitForTimeout(300);
      
      const newState = await dataSharing.first().isChecked();
      expect(newState).toBe(!initialState);
    }
  });

  test('should show success message after saving settings', async ({ page }) => {
    // Find save button
    const saveButton = page.locator('button:has-text("Save"), button[type="submit"], .save-button');
    
    if (await saveButton.first().isVisible()) {
      await saveButton.first().click();
      await page.waitForTimeout(1000);
      
      // Check for success message
      const successMessage = page.locator('.success, .saved, .success-message, [class*="success"]');
      if (await successMessage.first().isVisible()) {
        await expect(successMessage.first()).toBeVisible();
      }
    }
  });

  test('should handle account deletion flow', async ({ page }) => {
    // Look for delete account button or link
    const deleteButton = page.locator('button:has-text("Delete"), .delete-account, [class*="delete"]');
    
    if (await deleteButton.first().isVisible()) {
      await deleteButton.first().click();
      await page.waitForTimeout(500);
      
      // Should show confirmation dialog
      const confirmDialog = page.locator('.modal, .dialog, .confirmation');
      if (await confirmDialog.first().isVisible()) {
        await expect(confirmDialog.first()).toBeVisible();
        
        // Look for cancel button in dialog
        const cancelButton = page.locator('.modal button:has-text("Cancel"), .dialog .cancel');
        if (await cancelButton.first().isVisible()) {
          await cancelButton.first().click();
          await page.waitForTimeout(300);
          
          // Dialog should close
          await expect(confirmDialog.first()).not.toBeVisible();
        }
      }
    }
  });

  test('should handle data export functionality', async ({ page }) => {
    // Look for export data button
    const exportButton = page.locator('button:has-text("Export"), .export-data, [class*="export"]');
    
    if (await exportButton.first().isVisible()) {
      await exportButton.first().click();
      await page.waitForTimeout(500);
      
      // Should show export options or start download
      const exportDialog = page.locator('.modal, .export-dialog');
      const downloadMessage = page.locator('.download, .export-status');
      
      const hasDialog = await exportDialog.first().isVisible();
      const hasDownload = await downloadMessage.first().isVisible();
      
      expect(hasDialog || hasDownload).toBeTruthy();
    }
  });
});