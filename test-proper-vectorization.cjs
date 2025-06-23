const { chromium } = require('playwright');

(async () => {
  console.log('🧪 Testing proper vectorization with selected files...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000 
  });
  const page = await browser.newPage();

  // Monitor console logs
  page.on('console', msg => {
    console.log(`[BROWSER]: ${msg.text()}`);
  });

  // Monitor network requests specifically for artifact processor
  page.on('request', request => {
    if (request.url().includes('process-artifact') || request.url().includes(':8080')) {
      console.log(`\n🔥 ARTIFACT REQUEST: ${request.method()} ${request.url()}`);
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
      console.log(`\n📥 ARTIFACT RESPONSE: ${response.status()} ${response.url()}`);
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

    // Go to My Files
    console.log('\n📁 Navigating to My Files...');
    await page.goto('http://localhost:8357/pages/my-files.html');
    await page.waitForTimeout(5000);

    // Properly set up selected files and call handleBatchVectorize
    console.log('\n🚀 Setting up selected files and calling vectorization...');
    const result = await page.evaluate(() => {
      const files = window.currentFiles || [];
      if (files.length === 0) {
        return { error: 'No files found' };
      }
      
      // Find a valid image file with all required fields
      const validFile = files.find(f => 
        f.downloadURL && 
        f.fileType && 
        f.fileType.startsWith('image/') &&
        f.id
      );
      
      if (!validFile) {
        return { error: 'No valid image files found with required fields' };
      }
      
      console.log('🎯 Using file:', validFile.fileName, validFile.id);
      console.log('📋 File details:', {
        id: validFile.id,
        downloadURL: validFile.downloadURL,
        fileType: validFile.fileType
      });
      
      // Set up window.selectedFiles (this is what handleBatchVectorize expects)
      window.selectedFiles = new Set([validFile.id]);
      console.log('✅ Set window.selectedFiles to:', Array.from(window.selectedFiles));
      
      // Now call handleBatchVectorize (it should read from window.selectedFiles)
      if (window.handleBatchVectorize) {
        console.log('🚀 Calling handleBatchVectorize...');
        window.handleBatchVectorize();
        return { 
          success: true, 
          selectedFileId: validFile.id,
          fileName: validFile.fileName
        };
      } else {
        return { error: 'handleBatchVectorize function not found' };
      }
    });
    
    console.log('\n📊 Evaluation result:', JSON.stringify(result, null, 2));
    
    // Wait for network activity 
    console.log('\n⏳ Waiting for API calls...');
    await page.waitForTimeout(15000);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    console.log('\n🏁 Test complete');
    await browser.close();
  }
})();