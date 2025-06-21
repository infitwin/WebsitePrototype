const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Intercept API calls to see exact payload
  page.on('request', request => {
    if (request.url().includes('artifact-processor')) {
      console.log('🌐 API REQUEST:');
      console.log('   URL:', request.url());
      console.log('   Method:', request.method());
      console.log('   Headers:', JSON.stringify(request.headers(), null, 2));
      console.log('   Body:', request.postData());
    }
  });

  page.on('response', response => {
    if (response.url().includes('artifact-processor')) {
      console.log('📥 API RESPONSE:');
      console.log('   Status:', response.status());
      console.log('   URL:', response.url());
    }
  });

  // Enable console logging
  page.on('console', msg => {
    if (msg.text().includes('API') || msg.text().includes('Processing file') || msg.text().includes('Payload')) {
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

  console.log('🔍 Testing vectorization workflow...');
  
  // Close any open modals first
  const closeButtons = await page.locator('.modal.active .close, .modal.active .modal-close').count();
  if (closeButtons > 0) {
    await page.locator('.modal.active .close, .modal.active .modal-close').first().click();
    await page.waitForTimeout(500);
  }

  // Try selecting files with checkboxes (batch selection)
  const checkboxes = await page.locator('.file-card input[type="checkbox"]');
  const checkboxCount = await checkboxes.count();
  
  if (checkboxCount > 0) {
    console.log(`✅ Found ${checkboxCount} file checkboxes`);
    
    // Select first image file
    for (let i = 0; i < checkboxCount; i++) {
      const card = page.locator('.file-card').nth(i);
      const fileName = await card.locator('.file-name').textContent();
      
      if (fileName.toLowerCase().includes('.jpg') || fileName.toLowerCase().includes('.jpeg')) {
        console.log(`✅ Selecting image: ${fileName}`);
        await card.locator('input[type="checkbox"]').check();
        await page.waitForTimeout(1000);
        
        // Look for batch actions or vectorize button
        const vectorizeBtn = await page.locator('#vectorizeBtn, button:has-text("Vectorize")');
        if (await vectorizeBtn.count() > 0 && await vectorizeBtn.isVisible()) {
          console.log('🚀 Found vectorize button, clicking...');
          await vectorizeBtn.click();
          
          // Wait for API call
          await page.waitForTimeout(10000);
          break;
        } else {
          console.log('❌ Vectorize button not found or not visible');
          // Take screenshot to see current state
          await page.screenshot({ path: 'vectorize-debug.png' });
          console.log('📸 Screenshot saved as vectorize-debug.png');
        }
      }
    }
  } else {
    console.log('❌ No checkboxes found - trying alternative selection method');
    
    // Try the batch actions area
    const batchActions = await page.locator('.batch-actions');
    if (await batchActions.count() > 0) {
      console.log('✅ Found batch actions area');
      await page.screenshot({ path: 'batch-actions-visible.png' });
    }
  }
  
  await browser.close();
})();