const { test, expect } = require('@playwright/test');

test.describe('Required Elements - Curator Page', () => {
  // All required navigation items per CLAUDE.md
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

  const requiredAuthElements = [
    { name: 'Logout Button', selectors: [
      'text=Logout', 
      'text=Sign out', 
      'text=Sign Out', 
      '[aria-label="Logout"]', 
      'button:has-text("Logout")',
      '.logout-button',
      '.sign-out'
    ]},
    { name: 'User Menu', selectors: [
      '.user-menu', 
      '[data-testid="user-menu"]', 
      '.user-dropdown',
      '.user-profile',
      '.user-info[role="button"]',
      '.user-avatar'
    ]},
    { name: 'User Identification', selectors: [
      '.username',
      '.user-name', 
      '[data-testid="username"]',
      '.current-user',
      '.user-display-name'
    ]}
  ];

  test.beforeEach(async ({ page }) => {
    // Navigate to curator page
    await page.goto('http://localhost:8357/pages/curator.html');
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
          const filename = `missing-${name.toLowerCase().replace(/\s+/g, '-')}-curator.png`;
          await page.screenshot({ 
            path: `playwright-testing/screenshots/${filename}`, 
            fullPage: true 
          });
        }
        
        expect(found).toBeTruthy();
      });
    });
  });

  test.describe('Authentication UI', () => {
    requiredAuthElements.forEach(({ name, selectors }) => {
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
          const filename = `missing-${name.toLowerCase().replace(/\s+/g, '-')}-curator.png`;
          await page.screenshot({ 
            path: `playwright-testing/screenshots/${filename}`, 
            fullPage: true 
          });
        }
        
        expect(found).toBeTruthy();
      });
    });
  });

  test('should not hardcode demo-user', async ({ page }) => {
    // Check if the page is using hardcoded demo-user
    const pageContent = await page.content();
    const hasDemoUser = pageContent.includes("userId: 'demo-user'");
    
    if (hasDemoUser) {
      await page.screenshot({ 
        path: 'playwright-testing/screenshots/hardcoded-demo-user-curator.png', 
        fullPage: true 
      });
    }
    
    expect(hasDemoUser).toBeFalsy();
  });

  test('should have proper navigation structure', async ({ page }) => {
    // Check for either sidebar or complete header navigation
    const hasSidebar = await page.locator('.sidebar-nav').count() > 0;
    const hasFullHeaderNav = await page.locator('.header-nav').count() > 0;
    
    const hasProperNav = hasSidebar || hasFullHeaderNav;
    
    if (!hasProperNav) {
      await page.screenshot({ 
        path: 'playwright-testing/screenshots/missing-navigation-structure-curator.png', 
        fullPage: true 
      });
    }
    
    expect(hasProperNav).toBeTruthy();
  });

  test('curator specific features should work', async ({ page }) => {
    // Verify curator-specific elements are present
    const curatorElements = [
      { name: 'Persona Selector', selector: '.persona-selector' },
      { name: 'Memory Canvas', selector: '.memory-canvas' },
      { name: 'Question Display', selector: '.question-display' },
      { name: 'Response Area', selector: '.response-area' }
    ];

    for (const { name, selector } of curatorElements) {
      const count = await page.locator(selector).count();
      expect(count).toBeGreaterThan(0);
    }
  });
});