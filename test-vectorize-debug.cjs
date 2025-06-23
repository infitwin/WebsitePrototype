const { chromium } = require('playwright');

(async () => {
  console.log('🧪 Debugging vectorization process...');
  
  const browser = await chromium.launch({ 
    headless: true
  });
  const page = await browser.newPage();

  // Capture ALL console logs
  page.on('console', msg => {
    console.log(`[Browser ${msg.type()}]: ${msg.text()}`);
  });

  // Monitor network
  page.on('request', request => {
    if (request.url().includes('process-artifact') || request.url().includes('vectoriz')) {
      console.log(`\n🌐 REQUEST: ${request.method()} ${request.url()}`);
    }
  });

  page.on('response', response => {
    if (response.url().includes('process-artifact') || response.url().includes('vectoriz')) {
      console.log(`🌐 RESPONSE: ${response.status()} ${response.url()}`);
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

    // Debug what happens when we call handleBatchVectorize
    console.log('\n🔍 Analyzing handleBatchVectorize function...');
    const debugInfo = await page.evaluate(() => {
      // Check if functions exist
      const info = {
        hasHandleBatchVectorize: typeof window.handleBatchVectorize === 'function',
        hasGetVectorizationQuota: typeof window.getVectorizationQuota === 'function',
        hasSelectedFiles: !!window.selectedFiles,
        selectedFilesCount: window.selectedFiles ? window.selectedFiles.size : 0,
        currentFilesCount: window.currentFiles ? window.currentFiles.length : 0
      };

      // Find an unprocessed image
      const files = window.currentFiles || [];
      const unprocessedImage = files.find(f => 
        f.fileType?.startsWith('image/') && 
        f.downloadURL && 
        (!f.faceCount || f.faceCount === 0)
      );

      if (unprocessedImage) {
        info.targetFile = {
          id: unprocessedImage.id,
          fileName: unprocessedImage.fileName,
          hasDownloadURL: !!unprocessedImage.downloadURL,
          fileType: unprocessedImage.fileType
        };
      }

      return info;
    });

    console.log('\n📊 Debug info:', JSON.stringify(debugInfo, null, 2));

    if (!debugInfo.targetFile) {
      console.log('\n❌ No unprocessed images found');
      return;
    }

    // Try to process the file step by step
    console.log(`\n🚀 Processing ${debugInfo.targetFile.fileName}...`);

    // Execute vectorization with detailed logging
    const result = await page.evaluate((fileId) => {
      console.log('Step 1: Setting up mocks and selection');
      
      // Mock quota
      window.getVectorizationQuota = async () => {
        console.log('getVectorizationQuota called');
        return { used: 0, limit: 100 };
      };
      
      // Select file
      window.selectedFiles = new Set([fileId]);
      console.log('Selected files:', Array.from(window.selectedFiles));
      
      // Check if handleBatchVectorize exists
      if (!window.handleBatchVectorize) {
        return { error: 'handleBatchVectorize not found' };
      }
      
      console.log('Step 2: Calling handleBatchVectorize');
      
      try {
        // Call the function
        window.handleBatchVectorize();
        return { success: true };
      } catch (error) {
        console.error('Error calling handleBatchVectorize:', error);
        return { error: error.message };
      }
    }, debugInfo.targetFile.id);

    console.log('\n📊 Execution result:', result);

    // Wait to see if any API calls happen
    console.log('\n⏳ Waiting for API activity...');
    await page.waitForTimeout(5000);

    // Check vectorization status
    const statusCheck = await page.evaluate((fileId) => {
      const file = window.currentFiles?.find(f => f.id === fileId);
      return {
        vectorizationStatus: file?.vectorizationStatus,
        faceCount: file?.faceCount || 0,
        processing: file?.processing
      };
    }, debugInfo.targetFile.id);

    console.log('\n📊 Final status:', statusCheck);

  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    console.log('\n🏁 Test complete');
    await browser.close();
  }
})();