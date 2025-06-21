const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Detailed network and console monitoring
  page.on('request', request => {
    if (request.url().includes('artifact-processor') || request.url().includes('process-image')) {
      console.log('\n🌐 === API REQUEST ===');
      console.log('URL:', request.url());
      console.log('Method:', request.method());
      console.log('Headers:', JSON.stringify(request.headers(), null, 2));
      const body = request.postData();
      if (body) {
        try {
          const parsed = JSON.parse(body);
          console.log('Body (parsed):', JSON.stringify(parsed, null, 2));
        } catch (e) {
          console.log('Body (raw):', body);
        }
      }
      console.log('===================\n');
    }
  });

  page.on('response', async response => {
    if (response.url().includes('artifact-processor') || response.url().includes('process-image')) {
      console.log('\n📥 === API RESPONSE ===');
      console.log('Status:', response.status());
      console.log('Status Text:', response.statusText());
      console.log('URL:', response.url());
      try {
        const responseBody = await response.text();
        console.log('Response Body:', responseBody);
      } catch (e) {
        console.log('Could not read response body:', e.message);
      }
      console.log('===================\n');
    }
  });

  page.on('console', msg => {
    console.log('🔍 PAGE:', msg.text());
  });

  // Login and navigate
  console.log('🔐 Logging in...');
  await page.goto('http://localhost:8357/pages/auth.html');
  await page.click('[data-tab="login"]');
  await page.fill('.login-email', 'weezer@yev.com');
  await page.fill('.login-password', '123456');
  await page.click('button:has-text("Access Your Memories")');
  await page.waitForNavigation();
  
  console.log('📁 Going to My Files...');
  await page.goto('http://localhost:8357/pages/my-files.html');
  await page.waitForSelector('.file-card', { timeout: 10000 });
  await page.waitForTimeout(3000);

  console.log('🔍 Starting vectorization test...');
  
  // Select an image file
  const firstImageCard = await page.locator('.file-card').filter({ hasText: /\.(jpg|jpeg|png)/i }).first();
  if (await firstImageCard.count() > 0) {
    const fileName = await firstImageCard.locator('.file-name').textContent();
    console.log(`✅ Selecting image: ${fileName}`);
    
    // Check the checkbox
    await firstImageCard.locator('input[type="checkbox"]').check();
    await page.waitForTimeout(1000);
    
    // Click vectorize
    const vectorizeBtn = await page.locator('#vectorizeBtn');
    if (await vectorizeBtn.isVisible()) {
      console.log('🚀 Clicking vectorize button...');
      await vectorizeBtn.click();
      
      // Wait longer for the API call to complete
      console.log('⏳ Waiting for API call to complete...');
      await page.waitForTimeout(15000);
      
      console.log('✅ Test completed - check logs above for API details');
    } else {
      console.log('❌ Vectorize button not visible');
    }
  } else {
    console.log('❌ No image files found');
  }
  
  await browser.close();
})();