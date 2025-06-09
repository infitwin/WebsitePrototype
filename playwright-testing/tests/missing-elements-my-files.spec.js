const { test, expect } = require('@playwright/test');

test.describe('Required Elements - My Files Page', () => {
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
    { name: 'User Menu/Profile', selectors: [
      '.user-menu', 
      '[data-testid="user-menu"]', 
      '.user-dropdown',
      '.user-profile',
      '.user-info',
      '.user-avatar'
    ]}
  ];

  const requiredNavigationElements = [
    { name: 'Explore Link', selectors: [
      'text=Explore', 
      'a[href*="explore"]', 
      '[data-page="explore"]',
      '.sidebar-nav-item >> text=Explore'
    ]}
  ];

  const requiredFileManagementElements = [
    { name: 'Delete File Option', selectors: [
      '.delete-file',
      'button:has-text("Delete")',
      '.btn-batch-delete',
      '[aria-label="Delete file"]',
      '.file-actions >> text=Delete'
    ]},
    { name: 'Bulk Selection Controls', selectors: [
      '#selectAll',
      '.file-checkbox',
      'input[type="checkbox"]',
      '.batch-actions'
    ]}
  ];

  test.beforeEach(async ({ page }) => {
    // Navigate to My Files page
    await page.goto('http://localhost:8357/pages/my-files.html');
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
    // Wait a bit for files to load
    await page.waitForTimeout(2000);
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
          const filename = `missing-${name.toLowerCase().replace(/\s+/g, '-')}-my-files.png`;
          await page.screenshot({ 
            path: `playwright-testing/screenshots/${filename}`, 
            fullPage: true 
          });
        }
        
        expect(found).toBeTruthy();
      });
    });
  });

  test.describe('Navigation Completeness', () => {
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
          const filename = `missing-${name.toLowerCase().replace(/\s+/g, '-')}-my-files.png`;
          await page.screenshot({ 
            path: `playwright-testing/screenshots/${filename}`, 
            fullPage: true 
          });
        }
        
        expect(found).toBeTruthy();
      });
    });
  });

  test.describe('File Management Features', () => {
    requiredFileManagementElements.forEach(({ name, selectors }) => {
      test(`should have ${name}`, async ({ page }) => {
        let found = false;
        
        // Wait for files to potentially load
        await page.waitForTimeout(1000);
        
        for (const selector of selectors) {
          const count = await page.locator(selector).count();
          if (count > 0) {
            found = true;
            break;
          }
        }
        
        if (!found) {
          const filename = `missing-${name.toLowerCase().replace(/\s+/g, '-')}-my-files.png`;
          await page.screenshot({ 
            path: `playwright-testing/screenshots/${filename}`, 
            fullPage: true 
          });
        }
        
        expect(found).toBeTruthy();
      });
    });
  });

  test('should have all navigation items with proper labels', async ({ page }) => {
    const requiredNavItems = [
      { text: 'Dashboard', tooltip: true },
      { text: 'Twin Management', tooltip: true },
      { text: 'Explore', tooltip: true },
      { text: 'Interview', tooltip: true },
      { text: 'Curator', tooltip: true },
      { text: 'Transcripts', tooltip: true },
      { text: 'Talk to Twin', tooltip: true },
      { text: 'My Files', tooltip: true },
      { text: 'Settings', tooltip: true }
    ];

    for (const item of requiredNavItems) {
      // Check for either visible text or tooltip
      const visibleText = await page.locator(`.sidebar-nav-item >> text=${item.text}`).count();
      const tooltip = await page.locator(`.sidebar-tooltip >> text=${item.text}`).count();
      
      const found = visibleText > 0 || tooltip > 0;
      if (!found) {
        console.log(`Missing navigation item: ${item.text}`);
      }
      expect(found).toBeTruthy();
    }
  });

  test('file operations should have proper UI elements', async ({ page }) => {
    // Check if batch actions are present when files are selected
    const batchActions = await page.locator('.batch-actions').count();
    expect(batchActions).toBeGreaterThan(0);
    
    // Check if delete button exists in batch actions
    const deleteBtn = await page.locator('.btn-batch-delete').count();
    expect(deleteBtn).toBeGreaterThan(0);
  });
});