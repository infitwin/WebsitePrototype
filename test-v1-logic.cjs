const { chromium } = require('playwright');

async function testV1Logic() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log('🧪 Testing V1 vectorization logic with simulated API response...');
  
  // Monitor console logs
  page.on('console', msg => {
    console.log('BROWSER:', msg.type().toUpperCase(), msg.text());
  });
  
  page.on('dialog', async dialog => {
    console.log('🚨 DIALOG:', dialog.message());
    await dialog.accept();
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
  
  // Take before screenshot
  await page.screenshot({ path: 'before-v1-test.png', fullPage: true });
  console.log('📸 Before screenshot saved');
  
  // Test the V1 UI logic directly by calling the functions with mock data
  const testResult = await page.evaluate(() => {
    // Test file
    const targetFileId = 'file_1750436548522_i7a3s6sze';
    
    // Mock API response matching working files
    const mockAPIResponse = {
      results: [{
        faces: [
          {
            "sunglasses": { "Confidence": 100, "Value": true },
            "gender": { "Value": "Male", "Confidence": 88.84 },
            "eyeglasses": { "Value": true, "Confidence": 100 },
            "mouthOpen": { "Confidence": 99.21, "Value": true },
            "ageRange": { "Low": 19, "High": 25 },
            "smile": { "Confidence": 85.64, "Value": true },
            "eyesOpen": { "Value": true, "Confidence": 100 },
            "confidence": 99.99,
            "boundingBox": { "Left": 0.59, "Height": 0.24, "Width": 0.23, "Top": 0.26 }
          }
        ]
      }]
    };
    
    console.log('🔧 TESTING: V1 UI update logic directly');
    
    // Test Step 1: updateFileVectorizationUI (immediate UI update)
    window.updateFileVectorizationUI(targetFileId, mockAPIResponse);
    
    // Check if face indicator was added
    const faceIndicators = document.querySelectorAll('.face-indicator');
    const newFaceIndicator = document.querySelector(`[data-file-id="${targetFileId}"] .face-indicator`);
    
    return {
      step1_complete: true,
      totalFaceIndicators: faceIndicators.length,
      targetFileHasFaceIndicator: !!newFaceIndicator,
      newFaceIndicatorText: newFaceIndicator ? newFaceIndicator.textContent.trim() : null
    };
  });
  
  console.log('📊 V1 UI UPDATE TEST:', JSON.stringify(testResult, null, 2));
  
  // Take after screenshot to see the result
  await page.screenshot({ path: 'after-v1-test.png', fullPage: true });
  console.log('📸 After screenshot saved');
  
  // Now test Firebase update
  const firebaseResult = await page.evaluate(async () => {
    const targetFileId = 'file_1750436548522_i7a3s6sze';
    const mockAPIResponse = {
      results: [{
        faces: [
          {
            "sunglasses": { "Confidence": 100, "Value": true },
            "confidence": 99.99,
            "boundingBox": { "Left": 0.59, "Height": 0.24, "Width": 0.23, "Top": 0.26 }
          }
        ]
      }]
    };
    
    try {
      console.log('🔧 TESTING: V1 Firebase update logic');
      await window.updateFileVectorizationStatus(targetFileId, mockAPIResponse);
      return { firebaseUpdate: 'success' };
    } catch (error) {
      return { firebaseUpdate: 'failed', error: error.message };
    }
  });
  
  console.log('📊 V1 FIREBASE UPDATE TEST:', JSON.stringify(firebaseResult, null, 2));
  
  // Check final state after both updates
  const finalCheck = await page.evaluate(() => {
    const targetFileId = 'file_1750436548522_i7a3s6sze';
    const targetFile = window.currentFiles?.find(f => f.id === targetFileId);
    const faceIndicators = document.querySelectorAll('.face-indicator');
    
    return {
      totalFaceIndicators: faceIndicators.length,
      targetFileData: targetFile ? {
        faceCount: targetFile.faceCount,
        extractedFaces: targetFile.extractedFaces?.length,
        vectorizationStatus: targetFile.vectorizationStatus
      } : null
    };
  });
  
  console.log('📊 FINAL STATE CHECK:', JSON.stringify(finalCheck, null, 2));
  
  await browser.close();
}

testV1Logic().catch(console.error);