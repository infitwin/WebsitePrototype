const { chromium } = require('playwright');

(async () => {
  console.log('🧪 Testing with files that already have faces...');
  
  const browser = await chromium.launch({ 
    headless: true
  });
  const page = await browser.newPage();

  try {
    // Login
    await page.goto('http://localhost:8357/pages/auth.html');
    await page.click('[data-tab="login"]');
    await page.fill('.login-email', 'weezer@yev.com');
    await page.fill('.login-password', '123456');
    await page.click('button:has-text("Access Your Memories")');
    await page.waitForURL('**/dashboard.html');

    // Go to My Files
    await page.goto('http://localhost:8357/pages/my-files.html');
    await page.waitForTimeout(3000);

    // Check all files and their face data
    const allFiles = await page.evaluate(() => {
      const files = window.currentFiles || [];
      return files.map(f => ({
        id: f.id,
        fileName: f.fileName,
        fileType: f.fileType,
        faceCount: f.faceCount || 0,
        extractedFaces: f.extractedFaces || [],
        hasBoundingBoxes: f.extractedFaces && f.extractedFaces.length > 0 && f.extractedFaces[0].BoundingBox !== undefined
      })).filter(f => f.fileType?.startsWith('image/'));
    });

    console.log('\n📊 All image files and their face data:');
    allFiles.forEach(f => {
      console.log(`\n  File: ${f.fileName}`);
      console.log(`  - Face count: ${f.faceCount}`);
      console.log(`  - Extracted faces: ${f.extractedFaces.length}`);
      console.log(`  - Has bounding boxes: ${f.hasBoundingBoxes}`);
      if (f.extractedFaces.length > 0) {
        console.log(`  - First face:`, JSON.stringify(f.extractedFaces[0], null, 2));
      }
    });

    // Check if face indicators are clickable
    const faceIndicators = await page.locator('.face-indicator').count();
    console.log(`\n👁️ Total face indicators in UI: ${faceIndicators}`);

    if (faceIndicators > 0) {
      console.log('\n🖱️ Clicking first face indicator...');
      await page.locator('.face-indicator').first().click();
      await page.waitForTimeout(2000);
      
      // Check if modal opened
      const modalVisible = await page.locator('.face-viewer-modal, .modal.active').isVisible();
      console.log(`📸 Face viewer modal visible: ${modalVisible}`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await browser.close();
  }
})();