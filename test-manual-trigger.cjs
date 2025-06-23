const { chromium } = require('playwright');

(async () => {
  console.log('🧪 Testing manual trigger...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500 
  });
  const page = await browser.newPage();

  // Enable console logging
  page.on('console', msg => {
    console.log(`[BROWSER]: ${msg.text()}`);
  });

  // Monitor network requests
  page.on('request', request => {
    if (request.url().includes('process-artifact') || request.url().includes('8080')) {
      console.log(`\n📤 REQUEST: ${request.method()} ${request.url()}`);
      const postData = request.postData();
      if (postData) {
        try {
          const data = JSON.parse(postData);
          console.log(`📦 PARSED DATA:`, data);
          console.log(`✅ Required fields:`, {
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
    await page.waitForTimeout(3000);

    // Manually trigger vectorization
    console.log('\n🔧 Manually triggering vectorization...');
    const result = await page.evaluate(() => {
      // First, check what functions are available
      const vectorizeFuncs = Object.keys(window).filter(key => 
        key.toLowerCase().includes('vectorize')
      );
      console.log('🔍 Available vectorize functions:', vectorizeFuncs);
      
      // Check for files
      const files = window.currentFiles || [];
      console.log('📁 Current files count:', files.length);
      
      if (files.length > 0) {
        const firstFile = files[0];
        console.log('🎯 First file:', {
          id: firstFile.id,
          fileName: firstFile.fileName,
          downloadURL: firstFile.downloadURL,
          fileType: firstFile.fileType
        });
        
        // Try to call the vectorization function
        if (window.vectorizeFiles) {
          console.log('🚀 Calling vectorizeFiles...');
          window.vectorizeFiles([firstFile]);
          return 'vectorizeFiles called';
        } else {
          console.log('❌ vectorizeFiles not found');
          return 'function not found';
        }
      } else {
        return 'no files available';
      }
    });
    
    console.log(`\n📊 Manual trigger result: ${result}`);
    
    // Wait for any network activity
    await page.waitForTimeout(10000);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    console.log('\n🏁 Test complete');
    await browser.close();
  }
})();