const { test, expect } = require('@playwright/test');

// Helper function for login
async function loginUser(page) {
  await page.goto('http://localhost:8357/pages/auth.html');
  await page.click('[data-tab="login"]');
  await page.fill('.login-email', 'weezer@yev.com');
  await page.fill('.login-password', '123456');
  await page.click('button:has-text("Access Your Memories")');
  await page.waitForURL('**/dashboard.html');
}

test.describe('Settings Page Missing Functionality', () => {
  const missingElements = [
    // Expected settings sections based on common app patterns
    { name: 'Preferences Section', selectors: ['text=Preferences', '#preferences', '[data-section="preferences"]', '.preferences'] },
    { name: 'Data Export', selectors: ['text=Export', 'text=Download Data', 'button:has-text("Export")', '[data-action="export"]'] },
    { name: 'Backup Settings', selectors: ['text=Backup', 'text=Sync', '[data-section="backup"]'] },
    { name: 'API Keys Section', selectors: ['text=API Keys', 'text=Integrations', '[data-section="api"]'] },
    { name: 'Theme Settings', selectors: ['text=Theme', 'text=Dark Mode', 'text=Appearance', '[data-setting="theme"]'] },
    { name: 'Language Settings', selectors: ['text=Language', 'text=Locale', 'select[name="language"]'] },
    { name: 'Storage Management', selectors: ['text=Storage', 'text=Disk Usage', '[data-section="storage"]'] },
    { name: 'Import Settings', selectors: ['text=Import', 'button:has-text("Import")', '[data-action="import"]'] },
    { name: 'Advanced Settings', selectors: ['text=Advanced', '[data-section="advanced"]'] },
    { name: 'Help/Support Section', selectors: ['text=Help', 'text=Support', 'text=Contact', '[data-section="help"]'] }
  ];

  const missingFormFeatures = [
    { name: 'Profile Picture Upload', selectors: ['input[type="file"]', '.avatar-upload', '[data-action="upload-avatar"]'] },
    { name: 'Password Change Form', selectors: ['input[name="current-password"]', 'input[name="new-password"]', 'button:has-text("Change Password")'] },
    { name: 'Two-Factor Authentication', selectors: ['text=Two-Factor', 'text=2FA', '[data-feature="2fa"]'] },
    { name: 'Session Management', selectors: ['text=Active Sessions', 'text=Sign out all devices', '[data-section="sessions"]'] },
    { name: 'Data Privacy Controls', selectors: ['text=Data Privacy', 'text=Cookie Settings', '[data-section="privacy-controls"]'] }
  ];

  const missingUIElements = [
    { name: 'Search/Filter Settings', selectors: ['input[type="search"]', '.settings-search', '[placeholder*="search"]'] },
    { name: 'Save All Changes Button', selectors: ['button:has-text("Save All")', 'button:has-text("Apply Changes")', '[data-action="save-all"]'] },
    { name: 'Reset to Defaults', selectors: ['button:has-text("Reset")', 'button:has-text("Defaults")', '[data-action="reset"]'] },
    { name: 'Settings Navigation Menu', selectors: ['.settings-nav', '.settings-sidebar', '[data-nav="settings"]'] },
    { name: 'Settings Categories Tabs', selectors: ['.settings-tabs', '.tab-nav', '[role="tablist"]'] }
  ];
  
  test.beforeEach(async ({ page }) => {
    await loginUser(page);
    await page.goto('http://localhost:8357/pages/settings.html');
    await page.waitForLoadState('networkidle');
  });
  
  missingElements.forEach(({ name, selectors }) => {
    test(`should have ${name}`, async ({ page }) => {
      const found = await page.locator(selectors.join(', ')).count() > 0;
      if (!found) {
        await page.screenshot({ 
          path: `missing-${name.toLowerCase().replace(/[\s\/]/g, '-')}.png`,
          fullPage: true 
        });
      }
      expect(found).toBeTruthy();
    });
  });

  missingFormFeatures.forEach(({ name, selectors }) => {
    test(`should have ${name}`, async ({ page }) => {
      const found = await page.locator(selectors.join(', ')).count() > 0;
      if (!found) {
        await page.screenshot({ 
          path: `missing-${name.toLowerCase().replace(/[\s\/]/g, '-')}.png`,
          fullPage: true 
        });
      }
      expect(found).toBeTruthy();
    });
  });

  missingUIElements.forEach(({ name, selectors }) => {
    test(`should have ${name}`, async ({ page }) => {
      const found = await page.locator(selectors.join(', ')).count() > 0;
      if (!found) {
        await page.screenshot({ 
          path: `missing-${name.toLowerCase().replace(/[\s\/]/g, '-')}.png`,
          fullPage: true 
        });
      }
      expect(found).toBeTruthy();
    });
  });
  
  test('comprehensive settings audit', async ({ page }) => {
    console.log('\n=== COMPREHENSIVE SETTINGS AUDIT ===');
    
    // Take full page screenshot
    await page.screenshot({ path: 'settings-comprehensive-audit.png', fullPage: true });
    
    // Count all interactive elements
    const toggles = await page.locator('.toggle-switch').count();
    const inputs = await page.locator('input').count();
    const buttons = await page.locator('button').count();
    const selects = await page.locator('select').count();
    
    console.log(`Interactive elements found:`);
    console.log(`- Toggle switches: ${toggles}`);
    console.log(`- Input fields: ${inputs}`);
    console.log(`- Buttons: ${buttons}`);
    console.log(`- Select dropdowns: ${selects}`);
    
    // Check for common settings patterns
    const commonPatterns = [
      'Settings sections with clear headings',
      'Form validation feedback',
      'Success/error message areas',
      'Help text for complex settings',
      'Grouping of related settings'
    ];
    
    console.log('\nCommon settings page patterns to verify manually:');
    commonPatterns.forEach(pattern => {
      console.log(`- ${pattern}`);
    });
    
    console.log('\n=== END COMPREHENSIVE AUDIT ===\n');
  });
});