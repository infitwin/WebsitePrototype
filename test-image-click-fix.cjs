const { chromium } = require('playwright');

async function testImageClickFix() {
  const browser = await chromium.launch({ headless: false, slowMo: 300 });
  const page = await browser.newPage();
  
  console.log('🧪 Testing image click fix...');
  
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
  
  // First, upload a test image to ensure we have something to work with
  console.log('📤 Uploading test image...');
  await page.setInputFiles('#fileInput', '/home/tim/WebsitePrototype/playwright-testing/tests/test-face-image.jpg');
  await page.waitForTimeout(3000);
  
  // Apply the fix
  console.log('🔧 Applying image click fix...');
  await page.addScriptTag({ path: 'fix-image-click-selection.js' });
  await page.waitForTimeout(1000);
  
  // Find image files
  const imageCards = await page.locator('.file-card').filter({ 
    has: page.locator('img.file-thumbnail') 
  });
  
  const imageCount = await imageCards.count();
  console.log('📸 Found', imageCount, 'image files');
  
  if (imageCount > 0) {
    // Test 1: Click image thumbnail
    console.log('\n📊 Test 1: Clicking image thumbnail...');
    const firstCard = imageCards.first();
    const thumbnail = firstCard.locator('.file-thumbnail');
    
    await thumbnail.click();
    await page.waitForTimeout(1000);
    
    // Check states
    const afterImageClick = await page.evaluate(() => {
      return {
        selectedFiles: window.selectedFiles ? Array.from(window.selectedFiles) : [],
        selectedCount: window.selectedFiles ? window.selectedFiles.size : 0,
        batchActionsVisible: document.getElementById('batchActions')?.style.display !== 'none',
        imageModalVisible: document.getElementById('imageModal')?.classList.contains('active'),
        vectorizeButtonText: document.getElementById('vectorizeBtn')?.textContent?.trim()
      };
    });
    
    console.log('After image click:', afterImageClick);
    console.log('✅ Image modal opened:', afterImageClick.imageModalVisible);
    console.log('✅ No files selected:', afterImageClick.selectedCount === 0);
    console.log('✅ Batch actions hidden:', !afterImageClick.batchActionsVisible);
    console.log('✅ Button text correct:', afterImageClick.vectorizeButtonText);
    
    // Close modal
    if (afterImageClick.imageModalVisible) {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    }
    
    // Test 2: Select file with checkbox
    console.log('\n📊 Test 2: Selecting file with checkbox...');
    await firstCard.hover();
    await page.waitForTimeout(500);
    
    const checkbox = firstCard.locator('.file-checkbox');
    await checkbox.check();
    await page.waitForTimeout(500);
    
    const afterCheckbox = await page.evaluate(() => {
      return {
        selectedFiles: window.selectedFiles ? Array.from(window.selectedFiles) : [],
        selectedCount: window.selectedFiles ? window.selectedFiles.size : 0,
        batchActionsVisible: document.getElementById('batchActions')?.style.display !== 'none',
        vectorizeButtonText: document.getElementById('vectorizeBtn')?.textContent?.trim()
      };
    });
    
    console.log('After checkbox selection:', afterCheckbox);
    console.log('✅ File selected:', afterCheckbox.selectedCount === 1);
    console.log('✅ Batch actions visible:', afterCheckbox.batchActionsVisible);
    console.log('✅ Button text still correct:', afterCheckbox.vectorizeButtonText);
    
    // Take final screenshot
    await page.screenshot({ path: 'image-click-fix-result.png', fullPage: true });
    console.log('\n📸 Screenshot saved: image-click-fix-result.png');
    
    // Test 3: Click image again with file selected
    console.log('\n📊 Test 3: Clicking image with file already selected...');
    await thumbnail.click();
    await page.waitForTimeout(1000);
    
    const afterSecondClick = await page.evaluate(() => {
      return {
        selectedCount: window.selectedFiles ? window.selectedFiles.size : 0,
        imageModalVisible: document.getElementById('imageModal')?.classList.contains('active')
      };
    });
    
    console.log('After second image click:', afterSecondClick);
    console.log('✅ File still selected:', afterSecondClick.selectedCount === 1);
    console.log('✅ Image modal opened:', afterSecondClick.imageModalVisible);
  }
  
  setTimeout(() => browser.close(), 5000);
}

testImageClickFix().catch(console.error);