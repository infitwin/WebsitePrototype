const { test, expect } = require('@playwright/test');

test.describe('Required Elements - Interview Page', () => {
  const requiredNavigationElements = [
    { name: 'Dashboard Link', selectors: ['text=Dashboard', 'a[href*="dashboard"]', '[data-page="dashboard"]'] },
    { name: 'Twin Management Link', selectors: ['text=Twin Management', 'a[href*="twin-management"]', '[data-page="twin-management"]'] },
    { name: 'Explore Link', selectors: ['text=Explore', 'a[href*="explore"]', '[data-page="explore"]'] },
    { name: 'Interview Link', selectors: ['text=Interview', 'a[href*="interview"]', '[data-page="interview"]'] },
    { name: 'Curator Link', selectors: ['text=Curator', 'a[href*="curator"]', '[data-page="curator"]'] },
    { name: 'Transcripts Link', selectors: ['text=Transcripts', 'a[href*="transcripts"]', '[data-page="transcripts"]'] },
    { name: 'Talk to Twin Link', selectors: ['text=Talk to Twin', 'a[href*="talk-to-twin"]', '[data-page="talk"]'] },
    { name: 'My Files Link', selectors: ['text=My Files', 'a[href*="file-browser"]', 'a[href*="my-files"]', '[data-page="files"]'] },
    { name: 'Settings Link', selectors: ['text=Settings', 'a[href*="settings"]', '[data-page="settings"]'] }
  ];

  const requiredUserElements = [
    { name: 'Logout Button', selectors: ['text=Logout', 'text=Sign out', 'text=Sign Out', '[aria-label="Logout"]', 'button:has-text("Logout")'] },
    { name: 'User Menu', selectors: ['.user-menu', '[data-testid="user-menu"]', '.user-profile', '.avatar', '.user-avatar'] },
    { name: 'User Name Display', selectors: ['.username', '.user-name', '[data-testid="username"]', '.current-user'] }
  ];

  test.beforeEach(async ({ page }) => {
    // Navigate to interview page
    await page.goto('http://localhost:8357/pages/interview.html');
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
  });

  test.describe('Navigation Elements', () => {
    requiredNavigationElements.forEach(({ name, selectors }) => {
      test(`should have ${name}`, async ({ page }) => {
        let found = false;
        for (const selector of selectors) {
          const count = await page.locator(selector).count();
          if (count > 0) {
            found = true;
            break;
          }
        }
        
        if (!found) {
          const filename = `missing-${name.toLowerCase().replace(/\s+/g, '-')}-interview.png`;
          await page.screenshot({ 
            path: `playwright-testing/screenshots/${filename}`, 
            fullPage: true 
          });
        }
        
        expect(found).toBeTruthy();
      });
    });
  });

  test.describe('User Authentication Elements', () => {
    requiredUserElements.forEach(({ name, selectors }) => {
      test(`should have ${name}`, async ({ page }) => {
        let found = false;
        for (const selector of selectors) {
          const count = await page.locator(selector).count();
          if (count > 0) {
            found = true;
            break;
          }
        }
        
        if (!found) {
          const filename = `missing-${name.toLowerCase().replace(/\s+/g, '-')}-interview.png`;
          await page.screenshot({ 
            path: `playwright-testing/screenshots/${filename}`, 
            fullPage: true 
          });
        }
        
        expect(found).toBeTruthy();
      });
    });
  });

  test('should have proper interview functionality', async ({ page }) => {
    // Check that interview-specific elements ARE present
    const interviewElements = [
      { name: 'Microphone Button', selector: '.mic-button' },
      { name: 'Stop Session Button', selector: 'button:has-text("Stop Session")' },
      { name: 'Save & Exit Button', selector: 'button:has-text("Save & Exit")' },
      { name: 'Winston Avatar', selector: '.winston-avatar' },
      { name: 'Interview Manager', selector: '.interview-manager' }
    ];

    for (const { name, selector } of interviewElements) {
      const count = await page.locator(selector).count();
      expect(count).toBeGreaterThan(0);
    }
  });
});