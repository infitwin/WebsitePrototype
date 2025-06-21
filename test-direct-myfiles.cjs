const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // First login directly on auth page
  await page.goto('http://localhost:8357/pages/auth.html');
  await page.click('[data-tab="login"]');
  await page.fill('.login-email', 'weezer@yev.com');
  await page.fill('.login-password', '123456');
  await page.click('button:has-text("Access Your Memories")');
  
  // Wait for redirect
  await page.waitForNavigation();
  
  // Now go directly to My Files
  await page.goto('http://localhost:8357/pages/my-files.html');
  await page.waitForTimeout(3000);
  
  // Take screenshot
  await page.screenshot({ path: 'myfiles-direct.png', fullPage: true });
  
  // Count files
  const fileCount = await page.locator('.file-card').count();
  console.log(`Found ${fileCount} files`);
  
  // Check for faces
  const faceCount = await page.locator('.face-indicator').count();
  console.log(`Found ${faceCount} files with faces`);
  
  // Click on a face indicator if exists
  if (faceCount > 0) {
    await page.locator('.face-indicator').first().click();
    await page.waitForTimeout(2000);
    
    // Check face modal
    const modal = await page.locator('#faceModal.active');
    if (await modal.isVisible()) {
      console.log('Face modal opened successfully');
      
      // Check for real face images
      const realFaces = await page.locator('#facesModalGrid img:not([src*="svg"])').count();
      console.log(`Found ${realFaces} real face images`);
      
      await page.screenshot({ path: 'myfiles-face-modal.png', fullPage: true });
    }
  }
  
  await browser.close();
})();