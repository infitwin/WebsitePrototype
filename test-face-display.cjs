const { chromium } = require('playwright');

async function testFaceDisplay() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log('🧪 Testing face indicator display...');
  
  page.on('console', msg => {
    if (msg.text().includes('face') || msg.text().includes('extract')) {
      console.log('BROWSER:', msg.text());
    }
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
  
  // Check which files have face data
  const faceAnalysis = await page.evaluate(() => {
    console.log('🔍 Analyzing face data in files...');
    
    const filesWithFaces = [];
    const filesWithoutFaces = [];
    
    if (window.currentFiles) {
      window.currentFiles.forEach(file => {
        const faceCount = file.faceCount || 0;
        const extractedFaces = file.extractedFaces || [];
        
        console.log(`📁 File: ${file.fileName}`);
        console.log(`   faceCount: ${faceCount}`);
        console.log(`   extractedFaces: ${extractedFaces.length} items`);
        console.log(`   extractedFaces data:`, extractedFaces);
        
        if (faceCount > 0 || extractedFaces.length > 0) {
          filesWithFaces.push({
            id: file.id,
            fileName: file.fileName,
            faceCount: faceCount,
            extractedFacesLength: extractedFaces.length,
            extractedFaces: extractedFaces
          });
        } else {
          filesWithoutFaces.push({
            id: file.id,
            fileName: file.fileName
          });
        }
      });
    }
    
    return {
      filesWithFaces,
      filesWithoutFaces,
      totalFiles: window.currentFiles ? window.currentFiles.length : 0
    };
  });
  
  console.log('👤 Files WITH faces:', JSON.stringify(faceAnalysis.filesWithFaces, null, 2));
  console.log('📁 Files WITHOUT faces:', faceAnalysis.filesWithoutFaces.length);
  
  // Check for face indicators in DOM
  const domAnalysis = await page.evaluate(() => {
    const faceIndicators = document.querySelectorAll('.face-indicator');
    return {
      faceIndicatorCount: faceIndicators.length,
      faceIndicatorTexts: Array.from(faceIndicators).map(el => el.textContent.trim())
    };
  });
  
  console.log('🔍 DOM Analysis:', domAnalysis);
  
  // Take screenshot
  await page.screenshot({ path: 'face-display-test.png', fullPage: true });
  console.log('📸 Screenshot saved: face-display-test.png');
  
  await browser.close();
}

testFaceDisplay().catch(console.error);