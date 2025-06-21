const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Login first
  await page.goto('http://localhost:8357/pages/auth.html');
  await page.click('[data-tab="login"]');
  await page.fill('.login-email', 'weezer@yev.com');
  await page.fill('.login-password', '123456');
  await page.click('button:has-text("Access Your Memories")');
  await page.waitForNavigation();
  
  // Go to My Files
  await page.goto('http://localhost:8357/pages/my-files.html');
  await page.waitForTimeout(3000);
  
  console.log('📁 My Files page loaded');
  
  // Find and click on a face indicator
  const faceIndicators = await page.locator('.face-indicator').count();
  console.log(`👤 Found ${faceIndicators} files with faces`);
  
  if (faceIndicators > 0) {
    console.log('🖱️ Clicking on face indicator...');
    await page.locator('.face-indicator').first().click();
    await page.waitForTimeout(1500);
    
    // Take screenshot of the modal
    await page.screenshot({ path: 'faces-clean.png', fullPage: true });
    console.log('📸 Face modal screenshot taken');
    
    // Check if confidence text is gone
    const confidenceElements = await page.locator('.face-confidence').count();
    console.log(`📊 Confidence elements found: ${confidenceElements} (should be 0)`);
    
    // Count face thumbnails
    const faceImages = await page.locator('#facesModalGrid .face-thumb').count();
    console.log(`👤 Face thumbnails displayed: ${faceImages}`);
    
    // Check face labels only
    const faceLabels = await page.locator('#facesModalGrid .face-label').allTextContents();
    console.log('🏷️ Face labels:', faceLabels);
  }
  
  await browser.close();
})();