const { chromium } = require('playwright');

(async () => {
  console.log('🧪 Testing with dialog handling...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000 
  });
  const page = await browser.newPage();

  // Handle dialog boxes (confirm/alert)
  page.on('dialog', async dialog => {
    console.log(`📋 DIALOG: ${dialog.type()} - ${dialog.message()}`);
    if (dialog.type() === 'confirm') {
      console.log('✅ Accepting confirmation dialog');
      await dialog.accept();
    } else {
      console.log('ℹ️  Dismissing alert dialog');
      await dialog.dismiss();
    }
  });

  // Monitor API requests
  page.on('request', request => {
    if (request.url().includes('process-artifact') || request.url().includes(':8080')) {
      console.log(`\n🔥 ARTIFACT REQUEST: ${request.method()} ${request.url()}`);
      const postData = request.postData();
      if (postData) {
        try {
          const data = JSON.parse(postData);
          console.log(`📦 PAYLOAD:`, JSON.stringify(data, null, 2));
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

    // Set up and trigger vectorization with quota/dialog handling
    console.log('\n🚀 Setting up with quota mocking...');
    const result = await page.evaluate(async () => {
      try {
        const files = window.currentFiles || [];
        const validFile = files.find(f => 
          f.downloadURL && 
          f.fileType && 
          f.fileType.startsWith('image/') &&
          f.id
        );
        
        if (!validFile) {
          return { error: 'No valid file found' };
        }

        // Mock quota function to prevent quota blocking
        window.getVectorizationQuota = async () => ({
          used: 0,
          limit: 100  // High limit to prevent blocking
        });

        // Set selected files
        window.selectedFiles = new Set([validFile.id]);
        
        console.log('🎯 File selected:', validFile.fileName);
        console.log('📊 Mocked quota to prevent blocking');
        console.log('🚀 Calling handleBatchVectorize...');
        
        // Call the function
        const funcResult = await window.handleBatchVectorize();
        
        return {
          success: true,
          fileName: validFile.fileName,
          fileId: validFile.id,
          functionResult: funcResult
        };
      } catch (error) {
        console.error('Function error:', error);
        return { 
          error: error.message,
          stack: error.stack
        };
      }
    });
    
    console.log('\n📊 Function result:', JSON.stringify(result, null, 2));
    
    // Wait for API calls
    console.log('\n⏳ Waiting for API activity...');
    await page.waitForTimeout(15000);

  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    console.log('\n🏁 Dialog handling test complete');
    await browser.close();
  }
})();