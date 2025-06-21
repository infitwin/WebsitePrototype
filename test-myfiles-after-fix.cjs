const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Enable console logging
  page.on('console', msg => console.log('CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  console.log('🔍 Navigating to My Files page...');
  await page.goto('http://localhost:8357/pages/my-files.html');
  
  // Wait a bit for JavaScript to load
  await page.waitForTimeout(3000);
  
  // Check current URL
  console.log('📍 Current URL:', page.url());
  
  // Take screenshot
  await page.screenshot({ path: 'after-fix-initial.png', fullPage: true });
  
  // Check if redirected to auth
  if (page.url().includes('auth.html')) {
    console.log('🔐 Redirected to auth page, logging in...');
    
    await page.click('[data-tab="login"]');
    await page.fill('.login-email', 'weezer@yev.com');
    await page.fill('.login-password', '123456');
    await page.click('button:has-text("Access Your Memories")');
    
    // Wait for navigation
    await page.waitForNavigation();
    console.log('📍 After login URL:', page.url());
    
    // If redirected to My Files, wait for it to load
    if (page.url().includes('my-files.html')) {
      await page.waitForTimeout(3000);
      await page.screenshot({ path: 'after-fix-logged-in.png', fullPage: true });
      
      // Check for file cards
      const fileCount = await page.locator('.file-card').count();
      console.log(`📁 Found ${fileCount} files`);
      
      // Check for any face indicators
      const faceIndicators = await page.locator('.face-indicator').count();
      console.log(`👤 Found ${faceIndicators} files with faces`);
      
      // Try clicking on a face indicator if available
      if (faceIndicators > 0) {
        console.log('🖱️ Clicking on first face indicator...');
        await page.locator('.face-indicator').first().click();
        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'after-fix-face-modal.png', fullPage: true });
      }
    }
  }
  
  console.log('✅ Test complete');
  await browser.close();
})();