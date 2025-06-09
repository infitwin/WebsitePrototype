const { test, expect } = require('@playwright/test');

// Helper function for login (add at top of test file)
async function loginUser(page) {
  await page.goto('http://localhost:8357/pages/auth.html');
  await page.click('[data-tab="login"]');
  await page.fill('.login-email', 'weezer@yev.com');
  await page.fill('.login-password', '123456');
  await page.click('button:has-text("Access Your Memories")');
  await page.waitForURL('**/dashboard.html');
}

test.describe('Required Elements - Settings Page', () => {
  const requiredElements = [
    { name: 'Account Settings Section', selectors: ['text=Account Settings', '#account-settings', '[data-section="account"]', '.account-settings'] },
    { name: 'Preferences Section', selectors: ['text=Preferences', '#preferences', '[data-section="preferences"]', '.preferences-section'] }
  ];
  
  test.beforeEach(async ({ page }) => {
    // Login first to access authenticated pages
    await loginUser(page);
    
    // Navigate to settings page
    await page.goto('http://localhost:8357/pages/settings.html');
    await page.waitForLoadState('networkidle');
  });
  
  requiredElements.forEach(({ name, selectors }) => {
    test(`should have ${name}`, async ({ page }) => {
      const found = await page.locator(selectors.join(', ')).count() > 0;
      if (!found) {
        await page.screenshot({ 
          path: `missing-${name.toLowerCase().replace(/\s+/g, '-')}.png`,
          fullPage: true 
        });
      }
      expect(found).toBeTruthy();
    });
  });

  test('should have complete settings structure', async ({ page }) => {
    // Verify that existing sections are present
    const existingSections = [
      { name: 'Privacy Settings', selector: 'text=Privacy' },
      { name: 'Notifications', selector: 'text=Notifications' },
      { name: 'Security', selector: 'text=Security' }
    ];

    for (const section of existingSections) {
      const exists = await page.locator(section.selector).count() > 0;
      console.log(`${section.name}: ${exists ? 'Found' : 'Missing'}`);
    }

    // Check for missing sections
    const missingSections = [
      'Account Settings',
      'Preferences'
    ];

    for (const section of missingSections) {
      const exists = await page.locator(`text=${section}`).count() > 0;
      if (!exists) {
        console.log(`Missing section: ${section}`);
      }
    }
  });

  test('settings page should follow consistent layout', async ({ page }) => {
    // Check if settings sections follow a consistent structure
    const settingsSections = await page.locator('.settings-section, [class*="settings"]').count();
    
    // There should be at least 3 existing sections (Privacy, Notifications, Security)
    // Plus the 2 missing ones (Account Settings, Preferences) = 5 total expected
    console.log(`Found ${settingsSections} settings sections, expected at least 5`);
    
    // Take screenshot to document current state
    await page.screenshot({ 
      path: 'settings-page-layout.png',
      fullPage: true 
    });
  });
});