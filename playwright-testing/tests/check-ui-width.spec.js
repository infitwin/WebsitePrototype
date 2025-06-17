const { test, expect } = require('@playwright/test');

test('Check My Files UI Width', async ({ page }) => {
  // Go to My Files page (assuming already logged in)
  await page.goto('http://localhost:8357/pages/my-files.html');
  await page.waitForTimeout(3000);
  
  // Take screenshots at different viewport sizes
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.screenshot({ path: 'playwright-testing/my-files-1920.png', fullPage: true });
  
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.screenshot({ path: 'playwright-testing/my-files-1366.png', fullPage: true });
  
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.screenshot({ path: 'playwright-testing/my-files-1024.png', fullPage: true });
  
  // Check container widths
  const mainContent = await page.locator('.symphony-content').boundingBox();
  const filesContainer = await page.locator('.files-container').boundingBox();
  
  console.log('Main content width:', mainContent?.width);
  console.log('Files container width:', filesContainer?.width);
});