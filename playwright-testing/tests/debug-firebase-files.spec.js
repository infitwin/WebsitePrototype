const { test, expect } = require('@playwright/test');

test('Debug Firebase Files Loading', async ({ page }) => {
  // Enable console logging
  page.on('console', msg => {
    console.log(`[${msg.type()}] ${msg.text()}`);
  });

  // Login first
  await page.goto('http://localhost:8357/pages/auth.html');
  await page.click('[data-tab="login"]');
  await page.fill('.login-email', 'weezer@yev.com');
  await page.fill('.login-password', '123456');
  await page.click('button:has-text("Access Your Memories")');
  
  // Wait for navigation
  await page.waitForTimeout(2000);
  
  // Go to My Files page
  await page.goto('http://localhost:8357/pages/my-files.html');
  await page.waitForLoadState('networkidle');
  
  // Wait for files to load
  await page.waitForTimeout(3000);
  
  // Check for errors in console
  const fileCount = await page.locator('.file-grid-item, .file-list-item').count();
  console.log('File count found:', fileCount);
  
  // Check what's visible
  const emptyState = await page.locator('#emptyState').isVisible();
  const filesContainer = await page.locator('#filesContainer').isVisible();
  const loadingState = await page.locator('#loadingState').isVisible();
  
  console.log('Empty state visible:', emptyState);
  console.log('Files container visible:', filesContainer);
  console.log('Loading state visible:', loadingState);
  
  // Check file count text
  const fileCountText = await page.locator('.file-count').textContent();
  console.log('File count text:', fileCountText);
  
  // Take screenshot
  await page.screenshot({ path: 'playwright-testing/debug-firebase-files.png', fullPage: true });
});