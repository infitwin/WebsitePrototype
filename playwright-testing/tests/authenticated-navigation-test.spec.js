const { test, expect } = require('@playwright/test');
const { TEST_CONFIG, loginViaUI, ensureLoggedIn } = require('../test-config.js');

test.describe('Authenticated Navigation Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await loginViaUI(page, 'standard');
  });

  test('should show user info and logout option when logged in', async ({ page }) => {
    // Navigate to dashboard
    await page.goto(`${TEST_CONFIG.baseUrl}/pages/dashboard.html`);
    
    // Check for user email display
    const userEmail = await page.locator('#userEmail, .user-email').textContent();
    expect(userEmail).toContain('weezer@yev.com');
    
    // Check for logout functionality
    // First check Settings page since that's where logout exists
    await page.goto(`${TEST_CONFIG.baseUrl}/pages/settings.html`);
    
    const logoutButton = page.locator('button:has-text("Sign Out"), button:has-text("Logout")');
    await expect(logoutButton).toBeVisible();
    
    // Take screenshot for evidence
    await page.screenshot({ 
      path: 'playwright-testing/screenshots/authenticated-settings-with-logout.png',
      fullPage: true 
    });
  });

  test('should have access to all navigation items when logged in', async ({ page }) => {
    await page.goto(`${TEST_CONFIG.baseUrl}/pages/dashboard.html`);
    
    // Test navigation to each page
    const pages = [
      { name: 'Twin Management', url: 'twin-management.html' },
      { name: 'Interview', url: 'interview.html' },
      { name: 'Curator', url: 'curator.html' },
      { name: 'Transcripts', url: 'interview-transcripts.html' },
      { name: 'Talk to Twin', url: 'talk-to-twin.html' },
      { name: 'My Files', url: 'my-files.html' },
      { name: 'Settings', url: 'settings.html' }
    ];
    
    for (const pageInfo of pages) {
      // Click on navigation item
      const navItem = page.locator(`.sidebar-nav-item:has-text("${pageInfo.name}")`);
      await navItem.click();
      
      // Wait for navigation
      await page.waitForURL(`**/${pageInfo.url}`);
      
      // Verify we're on the right page
      expect(page.url()).toContain(pageInfo.url);
      
      console.log(`✅ Successfully navigated to ${pageInfo.name}`);
      
      // Go back to dashboard for next test
      if (pageInfo.name !== 'Settings') {
        await page.goto(`${TEST_CONFIG.baseUrl}/pages/dashboard.html`);
      }
    }
  });

  test('should maintain authentication across page refreshes', async ({ page }) => {
    await page.goto(`${TEST_CONFIG.baseUrl}/pages/dashboard.html`);
    
    // Get initial user info
    const initialUserName = await page.locator('#userName, .user-name').first().textContent();
    
    // Refresh the page
    await page.reload();
    
    // Check user is still logged in
    const afterRefreshUserName = await page.locator('#userName, .user-name').first().textContent();
    expect(afterRefreshUserName).toBe(initialUserName);
    
    // Verify no redirect to login page
    expect(page.url()).toContain('dashboard.html');
    expect(page.url()).not.toContain('auth.html');
  });

  test('should be able to perform authenticated actions', async ({ page }) => {
    // Go to My Files page
    await page.goto(`${TEST_CONFIG.baseUrl}/pages/my-files.html`);
    
    // Wait for files to load
    await page.waitForLoadState('networkidle');
    
    // Check if file upload area is accessible
    const dropZone = page.locator('#dropZone, .file-drop-zone');
    await expect(dropZone).toBeVisible();
    
    // Check if storage info is displayed (only for authenticated users)
    const storageInfo = page.locator('#storageText, .storage-text');
    const storageText = await storageInfo.textContent();
    expect(storageText).toContain('GB');
  });

  test('logout should redirect to login page', async ({ page }) => {
    // Navigate to settings page where logout exists
    await page.goto(`${TEST_CONFIG.baseUrl}/pages/settings.html`);
    
    // Click logout button
    const logoutButton = page.locator('#logoutBtn, button:has-text("Sign Out")');
    
    // Handle the confirmation dialog
    page.on('dialog', dialog => dialog.accept());
    
    // Click logout
    await logoutButton.click();
    
    // Should redirect to auth page
    await page.waitForURL('**/auth.html', { timeout: 10000 });
    
    expect(page.url()).toContain('auth.html');
    console.log('✅ Successfully logged out and redirected to login');
  });
});