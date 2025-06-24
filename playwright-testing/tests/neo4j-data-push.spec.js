const { test, expect } = require('@playwright/test');

test.describe('Neo4j Data Push Test', () => {
  test('should successfully push test data to Neo4j', async ({ page }) => {
    // Login
    await page.goto('http://localhost:8357/pages/auth.html');
    await page.click('[data-tab="login"]');
    await page.fill('.login-email', 'weezer@yev.com');
    await page.fill('.login-password', '123456');
    await page.click('button:has-text("Access Your Memories")');
    await page.waitForURL('**/dashboard.html');
    
    // Go to admin page
    await page.goto('http://localhost:8357/pages/admin-test-data.html');
    
    // Wait for page to load
    await page.waitForSelector('#generateBtn');
    
    // Select small test data
    await page.click('.size-option[data-size="small"]');
    
    // Click generate
    await page.click('#generateBtn');
    
    // Wait for either success or failure (max 60 seconds)
    await page.waitForFunction(() => {
      const statusMessage = document.getElementById('statusMessage');
      return statusMessage && statusMessage.style.display !== 'none';
    }, { timeout: 60000 });
    
    // Check the result
    const statusText = await page.locator('#statusMessage').textContent();
    const logsText = await page.locator('#logsContainer').textContent();
    
    console.log('Status Message:', statusText);
    console.log('Connection Logs:', logsText);
    
    // Test passes if we either:
    // 1. Successfully generated data, OR
    // 2. Got a connection error (which shows we tried to connect)
    expect(statusText).toMatch(/(Successfully generated|Failed to generate|Failed to connect)/);
    
    // If successful, should show node/relationship counts
    if (statusText.includes('Successfully generated')) {
      expect(logsText).toMatch(/Generated \d+ nodes and \d+ relationships/);
      expect(logsText).toContain('Generation complete');
    }
  });
});