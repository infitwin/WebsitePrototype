const { chromium } = require('playwright');

(async () => {
  console.log('🧪 Verifying bounding box data availability...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500 
  });
  const page = await browser.newPage();

  try {
    // Login and navigate
    await page.goto('http://localhost:8357/pages/auth.html');
    await page.click('[data-tab="login"]');
    await page.fill('.login-email', 'weezer@yev.com');
    await page.fill('.login-password', '123456');
    await page.click('button:has-text("Access Your Memories")');
    await page.waitForURL('**/dashboard.html');

    await page.goto('http://localhost:8357/pages/my-files.html');
    await page.waitForTimeout(3000);

    // Check bounding box data structure
    const boundingBoxData = await page.evaluate(() => {
      const files = window.currentFiles || [];
      const filesWithFaces = files.filter(f => f.extractedFaces && f.extractedFaces.length > 0);
      
      return filesWithFaces.map(file => ({
        fileName: file.fileName,
        fileId: file.id,
        faceCount: file.extractedFaces.length,
        faces: file.extractedFaces.map((face, index) => ({
          faceIndex: index,
          hasBoundingBox: !!face.BoundingBox,
          boundingBox: face.BoundingBox,
          confidence: face.Confidence,
          // Check for other important face properties
          hasLandmarks: !!face.Landmarks,
          hasEmotions: !!face.Emotions,
          hasAge: !!face.AgeRange
        }))
      }));
    });
    
    console.log('\n📊 Bounding Box Data Analysis:');
    console.log(JSON.stringify(boundingBoxData, null, 2));
    
    // Check if face modal can display bounding boxes
    const faceIndicators = await page.locator('.face-indicator').count();
    if (faceIndicators > 0) {
      console.log('\n🖱️ Testing face modal with bounding box data...');
      await page.locator('.face-indicator').first().click();
      await page.waitForTimeout(1000);
      
      const modalContent = await page.locator('#facesModalGrid').textContent();
      console.log(`Face modal content: ${modalContent}`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await browser.close();
  }
  
  console.log('\n✅ Bounding box verification complete!');
})();