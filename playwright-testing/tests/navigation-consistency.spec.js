const { test, expect } = require('@playwright/test');

test.describe('Navigation System Consistency', () => {
  // Pages that should have centralized navigation
  const authenticatedPages = [
    'dashboard.html',
    'twin-management.html',
    'interview.html',
    'curator.html',
    'interview-transcripts.html',
    'talk-to-twin.html',
    'my-files.html',
    'settings.html'
  ];

  // Pages that should NOT have centralized navigation
  const nonAuthenticatedPages = [
    'auth.html',
    'meet-winston.html',
    'alpha-welcome.html',
    'error.html',
    'shared-view.html',
    'email-verification.html',
    'capture-first-memory.html'
  ];

  test.beforeEach(async ({ page }) => {
    // Login for authenticated pages
    await page.goto('http://localhost:8357/pages/auth.html');
    await page.click('[data-tab="login"]');
    await page.fill('.login-email', 'weezer@yev.com');
    await page.fill('.login-password', '123456');
    await page.click('button:has-text("Access Your Memories")');
    await page.waitForURL('**/dashboard.html');
  });

  authenticatedPages.forEach(pageName => {
    test(`${pageName} should use centralized navigation`, async ({ page }) => {
      await page.goto(`http://localhost:8357/pages/${pageName}`);
      
      // Check for sidebar-nav-container
      const sidebarContainer = await page.locator('.sidebar-nav-container').count();
      expect(sidebarContainer).toBeGreaterThan(0);
      
      // Check that navigation.js is loaded
      const hasNavigationScript = await page.evaluate(() => {
        const scripts = Array.from(document.querySelectorAll('script[src]'));
        return scripts.some(script => script.src.includes('navigation.js'));
      });
      expect(hasNavigationScript).toBeTruthy();
      
      // Check that shared sidebar is loaded
      const sharedSidebar = await page.locator('.sidebar-nav').count();
      expect(sharedSidebar).toBeGreaterThan(0);
    });
  });

  nonAuthenticatedPages.forEach(pageName => {
    test(`${pageName} should NOT use centralized navigation`, async ({ page }) => {
      await page.goto(`http://localhost:8357/pages/${pageName}`);
      
      // Check that sidebar-nav-container is NOT present
      const sidebarContainer = await page.locator('.sidebar-nav-container').count();
      expect(sidebarContainer).toBe(0);
      
      // Check that navigation.js is NOT loaded
      const hasNavigationScript = await page.evaluate(() => {
        const scripts = Array.from(document.querySelectorAll('script[src]'));
        return scripts.some(script => script.src.includes('navigation.js'));
      });
      expect(hasNavigationScript).toBeFalsy();
    });
  });

  test('All authenticated pages have consistent navigation items', async ({ page }) => {
    const expectedNavItems = [
      'Dashboard',
      'Twin Management',
      'Interview',
      'Curator',
      'Transcripts',
      'Talk to Twin',
      'My Files',
      'Settings'
    ];

    for (const pageName of authenticatedPages) {
      await page.goto(`http://localhost:8357/pages/${pageName}`);
      
      // Wait for navigation to load
      await page.waitForSelector('.sidebar-nav', { timeout: 5000 });
      
      // Check all navigation items are present
      for (const item of expectedNavItems) {
        const navItem = await page.locator(`.sidebar-nav-item:has-text("${item}")`).count();
        expect(navItem).toBeGreaterThan(0);
      }
    }
  });
});