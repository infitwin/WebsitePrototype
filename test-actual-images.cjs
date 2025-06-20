const { chromium } = require('playwright');

async function testActualImages() {
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const page = await browser.newPage();
  
  console.log('🧪 Testing with ACTUAL images on the page...');
  
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
  
  // SCREENSHOT 1: Initial state
  await page.screenshot({ path: 'test-1-initial.png', fullPage: true });
  console.log('📸 SCREENSHOT 1: test-1-initial.png');
  
  // Find the second image (test-image3.jpg - the woman in restaurant)
  const imageCard = await page.locator('.file-card').filter({
    hasText: 'test-image3.jpg'
  });
  
  if (await imageCard.count() > 0) {
    console.log('✅ Found test-image3.jpg');
    
    // Click the image thumbnail
    const thumbnail = imageCard.locator('.file-thumbnail');
    await thumbnail.click();
    await page.waitForTimeout(2000);
    
    // SCREENSHOT 2: After clicking image
    await page.screenshot({ path: 'test-2-after-image-click.png', fullPage: true });
    console.log('📸 SCREENSHOT 2: test-2-after-image-click.png - Should show image modal');
    
    // Check vectorize button text
    const vectorizeText = await page.locator('#vectorizeBtn').textContent();
    console.log('🔘 Vectorize button text:', vectorizeText);
    
    // Check if any files are selected
    const selectedCount = await page.evaluate(() => window.selectedFiles ? window.selectedFiles.size : 0);
    console.log('📊 Selected files count:', selectedCount);
    
    // Close modal
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1000);
    
    // Now select with checkbox
    await imageCard.hover();
    await page.waitForTimeout(500);
    
    const checkbox = imageCard.locator('.file-checkbox');
    await checkbox.check();
    await page.waitForTimeout(1000);
    
    // SCREENSHOT 3: After checkbox selection
    await page.screenshot({ path: 'test-3-after-checkbox.png', fullPage: true });
    console.log('📸 SCREENSHOT 3: test-3-after-checkbox.png - Should show batch actions');
    
    // Check if batch actions are visible
    const batchActionsVisible = await page.locator('#batchActions').isVisible();
    console.log('📊 Batch actions visible:', batchActionsVisible);
    
    // Click image again with selection
    await thumbnail.click();
    await page.waitForTimeout(2000);
    
    // SCREENSHOT 4: Image click with selection
    await page.screenshot({ path: 'test-4-image-with-selection.png', fullPage: true });
    console.log('📸 SCREENSHOT 4: test-4-image-with-selection.png - Should keep selection');
    
    // Final check
    const finalSelectedCount = await page.evaluate(() => window.selectedFiles ? window.selectedFiles.size : 0);
    console.log('📊 Final selected count:', finalSelectedCount);
  }
  
  console.log('\n📸 CHECK THESE SCREENSHOTS:');
  console.log('- test-1-initial.png');
  console.log('- test-2-after-image-click.png');
  console.log('- test-3-after-checkbox.png');
  console.log('- test-4-image-with-selection.png');
  
  setTimeout(() => browser.close(), 5000);
}

testActualImages().catch(console.error);