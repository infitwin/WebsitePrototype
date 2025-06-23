const { chromium } = require('playwright');

(async () => {
  console.log('🧪 Testing face detection integration (headless)...');
  
  const browser = await chromium.launch({ 
    headless: true  // Run in headless mode
  });
  const page = await browser.newPage();

  // Monitor console logs
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Face') || text.includes('face') || text.includes('bounding') || 
        text.includes('API') || text.includes('error') || text.includes('Error')) {
      console.log(`[Browser]: ${text}`);
    }
  });

  // Monitor API calls
  page.on('request', request => {
    if (request.url().includes('process-artifact')) {
      console.log(`\n📤 API Request: ${request.method()} ${request.url()}`);
    }
  });

  page.on('response', async response => {
    if (response.url().includes('process-artifact')) {
      console.log(`📥 API Response: ${response.status()} ${response.statusText()}`);
      if (response.status() === 503) {
        console.log('❌ 503 ERROR - ArtifactProcessor not working properly');
        const text = await response.text();
        console.log(`Error details: ${text}`);
      }
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

    // Navigate to My Files
    console.log('\n📁 Navigating to My Files...');
    await page.goto('http://localhost:8357/pages/my-files.html');
    await page.waitForTimeout(5000);

    // Analyze all files to find ones WITHOUT face data
    console.log('\n🔍 Analyzing files to find ones WITHOUT existing face data...');
    const fileAnalysis = await page.evaluate(() => {
      const files = window.currentFiles || [];
      return files.map(f => ({
        id: f.id,
        fileName: f.fileName,
        faceCount: f.faceCount || 0,
        extractedFaces: f.extractedFaces?.length || 0,
        isImage: f.fileType?.startsWith('image/'),
        hasDownloadURL: !!f.downloadURL,
        vectorizationStatus: f.vectorizationStatus,
        processed: f.processed
      }));
    });

    console.log(`\n📊 Total files: ${fileAnalysis.length}`);
    
    // Find unprocessed images
    const unprocessedImages = fileAnalysis.filter(f => 
      f.isImage && 
      f.hasDownloadURL && 
      f.faceCount === 0 && 
      f.extractedFaces === 0
    );

    console.log(`\n🎯 Found ${unprocessedImages.length} images WITHOUT face data:`);
    unprocessedImages.forEach(f => {
      console.log(`  - ${f.fileName} (id: ${f.id})`);
    });

    if (unprocessedImages.length === 0) {
      console.log('\n❌ No unprocessed images found. All images already have face data.');
      
      // Show files that DO have face data
      const processedImages = fileAnalysis.filter(f => f.isImage && (f.faceCount > 0 || f.extractedFaces > 0));
      console.log(`\n✅ Files with face data (${processedImages.length}):`);
      processedImages.forEach(f => {
        console.log(`  - ${f.fileName}: ${f.faceCount} faces, ${f.extractedFaces} extracted`);
      });
      
      return;
    }

    // Test with the first unprocessed image
    const targetFile = unprocessedImages[0];
    console.log(`\n🚀 Processing: ${targetFile.fileName}`);

    // Process the file
    const processResult = await page.evaluate((fileId) => {
      // Mock quota
      window.getVectorizationQuota = async () => ({ used: 0, limit: 100 });
      
      // Select and process
      window.selectedFiles = new Set([fileId]);
      
      if (window.handleBatchVectorize) {
        window.handleBatchVectorize();
        return { success: true };
      } else {
        return { error: 'handleBatchVectorize not found' };
      }
    }, targetFile.id);

    console.log('\n📊 Process triggered:', processResult);

    // Wait for processing
    console.log('\n⏳ Waiting for face detection processing...');
    await page.waitForTimeout(10000);

    // Refresh and check results
    console.log('\n🔄 Refreshing file data...');
    await page.evaluate(() => {
      if (window.initializeFileBrowser) {
        window.initializeFileBrowser();
      }
    });
    
    await page.waitForTimeout(3000);

    // Check the updated file data
    const updatedFile = await page.evaluate((fileId) => {
      const files = window.currentFiles || [];
      return files.find(f => f.id === fileId);
    }, targetFile.id);

    console.log('\n📊 RESULTS:');
    console.log(`File: ${updatedFile.fileName}`);
    console.log(`Face count: ${updatedFile.faceCount || 0}`);
    console.log(`Extracted faces: ${updatedFile.extractedFaces?.length || 0}`);
    console.log(`Vectorization status: ${updatedFile.vectorizationStatus}`);

    if (updatedFile.extractedFaces && updatedFile.extractedFaces.length > 0) {
      console.log('\n✅ SUCCESS: Face detection working!');
      console.log('First face bounding box:', JSON.stringify(updatedFile.extractedFaces[0], null, 2));
    } else {
      console.log('\n❌ PROBLEM: No face data after processing');
      
      // Check Firebase directly
      console.log('\n🔍 Checking Firebase data directly...');
      const firebaseData = await page.evaluate((fileId) => {
        return new Promise((resolve) => {
          const user = firebase.auth().currentUser;
          if (!user) {
            resolve({ error: 'Not authenticated' });
            return;
          }
          
          firebase.firestore()
            .collection('users').doc(user.uid)
            .collection('files').doc(fileId)
            .get()
            .then(doc => {
              if (doc.exists) {
                const data = doc.data();
                resolve({
                  hasExtractedFaces: !!data.extractedFaces,
                  faceCount: data.extractedFaces?.length || 0,
                  firstFace: data.extractedFaces?.[0] || null
                });
              } else {
                resolve({ error: 'Document not found' });
              }
            })
            .catch(err => resolve({ error: err.message }));
        });
      }, targetFile.id);
      
      console.log('Firebase data:', JSON.stringify(firebaseData, null, 2));
    }

    // Check UI for face indicators
    const faceIndicators = await page.locator('.face-indicator').count();
    console.log(`\n👁️ Face indicators visible in UI: ${faceIndicators}`);

  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    console.log('\n🏁 Test complete');
    await browser.close();
  }
})();