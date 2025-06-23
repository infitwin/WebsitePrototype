const { test, expect } = require('@playwright/test');

test('Debug vectorization network flow', async ({ page }) => {
  console.log('🎯 Starting vectorization debug test...');
  
  // Capture all console logs
  page.on('console', msg => {
    console.log(`BROWSER: ${msg.text()}`);
  });

  // Capture network requests
  page.on('request', request => {
    if (request.url().includes('process-artifact') || request.url().includes('localhost:8080')) {
      console.log(`🌐 REQUEST: ${request.method()} ${request.url()}`);
      console.log(`🌐 HEADERS: ${JSON.stringify(request.headers())}`);
    }
  });

  page.on('response', response => {
    if (response.url().includes('process-artifact') || response.url().includes('localhost:8080')) {
      console.log(`🌐 RESPONSE: ${response.status()} ${response.url()}`);
    }
  });

  page.on('requestfailed', request => {
    console.log(`🔴 REQUEST FAILED: ${request.url()} - ${request.failure().errorText}`);
  });

  // Navigate and login
  await page.goto('http://localhost:8357/pages/auth.html');
  await page.click('[data-tab="login"]');
  await page.fill('.login-email', 'weezer@yev.com');
  await page.fill('.login-password', '123456');
  await page.click('button:has-text("Access Your Memories")');
  await page.waitForURL('**/my-files.html');

  console.log('✅ Logged in and navigated to My Files');

  // Wait for files to load
  await page.waitForSelector('.file-grid', { timeout: 10000 });
  await page.waitForTimeout(3000);

  // Select first image file
  const firstImage = await page.locator('.file-item').first();
  await firstImage.click();
  console.log('📷 Selected first image');

  // Check if vectorize button exists
  const vectorizeBtn = page.locator('#vectorizeBtn');
  await expect(vectorizeBtn).toBeVisible({ timeout: 5000 });
  console.log('🎯 Vectorize button found');

  // Click vectorize and capture the error
  console.log('🚀 Clicking vectorize button...');
  await vectorizeBtn.click();

  // Wait for the error/response
  await page.waitForTimeout(5000);

  console.log('✅ Test completed - check logs above for network details');
});