const { test, expect } = require('@playwright/test');

test.describe('Debug Vectorization with Local Server', () => {
  test('should inject debugging code and test vectorization flow', async ({ page }) => {
    // Enable detailed logging
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      
      // Color code different log types
      if (type === 'error') {
        console.log(`🔴 BROWSER ERROR: ${text}`);
      } else if (text.includes('🐛') || text.includes('🔧') || text.includes('🔍')) {
        console.log(`💬 DEBUG LOG: ${text}`);
      } else if (text.includes('📤') || text.includes('📡') || text.includes('🚀')) {
        console.log(`🌐 NETWORK LOG: ${text}`);
      } else if (type === 'log') {
        console.log(`📝 BROWSER LOG: ${text}`);
      }
    });

    // Capture network requests
    page.on('request', request => {
      if (request.url().includes('localhost:8080')) {
        console.log(`🌐 REQUEST TO LOCAL SERVER: ${request.method()} ${request.url()}`);
        console.log(`🌐 REQUEST HEADERS:`, request.headers());
      }
    });

    page.on('response', response => {
      if (response.url().includes('localhost:8080')) {
        console.log(`🌐 RESPONSE FROM LOCAL SERVER: ${response.status()} ${response.url()}`);
      }
    });

    // Navigate to My Files
    console.log('🎯 Navigating to My Files page...');
    await page.goto('http://localhost:8357/pages/my-files.html');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Login first
    console.log('🔐 Checking if login is needed...');
    const isAuthPage = await page.url().includes('/auth.html');
    
    if (isAuthPage) {
      console.log('🔑 Logging in...');
      await page.click('[data-tab="login"]');
      await page.fill('.login-email', 'weezer@yev.com');
      await page.fill('.login-password', '123456');
      await page.click('button:has-text("Access Your Memories")');
      await page.waitForURL('**/my-files.html');
    }

    // Wait for My Files page to load
    await page.waitForSelector('.file-grid', { timeout: 10000 });
    console.log('✅ My Files page loaded');

    // Inject additional debugging code
    await page.addInitScript(() => {
      console.log('🔧 INJECTED: Adding enhanced debugging...');
      
      // Override fetch to log all requests
      const originalFetch = window.fetch;
      window.fetch = async function(...args) {
        console.log('🌐 FETCH INTERCEPTED:', args[0], args[1]);
        
        try {
          const response = await originalFetch.apply(this, args);
          console.log('🌐 FETCH RESPONSE:', response.status, response.statusText);
          
          // Log response body for local server calls
          if (args[0].includes('localhost:8080')) {
            const clonedResponse = response.clone();
            const responseText = await clonedResponse.text();
            console.log('🌐 LOCAL SERVER RESPONSE BODY:', responseText);
          }
          
          return response;
        } catch (error) {
          console.log('🔴 FETCH ERROR:', error.message);
          throw error;
        }
      };

      // Override XMLHttpRequest
      const originalXHR = window.XMLHttpRequest;
      window.XMLHttpRequest = function() {
        const xhr = new originalXHR();
        const originalOpen = xhr.open;
        const originalSend = xhr.send;
        
        xhr.open = function(method, url, ...args) {
          console.log('🌐 XHR OPENED:', method, url);
          return originalOpen.apply(this, [method, url, ...args]);
        };
        
        xhr.send = function(data) {
          console.log('🌐 XHR SENDING:', data);
          return originalSend.apply(this, [data]);
        };
        
        return xhr;
      };
    });

    // Wait for files to load and find images
    await page.waitForTimeout(3000);
    
    // Check if files are present
    const fileItems = await page.locator('.file-item').count();
    console.log(`📁 Found ${fileItems} files in the grid`);
    
    if (fileItems === 0) {
      console.log('❌ No files found to test with');
      return;
    }

    // Select the first few image files
    console.log('🖼️ Selecting image files...');
    const imageFiles = await page.locator('.file-item').all();
    let selectedCount = 0;
    
    for (let i = 0; i < Math.min(3, imageFiles.length); i++) {
      const fileItem = imageFiles[i];
      const isImage = await fileItem.locator('[data-file-type^="image"]').count() > 0;
      
      if (isImage) {
        console.log(`📷 Selecting image file ${i + 1}`);
        await fileItem.click();
        selectedCount++;
      }
    }
    
    console.log(`✅ Selected ${selectedCount} image files`);
    
    if (selectedCount === 0) {
      console.log('❌ No image files found to vectorize');
      return;
    }

    // Check if vectorize button is available
    const vectorizeBtn = page.locator('#vectorizeBtn');
    await expect(vectorizeBtn).toBeVisible({ timeout: 5000 });
    
    console.log('🎯 Vectorize button found, clicking...');
    
    // Add listener for Firebase updates
    await page.evaluate(() => {
      console.log('🔧 INJECTED: Setting up Firebase update monitoring...');
      
      // Monitor Firebase writes
      if (window.firebase && window.firebase.firestore) {
        const originalDoc = window.firebase.firestore().doc;
        window.firebase.firestore().doc = function(path) {
          const docRef = originalDoc.call(this, path);
          const originalUpdate = docRef.update;
          const originalSet = docRef.set;
          
          docRef.update = function(data) {
            console.log('🔥 FIREBASE UPDATE:', path, data);
            return originalUpdate.apply(this, arguments);
          };
          
          docRef.set = function(data, options) {
            console.log('🔥 FIREBASE SET:', path, data, options);
            return originalSet.apply(this, arguments);
          };
          
          return docRef;
        };
      }
    });

    // Click vectorize and monitor the entire flow
    console.log('🚀 Clicking vectorize button...');
    await vectorizeBtn.click();

    // Wait for vectorization to start
    await page.waitForTimeout(2000);
    
    // Monitor for completion or errors
    console.log('⏳ Waiting for vectorization to complete...');
    
    // Wait up to 60 seconds for vectorization
    let completed = false;
    let attempts = 0;
    const maxAttempts = 60; // 60 seconds
    
    while (!completed && attempts < maxAttempts) {
      attempts++;
      
      // Check for completion indicators
      const hasError = await page.locator(':has-text("error")').count() > 0;
      const hasSuccess = await page.locator(':has-text("Vectorization completed")').count() > 0;
      const buttonEnabled = await vectorizeBtn.isEnabled();
      
      if (hasError) {
        console.log('❌ Error detected in UI');
        completed = true;
      } else if (hasSuccess) {
        console.log('✅ Success message detected');
        completed = true;
      } else if (buttonEnabled && attempts > 10) {
        console.log('🔄 Button re-enabled, checking if done...');
        completed = true;
      }
      
      if (!completed) {
        await page.waitForTimeout(1000);
      }
    }

    console.log(`⏰ Vectorization monitoring completed after ${attempts} seconds`);

    // Take a screenshot for debugging
    await page.screenshot({ path: 'vectorization-debug-result.png', fullPage: true });
    console.log('📸 Screenshot saved: vectorization-debug-result.png');

    // Final check of what happened
    console.log('🔍 Final status check...');
    
    // Check browser console for any final messages
    await page.evaluate(() => {
      console.log('🔧 FINAL CHECK: Vectorization flow completed');
      console.log('🔧 Local server was:', 'http://localhost:8080/process-artifact');
      console.log('🔧 Check server logs for backend processing details');
    });
  });
});