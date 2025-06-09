const { test, expect } = require('@playwright/test');

test.describe('Required Elements - Dashboard Page', () => {
  const requiredAuthElements = [
    { name: 'Logout Button', selectors: [
      'text=Logout', 
      'text=Sign out', 
      'text=Sign Out', 
      '[aria-label="Logout"]', 
      'button:has-text("Logout")',
      '#logoutBtn',  // Referenced in knowledge-symphony.js
      '.logout-button'
    ]},
    { name: 'User Menu Dropdown', selectors: [
      '.user-menu', 
      '[data-testid="user-menu"]', 
      '.user-dropdown',
      '.profile-dropdown',
      '[aria-label="User menu"]'
    ]},
    { name: 'Clickable User Profile', selectors: [
      '.user-info[role="button"]',
      '.user-info[onclick]',
      '.user-profile-link',
      'a[href*="profile"]'
    ]}
  ];

  const requiredNavigationElements = [
    { name: 'Explore Link', selectors: [
      'text=Explore', 
      'a[href*="explore"]', 
      '[data-page="explore"]',
      '.sidebar-nav-item:has-text("Explore")'
    ]}
  ];

  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard
    await page.goto('http://localhost:8357/pages/dashboard.html');
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
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
          const filename = `missing-${name.toLowerCase().replace(/\s+/g, '-')}-dashboard.png`;
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
          const filename = `missing-${name.toLowerCase().replace(/\s+/g, '-')}-dashboard.png`;
          await page.screenshot({ 
            path: `playwright-testing/screenshots/${filename}`, 
            fullPage: true 
          });
        }
        
        expect(found).toBeTruthy();
      });
    });
  });

  test('should have all required navigation items', async ({ page }) => {
    const requiredNavItems = [
      'Dashboard',
      'Twin Management', 
      'Explore',  // Currently missing
      'Interview',
      'Curator',
      'Transcripts',
      'Talk to Twin',
      'My Files',
      'Settings'
    ];

    for (const item of requiredNavItems) {
      const count = await page.locator(`.sidebar-nav-item >> text=${item}`).count();
      if (count === 0) {
        console.log(`Missing navigation item: ${item}`);
      }
      expect(count).toBeGreaterThan(0);
    }
  });

  test('user info should be interactive', async ({ page }) => {
    // Check if user info area is clickable/interactive
    const userInfo = page.locator('.user-info').first();
    const isClickable = await userInfo.evaluate(el => {
      return el.onclick !== null || 
             el.getAttribute('role') === 'button' ||
             el.style.cursor === 'pointer' ||
             el.tagName === 'A' ||
             el.tagName === 'BUTTON';
    });
    
    expect(isClickable).toBeTruthy();
  });
});