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

test.describe('Navigation Without Explore', () => {
  test('Navigation should not contain Explore link', async ({ page }) => {
    await loginUser(page);
    
    // Check that Explore link is not in navigation
    const exploreLink = page.locator('.sidebar-nav a[href="explore.html"]');
    await expect(exploreLink).toHaveCount(0);
    
    // Check that there's no data-page="explore"
    const exploreItem = page.locator('[data-page="explore"]');
    await expect(exploreItem).toHaveCount(0);
    
    // Verify other navigation items are still present
    const expectedItems = [
      { page: 'dashboard', text: 'Dashboard' },
      { page: 'twin', text: 'Twin Management' },
      { page: 'interview', text: 'Interview' },
      { page: 'curator', text: 'Curator' },
      { page: 'transcripts', text: 'Transcripts' },
      { page: 'talk', text: 'Talk to Twin' },
      { page: 'files', text: 'My Files' },
      { page: 'settings', text: 'Settings' }
    ];
    
    for (const item of expectedItems) {
      const navItem = page.locator(`[data-page="${item.page}"]`);
      await expect(navItem).toBeVisible();
      await expect(navItem).toContainText(item.text);
    }
  });
  
  test('Curator page should be accessible as memory exploration alternative', async ({ page }) => {
    await loginUser(page);
    
    // Click on Curator link
    await page.click('[data-page="curator"]');
    
    // Verify we're on the curator page
    await expect(page).toHaveURL(/curator\.html/);
    
    // Verify Curator page loaded successfully
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });
});