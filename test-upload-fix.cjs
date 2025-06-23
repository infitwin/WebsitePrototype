const { chromium } = require('playwright');

(async () => {
  console.log('🧪 Testing upload fix...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500 
  });
  const page = await browser.newPage();

  // Monitor network requests
  const requests = [];
  page.on('request', request => {
    if (request.url().includes('process-artifact')) {
      console.log(`\n📤 ARTIFACT REQUEST: ${request.method()} ${request.url()}`);
      const postData = request.postData();
      if (postData) {
        console.log(`📦 POST DATA:`, JSON.parse(postData));
      }
      requests.push({
        url: request.url(),
        method: request.method(),
        postData: postData
      });
    }
  });

  page.on('response', response => {
    if (response.url().includes('process-artifact')) {
      console.log(`\n📥 ARTIFACT RESPONSE: ${response.status()} ${response.url()}`);
      response.text().then(text => {
        console.log(`📋 RESPONSE:`, text);
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

    // Look for existing files to reprocess
    console.log('\n🔍 Looking for files to reprocess...');
    const files = await page.evaluate(() => {
      return window.currentFiles || [];
    });
    
    console.log(`📊 Found ${files.length} files`);
    
    if (files.length > 0) {
      // Try to trigger reprocessing on the first file
      console.log('\n🔄 Triggering reprocessing...');
      
      // Look for a vectorization button or similar
      const vectorizeButton = await page.locator('button').filter({ hasText: /vectorize|process|reprocess/i }).first();
      
      if (await vectorizeButton.count() > 0) {
        console.log('✅ Found vectorization button, clicking...');
        await vectorizeButton.click();
        
        // Wait for processing
        await page.waitForTimeout(5000);
        
      } else {
        // Try to manually trigger vectorization via console
        console.log('🔧 Manually triggering vectorization...');
        await page.evaluate(() => {
          if (window.vectorizeFiles && window.currentFiles) {
            const firstFile = window.currentFiles[0];
            console.log('🚀 Triggering vectorization for:', firstFile.fileName);
            window.vectorizeFiles([firstFile]);
          }
        });
        
        await page.waitForTimeout(5000);
      }
      
      console.log('\n📋 Captured requests:');
      requests.forEach((req, i) => {
        console.log(`${i + 1}. ${req.method} ${req.url}`);
        if (req.postData) {
          try {
            const data = JSON.parse(req.postData);
            console.log('   Fields:', Object.keys(data));
            console.log('   Required fields check:');
            console.log(`     ✓ file_url: ${!!data.file_url}`);
            console.log(`     ✓ mime_type: ${!!data.mime_type}`);
            console.log(`     ✓ artifact_id: ${!!data.artifact_id}`);
            console.log(`     ✓ user_id: ${!!data.user_id}`);
          } catch (e) {
            console.log('   Raw POST data:', req.postData.substring(0, 200));
          }
        }
      });
      
    } else {
      console.log('❌ No files found to test with');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    console.log('\n🏁 Test complete');
    await page.waitForTimeout(5000);
    await browser.close();
  }
})();