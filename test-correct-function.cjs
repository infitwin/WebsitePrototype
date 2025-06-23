const { chromium } = require('playwright');

(async () => {
  console.log('🧪 Testing correct vectorization function...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500 
  });
  const page = await browser.newPage();

  // Monitor network requests
  page.on('request', request => {
    if (request.url().includes('process-artifact') || request.url().includes('8080')) {
      console.log(`\n📤 REQUEST: ${request.method()} ${request.url()}`);
      const postData = request.postData();
      if (postData) {
        try {
          const data = JSON.parse(postData);
          console.log(`📦 PARSED DATA:`, data);
          console.log(`✅ Required fields check:`, {
            file_url: !!data.file_url,
            mime_type: !!data.mime_type,
            artifact_id: !!data.artifact_id,
            user_id: !!data.user_id
          });
        } catch (e) {
          console.log(`📦 RAW DATA: ${postData.substring(0, 300)}`);
        }
      }
    }
  });

  page.on('response', response => {
    if (response.url().includes('process-artifact') || response.url().includes('8080')) {
      console.log(`\n📥 RESPONSE: ${response.status()} ${response.url()}`);
      response.text().then(text => {
        console.log(`📋 RESPONSE BODY:`, text);
      }).catch(() => {});
    }
  });

  try {
    // Login
    await page.goto('http://localhost:8357/pages/auth.html');
    await page.click('[data-tab="login"]');
    await page.fill('.login-email', 'weezer@yev.com');
    await page.fill('.login-password', '123456');
    await page.click('button:has-text("Access Your Memories")');
    await page.waitForURL('**/dashboard.html');

    // Go to My Files
    await page.goto('http://localhost:8357/pages/my-files.html');
    await page.waitForTimeout(3000);

    // Manually trigger handleBatchVectorize
    console.log('\\n🚀 Triggering handleBatchVectorize...');
    const result = await page.evaluate(() => {
      const files = window.currentFiles || [];
      if (files.length > 0 && window.handleBatchVectorize) {
        const firstFile = files[0];
        console.log('🎯 Processing file:', firstFile.fileName, firstFile.id);
        window.handleBatchVectorize([firstFile]);
        return 'handleBatchVectorize called successfully';
      }
      return 'function not available or no files';
    });
    
    console.log(`📊 Result: ${result}`);
    
    // Wait for network activity
    await page.waitForTimeout(10000);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await browser.close();
  }
})();