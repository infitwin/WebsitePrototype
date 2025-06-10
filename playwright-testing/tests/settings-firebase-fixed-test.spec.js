const { test, expect } = require('@playwright/test');

// Test credentials
const TEST_EMAIL = 'weezer@yev.com';
const TEST_PASSWORD = '123456';

test.describe('Settings Page - Firebase Fixed Tests', () => {
  let page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    
    // Setup console error capturing
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    page.consoleErrors = consoleErrors;
  });

  test('should login successfully with test credentials', async () => {
    // Navigate to auth page
    await page.goto('http://localhost:8357/pages/auth.html');
    
    // Click login tab
    await page.click('[data-tab="login"]');
    await page.waitForTimeout(500);
    
    // Fill login form
    await page.fill('.login-email', TEST_EMAIL);
    await page.fill('.login-password', TEST_PASSWORD);
    
    // Click login button
    const loginButton = page.locator('button').filter({ hasText: 'Access Your Memories' }).first();
    await loginButton.click();
    
    // Wait for navigation to dashboard or any success indication
    await page.waitForTimeout(3000);
    
    // Verify we're logged in (could be on dashboard or any authenticated page)
    const currentUrl = page.url();
    console.log(`Current URL after login: ${currentUrl}`);
    
    // We should not be on the auth page anymore
    expect(currentUrl).not.toContain('auth.html');
  });

  test('should navigate to settings page without Firebase errors', async () => {
    // Navigate to settings page
    await page.goto('http://localhost:8357/pages/settings.html');
    await page.waitForTimeout(2000);
    
    // Check for JavaScript/Firebase errors
    const errors = page.consoleErrors.filter(error => 
      error.includes('firebase') || 
      error.includes('Firebase') ||
      error.includes('import') ||
      error.includes('module')
    );
    
    console.log('Console errors related to Firebase:', errors);
    expect(errors.length).toBe(0);
    
    // Check that Firebase is loaded
    const firebaseLoaded = await page.evaluate(() => {
      return typeof window.firebase !== 'undefined';
    });
    
    expect(firebaseLoaded).toBe(true);
    console.log('✓ Firebase is loaded successfully');
  });

  test('should have working form elements', async () => {
    await page.goto('http://localhost:8357/pages/settings.html');
    await page.waitForTimeout(1000);
    
    // Check for display name field
    const displayNameField = page.locator('#displayName');
    await expect(displayNameField).toBeVisible();
    
    // Check for save button
    const saveButton = page.locator('button').filter({ hasText: 'Save Changes' }).first();
    await expect(saveButton).toBeVisible();
    
    console.log('✓ Form elements are present');
  });

  test('should handle form submission', async () => {
    await page.goto('http://localhost:8357/pages/settings.html');
    await page.waitForTimeout(1000);
    
    // Get current display name
    const displayNameField = page.locator('#displayName');
    const originalValue = await displayNameField.inputValue();
    
    // Change display name
    const testValue = `Test User ${Date.now()}`;
    await displayNameField.fill(testValue);
    
    // Click save button
    const saveButton = page.locator('button').filter({ hasText: 'Save Changes' }).first();
    await saveButton.click();
    await page.waitForTimeout(1000);
    
    // Check for success message
    const successMessage = page.locator('.success-message');
    
    // The success message should become visible
    await expect(successMessage).toBeVisible();
    
    console.log('✓ Form submission triggered success message');
  });

  test('should have working toggle switches', async () => {
    await page.goto('http://localhost:8357/pages/settings.html');
    await page.waitForTimeout(1000);
    
    // Find toggle switches
    const toggles = page.locator('.toggle-switch input[type="checkbox"]');
    const toggleCount = await toggles.count();
    
    expect(toggleCount).toBeGreaterThan(0);
    console.log(`Found ${toggleCount} toggle switches`);
    
    if (toggleCount > 0) {
      // Test first toggle
      const firstToggle = toggles.first();
      const originalChecked = await firstToggle.isChecked();
      
      // Click toggle
      await firstToggle.click();
      await page.waitForTimeout(500);
      
      // Verify state changed
      const newChecked = await firstToggle.isChecked();
      expect(newChecked).not.toBe(originalChecked);
      
      console.log('✓ Toggle switches respond to clicks');
    }
  });

  test('should use localStorage for settings', async () => {
    await page.goto('http://localhost:8357/pages/settings.html');
    await page.waitForTimeout(1000);
    
    // Check if localStorage has userSettings
    const hasUserSettings = await page.evaluate(() => {
      return localStorage.getItem('userSettings') !== null;
    });
    
    // If not in localStorage yet, make a change to trigger save
    if (!hasUserSettings) {
      const displayNameField = page.locator('#displayName');
      await displayNameField.fill('Test User for localStorage');
      
      const saveButton = page.locator('button').filter({ hasText: 'Save Changes' }).first();
      await saveButton.click();
      await page.waitForTimeout(1000);
    }
    
    // Check localStorage again
    const userSettingsData = await page.evaluate(() => {
      const settings = localStorage.getItem('userSettings');
      return settings ? JSON.parse(settings) : null;
    });
    
    expect(userSettingsData).not.toBeNull();
    console.log('✓ localStorage contains userSettings:', Object.keys(userSettingsData || {}));
  });

  test('should persist settings after page refresh', async () => {
    await page.goto('http://localhost:8357/pages/settings.html');
    await page.waitForTimeout(1000);
    
    // Make a unique change
    const testValue = `Persistence Test ${Date.now()}`;
    const displayNameField = page.locator('#displayName');
    await displayNameField.fill(testValue);
    
    // Save changes
    const saveButton = page.locator('button').filter({ hasText: 'Save Changes' }).first();
    await saveButton.click();
    await page.waitForTimeout(1000);
    
    // Refresh page
    await page.reload();
    await page.waitForTimeout(2000);
    
    // Check if value persisted
    const displayNameAfterRefresh = await displayNameField.inputValue();
    expect(displayNameAfterRefresh).toBe(testValue);
    
    console.log('✓ Settings persist after page refresh');
  });

  test('final results summary', async () => {
    const totalErrors = page.consoleErrors.length;
    const firebaseErrors = page.consoleErrors.filter(error => 
      error.includes('firebase') || 
      error.includes('Firebase') ||
      error.includes('import') ||
      error.includes('module')
    ).length;
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 SETTINGS PAGE TEST SUMMARY');
    console.log('='.repeat(50));
    console.log(`Total JavaScript errors: ${totalErrors}`);
    console.log(`Firebase-related errors: ${firebaseErrors}`);
    console.log('='.repeat(50));
    
    if (totalErrors > 0) {
      console.log('Console errors found:');
      page.consoleErrors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    } else {
      console.log('✅ No JavaScript errors detected!');
    }
  });
});