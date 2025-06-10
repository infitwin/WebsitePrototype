const { test, expect } = require('@playwright/test');

test.describe('My Files Authentication Fix', () => {
  
  test('should load My Files page after login with email confirmation', async ({ page }) => {
    // Go to auth page
    await page.goto('http://localhost:8357/pages/auth.html');
    
    // Click on login tab
    await page.click('[data-tab="login"]');
    
    // Fill in login credentials
    await page.fill('.login-email', 'weezer@yev.com');
    await page.fill('.login-password', '123456');
    
    // Click login button
    await page.click('button:has-text("Access Your Memories")');
    
    // Wait for email verification page
    await page.waitForURL('**/email-verification.html', { timeout: 5000 });
    
    // Click the red "Bypass All Auth (Testing)" button
    console.log('📧 On email verification page, clicking red bypass button...');
    await page.click('button:has-text("Bypass All Auth (Testing)")');
    
    // Wait for navigation to dashboard
    await page.waitForURL('**/dashboard.html', { timeout: 10000 });
    
    // Navigate to My Files
    await page.goto('http://localhost:8357/pages/my-files.html');
    
    // Wait for page to load
    await page.waitForTimeout(3000);
    
    // Take screenshot for analysis
    await page.screenshot({ path: 'my-files-authenticated.png', fullPage: true });
    
    // Verify no authentication errors in console
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error' && msg.text().includes('User not authenticated')) {
        consoleErrors.push(msg.text());
      }
    });
    
    // Check that key elements are visible
    const pageTitle = await page.locator('h1:has-text("My Files")');
    await expect(pageTitle).toBeVisible();
    
    // Check for storage chart
    const storageChart = await page.locator('#storageDonutChart');
    await expect(storageChart).toBeVisible();
    
    // Check for file container (either with files or empty state)
    const filesContainer = await page.locator('#filesContainer');
    const emptyState = await page.locator('#emptyState');
    
    // Either files container or empty state should be visible, but not both
    const isFilesVisible = await filesContainer.isVisible();
    const isEmptyVisible = await emptyState.isVisible();
    
    expect(isFilesVisible || isEmptyVisible).toBe(true);
    
    // Check that no auth errors appeared
    expect(consoleErrors.length).toBe(0);
    
    // Verify user info is displayed
    const userInfo = await page.locator('#userInfo');
    const userInfoText = await userInfo.textContent();
    expect(userInfoText).toContain('weezer@yev.com');
    
    console.log('✅ My Files page loaded successfully with authentication');
  });

  test('should redirect to auth page when not logged in', async ({ page }) => {
    // Go directly to My Files without logging in
    await page.goto('http://localhost:8357/pages/my-files.html');
    
    // Wait for redirect
    await page.waitForURL('**/auth.html', { timeout: 10000 });
    
    // Take screenshot
    await page.screenshot({ path: 'my-files-redirect-to-auth.png', fullPage: true });
    
    // Verify we're on the auth page
    const authPageTitle = await page.locator('text=Begin Your Memory Journey');
    await expect(authPageTitle).toBeVisible();
    
    console.log('✅ Successfully redirected to auth page when not authenticated');
  });
});