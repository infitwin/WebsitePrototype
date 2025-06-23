const { chromium } = require('playwright');

(async () => {
  console.log('🧪 Testing direct vectorization...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000 
  });
  const page = await browser.newPage();

  // Monitor console logs
  page.on('console', msg => {
    console.log(`[BROWSER]: ${msg.text()}`);
  });

  // Monitor network requests with full details
  page.on('request', request => {
    if (request.url().includes('process-artifact') || request.url().includes(':8080')) {
      console.log(`\n🔥 REQUEST: ${request.method()} ${request.url()}`);
      const postData = request.postData();
      if (postData) {
        try {
          const data = JSON.parse(postData);
          console.log(`📦 PAYLOAD:`, JSON.stringify(data, null, 2));
          console.log(`✅ Required fields check:`, {
            artifact_id: !!data.artifact_id,
            file_url: !!data.file_url,
            mime_type: !!data.mime_type,
            user_id: !!data.user_id
          });
        } catch (e) {
          console.log(`📦 RAW DATA: ${postData}`);
        }
      }
    }
  });

  page.on('response', response => {
    if (response.url().includes('process-artifact') || response.url().includes(':8080')) {
      console.log(`\n📥 RESPONSE: ${response.status()} ${response.url()}`);
      response.text().then(text => {
        console.log(`📋 RESPONSE BODY:`, text);
      }).catch(() => {});
    }
  });

  try {
    // Login
    console.log('\n🔐 Logging in...');
    await page.goto('http://localhost:8357/pages/auth.html');
    await page.click('[data-tab="login"]');
    await page.fill('.login-email', 'weezer@yev.com');
    await page.fill('.login-password', '123456');
    await page.click('button:has-text("Access Your Memories")');
    await page.waitForURL('**/dashboard.html');

    // Go to My Files and wait for full load
    console.log('\n📁 Navigating to My Files...');
    await page.goto('http://localhost:8357/pages/my-files.html');
    await page.waitForTimeout(5000); // Extra time for file loading

    // Directly call the vectorization function
    console.log('\n🚀 Direct vectorization call...');
    const result = await page.evaluate(() => {
      // Get first file that has required data
      const files = window.currentFiles || [];
      if (files.length === 0) {
        return 'No files found';
      }
      
      const validFile = files.find(f => f.downloadURL && f.fileType);
      if (!validFile) {
        return 'No valid files with downloadURL found';
      }
      
      console.log('🎯 Using file:', validFile.fileName, validFile.id);
      console.log('🔗 File URL:', validFile.downloadURL);
      console.log('📄 File type:', validFile.fileType);
      
      // Call handleBatchVectorize if available
      if (window.handleBatchVectorize) {
        console.log('✅ Calling handleBatchVectorize...');
        window.handleBatchVectorize([validFile]);
        return 'handleBatchVectorize called';
      } else {
        return 'handleBatchVectorize not found';
      }
    });
    
    console.log(`\n📊 Evaluation result: ${result}`);
    
    // Wait for any network activity
    console.log('\n⏳ Waiting for network activity...');
    await page.waitForTimeout(10000);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    console.log('\n🏁 Test complete');
    await browser.close();
  }
})();