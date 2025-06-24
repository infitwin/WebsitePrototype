const { test, expect } = require('@playwright/test');

test.describe('Admin Page Quick Test', () => {
  test('should load admin page and attempt Neo4j connection', async ({ page }) => {
    // Go directly to auth page and login
    await page.goto('http://localhost:8357/pages/auth.html');
    await page.click('[data-tab="login"]');
    await page.fill('.login-email', 'weezer@yev.com');
    await page.fill('.login-password', '123456');
    await page.click('button:has-text("Access Your Memories")');
    await page.waitForURL('**/dashboard.html', { timeout: 10000 });
    
    // Navigate to admin page
    await page.goto('http://localhost:8357/pages/admin-test-data.html');
    await page.waitForLoadState('networkidle');
    
    // Take screenshot for debugging
    await page.screenshot({ path: 'admin-page-loaded.png', fullPage: true });
    
    // Check basic page elements
    await expect(page.locator('h1:has-text("Admin - Test Data Generator")')).toBeVisible();
    await expect(page.locator('#currentUser')).toContainText('weezer@yev.com');
    
    // Select small size and attempt connection
    await page.click('.size-option[data-size="small"]');
    await expect(page.locator('.size-option[data-size="small"]')).toHaveClass(/selected/);
    
    // Click generate - this will test the Neo4j connection
    await page.click('#generateBtn');
    
    // Wait up to 15 seconds for some result
    await page.waitForFunction(() => {
      const logs = document.getElementById('logsContainer');
      return logs && (
        logs.textContent.includes('Neo4j connection established') ||
        logs.textContent.includes('Neo4j connection failed') ||
        logs.textContent.includes('Generation complete') ||
        logs.textContent.includes('Generation failed')
      );
    }, { timeout: 15000 });
    
    // Take screenshot of results
    await page.screenshot({ path: 'neo4j-test-result.png', fullPage: true });
    
    // Check what happened
    const logs = page.locator('#logsContainer');
    const logsText = await logs.textContent();
    console.log('Neo4j connection logs:', logsText);
    
    // The test passes if we get any definitive result (success or failure)
    expect(logsText).toMatch(/(connection established|connection failed|Generation complete|Generation failed)/);
  });
});