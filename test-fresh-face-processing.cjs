const { chromium } = require('playwright');

(async () => {
  console.log('🧪 Testing face processing on files with NO existing face data...');
  
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

  // Monitor console logs for face processing
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('👤 Extracted') || text.includes('faces') || text.includes('API Result') || text.includes('Processing file:')) {
      console.log(`[BROWSER]: ${text}`);
    }
  });

  // Monitor API calls
  page.on('request', request => {
    if (request.url().includes('process-artifact')) {
      console.log(`\n🔥 API REQUEST: ${request.method()} ${request.url()}`);
      const postData = request.postData();
      if (postData) {
        try {
          const data = JSON.parse(postData);
          console.log(`📦 Processing: ${data.metadata?.fileName}`);
        } catch (e) {
          console.log(`📦 POST data available`);
        }
      }
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

    // Find files with NO existing face data
    console.log('\n🔍 Looking for files with NO existing face data...');
    const fileAnalysis = await page.evaluate(() => {
      const files = window.currentFiles || [];
      return files.map(f => ({
        id: f.id,
        fileName: f.fileName,
        faceCount: f.faceCount || 0,
        extractedFaces: f.extractedFaces?.length || 0,
        hasDownloadURL: !!f.downloadURL,
        fileType: f.fileType,
        isImage: f.fileType?.startsWith('image/'),
        processed: f.processed
      }));
    });
    
    console.log('\n📊 All files analysis:');
    fileAnalysis.forEach(f => {
      console.log(`  - ${f.fileName}: faces=${f.faceCount}, extracted=${f.extractedFaces}, isImage=${f.isImage}, hasURL=${f.hasDownloadURL}`);
    });

    // Find a file with zero faces that is an image
    const unprocessedFiles = fileAnalysis.filter(f => 
      f.isImage && 
      f.hasDownloadURL && 
      f.faceCount === 0 && 
      f.extractedFaces === 0
    );

    console.log(`\n🎯 Found ${unprocessedFiles.length} unprocessed image files`);

    if (unprocessedFiles.length === 0) {
      console.log('❌ No unprocessed image files found for testing');
      return;
    }

    const targetFile = unprocessedFiles[0];
    console.log(`\n🎯 Testing with: ${targetFile.fileName} (${targetFile.id})`);

    // Process this specific file
    console.log('\n🚀 Processing file with NO existing face data...');
    const result = await page.evaluate((fileId) => {
      // Mock quota function
      window.getVectorizationQuota = async () => ({ used: 0, limit: 100 });

      // Set selected files to our target
      window.selectedFiles = new Set([fileId]);
      
      console.log('🎯 Selected file ID:', fileId);
      console.log('🎯 Selected files:', Array.from(window.selectedFiles));
      
      // Get the file details
      const targetFile = window.currentFiles.find(f => f.id === fileId);
      if (!targetFile) {
        return { error: 'Target file not found' };
      }

      console.log('🎯 Target file details:', {
        id: targetFile.id,
        fileName: targetFile.fileName,
        faceCount: targetFile.faceCount,
        extractedFaces: targetFile.extractedFaces?.length,
        downloadURL: !!targetFile.downloadURL
      });
      
      // Call the vectorization function
      if (window.handleBatchVectorize) {
        window.handleBatchVectorize();
        return {
          success: true,
          fileName: targetFile.fileName,
          fileId: targetFile.id,
          beforeFaces: targetFile.faceCount || 0
        };
      } else {
        return { error: 'handleBatchVectorize not available' };
      }
    }, targetFile.id);
    
    console.log('\n📊 Processing trigger result:', JSON.stringify(result, null, 2));
    
    // Wait for API processing
    console.log('\n⏳ Waiting for API processing...');
    await page.waitForTimeout(10000);
    
    // Refresh the file browser to get updated data
    console.log('\n🔄 Refreshing file browser...');
    await page.evaluate(() => {
      if (window.initializeFileBrowser) {
        return window.initializeFileBrowser();
      }
    });
    
    await page.waitForTimeout(3000);
    
    // Check if the specific file now has face data
    const updatedFileData = await page.evaluate((fileId) => {
      const files = window.currentFiles || [];
      const updatedFile = files.find(f => f.id === fileId);
      
      if (!updatedFile) {
        return { error: 'File not found after refresh' };
      }
      
      return {
        fileName: updatedFile.fileName,
        fileId: updatedFile.id,
        faceCount: updatedFile.faceCount || 0,
        extractedFaces: updatedFile.extractedFaces?.length || 0,
        processed: updatedFile.processed,
        vectorizationStatus: updatedFile.vectorizationStatus,
        hasExtractedFacesArray: !!updatedFile.extractedFaces,
        extractedFacesPreview: updatedFile.extractedFaces ? updatedFile.extractedFaces.slice(0, 1) : null
      };
    }, targetFile.id);
    
    console.log('\n📊 UPDATED file data after processing:');
    console.log(JSON.stringify(updatedFileData, null, 2));
    
    // Check face indicators in UI
    const faceIndicators = await page.locator('.face-indicator').count();
    console.log(`\n👁️ Total face indicators in UI: ${faceIndicators}`);
    
    // Success analysis
    if (updatedFileData.faceCount > 0 || updatedFileData.extractedFaces > 0) {
      console.log('\n✅ SUCCESS: Face processing worked on fresh file!');
    } else {
      console.log('\n❌ ISSUE: No face data found after processing');
    }

  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    console.log('\n🏁 Fresh face processing test complete');
    await browser.close();
  }
})();