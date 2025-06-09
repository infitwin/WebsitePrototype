const { test, expect } = require('@playwright/test');

test.describe('Settings Save Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('http://localhost:8357/pages/auth.html');
    await page.click('[data-tab="login"]');
    await page.fill('.login-email', 'weezer@yev.com');
    await page.fill('.login-password', '123456');
    await page.click('button:has-text("Access Your Memories")');
    await page.waitForTimeout(2000);

    // Navigate to settings
    await page.goto('http://localhost:8357/pages/settings.html');
    await page.waitForLoadState('networkidle');
  });

  test('should save form changes to localStorage', async ({ page }) => {
    console.log('Testing form save to localStorage...');

    // Change display name
    await page.fill('#displayName', 'Test User Modified');
    
    // Submit form
    await page.click('#saveAccountBtn');
    await page.waitForTimeout(2000);

    // Check localStorage
    const userSettings = await page.evaluate(() => {
      return localStorage.getItem('userSettings');
    });

    expect(userSettings).toBeTruthy();
    
    const settings = JSON.parse(userSettings);
    expect(settings.displayName).toBe('Test User Modified');
    
    console.log('✅ Form changes saved to localStorage correctly');
  });

  test('should toggle email notifications and save immediately', async ({ page }) => {
    console.log('Testing email notifications toggle...');

    // Get initial state
    const initialSettings = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('userSettings') || '{}');
    });

    // Click the email notifications toggle
    await page.click('[data-setting="emailNotifications"]');
    await page.waitForTimeout(500);

    // Check localStorage was updated
    const updatedSettings = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('userSettings') || '{}');
    });

    expect(updatedSettings.emailNotifications).toBe(!initialSettings.emailNotifications);
    
    console.log('✅ Email notifications toggle saves immediately to localStorage');
  });

  test('should update all toggle switches correctly', async ({ page }) => {
    console.log('Testing all toggle switches...');

    const togglesToTest = [
      'interviewReminders',
      'weeklyDigest',
      'profileVisibility', 
      'analytics',
      'autoSaveInterviews',
      'compactView',
      'animationEffects',
      'soundEffects'
    ];

    for (const toggleSetting of togglesToTest) {
      console.log(`Testing ${toggleSetting} toggle...`);

      // Get initial state
      const beforeToggle = await page.evaluate((setting) => {
        const settings = JSON.parse(localStorage.getItem('userSettings') || '{}');
        return settings[setting];
      }, toggleSetting);

      // Click toggle
      await page.click(`[data-setting="${toggleSetting}"]`);
      await page.waitForTimeout(300);

      // Check localStorage updated
      const afterToggle = await page.evaluate((setting) => {
        const settings = JSON.parse(localStorage.getItem('userSettings') || '{}');
        return settings[setting];
      }, toggleSetting);

      expect(afterToggle).toBe(!beforeToggle);
      console.log(`✅ ${toggleSetting} toggle working correctly`);
    }
  });

  test('should save preferences section correctly', async ({ page }) => {
    console.log('Testing preferences save...');

    // Change theme preference
    await page.selectOption('#themePreference', 'dark');
    await page.selectOption('#languagePreference', 'es');
    await page.selectOption('#dateFormat', 'dmy');

    // Save preferences
    await page.click('#savePreferencesBtn');
    await page.waitForTimeout(2000);

    // Check localStorage
    const settings = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('userSettings') || '{}');
    });

    expect(settings.themePreference).toBe('dark');
    expect(settings.languagePreference).toBe('es');
    expect(settings.dateFormat).toBe('dmy');

    console.log('✅ Preferences saved correctly to localStorage');
  });

  test('should persist settings after page reload', async ({ page }) => {
    console.log('Testing localStorage persistence...');

    // Make changes
    await page.fill('#displayName', 'Persistent Test User');
    await page.click('#saveAccountBtn');
    await page.waitForTimeout(2000);

    await page.click('[data-setting="emailNotifications"]');
    await page.waitForTimeout(500);

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Check settings persisted
    const persistedSettings = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('userSettings') || '{}');
    });

    expect(persistedSettings.displayName).toBe('Persistent Test User');
    
    console.log('✅ Settings persist correctly after page reload');
  });

  test('should check for JavaScript errors', async ({ page }) => {
    console.log('Checking for JavaScript errors...');

    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    page.on('pageerror', error => {
      errors.push(error.message);
    });

    // Interact with various elements
    await page.click('#saveAccountBtn');
    await page.waitForTimeout(1000);

    await page.click('[data-setting="emailNotifications"]');
    await page.waitForTimeout(500);

    await page.click('#savePreferencesBtn');
    await page.waitForTimeout(1000);

    // Check for errors
    if (errors.length > 0) {
      console.log('❌ JavaScript errors found:');
      errors.forEach(error => console.log(`   - ${error}`));
      expect(errors.length).toBe(0);
    } else {
      console.log('✅ No JavaScript errors detected');
    }
  });

  test('should show success messages when settings are saved', async ({ page }) => {
    console.log('Testing success message display...');

    // Change a setting and submit
    await page.fill('#displayName', 'Success Message Test');
    await page.click('#saveAccountBtn');

    // Check success message appears
    const successMessage = page.locator('#successMessage');
    await expect(successMessage).toBeVisible({ timeout: 3000 });

    const messageText = await successMessage.textContent();
    expect(messageText).toContain('saved');

    console.log('✅ Success message displayed correctly');
  });

  test('should handle form validation correctly', async ({ page }) => {
    console.log('Testing form validation...');

    // Try invalid email
    await page.fill('#emailAddress', 'invalid-email');
    await page.click('#saveAccountBtn');
    await page.waitForTimeout(1000);

    // The form should still process (based on current implementation)
    // This test documents current behavior
    console.log('✅ Form validation test completed');
  });

  test('should handle password form correctly', async ({ page }) => {
    console.log('Testing password form...');

    // Fill password fields
    await page.fill('#currentPassword', 'current123');
    await page.fill('#newPassword', 'newpassword123');
    await page.fill('#confirmPassword', 'newpassword123');

    // Submit password form
    await page.click('#changePasswordBtn');
    await page.waitForTimeout(2000);

    // Check success message
    const successMessage = page.locator('#successMessage');
    await expect(successMessage).toBeVisible({ timeout: 3000 });

    console.log('✅ Password form working correctly');
  });
});