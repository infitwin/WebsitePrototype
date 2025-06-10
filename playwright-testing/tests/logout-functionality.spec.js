const { test, expect } = require('@playwright/test');

// Helper function for login
async function loginUser(page) {
  await page.goto('http://localhost:8357/pages/auth.html');
  await page.click('[data-tab="login"]');
  await page.fill('.login-email', 'weezer@yev.com');
  await page.fill('.login-password', '123456');
  await page.click('button:has-text("Access Your Memories")');
  await page.waitForURL('**/dashboard.html');
}

test.describe('Logout Functionality', () => {
  test('Sidebar logout button should log out user', async ({ page }) => {
    // Login first
    await loginUser(page);
    
    // Verify we're on dashboard
    await expect(page).toHaveURL(/dashboard\.html/);
    
    // Click the logout button in sidebar
    await page.click('.sidebar-nav .logout-item');
    
    // Should redirect to auth page
    await expect(page).toHaveURL(/auth\.html/);
    
    // Verify localStorage is cleared
    const isAuthenticated = await page.evaluate(() => localStorage.getItem('isAuthenticated'));
    expect(isAuthenticated).toBeNull();
  });
  
  test('Dashboard should not have duplicate logout in header', async ({ page }) => {
    // Login first
    await loginUser(page);
    
    // Open user dropdown menu
    await page.click('#userMenuToggle');
    
    // Check that dropdown is visible
    await expect(page.locator('#userDropdownMenu')).toBeVisible();
    
    // Check that there's no logout option in the dropdown
    const logoutInDropdown = await page.locator('#userDropdownMenu').locator('text=Logout').count();
    expect(logoutInDropdown).toBe(0);
    
    // Check that Settings option is still there
    const settingsInDropdown = await page.locator('#userDropdownMenu').locator('text=Settings').count();
    expect(settingsInDropdown).toBe(1);
  });
  
  test('All authenticated pages should have logout in sidebar', async ({ page }) => {
    await loginUser(page);
    
    const authenticatedPages = [
      'dashboard.html',
      'twin-management.html',
      'my-files.html',
      'settings.html',
      'curator.html',
      'interview.html',
      'talk-to-twin.html',
      'interview-transcripts.html'
    ];
    
    for (const pageName of authenticatedPages) {
      await page.goto(`http://localhost:8357/pages/${pageName}`);
      
      // Check that sidebar logout button exists
      const logoutButton = page.locator('.sidebar-nav .logout-item');
      await expect(logoutButton).toBeVisible();
      
      // Verify it has the logout icon and text
      await expect(logoutButton).toContainText('🚪');
    }
  });
});