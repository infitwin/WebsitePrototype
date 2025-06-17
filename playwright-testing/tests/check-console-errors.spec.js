const { test, expect } = require('@playwright/test');

test('Check Console Errors on My Files Page', async ({ page }) => {
  // Capture ALL console messages
  page.on('console', msg => {
    console.log(`[${msg.type()}] ${msg.text()}`);
  });
  
  page.on('pageerror', error => {
    console.error('PAGE ERROR:', error.message);
  });

  // Go directly to My Files (assuming already logged in)
  await page.goto('http://localhost:8357/pages/my-files.html');
  await page.waitForTimeout(3000);
  
  // Check what's in the DOM
  const fileCount = await page.locator('.file-count').textContent();
  console.log('\n=== PAGE STATE ===');
  console.log('File count text:', fileCount);
  
  const hasFiles = await page.locator('.file-grid-item').count();
  console.log('Files in grid:', hasFiles);
  
  // Check if loadFiles was called
  await page.evaluate(() => {
    console.log('Checking if loadFiles exists:', typeof window.loadFiles);
    console.log('Checking if currentFiles exists:', typeof window.currentFiles);
  });
});