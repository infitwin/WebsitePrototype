const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Monitor ALL console output during vectorization
  page.on('console', msg => {
    const text = msg.text();
    // Filter for vectorization-related messages
    if (text.includes('vectoriz') || text.includes('Processing file') || text.includes('API') || 
        text.includes('Payload') || text.includes('Response') || text.includes('Error')) {
      console.log('🔍 CONSOLE:', text);
    }
  });

  // Monitor network requests
  page.on('request', request => {
    if (request.url().includes('artifact-processor') || request.url().includes('process')) {
      console.log('\n🌐 REQUEST:', request.url());
      console.log('Body:', request.postData());
    }
  });

  // Login and navigate
  await page.goto('http://localhost:8357/pages/auth.html');
  await page.click('[data-tab="login"]');
  await page.fill('.login-email', 'weezer@yev.com');
  await page.fill('.login-password', '123456');
  await page.click('button:has-text("Access Your Memories")');
  await page.waitForNavigation();
  
  await page.goto('http://localhost:8357/pages/my-files.html');
  await page.waitForSelector('.file-card', { timeout: 10000 });
  await page.waitForTimeout(3000);

  console.log('\n🚀 === STARTING VECTORIZATION TEST ===');
  
  // Select file with checkbox
  const firstFile = await page.locator('.file-card').filter({ hasText: /\.(jpg|jpeg|png)/i }).first();
  const fileName = await firstFile.locator('.file-name').textContent();
  console.log(`📁 Selecting file: ${fileName}`);
  
  await firstFile.locator('input[type="checkbox"]').check();
  await page.waitForTimeout(1000);
  
  // Check if vectorize button is visible and enabled
  const vectorizeBtn = await page.locator('#vectorizeBtn');
  const isVisible = await vectorizeBtn.isVisible();
  const isEnabled = await vectorizeBtn.isEnabled();
  
  console.log(`🔘 Vectorize button - Visible: ${isVisible}, Enabled: ${isEnabled}`);
  
  if (isVisible && isEnabled) {
    console.log('🚀 Clicking vectorize button...');
    
    // Click and monitor the immediate response
    await vectorizeBtn.click();
    
    // Wait and check for any changes
    console.log('⏳ Waiting for vectorization process...');
    await page.waitForTimeout(10000);
    
    // Check if any notifications appeared
    const notifications = await page.locator('.notification, .toast, .alert').count();
    if (notifications > 0) {
      const notificationText = await page.locator('.notification, .toast, .alert').first().textContent();
      console.log('📢 Notification:', notificationText);
    }
  } else {
    console.log('❌ Cannot click vectorize button');
  }
  
  console.log('=== VECTORIZATION TEST COMPLETE ===\n');
  
  await browser.close();
})();