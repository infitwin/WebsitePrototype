const { test, expect } = require('@playwright/test');

test.describe('Settings Debug', () => {
  test('Debug settings page localStorage and form submission', async ({ page }) => {
    console.log('\n=== DEBUGGING SETTINGS FUNCTIONALITY ===\n');

    // Enable comprehensive console logging
    page.on('console', msg => {
      console.log(`🟦 BROWSER CONSOLE [${msg.type()}]: ${msg.text()}`);
    });

    page.on('pageerror', error => {
      console.log(`❌ PAGE ERROR: ${error.message}`);
    });

    // Login
    console.log('1. Logging in...');
    await page.goto('http://localhost:8357/pages/auth.html');
    await page.click('[data-tab="login"]');
    await page.fill('.login-email', 'weezer@yev.com');
    await page.fill('.login-password', '123456');
    await page.click('button:has-text("Access Your Memories")');
    await page.waitForTimeout(2000);

    // Navigate to settings
    console.log('2. Navigating to settings...');
    await page.goto('http://localhost:8357/pages/settings.html');
    await page.waitForLoadState('networkidle');

    // Check initial localStorage
    console.log('3. Checking initial localStorage...');
    const initialStorage = await page.evaluate(() => {
      return {
        userSettings: localStorage.getItem('userSettings'),
        allKeys: Object.keys(localStorage),
        localStorage: { ...localStorage }
      };
    });
    console.log('Initial localStorage:', initialStorage);

    // Check if form elements exist
    console.log('4. Checking form elements...');
    const formElements = await page.evaluate(() => {
      return {
        displayNameExists: !!document.getElementById('displayName'),
        saveButtonExists: !!document.getElementById('saveAccountBtn'),
        emailToggleExists: !!document.querySelector('[data-setting="emailNotifications"]'),
        formExists: !!document.getElementById('accountForm')
      };
    });
    console.log('Form elements:', formElements);

    // Change display name and check value
    console.log('5. Changing display name...');
    await page.fill('#displayName', 'Debug Test User');
    
    const displayNameValue = await page.inputValue('#displayName');
    console.log('Display name value after change:', displayNameValue);

    // Check if form submission handler is attached
    console.log('6. Testing form submission...');
    
    // Check localStorage before submission
    const beforeSubmit = await page.evaluate(() => {
      return localStorage.getItem('userSettings');
    });
    console.log('localStorage before form submit:', beforeSubmit);

    // Click save button
    await page.click('#saveAccountBtn');
    
    // Wait for any async operations
    await page.waitForTimeout(3000);

    // Check localStorage after submission
    const afterSubmit = await page.evaluate(() => {
      return {
        userSettings: localStorage.getItem('userSettings'),
        allKeys: Object.keys(localStorage)
      };
    });
    console.log('localStorage after form submit:', afterSubmit);

    // Test toggle functionality
    console.log('7. Testing toggle functionality...');
    
    // Check if toggle exists and click it
    const toggleExists = await page.locator('[data-setting="emailNotifications"]').count();
    console.log('Email notifications toggle exists:', toggleExists > 0);

    if (toggleExists > 0) {
      await page.click('[data-setting="emailNotifications"]');
      await page.waitForTimeout(1000);

      const afterToggle = await page.evaluate(() => {
        return localStorage.getItem('userSettings');
      });
      console.log('localStorage after toggle:', afterToggle);
    }

    // Check if JavaScript functions are available
    console.log('8. Checking JavaScript functions...');
    const jsStatus = await page.evaluate(() => {
      return {
        saveSettingsFunction: typeof window.saveSettings,
        userSettingsVar: typeof userSettings,
        handleAccountFormSubmit: typeof window.handleAccountFormSubmit,
        initializeSettings: typeof window.initializeSettings
      };
    });
    console.log('JavaScript function availability:', jsStatus);

    // Try calling saveSettings directly if available
    const directSaveResult = await page.evaluate(() => {
      try {
        if (typeof window.saveSettings === 'function') {
          window.saveSettings();
          return 'Called saveSettings successfully';
        } else {
          return 'saveSettings function not found';
        }
      } catch (error) {
        return 'Error calling saveSettings: ' + error.message;
      }
    });
    console.log('Direct saveSettings call result:', directSaveResult);

    // Check success message functionality
    console.log('9. Checking success message...');
    const successMessageVisible = await page.locator('#successMessage').isVisible();
    console.log('Success message visible:', successMessageVisible);
  });
});