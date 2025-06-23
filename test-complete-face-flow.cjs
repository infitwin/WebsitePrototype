const { chromium } = require('playwright');

(async () => {
  console.log('🧪 Testing complete face detection flow with fixes...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000 
  });
  const page = await browser.newPage();

  // Handle dialog boxes
  page.on('dialog', async dialog => {
    console.log(`📋 DIALOG: ${dialog.message()}`);
    if (dialog.type() === 'confirm') {
      await dialog.accept();
    }
  });

  // Monitor console logs for face data
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('👤 Extracted') || text.includes('faces') || text.includes('API Result')) {
      console.log(`[BROWSER]: ${text}`);
    }
  });

  // Monitor API calls
  page.on('request', request => {
    if (request.url().includes('process-artifact')) {
      console.log(`\n🔥 API REQUEST: Processing image...`);
    }
  });

  page.on('response', response => {
    if (response.url().includes('process-artifact')) {
      console.log(`📥 API RESPONSE: ${response.status()}`);
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

    // Process a file with the updated code
    console.log('\n🚀 Triggering vectorization with fixed face extraction...');
    const result = await page.evaluate(async () => {
      const files = window.currentFiles || [];
      const validFile = files.find(f => 
        f.downloadURL && 
        f.fileType && 
        f.fileType.startsWith('image/') &&
        f.id &&
        // Pick a file that doesn't already have faces processed
        (!f.extractedFaces || f.extractedFaces.length === 0)
      );
      
      if (!validFile) {
        return { error: 'No unprocessed image files found' };
      }

      // Mock quota function
      window.getVectorizationQuota = async () => ({ used: 0, limit: 100 });

      // Set selected files and trigger processing
      window.selectedFiles = new Set([validFile.id]);
      
      console.log('🎯 Processing file:', validFile.fileName, validFile.id);
      
      // Call the function
      await window.handleBatchVectorize();
      
      return {
        success: true,
        fileName: validFile.fileName,
        fileId: validFile.id
      };
    });
    
    console.log('\n📊 Processing result:', JSON.stringify(result, null, 2));
    
    // Wait for API call and processing
    console.log('\n⏳ Waiting for face processing...');
    await page.waitForTimeout(10000);
    
    // Check if face data was properly extracted and saved
    console.log('\n🔍 Checking updated face data...');
    const updatedFaceData = await page.evaluate(() => {
      // Refresh the file browser to get updated data
      return window.initializeFileBrowser ? window.initializeFileBrowser() : Promise.resolve();
    });
    
    await page.waitForTimeout(3000);
    
    // Check final state
    const finalState = await page.evaluate(() => {
      const files = window.currentFiles || [];
      return files.map(f => ({
        id: f.id,
        fileName: f.fileName,
        faceCount: f.faceCount,
        extractedFaces: f.extractedFaces?.length || 0,
        processed: f.processed
      })).filter(f => f.faceCount > 0 || f.extractedFaces > 0);
    });
    
    console.log('\n📊 Files with faces after processing:');
    finalState.forEach(f => {
      console.log(`  - ${f.fileName}: faceCount=${f.faceCount}, extractedFaces=${f.extractedFaces}`);
    });
    
    // Check for face indicators in UI
    const faceIndicators = await page.locator('.face-indicator').count();
    console.log(`\n👁️ Face indicators in UI: ${faceIndicators}`);

  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    console.log('\n🏁 Complete face flow test complete');
    await browser.close();
  }
})();