const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Monitor API calls
  page.on('request', request => {
    if (request.url().includes('artifact-processor')) {
      console.log('🌐 API REQUEST:', request.url());
      console.log('📤 PAYLOAD:', request.postData());
    }
  });

  page.on('response', async response => {
    if (response.url().includes('artifact-processor')) {
      console.log('📥 API RESPONSE STATUS:', response.status());
      const body = await response.text();
      console.log('📥 RESPONSE BODY:', body);
    }
  });

  // Monitor console for vectorization logs
  page.on('console', msg => {
    if (msg.text().includes('Processing file') || msg.text().includes('faces') || msg.text().includes('API') || msg.text().includes('Response')) {
      console.log('🔍 CONSOLE:', msg.text());
    }
  });

  console.log('🔐 Step 1: Login');
  await page.goto('http://localhost:8357/pages/auth.html');
  await page.click('[data-tab="login"]');
  await page.fill('.login-email', 'weezer@yev.com');
  await page.fill('.login-password', '123456');
  await page.click('button:has-text("Access Your Memories")');
  await page.waitForNavigation();
  
  console.log('📁 Step 2: Go to My Files');
  await page.goto('http://localhost:8357/pages/my-files.html');
  await page.waitForSelector('.file-card', { timeout: 10000 });
  await page.waitForTimeout(3000);

  console.log('🖼️ Step 3: Select a photo');
  // Find an image file
  const imageCard = await page.locator('.file-card').filter({ hasText: /\.(jpg|jpeg|png)/i }).first();
  const fileName = await imageCard.locator('.file-name').textContent();
  console.log(`   Selected: ${fileName}`);
  
  // Check the checkbox to select it
  await imageCard.locator('input[type="checkbox"]').check();
  await page.waitForTimeout(1000);
  
  console.log('🚀 Step 4: Press vectorization button');
  const vectorizeBtn = await page.locator('#vectorizeBtn');
  await vectorizeBtn.click();
  
  console.log('⏳ Step 5: Wait for vectorization to complete');
  // Wait for the API call and response
  await page.waitForTimeout(15000);
  
  console.log('👀 Step 6: Check if faces appear in the UI');
  // Refresh the page to see if faces were added
  await page.reload();
  await page.waitForSelector('.file-card', { timeout: 10000 });
  await page.waitForTimeout(3000);
  
  // Look for face indicators on the selected file
  const updatedCard = await page.locator('.file-card').filter({ hasText: fileName }).first();
  const faceIndicator = await updatedCard.locator('.face-indicator');
  
  if (await faceIndicator.count() > 0) {
    const faceText = await faceIndicator.textContent();
    console.log('✅ SUCCESS: Face indicator found:', faceText);
    
    // Click on face indicator to see extracted faces
    console.log('🔍 Step 7: Test face extraction display');
    await faceIndicator.click();
    await page.waitForTimeout(3000);
    
    // Check if modal shows real faces
    const faceImages = await page.locator('#facesModalGrid .face-thumb').count();
    console.log(`👤 Found ${faceImages} face thumbnails in modal`);
    
    // Take screenshot
    await page.screenshot({ path: 'vectorization-success.png', fullPage: true });
    console.log('📸 Screenshot saved: vectorization-success.png');
    
  } else {
    console.log('❌ FAILED: No face indicator found after vectorization');
    await page.screenshot({ path: 'vectorization-failed.png', fullPage: true });
    console.log('📸 Screenshot saved: vectorization-failed.png');
  }
  
  console.log('🏁 COMPLETE WORKFLOW TEST FINISHED');
  await browser.close();
})();