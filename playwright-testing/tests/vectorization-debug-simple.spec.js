const { test, expect } = require('@playwright/test');
const path = require('path');

test.describe('Vectorization Debug - Simplified', () => {
  test('Upload and vectorize image with debugging', async ({ page }) => {
    // Set up comprehensive logging
    const logs = {
      console: [],
      requests: [],
      responses: [],
      errors: []
    };

    // Console logging
    page.on('console', msg => {
      logs.console.push({
        type: msg.type(),
        text: msg.text(),
        time: new Date().toISOString()
      });
      if (msg.type() === 'error') {
        console.log('[CONSOLE ERROR]', msg.text());
      }
    });

    // Network logging
    page.on('request', request => {
      if (request.url().includes('vectorize') || 
          request.url().includes('face') ||
          request.url().includes('upload')) {
        logs.requests.push({
          url: request.url(),
          method: request.method(),
          time: new Date().toISOString()
        });
        console.log(`[API REQUEST] ${request.method()} ${request.url()}`);
      }
    });

    page.on('response', response => {
      if (response.url().includes('vectorize') || 
          response.url().includes('face') ||
          response.url().includes('upload')) {
        logs.responses.push({
          url: response.url(),
          status: response.status(),
          time: new Date().toISOString()
        });
        console.log(`[API RESPONSE] ${response.status()} ${response.url()}`);
      }
    });

    // Error handling
    page.on('pageerror', err => {
      logs.errors.push({
        message: err.message,
        stack: err.stack,
        time: new Date().toISOString()
      });
      console.log('[PAGE ERROR]', err.message);
    });

    // Inject monitoring script
    await page.addInitScript(() => {
      window.uploadDebug = {
        events: [],
        uploadedFiles: [],
        vectorizationCalls: []
      };

      // Monitor file uploads
      const originalAddEventListener = EventTarget.prototype.addEventListener;
      EventTarget.prototype.addEventListener = function(type, listener, options) {
        if (type === 'change' && this.type === 'file') {
          const wrappedListener = function(e) {
            const files = Array.from(e.target.files || []);
            window.uploadDebug.uploadedFiles.push({
              count: files.length,
              files: files.map(f => ({ name: f.name, size: f.size, type: f.type })),
              timestamp: new Date().toISOString()
            });
            console.log('[FILE SELECTED]', files);
            return listener.call(this, e);
          };
          return originalAddEventListener.call(this, type, wrappedListener, options);
        }
        return originalAddEventListener.call(this, type, listener, options);
      };

      // Monitor fetch for vectorization
      const originalFetch = window.fetch;
      window.fetch = async (...args) => {
        const [url, options] = args;
        if (url.includes('vectorize')) {
          window.uploadDebug.vectorizationCalls.push({
            url,
            method: options?.method || 'GET',
            timestamp: new Date().toISOString()
          });
          console.log('[VECTORIZATION CALL]', url);
        }
        return originalFetch(...args);
      };
    });

    // Step 1: Navigate to My Files
    console.log('\n=== STEP 1: Navigate to My Files ===');
    await page.goto('http://localhost:8357/pages/my-files.html');
    await page.waitForLoadState('networkidle');
    
    console.log('Current URL after navigation:', page.url());
    
    // Handle authentication if needed
    if (page.url().includes('auth.html')) {
      console.log('Redirected to auth, logging in...');
      await page.click('[data-tab="login"]');
      await page.waitForTimeout(500);
      await page.fill('.login-email', 'weezer@yev.com');
      await page.fill('.login-password', '123456');
      await page.click('button:has-text("Access Your Memories")');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      // Check where we are now
      const currentUrl = page.url();
      console.log('After login, at:', currentUrl);
      
      // Handle email verification if present
      if (currentUrl.includes('email-verification')) {
        console.log('On email verification page');
        const skipButton = await page.locator('button').filter({ hasText: /continue|skip|later/i }).first();
        if (await skipButton.count() > 0) {
          await skipButton.click();
          await page.waitForLoadState('networkidle');
        }
      }
      
      // Navigate to My Files
      console.log('Navigating to My Files...');
      await page.goto('http://localhost:8357/pages/my-files.html');
      await page.waitForLoadState('networkidle');
    }
    
    await page.waitForLoadState('networkidle');
    console.log('Current URL:', page.url());

    // Step 2: Upload file
    console.log('\n=== STEP 2: Upload File ===');
    const fileInput = page.locator('#fileInput');
    await expect(fileInput).toBeAttached({ timeout: 5000 });
    
    const testImagePath = path.join('/home/tim/WebsitePrototype/assets/images/infitwin-logo.jpg');
    await fileInput.setInputFiles(testImagePath);
    console.log('File set on input');
    
    // Wait for upload to process
    await page.waitForTimeout(2000);
    
    // Step 3: Check upload status
    console.log('\n=== STEP 3: Check Upload Status ===');
    
    // Wait a bit more for Firebase upload to complete
    await page.waitForTimeout(3000);
    
    const uploadStatus = await page.evaluate(() => {
      const fileInput = document.querySelector('#fileInput');
      const uploadedItems = document.querySelectorAll('.upload-item, .file-preview, [class*="upload-preview"]');
      const fileItems = document.querySelectorAll('.file-item');
      const uploadButton = document.querySelector('button[class*="upload"]') || 
                           Array.from(document.querySelectorAll('button')).find(btn => btn.textContent.includes('Upload'));
      const filesGrid = document.querySelector('.files-grid');
      const fileCount = document.querySelector('.file-count');
      
      // Get all possible file containers
      const allFileContainers = document.querySelectorAll('.file-card, .file-item, .file-entry, [class*="file-item"]');
      
      return {
        fileInputFiles: fileInput?.files?.length || 0,
        uploadPreviewCount: uploadedItems.length,
        fileListCount: fileItems.length,
        allFileContainers: allFileContainers.length,
        hasUploadButton: !!uploadButton,
        uploadButtonText: uploadButton?.textContent || null,
        uploadButtonVisible: uploadButton ? getComputedStyle(uploadButton).display !== 'none' : false,
        filesGridHTML: filesGrid ? filesGrid.innerHTML.substring(0, 500) : 'Not found',
        fileCountText: fileCount?.textContent || 'Not found'
      };
    });
    console.log('Upload status:', uploadStatus);
    
    // Click upload button if present
    if (uploadStatus.hasUploadButton && uploadStatus.uploadButtonVisible) {
      console.log('Clicking upload button...');
      await page.click('button[class*="upload"], button:has-text("Upload")');
      await page.waitForTimeout(3000);
    }

    // Step 4: Check for files and vectorize
    console.log('\n=== STEP 4: Check Files and Vectorize ===');
    
    // Re-check file status with more selectors
    const fileStatus = await page.evaluate(() => {
      const fileItems = document.querySelectorAll('.file-item, .file-card');
      const checkboxes = document.querySelectorAll('input[type="checkbox"][name="fileSelect"], .file-item input[type="checkbox"], .file-card input[type="checkbox"]');
      
      // Find vectorize button with various selectors
      let vectorizeButton = null;
      const buttonSelectors = [
        'button[class*="vectorize"]',
        '.btn-batch-vectorize',
        'button.btn-primary'
      ];
      
      for (const selector of buttonSelectors) {
        try {
          const btn = document.querySelector(selector);
          if (btn && btn.textContent.toLowerCase().includes('vectorize')) {
            vectorizeButton = btn;
            break;
          }
        } catch (e) {
          // Try next selector
        }
      }
      
      // Also check for text content
      if (!vectorizeButton) {
        const allButtons = document.querySelectorAll('button');
        for (const btn of allButtons) {
          if (btn.textContent.toLowerCase().includes('vectorize')) {
            vectorizeButton = btn;
            break;
          }
        }
      }
      
      return {
        fileCount: fileItems.length,
        checkboxCount: checkboxes.length,
        checkedCount: Array.from(checkboxes).filter(cb => cb.checked).length,
        hasVectorizeButton: !!vectorizeButton,
        vectorizeButtonText: vectorizeButton?.textContent || null,
        vectorizeButtonClasses: vectorizeButton?.className || null,
        vectorizeButtonId: vectorizeButton?.id || null,
        vectorizeButtonVisible: vectorizeButton ? getComputedStyle(vectorizeButton).display !== 'none' : false
      };
    });
    console.log('File status:', fileStatus);
    
    // If files are in the list, select them
    if (fileStatus.checkboxCount > 0) {
      console.log('Selecting files...');
      const checkboxes = page.locator('.file-item input[type="checkbox"]');
      const count = await checkboxes.count();
      for (let i = 0; i < count; i++) {
        await checkboxes.nth(i).check();
      }
      await page.waitForTimeout(500);
    }
    
    // Look for vectorize button
    const vectorizeButton = page.locator('button').filter({ hasText: /vectorize|process|analyze/i }).first();
    if (await vectorizeButton.count() > 0) {
      console.log('Found vectorize button, attempting to click...');
      
      // Make sure it's visible
      await vectorizeButton.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      
      // Try to click
      try {
        await vectorizeButton.click({ timeout: 5000 });
        console.log('Clicked vectorize button');
      } catch (e) {
        console.log('Click failed, trying force click...');
        await vectorizeButton.click({ force: true });
      }
      
      // Wait for processing
      console.log('Waiting for vectorization...');
      await page.waitForTimeout(5000);
    }

    // Step 5: Check results
    console.log('\n=== STEP 5: Check Results ===');
    const results = await page.evaluate(() => {
      const faces = document.querySelectorAll('.face, .face-box, [class*="face"]');
      const images = document.querySelectorAll('img[src*="face"], img[class*="face"]');
      const debug = window.uploadDebug || {};
      
      return {
        faceElements: faces.length,
        faceImages: images.length,
        uploadedFiles: debug.uploadedFiles || [],
        vectorizationCalls: debug.vectorizationCalls || [],
        debugEvents: debug.events || []
      };
    });
    console.log('Results:', results);

    // Get console logs
    console.log('\n=== Console Logs ===');
    console.log(`Total logs: ${logs.console.length}`);
    logs.console.slice(-20).forEach(log => {
      console.log(`[${log.type}] ${log.text}`);
    });

    // Get API activity
    console.log('\n=== API Activity ===');
    console.log('Requests:', logs.requests);
    console.log('Responses:', logs.responses);

    // Take final screenshot
    await page.screenshot({ 
      path: '/home/tim/WebsitePrototype/playwright-testing/vectorization-debug-final.png', 
      fullPage: true 
    });

    // Save full debug report
    const debugReport = {
      timestamp: new Date().toISOString(),
      uploadStatus,
      fileStatus,
      results,
      logs: {
        console: logs.console.slice(-50),
        requests: logs.requests,
        responses: logs.responses,
        errors: logs.errors
      }
    };

    const fs = require('fs').promises;
    await fs.writeFile(
      '/home/tim/WebsitePrototype/playwright-testing/vectorization-debug-report-simple.json',
      JSON.stringify(debugReport, null, 2)
    );
    
    console.log('\nDebug report saved to vectorization-debug-report-simple.json');
    console.log('Screenshot saved to vectorization-debug-final.png');

    // Basic assertion
    expect(uploadStatus.fileInputFiles).toBeGreaterThan(0);
  });
});