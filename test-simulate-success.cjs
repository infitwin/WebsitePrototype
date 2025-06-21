const { chromium } = require('playwright');

async function simulateSuccessfulVectorization() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log('🧪 Simulating successful vectorization with working data structure...');
  
  // Monitor console logs
  page.on('console', msg => {
    console.log('BROWSER:', msg.type().toUpperCase(), msg.text());
  });
  
  // Login
  await page.goto('http://localhost:8357/pages/my-files.html');
  await page.waitForTimeout(2000);
  await page.click('[data-tab="login"]');
  await page.fill('.login-email', 'weezer@yev.com');
  await page.fill('.login-password', '123456');
  await page.click('button:has-text("Access Your Memories")');
  await page.waitForTimeout(3000);
  
  const skipBtn = await page.locator('button:has-text("Skip")').count();
  if (skipBtn > 0) {
    await page.click('button:has-text("Skip")');
    await page.waitForTimeout(2000);
  }
  
  await page.goto('http://localhost:8357/pages/my-files.html');
  await page.waitForTimeout(5000);
  
  // Get a clean file for testing
  const targetFileId = 'file_1750436548522_i7a3s6sze';
  
  // Take before screenshot
  await page.screenshot({ path: 'before-simulation.png', fullPage: true });
  console.log('📸 Before screenshot saved');
  
  // Simulate successful API response by overriding the performVectorization function
  await page.evaluate((fileId) => {
    // Simulate the exact API response structure that worked for existing files
    const mockAPIResponse = {
      results: [{
        faces: [
          {
            "sunglasses": { "Confidence": 100, "Value": true },
            "gender": { "Value": "Male", "Confidence": 88.84 },
            "eyeglasses": { "Value": true, "Confidence": 100 },
            "mouthOpen": { "Confidence": 99.21, "Value": true },
            "mustache": { "Confidence": 99.77, "Value": false },
            "ageRange": { "Low": 19, "High": 25 },
            "smile": { "Confidence": 85.64, "Value": true },
            "beard": { "Value": false, "Confidence": 93.89 },
            "emotions": [
              { "Type": "HAPPY", "Confidence": 98.04 },
              { "Type": "CALM", "Confidence": 0.56 }
            ],
            "eyesOpen": { "Value": true, "Confidence": 100 },
            "confidence": 99.99,
            "boundingBox": { "Left": 0.59, "Height": 0.24, "Width": 0.23, "Top": 0.26 }
          }
        ]
      }]
    };
    
    // Override the performVectorization function to simulate success
    const originalPerformVectorization = window.performVectorization;
    window.performVectorization = async function(fileIds) {
      console.log('🔧 SIMULATED: performVectorization called with:', fileIds);
      
      for (const testFileId of fileIds) {
        if (testFileId === fileId) {
          const file = window.currentFiles?.find(f => f.id === testFileId);
          if (file) {
            console.log('🔧 SIMULATED: Processing file with mock data');
            
            // Update UI immediately (this is the V1 behavior)
            window.updateFileVectorizationUI(testFileId, mockAPIResponse);
            
            // Update Firebase status
            await window.updateFileVectorizationStatus(testFileId, mockAPIResponse);
            
            console.log('🔧 SIMULATED: Vectorization completed successfully');
          }
        }
      }
      
      // Refresh file browser (V1 behavior)
      await window.initializeFileBrowser();
    };
    
    console.log('🔧 SIMULATION: Override complete');
  }, targetFileId);
  
  // Select the file
  const fileCard = page.locator(`[data-file-id="${targetFileId}"]`);
  await fileCard.hover();
  await page.waitForTimeout(500);
  
  const checkbox = fileCard.locator('.file-checkbox');
  await checkbox.check();
  await page.waitForTimeout(1000);
  
  console.log('🔄 Starting simulated vectorization...');
  await page.click('#vectorizeBtn');
  
  // Accept dialog
  await page.waitForTimeout(1000);
  
  // Wait for simulation to complete
  await page.waitForTimeout(10000);
  
  // Take after screenshot
  await page.screenshot({ path: 'after-simulation.png', fullPage: true });
  console.log('📸 After screenshot saved');
  
  // Check final state
  const finalState = await page.evaluate(() => {
    const faceIndicators = document.querySelectorAll('.face-indicator');
    const targetFile = window.currentFiles?.find(f => f.id === 'file_1750436548522_i7a3s6sze');
    
    return {
      domFaceIndicators: faceIndicators.length,
      faceIndicatorTexts: Array.from(faceIndicators).map(el => el.textContent.trim()),
      targetFileData: targetFile ? {
        faceCount: targetFile.faceCount,
        extractedFaces: targetFile.extractedFaces?.length,
        vectorizationStatus: targetFile.vectorizationStatus
      } : null
    };
  });
  
  console.log('📊 SIMULATION RESULT:', JSON.stringify(finalState, null, 2));
  
  await browser.close();
}

simulateSuccessfulVectorization().catch(console.error);