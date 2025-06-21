const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Intercept network requests to see the exact payload
  page.on('request', request => {
    if (request.url().includes('artifact-processor')) {
      console.log('🌐 REQUEST URL:', request.url());
      console.log('🌐 REQUEST METHOD:', request.method());
      console.log('🌐 REQUEST HEADERS:', request.headers());
      console.log('🌐 REQUEST BODY:', request.postData());
    }
  });

  page.on('response', response => {
    if (response.url().includes('artifact-processor')) {
      console.log('📥 RESPONSE STATUS:', response.status());
      console.log('📥 RESPONSE URL:', response.url());
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

  console.log('🔍 Intercepting API payload...');
  
  // Select an image file - be more specific about file type
  const fileCards = await page.locator('.file-card').count();
  console.log(`📁 Found ${fileCards} file cards`);
  
  // Look for image files specifically
  for (let i = 0; i < fileCards; i++) {
    const card = page.locator('.file-card').nth(i);
    const fileName = await card.locator('.file-name').textContent();
    
    if (fileName.toLowerCase().includes('.jpg') || fileName.toLowerCase().includes('.jpeg') || fileName.toLowerCase().includes('.png')) {
      console.log(`✅ Selecting image file: ${fileName}`);
      await card.click();
      await page.waitForTimeout(1000);
      
      // Check if batch actions are visible
      const batchActions = await page.locator('.batch-actions');
      if (await batchActions.isVisible()) {
        console.log('✅ Batch actions visible');
        
        // Click vectorize
        const vectorizeBtn = await page.locator('#vectorizeBtn');
        if (await vectorizeBtn.isVisible()) {
          console.log('🚀 Clicking vectorize...');
          await vectorizeBtn.click();
          
          // Wait for the API call
          await page.waitForTimeout(5000);
          break;
        } else {
          console.log('❌ Vectorize button not visible');
        }
      } else {
        console.log('❌ Batch actions not visible');
      }
    }
  }
  
  await browser.close();
})();