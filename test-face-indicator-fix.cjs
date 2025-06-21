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
  await page.waitForSelector('.file-card', { timeout: 10000 });
  await page.waitForTimeout(3000);

  console.log('📸 Taking screenshot after face indicator positioning fix...');
  await page.screenshot({ path: 'face-indicator-fixed.png', fullPage: true });
  
  // Check if images are visible now
  const faceIndicators = await page.locator('.face-indicator').count();
  console.log(`👤 Found ${faceIndicators} face indicators`);
  
  // Check if any images are still covered
  for (let i = 0; i < Math.min(faceIndicators, 3); i++) {
    const card = page.locator('.face-indicator').nth(i).locator('..').locator('..');
    const fileName = await card.locator('.file-name').textContent();
    const img = card.locator('.thumbnail-image');
    
    if (await img.count() > 0) {
      const imgRect = await img.boundingBox();
      const indicatorRect = await card.locator('.face-indicator').boundingBox();
      
      console.log(`🖼️ ${fileName}:`);
      console.log(`   Image: x=${imgRect.x}, y=${imgRect.y}, w=${imgRect.width}, h=${imgRect.height}`);
      console.log(`   Indicator: x=${indicatorRect.x}, y=${indicatorRect.y}, w=${indicatorRect.width}, h=${indicatorRect.height}`);
      
      // Check if indicator is overlapping significantly with image
      const overlap = (indicatorRect.x < imgRect.x + imgRect.width && 
                      indicatorRect.x + indicatorRect.width > imgRect.x &&
                      indicatorRect.y < imgRect.y + imgRect.height && 
                      indicatorRect.y + indicatorRect.height > imgRect.y);
      
      if (overlap) {
        console.log(`   ⚠️ Still overlapping`);
      } else {
        console.log(`   ✅ No overlap`);
      }
    }
  }
  
  console.log('✅ Check face-indicator-fixed.png for results');
  await browser.close();
})();