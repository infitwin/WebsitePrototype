const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Enable console logging
  page.on('console', msg => {
    if (msg.text().includes('Endpoint') || msg.text().includes('API')) {
      console.log('🔍 CONSOLE:', msg.text());
    }
  });

  // Login first
  await page.goto('http://localhost:8357/pages/auth.html');
  await page.click('[data-tab="login"]');
  await page.fill('.login-email', 'weezer@yev.com');
  await page.fill('.login-password', '123456');
  await page.click('button:has-text("Access Your Memories")');
  await page.waitForNavigation();
  
  // Go to My Files
  await page.goto('http://localhost:8357/pages/my-files.html');
  await page.waitForSelector('.file-card', { timeout: 10000 });
  await page.waitForTimeout(3000);

  console.log('🔍 Testing vectorization endpoint...');
  
  // Try to trigger vectorization (will fail but show endpoint)
  const vectorizeBtn = await page.locator('#vectorizeBtn');
  if (await vectorizeBtn.count() > 0) {
    console.log('⚠️ No vectorize button found - may need to select files first');
  }
  
  // Try to select a file first
  const fileCards = await page.locator('.file-card').count();
  if (fileCards > 0) {
    // Click on first file card to select it
    await page.locator('.file-card').first().click();
    await page.waitForTimeout(500);
    
    // Look for batch actions
    const batchActions = await page.locator('.batch-actions, #vectorizeBtn');
    if (await batchActions.count() > 0) {
      console.log('✅ Found batch actions/vectorize button');
      // Click vectorize to see what endpoint it tries
      await batchActions.click();
      await page.waitForTimeout(2000);
    }
  }
  
  console.log('✅ Check console for endpoint information');
  await browser.close();
})();