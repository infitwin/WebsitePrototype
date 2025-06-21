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

  console.log('🔍 Debugging image loading issues...');

  // Check all file cards with images
  const fileCards = await page.locator('.file-card').count();
  console.log(`📁 Found ${fileCards} file cards`);

  for (let i = 0; i < fileCards; i++) {
    const card = page.locator('.file-card').nth(i);
    const fileName = await card.locator('.file-name').textContent();
    
    // Check thumbnail image
    const thumbnailImg = card.locator('.thumbnail-image');
    if (await thumbnailImg.count() > 0) {
      const imgSrc = await thumbnailImg.getAttribute('src');
      const imgNaturalWidth = await thumbnailImg.evaluate(img => img.naturalWidth);
      const imgNaturalHeight = await thumbnailImg.evaluate(img => img.naturalHeight);
      const imgComplete = await thumbnailImg.evaluate(img => img.complete);
      
      console.log(`🖼️ ${fileName}:`);
      console.log(`   - Source: ${imgSrc?.substring(0, 80)}...`);
      console.log(`   - Dimensions: ${imgNaturalWidth}x${imgNaturalHeight}`);
      console.log(`   - Complete: ${imgComplete}`);
      
      if (imgNaturalWidth === 0 || imgNaturalHeight === 0) {
        console.log(`   ❌ Image failed to load!`);
      }
    } else {
      console.log(`📄 ${fileName}: No thumbnail image`);
    }
    
    // Check for face indicators
    const faceIndicator = card.locator('.face-indicator');
    if (await faceIndicator.count() > 0) {
      const faceText = await faceIndicator.textContent();
      console.log(`   👤 ${faceText}`);
    }
  }

  // Take screenshot of current state
  await page.screenshot({ path: 'debug-image-loading.png', fullPage: true });
  console.log('📸 Screenshot saved: debug-image-loading.png');

  await browser.close();
})();