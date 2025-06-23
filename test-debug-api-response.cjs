const { chromium } = require('playwright');

(async () => {
  console.log('🧪 Debug API response handling...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000 
  });
  const page = await browser.newPage();

  // Handle dialogs
  page.on('dialog', async dialog => {
    console.log(`📋 DIALOG: ${dialog.message()}`);
    if (dialog.type() === 'confirm') {
      await dialog.accept();
    }
  });

  // Monitor ALL console logs
  page.on('console', msg => {
    console.log(`[BROWSER]: ${msg.text()}`);
  });

  // Monitor requests with detailed logging
  page.on('request', request => {
    if (request.url().includes('process-artifact')) {
      console.log(`\n🔥 REQUEST: ${request.method()} ${request.url()}`);
      console.log(`🔗 Headers:`, request.headers());
      const postData = request.postData();
      if (postData) {
        console.log(`📦 POST DATA LENGTH: ${postData.length}`);
        try {
          const data = JSON.parse(postData);
          console.log(`📦 PAYLOAD FIELDS:`, Object.keys(data));
        } catch (e) {
          console.log(`📦 POST DATA: ${postData.substring(0, 200)}...`);
        }
      }
    }
  });

  // Monitor responses with detailed logging
  page.on('response', async response => {
    if (response.url().includes('process-artifact')) {
      console.log(`\n📥 RESPONSE: ${response.status()} ${response.statusText()}`);
      console.log(`📥 Response headers:`, response.headers());
      
      try {
        const text = await response.text();
        console.log(`📥 Response size: ${text.length} chars`);
        
        if (text.length > 0) {
          try {
            const json = JSON.parse(text);
            console.log(`📥 JSON parsed successfully`);
            console.log(`📥 JSON keys:`, Object.keys(json));
            
            if (json.result?.data?.analysis?.faces) {
              console.log(`📥 FACES FOUND: ${json.result.data.analysis.faces.length}`);
              console.log(`📥 First face:`, json.result.data.analysis.faces[0]);
            } else {
              console.log(`📥 NO FACES in response structure`);
              console.log(`📥 Response structure:`, JSON.stringify(json, null, 2).substring(0, 500));
            }
          } catch (parseError) {
            console.log(`📥 JSON parse failed:`, parseError.message);
            console.log(`📥 Raw text:`, text.substring(0, 300));
          }
        } else {
          console.log(`📥 Empty response body`);
        }
      } catch (textError) {
        console.log(`📥 Failed to read response text:`, textError.message);
      }
    }
  });

  // Monitor page errors
  page.on('pageerror', error => {
    console.log(`❌ PAGE ERROR: ${error.message}`);
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

    // Trigger processing on a file with no faces
    console.log('\n🚀 Processing a file to debug API response...');
    const result = await page.evaluate(() => {
      // Find an unprocessed file
      const files = window.currentFiles || [];
      const unprocessedFile = files.find(f => 
        f.fileType?.startsWith('image/') && 
        f.downloadURL && 
        (!f.faceCount || f.faceCount === 0)
      );
      
      if (!unprocessedFile) {
        return { error: 'No unprocessed file found' };
      }

      // Mock quota
      window.getVectorizationQuota = async () => ({ used: 0, limit: 100 });

      // Select and process
      window.selectedFiles = new Set([unprocessedFile.id]);
      
      console.log('🎯 Processing:', unprocessedFile.fileName);
      
      // Call the function
      window.handleBatchVectorize();
      
      return {
        success: true,
        fileName: unprocessedFile.fileName,
        fileId: unprocessedFile.id
      };
    });
    
    console.log('\n📊 Trigger result:', JSON.stringify(result, null, 2));
    
    // Wait longer for detailed response analysis
    console.log('\n⏳ Waiting for detailed API response analysis...');
    await page.waitForTimeout(15000);

  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    console.log('\n🏁 API response debug complete');
    await browser.close();
  }
})();