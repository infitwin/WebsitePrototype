const { chromium } = require('playwright');

(async () => {
  console.log('🧪 Inspecting vectorization function...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000 
  });
  const page = await browser.newPage();

  // Monitor all network requests
  const allRequests = [];
  page.on('request', request => {
    const url = request.url();
    const method = request.method();
    allRequests.push({ method, url, time: new Date().toISOString() });
    
    if (url.includes('8080') || url.includes('process-artifact')) {
      console.log(`\n🔥 ARTIFACT REQUEST: ${method} ${url}`);
      const postData = request.postData();
      if (postData) {
        console.log(`📦 PAYLOAD:`, postData);
      }
    }
  });

  page.on('response', response => {
    if (response.url().includes('8080') || response.url().includes('process-artifact')) {
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

    // Inspect the function and its execution
    console.log('\n🔍 Inspecting function behavior...');
    const functionAnalysis = await page.evaluate(() => {
      const files = window.currentFiles || [];
      if (files.length === 0) {
        return { error: 'No files found' };
      }
      
      const validFile = files.find(f => f.downloadURL && f.fileType);
      if (!validFile) {
        return { error: 'No valid files found' };
      }
      
      // Check if function exists
      const funcExists = typeof window.handleBatchVectorize === 'function';
      if (!funcExists) {
        return { error: 'handleBatchVectorize function not found' };
      }
      
      // Get function source
      const funcSource = window.handleBatchVectorize.toString();
      
      // Try to execute and catch any errors
      try {
        console.log('🚀 About to call handleBatchVectorize...');
        const result = window.handleBatchVectorize([validFile]);
        console.log('✅ Function executed, result:', result);
        
        return {
          success: true,
          fileUsed: {
            id: validFile.id,
            fileName: validFile.fileName,
            downloadURL: validFile.downloadURL,
            fileType: validFile.fileType
          },
          functionExists: true,
          functionSource: funcSource.substring(0, 500) + '...',
          executionResult: result
        };
      } catch (error) {
        console.error('❌ Function execution error:', error);
        return {
          error: 'Function execution failed: ' + error.message,
          functionExists: true,
          functionSource: funcSource.substring(0, 500) + '...'
        };
      }
    });
    
    console.log('\n📊 Function analysis:', JSON.stringify(functionAnalysis, null, 2));
    
    // Wait for any delayed network activity
    console.log('\n⏳ Waiting for network activity...');
    await page.waitForTimeout(10000);
    
    console.log('\n📋 All network requests made:');
    allRequests.forEach((req, i) => {
      console.log(`${i + 1}. ${req.method} ${req.url}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    console.log('\n🏁 Test complete');
    await browser.close();
  }
})();