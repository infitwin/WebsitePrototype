const { test, expect } = require('@playwright/test');

test.describe('My Files Upload Debugging', () => {
  test('debug missing required fields error', async ({ page }) => {
    // Enable console logging
    page.on('console', msg => {
      console.log(`Browser console: ${msg.text()}`);
    });
    
    // Capture network requests
    const requests = [];
    page.on('request', request => {
      if (request.url().includes('artifact') || request.url().includes('upload')) {
        console.log(`REQUEST: ${request.method()} ${request.url()}`);
        const postData = request.postData();
        if (postData) {
          console.log(`POST DATA: ${postData}`);
        }
        requests.push({
          url: request.url(),
          method: request.method(),
          headers: request.headers(),
          postData: postData
        });
      }
    });
    
    // Capture responses
    page.on('response', response => {
      if (response.url().includes('artifact') || response.url().includes('upload')) {
        console.log(`RESPONSE: ${response.status()} ${response.url()}`);
        response.text().then(text => {
          console.log(`RESPONSE BODY: ${text}`);
        }).catch(() => {});
      }
    });
    
    // Login first
    await page.goto('http://localhost:8357/pages/auth.html');
    await page.click('[data-tab="login"]');
    await page.fill('.login-email', 'weezer@yev.com');
    await page.fill('.login-password', '123456');
    await page.click('button:has-text("Access Your Memories")');
    await page.waitForURL('**/dashboard.html');
    
    // Navigate to My Files
    await page.goto('http://localhost:8357/pages/my-files.html');
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of initial state
    await page.screenshot({ path: 'debug-upload-initial.png', fullPage: true });
    
    // Inject debugging code to inspect upload function
    await page.evaluate(() => {
      // Intercept the upload function to see what data is being sent
      const originalUpload = window.uploadFile;
      if (originalUpload) {
        window.uploadFile = function(...args) {
          console.log('🔍 uploadFile called with args:', args);
          return originalUpload.apply(this, args);
        };
      }
      
      // Also check if any upload handlers exist
      console.log('🔍 Available upload functions:', Object.keys(window).filter(key => key.toLowerCase().includes('upload')));
      
      // Look for file input handlers
      const fileInputs = document.querySelectorAll('input[type="file"]');
      console.log('🔍 File inputs found:', fileInputs.length);
      fileInputs.forEach((input, i) => {
        console.log(`🔍 File input ${i}:`, {
          id: input.id,
          name: input.name,
          accept: input.accept,
          multiple: input.multiple
        });
      });
      
      // Check for any event listeners on file inputs
      fileInputs.forEach((input, i) => {
        const listeners = getEventListeners ? getEventListeners(input) : 'getEventListeners not available';
        console.log(`🔍 File input ${i} listeners:`, listeners);
      });
    });
    
    // Wait a moment for any async loading
    await page.waitForTimeout(2000);
    
    // Try to find and click upload button or file input
    const fileInput = page.locator('input[type="file"]').first();
    const uploadButton = page.locator('button').filter({ hasText: /upload/i }).first();
    
    if (await fileInput.count() > 0) {
      console.log('✅ Found file input');
      
      // Check if test image exists
      const fs = require('fs');
      const testImagePath = '/home/tim/WebsitePrototype/test-files/test-image5.jpg';
      
      if (fs.existsSync(testImagePath)) {
        console.log('✅ Test image exists, attempting upload');
        
        // Upload file and watch for network activity
        await fileInput.setInputFiles(testImagePath);
        
        // Wait for any upload processing
        await page.waitForTimeout(3000);
        
        // Take screenshot after upload attempt
        await page.screenshot({ path: 'debug-upload-after-file-select.png', fullPage: true });
        
      } else {
        console.log('❌ Test image not found at:', testImagePath);
        
        // List available test files
        const testFilesDir = '/home/tim/WebsitePrototype/test-files';
        if (fs.existsSync(testFilesDir)) {
          const files = fs.readdirSync(testFilesDir);
          console.log('📁 Available test files:', files);
          
          // Try with first available image
          const imageFiles = files.filter(f => f.match(/\.(jpg|jpeg|png)$/i));
          if (imageFiles.length > 0) {
            const firstImage = `${testFilesDir}/${imageFiles[0]}`;
            console.log('🔄 Trying with:', firstImage);
            await fileInput.setInputFiles(firstImage);
            await page.waitForTimeout(3000);
          }
        }
      }
    } else {
      console.log('❌ No file input found');
      
      // Look for other upload mechanisms
      await page.evaluate(() => {
        console.log('🔍 Looking for upload buttons...');
        const buttons = Array.from(document.querySelectorAll('button'));
        buttons.forEach(btn => {
          if (btn.textContent.toLowerCase().includes('upload')) {
            console.log('🔍 Found upload button:', btn.textContent, btn.className);
          }
        });
        
        // Check for drag-drop areas
        const dropZones = document.querySelectorAll('[data-drop-zone], .drop-zone, .upload-area');
        console.log('🔍 Drop zones found:', dropZones.length);
      });
    }
    
    // Final screenshot
    await page.screenshot({ path: 'debug-upload-final.png', fullPage: true });
    
    // Print captured requests for analysis
    console.log('\\n📋 CAPTURED REQUESTS:');
    requests.forEach((req, i) => {
      console.log(`\\nRequest ${i + 1}:`);
      console.log(`  URL: ${req.url}`);
      console.log(`  Method: ${req.method}`);
      console.log(`  Headers:`, JSON.stringify(req.headers, null, 2));
      if (req.postData) {
        console.log(`  POST Data: ${req.postData}`);
      }
    });
  });
});