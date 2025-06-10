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

test.describe('Dashboard Graph Controls', () => {
  test.beforeEach(async ({ page }) => {
    await loginUser(page);
  });

  test('Graph control buttons should not cause JavaScript errors', async ({ page }) => {
    // Set up console error listener
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Wait for graph to be visible
    await page.waitForSelector('#knowledge-graph', { state: 'visible' });
    
    // Click Center button
    await page.click('button:has-text("Center")');
    await page.waitForTimeout(600); // Wait for animation
    
    // Click Fit button
    await page.click('button:has-text("Fit")');
    await page.waitForTimeout(600); // Wait for animation
    
    // Click Reset button
    await page.click('button:has-text("Reset")');
    await page.waitForTimeout(600); // Wait for animation
    
    // Check that no console errors occurred
    expect(consoleErrors).toHaveLength(0);
  });
  
  test('Graph controls should be visible and clickable', async ({ page }) => {
    // Check that all control buttons exist
    const centerBtn = page.locator('button:has-text("Center")');
    const fitBtn = page.locator('button:has-text("Fit")');
    const resetBtn = page.locator('button:has-text("Reset")');
    
    await expect(centerBtn).toBeVisible();
    await expect(fitBtn).toBeVisible();
    await expect(resetBtn).toBeVisible();
    
    // Verify they're in the graph controls section
    const graphControls = page.locator('.graph-controls');
    await expect(graphControls).toContainText('Center');
    await expect(graphControls).toContainText('Fit');
    await expect(graphControls).toContainText('Reset');
  });
  
  test('Graph should be rendered with nodes and edges', async ({ page }) => {
    // Wait for graph SVG
    await page.waitForSelector('#knowledge-graph', { state: 'visible' });
    
    // Check that nodes are rendered
    const nodes = page.locator('#knowledge-graph g.node');
    await expect(nodes).toHaveCount(7); // Based on the sample data
    
    // Check that edges are rendered
    const edges = page.locator('#knowledge-graph line');
    await expect(edges).toHaveCount(7); // Based on the sample data
    
    // Check graph stats
    const stats = page.locator('#graph-stats');
    await expect(stats).toContainText('Nodes: 7');
    await expect(stats).toContainText('Edges: 7');
  });
});