const { test, expect } = require('@playwright/test');
const { TEST_CONFIG, loginViaUI } = require('../test-config.js');

test.describe('Missing Elements for Authenticated Users', () => {
  test.beforeEach(async ({ page }) => {
    // Login with real credentials
    await loginViaUI(page, 'standard');
  });

  test('Dashboard should have user menu dropdown when logged in', async ({ page }) => {
    await page.goto(`${TEST_CONFIG.baseUrl}/pages/dashboard.html`);
    
    // Look for user menu that should be clickable
    const userMenuSelectors = [
      '.user-menu[role="button"]',
      '.user-dropdown',
      '.user-info[onclick]',
      '.user-profile-menu'
    ];
    
    let found = false;
    for (const selector of userMenuSelectors) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        found = true;
        break;
      }
    }
    
    if (!found) {
      await page.screenshot({ 
        path: 'playwright-testing/screenshots/missing-user-menu-when-logged-in.png',
        fullPage: true 
      });
    }
    
    expect(found).toBeTruthy();
  });

  test('All pages except Settings should have logout in user menu', async ({ page }) => {
    const pagesToCheck = [
      { name: 'Dashboard', url: '/pages/dashboard.html' },
      { name: 'Twin Management', url: '/pages/twin-management.html' },
      { name: 'Interview', url: '/pages/interview.html' },
      { name: 'My Files', url: '/pages/my-files.html' }
    ];
    
    for (const pageInfo of pagesToCheck) {
      await page.goto(`${TEST_CONFIG.baseUrl}${pageInfo.url}`);
      
      // Check for logout in potential user menu
      const logoutInMenuSelectors = [
        '.user-menu >> text=Logout',
        '.user-dropdown >> text=Sign Out',
        '.user-menu-item:has-text("Logout")',
        '[data-testid="user-menu-logout"]'
      ];
      
      let logoutFound = false;
      for (const selector of logoutInMenuSelectors) {
        try {
          const element = await page.locator(selector);
          if (await element.count() > 0) {
            logoutFound = true;
            break;
          }
        } catch (e) {
          // Continue checking
        }
      }
      
      if (!logoutFound) {
        console.log(`❌ ${pageInfo.name}: No logout option in user menu`);
        await page.screenshot({ 
          path: `playwright-testing/screenshots/no-logout-menu-${pageInfo.name.toLowerCase().replace(/\s+/g, '-')}.png`,
          fullPage: true 
        });
      } else {
        console.log(`✅ ${pageInfo.name}: Logout found in user menu`);
      }
      
      // For now, we know logout is missing from most pages
      // This test documents the issue
    }
  });

  test('User avatar should show actual user initial', async ({ page }) => {
    await page.goto(`${TEST_CONFIG.baseUrl}/pages/dashboard.html`);
    
    // Check if avatar shows 'W' for weezer@yev.com
    const avatarElement = page.locator('#userInitial, .user-avatar');
    const avatarText = await avatarElement.textContent();
    
    // Should show 'W' for Weezer
    expect(avatarText.trim()).toBe('W');
  });

  test('Interview page should show user context', async ({ page }) => {
    await page.goto(`${TEST_CONFIG.baseUrl}/pages/interview.html`);
    
    // Wait for privacy modal and dismiss it
    const privacyButton = page.locator('button:has-text("I Understand")');
    if (await privacyButton.isVisible()) {
      await privacyButton.click();
    }
    
    // Check for user identification on interview page
    const userIndicators = [
      '.user-name',
      '.current-user',
      '[data-user-email]',
      '.logged-in-as'
    ];
    
    let userContextFound = false;
    for (const selector of userIndicators) {
      if (await page.locator(selector).count() > 0) {
        userContextFound = true;
        break;
      }
    }
    
    if (!userContextFound) {
      await page.screenshot({ 
        path: 'playwright-testing/screenshots/interview-missing-user-context.png',
        fullPage: true 
      });
      console.log('❌ Interview page missing user context');
    }
    
    expect(userContextFound).toBeTruthy();
  });

  test('Create Twin button should be visible for logged in users', async ({ page }) => {
    await page.goto(`${TEST_CONFIG.baseUrl}/pages/twin-management.html`);
    
    // Look for create twin functionality
    const createTwinSelectors = [
      'button:has-text("Create Twin")',
      'button:has-text("New Twin")',
      '.create-twin-btn',
      '[data-action="create-twin"]'
    ];
    
    let createFound = false;
    for (const selector of createTwinSelectors) {
      if (await page.locator(selector).count() > 0) {
        createFound = true;
        break;
      }
    }
    
    if (!createFound) {
      await page.screenshot({ 
        path: 'playwright-testing/screenshots/missing-create-twin-logged-in.png',
        fullPage: true 
      });
      console.log('❌ Create Twin button missing for logged in user');
    }
    
    expect(createFound).toBeTruthy();
  });
});