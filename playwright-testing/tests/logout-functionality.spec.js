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
    
    // Click the logout button in sidebar footer
    await page.click('.sidebar-footer .logout-item');
    
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
    
    // Wait for dropdown to have 'show' class
    await page.waitForSelector('#userDropdownMenu.show', { state: 'visible' });
    
    // Get dropdown content
    const dropdownContent = await page.locator('#userDropdownMenu').textContent();
    
    // Check that there's no logout option in the dropdown
    expect(dropdownContent).not.toContain('Logout');
    
    // Check that Settings option is still there
    expect(dropdownContent).toContain('Settings');
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
      
      // Check that sidebar logout button exists (in footer section)
      const logoutButton = page.locator('.sidebar-footer .logout-item');
      await expect(logoutButton).toBeVisible();
      
      // Verify it has the logout icon and text
      await expect(logoutButton).toContainText('🚪');
    }
  });
});