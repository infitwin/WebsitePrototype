const { chromium } = require('playwright');

(async () => {
  console.log('🧪 Testing API face detection response...');
  
  const browser = await chromium.launch({ 
    headless: true
  });
  const page = await browser.newPage();

  let apiCallCaptured = false;
  let apiResponseData = null;

  // Capture API responses
  page.on('response', async response => {
    if (response.url().includes('process-artifact')) {
      console.log(`\n📥 API Response: ${response.status()}`);
      try {
        const responseText = await response.text();
        const responseData = JSON.parse(responseText);
        apiResponseData = responseData;
        apiCallCaptured = true;
        
        console.log('📥 Full API Response:');
        console.log(JSON.stringify(responseData, null, 2));
        
        // Check for face data in response
        if (responseData.result?.data?.analysis?.faces) {
          console.log(`\n✅ Faces detected: ${responseData.result.data.analysis.faces.length}`);
          console.log('First face:', JSON.stringify(responseData.result.data.analysis.faces[0], null, 2));
        } else {
          console.log('\n❌ No faces in API response');
          console.log('Response structure:', Object.keys(responseData.result || {}));
        }
      } catch (e) {
        console.log('Failed to parse response:', e.message);
        console.log('Raw response:', responseText);
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
    console.log('\n📁 Going to My Files...');
    await page.goto('http://localhost:8357/pages/my-files.html');
    await page.waitForTimeout(3000);

    // Inject logging to capture what happens after API response
    await page.evaluate(() => {
      const originalProcessResponse = window.processVectorizationResponse;
      if (originalProcessResponse) {
        window.processVectorizationResponse = function(file, result) {
          console.log('📝 Processing response for:', file.fileName);
          console.log('📝 Result structure:', JSON.stringify(result, null, 2));
          return originalProcessResponse.call(this, file, result);
        };
      }
    });

    // Find a file without faces
    const targetFile = await page.evaluate(() => {
      const files = window.currentFiles || [];
      const unprocessed = files.find(f => 
        f.fileType?.startsWith('image/') && 
        f.downloadURL && 
        (!f.faceCount || f.faceCount === 0) &&
        (!f.extractedFaces || f.extractedFaces.length === 0)
      );
      
      if (unprocessed) {
        console.log('🎯 Found unprocessed file:', unprocessed.fileName);
        return {
          id: unprocessed.id,
          fileName: unprocessed.fileName,
          downloadURL: unprocessed.downloadURL
        };
      }
      return null;
    });

    if (!targetFile) {
      console.log('\n❌ No unprocessed images found');
      return;
    }

    console.log(`\n🚀 Processing ${targetFile.fileName}...`);

    // Trigger processing
    await page.evaluate((fileId) => {
      window.getVectorizationQuota = async () => ({ used: 0, limit: 100 });
      window.selectedFiles = new Set([fileId]);
      window.handleBatchVectorize();
    }, targetFile.id);

    // Wait for API call
    console.log('\n⏳ Waiting for API response...');
    await page.waitForTimeout(10000);

    if (!apiCallCaptured) {
      console.log('\n❌ No API call was made');
    } else if (apiResponseData?.result?.data?.analysis?.faces?.length > 0) {
      console.log('\n✅ API returned face data successfully');
      
      // Now check if it was saved to Firebase
      console.log('\n🔍 Checking if face data was saved...');
      await page.waitForTimeout(3000);
      
      const savedData = await page.evaluate((fileId) => {
        const file = window.currentFiles?.find(f => f.id === fileId);
        return {
          faceCount: file?.faceCount || 0,
          extractedFaces: file?.extractedFaces?.length || 0,
          hasData: !!(file?.extractedFaces && file.extractedFaces.length > 0)
        };
      }, targetFile.id);
      
      console.log('\n📊 File data after processing:', savedData);
      
      if (savedData.hasData) {
        console.log('✅ Face data successfully saved and loaded');
      } else {
        console.log('❌ Face data NOT saved despite successful API response');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    console.log('\n🏁 Test complete');
    await browser.close();
  }
})();