const { test, expect } = require('@playwright/test');

test('Quick Firebase Test', async ({ page }) => {
  // Enable console logging
  page.on('console', msg => {
    if (msg.text().includes('getUserFiles') || msg.text().includes('files')) {
      console.log(`[${msg.type()}] ${msg.text()}`);
    }
  });

  // Login first
  await page.goto('http://localhost:8357/pages/auth.html');
  await page.click('[data-tab="login"]');
  await page.fill('.login-email', 'weezer@yev.com');
  await page.fill('.login-password', '123456');
  await page.click('button:has-text("Access Your Memories")');
  
  // Wait for navigation
  await page.waitForURL('**/dashboard.html');
  
  // Go to My Files page
  await page.goto('http://localhost:8357/pages/my-files.html');
  
  // Wait for page to fully load
  await page.waitForTimeout(5000);
  
  // Check what's visible
  const fileCount = await page.locator('.file-grid-item, .file-list-item').count();
  console.log('\n=== RESULTS ===');
  console.log('File count found:', fileCount);
  
  const emptyState = await page.locator('#emptyState').isVisible();
  console.log('Empty state visible:', emptyState);
  
  if (emptyState) {
    const emptyText = await page.locator('#emptyState').textContent();
    console.log('Empty state text:', emptyText);
  }
  
  // Take screenshot
  await page.screenshot({ path: 'playwright-testing/quick-firebase-test.png', fullPage: true });
});