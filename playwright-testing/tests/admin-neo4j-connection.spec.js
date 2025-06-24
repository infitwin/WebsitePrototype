const { test, expect } = require('@playwright/test');

test.describe('Admin Test Data Generator', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('http://localhost:8357/pages/auth.html');
    await page.click('[data-tab="login"]');
    await page.fill('.login-email', 'weezer@yev.com');
    await page.fill('.login-password', '123456');
    await page.click('button:has-text("Access Your Memories")');
    await page.waitForURL('**/dashboard.html');
    
    // Navigate to admin page
    await page.goto('http://localhost:8357/pages/admin-test-data.html');
    await page.waitForLoadState('networkidle');
  });

  test('should load admin page and show user info', async ({ page }) => {
    // Check that admin page loads
    await expect(page.locator('h1:has-text("Admin - Test Data Generator")')).toBeVisible();
    
    // Check that user info is populated
    await expect(page.locator('#currentUser')).toContainText('weezer@yev.com');
    await expect(page.locator('#currentTwinId')).toContainText('-1');
    
    // Check that environment shows Development
    await expect(page.locator('#environment')).toContainText('Development');
  });

  test('should connect to Neo4j and generate small test data', async ({ page }) => {
    // Select small graph size
    await page.click('.size-option[data-size="small"]');
    
    // Verify selection
    await expect(page.locator('.size-option[data-size="small"]')).toHaveClass(/selected/);
    
    // Check that generate button is enabled
    await expect(page.locator('#generateBtn')).toBeEnabled();
    
    // Click generate and wait for completion
    await page.click('#generateBtn');
    
    // Wait for generation to complete (max 30 seconds)
    await page.waitForFunction(() => {
      const statusMessage = document.getElementById('statusMessage');
      return statusMessage && 
             statusMessage.style.display !== 'none' &&
             (statusMessage.textContent.includes('Successfully generated') ||
              statusMessage.textContent.includes('Failed to generate'));
    }, { timeout: 30000 });
    
    // Check for success message
    const statusMessage = page.locator('#statusMessage');
    await expect(statusMessage).toContainText('Successfully generated');
    
    // Check logs for connection success
    const logs = page.locator('#logsContainer');
    await expect(logs).toContainText('Neo4j connection established');
    await expect(logs).toContainText('Generation complete');
  });

  test('should show Neo4j connection details in logs', async ({ page }) => {
    // Select small graph size
    await page.click('.size-option[data-size="small"]');
    
    // Start generation
    await page.click('#generateBtn');
    
    // Wait for connection attempt
    await page.waitForFunction(() => {
      const logs = document.getElementById('logsContainer');
      return logs && logs.textContent.includes('Connecting to Neo4j');
    }, { timeout: 10000 });
    
    // Check connection logs
    const logs = page.locator('#logsContainer');
    await expect(logs).toContainText('URI: neo4j://80dc1193.databases.neo4j.io');
    await expect(logs).toContainText('Username: neo4j');
  });

  test('should handle clear data functionality', async ({ page }) => {
    // Click clear data button
    await page.click('#clearBtn');
    
    // Handle confirmation dialog
    page.on('dialog', async dialog => {
      expect(dialog.message()).toContain('Are you sure you want to clear ALL test data?');
      await dialog.accept();
    });
    
    // Wait for clear operation to complete
    await page.waitForFunction(() => {
      const statusMessage = document.getElementById('statusMessage');
      return statusMessage && 
             statusMessage.style.display !== 'none' &&
             (statusMessage.textContent.includes('Successfully cleared') ||
              statusMessage.textContent.includes('Failed to clear'));
    }, { timeout: 30000 });
    
    // Check for success or connection message
    const statusMessage = page.locator('#statusMessage');
    const statusText = await statusMessage.textContent();
    expect(statusText).toMatch(/(Successfully cleared|Failed to connect)/);
  });

  test('should show progress during generation', async ({ page }) => {
    // Select medium graph for longer operation
    await page.click('.size-option[data-size="medium"]');
    await page.click('#generateBtn');
    
    // Check that progress container appears
    await expect(page.locator('#progressContainer')).toBeVisible();
    
    // Check that progress bar shows some progress
    await page.waitForFunction(() => {
      const progressFill = document.getElementById('progressFill');
      return progressFill && progressFill.style.width !== '0%';
    }, { timeout: 10000 });
    
    // Check progress text updates
    const progressText = page.locator('#progressText');
    await expect(progressText).not.toContainText('Initializing...');
  });

  test('should disable buttons during generation', async ({ page }) => {
    // Select small graph
    await page.click('.size-option[data-size="small"]');
    
    // Verify buttons are enabled initially
    await expect(page.locator('#generateBtn')).toBeEnabled();
    await expect(page.locator('#clearBtn')).toBeEnabled();
    
    // Start generation
    await page.click('#generateBtn');
    
    // Check that buttons are disabled during operation
    await expect(page.locator('#generateBtn')).toBeDisabled();
    await expect(page.locator('#clearBtn')).toBeDisabled();
    
    // Wait for completion
    await page.waitForFunction(() => {
      const statusMessage = document.getElementById('statusMessage');
      return statusMessage && statusMessage.style.display !== 'none';
    }, { timeout: 30000 });
    
    // Check that buttons are re-enabled
    await expect(page.locator('#generateBtn')).toBeEnabled();
    await expect(page.locator('#clearBtn')).toBeEnabled();
  });
});