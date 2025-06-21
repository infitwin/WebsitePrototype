const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Monitor ALL console output
  page.on('console', msg => {
    console.log('🔍 CONSOLE:', msg.text());
  });

  // Monitor network requests
  page.on('request', request => {
    console.log('🌐 REQUEST:', request.method(), request.url());
    if (request.postData()) {
      console.log('📤 BODY:', request.postData());
    }
  });

  page.on('response', async response => {
    console.log('📥 RESPONSE:', response.status(), response.url());
    if (response.url().includes('artifact-processor')) {
      try {
        const body = await response.text();
        console.log('📥 BODY:', body);
      } catch (e) {
        console.log('Could not read response body');
      }
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

  console.log('\n🚀 === TESTING VECTORIZATION MANUALLY ===');
  
  // Manually call the vectorization function through JavaScript
  const result = await page.evaluate(async () => {
    try {
      console.log('🔍 Manual test: Checking window.selectedFiles...');
      
      // First select a file manually
      const firstImageCard = document.querySelector('.file-card');
      if (firstImageCard) {
        const checkbox = firstImageCard.querySelector('input[type="checkbox"]');
        if (checkbox) {
          checkbox.checked = true;
          checkbox.dispatchEvent(new Event('change'));
          console.log('✅ Manual test: File selected');
        }
      }
      
      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('🔍 Manual test: Current selectedFiles:', window.selectedFiles);
      console.log('🔍 Manual test: Current currentFiles length:', window.currentFiles?.length);
      
      // Try to call handleBatchVectorize directly
      if (typeof handleBatchVectorize === 'function') {
        console.log('🚀 Manual test: Calling handleBatchVectorize...');
        await handleBatchVectorize();
        return 'Vectorization function called';
      } else {
        return 'handleBatchVectorize function not found';
      }
    } catch (error) {
      console.error('❌ Manual test error:', error);
      return 'Error: ' + error.message;
    }
  });

  console.log('🔍 Manual test result:', result);
  
  // Wait for any potential network activity
  await page.waitForTimeout(10000);
  
  console.log('=== MANUAL TEST COMPLETE ===\n');
  
  await browser.close();
})();