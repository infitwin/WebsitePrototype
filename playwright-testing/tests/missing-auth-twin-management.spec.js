const { test, expect } = require('@playwright/test');

test.describe('Required Elements - Twin Management Page', () => {
  const requiredAuthElements = [
    { name: 'Logout Button', selectors: ['text=Logout', 'text=Sign out', 'text=Sign Out', '[aria-label="Logout"]', 'button:has-text("Logout")'] },
    { name: 'User Menu', selectors: ['.user-menu', '[data-testid="user-menu"]', '.user-profile', '.avatar', '.user-avatar'] },
    { name: 'User Name Display', selectors: ['.username', '.user-name', '[data-testid="username"]', '.current-user'] }
  ];

  const requiredTwinManagementElements = [
    { name: 'Create Twin Button', selectors: ['text=Create Twin', 'text=New Twin', 'button:has-text("Create")', '[aria-label="Create new twin"]'] },
    { name: 'Delete Twin Button', selectors: ['text=Delete', 'button:has-text("Delete")', '[aria-label="Delete twin"]', '.delete-twin'] },
    { name: 'Twin List View', selectors: ['.twin-list', '.twins-grid', '[data-testid="twins-list"]', '.my-twins-list'] }
  ];

  test.beforeEach(async ({ page }) => {
    // Navigate to twin management page
    await page.goto('http://localhost:8357/pages/twin-management.html');
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
  });

  test.describe('Authentication Elements', () => {
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
          const filename = `missing-${name.toLowerCase().replace(/\s+/g, '-')}-twin-management.png`;
          await page.screenshot({ 
            path: `playwright-testing/screenshots/${filename}`, 
            fullPage: true 
          });
        }
        
        expect(found).toBeTruthy();
      });
    });
  });

  test.describe('Twin Management Features', () => {
    requiredTwinManagementElements.forEach(({ name, selectors }) => {
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
          const filename = `missing-${name.toLowerCase().replace(/\s+/g, '-')}-twin-management.png`;
          await page.screenshot({ 
            path: `playwright-testing/screenshots/${filename}`, 
            fullPage: true 
          });
        }
        
        expect(found).toBeTruthy();
      });
    });
  });

  test('should have correct My Files link', async ({ page }) => {
    // Check if My Files link points to correct page
    const myFilesLink = await page.locator('a[href*="file-browser.html"]').first();
    const href = await myFilesLink.getAttribute('href');
    
    // Should point to my-files.html, not file-browser.html
    expect(href).not.toContain('file-browser.html');
    expect(href).toContain('my-files.html');
  });

  test('should have working navigation sidebar', async ({ page }) => {
    // Verify navigation sidebar is present and complete
    const navItems = [
      'Dashboard',
      'Twin Management',
      'Explore',
      'Interview', 
      'Curator',
      'Transcripts',
      'Talk to Twin',
      'My Files',
      'Settings'
    ];

    for (const item of navItems) {
      const count = await page.locator(`.sidebar-nav-item:has-text("${item}")`).count();
      expect(count).toBeGreaterThan(0);
    }
  });
});