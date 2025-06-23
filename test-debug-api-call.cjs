const { chromium } = require('playwright');

(async () => {
  console.log('🧪 Debug API call - Extended monitoring...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000 
  });
  const page = await browser.newPage();

  // Monitor ALL console logs for debugging
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    if (type === 'error' || text.includes('error') || text.includes('fail') || text.includes('API') || text.includes('8080')) {
      console.log(`[${type.toUpperCase()}]: ${text}`);
    }
  });

  // Monitor all requests and responses
  let requestCount = 0;
  page.on('request', request => {
    requestCount++;
    const url = request.url();
    if (url.includes('8080') || url.includes('process-artifact') || url.includes('localhost')) {
      console.log(`\n🔥 REQUEST #${requestCount}: ${request.method()} ${url}`);
      if (request.postData()) {
        console.log(`📦 POST DATA:`, request.postData());
      }
    }
  });

  page.on('response', response => {
    const url = response.url();
    if (url.includes('8080') || url.includes('process-artifact') || url.includes('localhost')) {
      console.log(`\n📥 RESPONSE: ${response.status()} ${url}`);
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

    // Add error logging and call the function
    console.log('\n🚀 Setting up function with error logging...');
    const result = await page.evaluate(async () => {
      // Add global error catching
      const originalError = console.error;
      const errors = [];
      console.error = (...args) => {
        errors.push(args.join(' '));
        originalError.apply(console, args);
      };

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

        // Set selected files
        window.selectedFiles = new Set([validFile.id]);
        
        console.log('🎯 About to call handleBatchVectorize for:', validFile.fileName);
        console.log('📋 Selected files:', Array.from(window.selectedFiles));
        
        // Call the function and wait a bit
        if (window.handleBatchVectorize) {
          const funcResult = await window.handleBatchVectorize();
          console.log('✅ Function returned:', funcResult);
          
          // Wait a bit more for async operations
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          return {
            success: true,
            fileName: validFile.fileName,
            fileId: validFile.id,
            errors: errors,
            functionResult: funcResult
          };
        } else {
          return { error: 'Function not found' };
        }
      } catch (error) {
        console.error('Evaluation error:', error);
        return { 
          error: error.message,
          stack: error.stack,
          errors: errors
        };
      }
    });
    
    console.log('\n📊 Detailed result:', JSON.stringify(result, null, 2));
    
    // Wait longer for network activity
    console.log('\n⏳ Extended wait for network activity...');
    await page.waitForTimeout(20000);
    
    console.log(`\n📋 Total requests made: ${requestCount}`);

  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    console.log('\n🏁 Extended debug test complete');
    await browser.close();
  }
})();