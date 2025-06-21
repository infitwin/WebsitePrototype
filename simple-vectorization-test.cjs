const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true }); // Run headless for simplicity
  const page = await browser.newPage();

  let apiCalled = false;

  // Monitor for the specific API call
  page.on('request', request => {
    if (request.url().includes('artifact-processor')) {
      console.log('🌐 API CALL DETECTED:', request.url());
      console.log('📤 PAYLOAD:', request.postData());
      apiCalled = true;
    }
  });

  page.on('response', response => {
    if (response.url().includes('artifact-processor')) {
      console.log('📥 API RESPONSE:', response.status());
    }
  });

  console.log('🔐 Logging in...');
  await page.goto('http://localhost:8357/pages/auth.html');
  await page.click('[data-tab="login"]');
  await page.fill('.login-email', 'weezer@yev.com');
  await page.fill('.login-password', '123456');
  await page.click('button:has-text("Access Your Memories")');
  await page.waitForNavigation();
  
  console.log('📁 Going to My Files...');
  await page.goto('http://localhost:8357/pages/my-files.html');
  await page.waitForLoadState('networkidle');

  console.log('🚀 Triggering vectorization...');
  
  const result = await page.evaluate(async () => {
    // Select first image file
    const imageCard = Array.from(document.querySelectorAll('.file-card')).find(card => {
      const name = card.querySelector('.file-name')?.textContent;
      return name && name.toLowerCase().includes('.jpg');
    });
    
    if (imageCard) {
      const checkbox = imageCard.querySelector('input[type="checkbox"]');
      if (checkbox) {
        checkbox.checked = true;
        checkbox.dispatchEvent(new Event('change'));
        
        // Wait a moment
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Call vectorization
        if (window.handleBatchVectorize) {
          console.log('📞 Calling handleBatchVectorize...');
          await window.handleBatchVectorize();
          return 'SUCCESS: Vectorization called';
        } else {
          return 'ERROR: Function not found';
        }
      }
    }
    return 'ERROR: No image file found';
  });

  console.log('🔍 Result:', result);
  
  // Wait for potential API call
  await page.waitForTimeout(10000);
  
  if (apiCalled) {
    console.log('✅ API call was made');
  } else {
    console.log('❌ No API call detected');
  }
  
  await browser.close();
})();