const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Enable console logging for API calls
  page.on('console', msg => {
    if (msg.text().includes('API') || msg.text().includes('Response') || msg.text().includes('Processing file') || msg.text().includes('faces')) {
      console.log('🔍 CONSOLE:', msg.text());
    }
  });

  // Login
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

  console.log('🔍 Testing vectorization with corrected API format...');
  
  // Select an image file for vectorization
  const imageCards = await page.locator('.file-card').filter({ hasText: 'jpg' }).first();
  if (await imageCards.count() > 0) {
    await imageCards.click();
    console.log('✅ Selected an image file');
    
    // Wait for batch actions to appear
    await page.waitForTimeout(1000);
    
    // Click vectorize button
    const vectorizeBtn = await page.locator('#vectorizeBtn');
    if (await vectorizeBtn.count() > 0) {
      console.log('🚀 Clicking vectorize button...');
      await vectorizeBtn.click();
      
      // Wait for API call to complete
      await page.waitForTimeout(10000);
      console.log('✅ Vectorization attempt completed - check console logs');
    } else {
      console.log('❌ Vectorize button not found');
    }
  } else {
    console.log('❌ No image files found');
  }
  
  await browser.close();
})();