const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Enable detailed console logging
  page.on('console', msg => {
    if (msg.text().includes('Face') || msg.text().includes('extract') || msg.text().includes('showFaces')) {
      console.log('🔍 CONSOLE:', msg.text());
    }
  });

  console.log('🔐 Logging in first...');
  await page.goto('http://localhost:8357/pages/auth.html');
  await page.click('[data-tab="login"]');
  await page.fill('.login-email', 'weezer@yev.com');
  await page.fill('.login-password', '123456');
  await page.click('button:has-text("Access Your Memories")');
  await page.waitForNavigation();
  
  console.log('📁 Going to My Files page...');
  await page.goto('http://localhost:8357/pages/my-files.html');
  
  // Wait for page to fully load - check for multiple indicators
  console.log('⏳ Waiting for page to fully load...');
  
  // Wait for files container to appear
  await page.waitForSelector('#filesContainer', { timeout: 10000 });
  console.log('✅ Files container found');
  
  // Wait for files to actually load
  await page.waitForSelector('.file-card', { timeout: 10000 });
  console.log('✅ File cards found');
  
  // Wait for face indicators specifically
  await page.waitForSelector('.face-indicator', { timeout: 10000 });
  console.log('✅ Face indicators found');
  
  // Wait a bit more for everything to settle
  await page.waitForTimeout(3000);
  console.log('✅ Extra wait complete');
  
  // Take screenshot before clicking
  await page.screenshot({ path: 'before-face-click-full-load.png', fullPage: true });
  
  // Now find and click on a face indicator
  const faceIndicators = await page.locator('.face-indicator').count();
  console.log(`👤 Found ${faceIndicators} files with faces`);
  
  if (faceIndicators > 0) {
    console.log('🖱️ Clicking on first face indicator...');
    await page.locator('.face-indicator').first().click();
    
    // Wait for modal to appear and load
    await page.waitForSelector('#faceModal.active', { timeout: 5000 });
    console.log('✅ Face modal appeared');
    
    // Wait for loading message to disappear
    await page.waitForFunction(() => {
      const grid = document.querySelector('#facesModalGrid');
      return grid && !grid.textContent.includes('Loading faces');
    }, { timeout: 10000 });
    console.log('✅ Loading message gone');
    
    // Wait for actual face images to load
    await page.waitForSelector('#facesModalGrid .face-thumb', { timeout: 10000 });
    console.log('✅ Face thumbnails loaded');
    
    // Wait a bit more for images to fully render
    await page.waitForTimeout(2000);
    
    // Take final screenshot
    await page.screenshot({ path: 'face-modal-fully-loaded.png', fullPage: true });
    console.log('📸 Final screenshot taken');
    
    // Check what's actually in the modal
    const modalContent = await page.locator('#facesModalGrid').innerHTML();
    console.log('📋 Modal content:', modalContent.substring(0, 200) + '...');
    
    // Check for confidence elements
    const confidenceElements = await page.locator('.face-confidence').count();
    console.log(`📊 Confidence elements: ${confidenceElements}`);
    
    // Check face images
    const faceImages = await page.locator('#facesModalGrid .face-thumb').count();
    console.log(`👤 Face images: ${faceImages}`);
    
    // Check if images have src attributes with data URLs
    const imageSources = await page.locator('#facesModalGrid .face-thumb').evaluateAll(imgs => 
      imgs.map(img => img.src.substring(0, 50))
    );
    console.log('🖼️ Image sources:', imageSources);
  }
  
  console.log('✅ Test complete - check face-modal-fully-loaded.png');
  await browser.close();
})();