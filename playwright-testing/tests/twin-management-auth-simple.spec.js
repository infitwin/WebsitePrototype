const { test, expect } = require('@playwright/test');

test.describe('Twin Management Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8357/pages/twin-management.html');
    await page.waitForLoadState('networkidle');
    // Give extra time for navigation to load
    await page.waitForTimeout(3000);
  });

  test('should have user authentication elements', async ({ page }) => {
    // Check for logout button
    const logoutCount = await page.locator('text=Logout').count();
    expect(logoutCount).toBeGreaterThan(0);

    // Check for user menu
    const userMenuCount = await page.locator('.user-menu').count();
    expect(userMenuCount).toBeGreaterThan(0);

    // Check for username display
    const usernameCount = await page.locator('.username').count();
    expect(usernameCount).toBeGreaterThan(0);
  });

  test('should have navigation sidebar', async ({ page }) => {
    // Check for key navigation items
    const dashboardCount = await page.locator('text=Dashboard').count();
    expect(dashboardCount).toBeGreaterThan(0);

    const settingsCount = await page.locator('text=Settings').count();
    expect(settingsCount).toBeGreaterThan(0);
  });
});