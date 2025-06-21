const { chromium } = require('playwright');

async function testFullVectorization() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log('🧪 Testing full vectorization flow...');
  
  // Monitor all console logs
  page.on('console', msg => {
    console.log('BROWSER:', msg.type().toUpperCase(), msg.text());
  });
  
  page.on('dialog', async dialog => {
    console.log('🚨 DIALOG:', dialog.message());
    await dialog.accept(); // Accept all dialogs
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
  
  // Select an image file
  const imageCard = await page.locator('.file-card').filter({
    has: page.locator('img.file-thumbnail')
  }).first();
  
  if (await imageCard.count() > 0) {
    console.log('📌 Selecting image file...');
    await imageCard.hover();
    await page.waitForTimeout(500);
    
    const checkbox = imageCard.locator('.file-checkbox');
    await checkbox.check();
    await page.waitForTimeout(1000);
    
    console.log('🔄 Starting vectorization...');
    await page.click('#vectorizeBtn');
    
    // Wait for vectorization to complete
    await page.waitForTimeout(10000);
    
    // Take final screenshot to see if faces appeared
    await page.screenshot({ path: 'vectorization-complete.png', fullPage: true });
    console.log('📸 Screenshot saved: vectorization-complete.png');
    
    // Check for face indicators
    const faceInfo = await page.evaluate(() => {
      const faceIndicators = document.querySelectorAll('.face-indicator');
      const vectorizedBadges = document.querySelectorAll('.vectorization-badge');
      const processingIndicators = document.querySelectorAll('.processing-indicator');
      
      return {
        faceIndicators: faceIndicators.length,
        vectorizedBadges: vectorizedBadges.length,
        processingIndicators: processingIndicators.length,
        faceData: Array.from(faceIndicators).map(el => el.textContent.trim())
      };
    });
    
    console.log('👤 Face extraction results:', faceInfo);
    
    // Check if files have been updated with face data
    const updatedFiles = await page.evaluate(() => {
      return window.currentFiles ? window.currentFiles.filter(f => 
        f.faceCount > 0 || 
        f.extractedFaces?.length > 0 || 
        f.vectorizationStatus?.faces?.processed
      ).map(f => ({
        fileName: f.fileName,
        faceCount: f.faceCount,
        extractedFaces: f.extractedFaces?.length,
        vectorizationStatus: f.vectorizationStatus
      })) : [];
    });
    
    console.log('📁 Files with face data:', updatedFiles);
  }
  
  await browser.close();
}

testFullVectorization().catch(console.error);