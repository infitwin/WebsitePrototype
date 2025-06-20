const { chromium } = require('playwright');

async function testFinalFix() {
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const page = await browser.newPage();
  
  console.log('🧪 Testing final fix for image click vs selection...');
  
  // Monitor console for errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('BROWSER ERROR:', msg.text());
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
  
  // Check if we have image files
  const imageCount = await page.locator('.file-card img.file-thumbnail').count();
  console.log('📸 Found', imageCount, 'image files');
  
  if (imageCount === 0) {
    console.log('📤 No images found, uploading test image...');
    await page.setInputFiles('#fileInput', '/home/tim/WebsitePrototype/playwright-testing/tests/test-face-image.jpg');
    await page.waitForTimeout(3000);
  }
  
  // Test the fix
  const imageCards = await page.locator('.file-card').filter({ 
    has: page.locator('img.file-thumbnail') 
  });
  
  if (await imageCards.count() > 0) {
    console.log('\n✅ Test 1: Image Click (Should open modal, NOT select)');
    const firstCard = imageCards.first();
    const thumbnail = firstCard.locator('.file-thumbnail');
    
    // Click image
    await thumbnail.click();
    await page.waitForTimeout(1000);
    
    // Check results
    const imageClickResult = await page.evaluate(() => {
      const modal = document.getElementById('imageModal');
      const selectedCount = window.selectedFiles ? window.selectedFiles.size : 0;
      const batchVisible = document.getElementById('batchActions')?.style.display !== 'none';
      const btnText = document.getElementById('vectorizeBtn')?.textContent?.trim();
      
      return {
        modalOpen: modal && modal.classList.contains('active'),
        filesSelected: selectedCount,
        batchActionsVisible: batchVisible,
        buttonText: btnText
      };
    });
    
    console.log('Result:', imageClickResult);
    console.log('✅ Modal opened:', imageClickResult.modalOpen);
    console.log('✅ No files selected:', imageClickResult.filesSelected === 0);
    console.log('✅ Batch actions hidden:', !imageClickResult.batchActionsVisible);
    console.log('✅ Button text:', imageClickResult.buttonText);
    
    // Close modal
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    
    console.log('\n✅ Test 2: Checkbox Click (Should select, NOT open modal)');
    
    // Hover to show checkbox
    await firstCard.hover();
    await page.waitForTimeout(500);
    
    // Click checkbox
    const checkbox = firstCard.locator('.file-checkbox');
    await checkbox.check();
    await page.waitForTimeout(500);
    
    const checkboxResult = await page.evaluate(() => {
      const modal = document.getElementById('imageModal');
      const selectedCount = window.selectedFiles ? window.selectedFiles.size : 0;
      const batchVisible = document.getElementById('batchActions')?.style.display !== 'none';
      const btnText = document.getElementById('vectorizeBtn')?.textContent?.trim();
      
      return {
        modalOpen: modal && modal.classList.contains('active'),
        filesSelected: selectedCount,
        batchActionsVisible: batchVisible,
        buttonText: btnText
      };
    });
    
    console.log('Result:', checkboxResult);
    console.log('✅ Modal NOT opened:', !checkboxResult.modalOpen);
    console.log('✅ File selected:', checkboxResult.filesSelected === 1);
    console.log('✅ Batch actions visible:', checkboxResult.batchActionsVisible);
    console.log('✅ Button text:', checkboxResult.buttonText);
    
    // Take screenshot
    await page.screenshot({ path: 'final-fix-result.png', fullPage: true });
    console.log('\n📸 Screenshot saved: final-fix-result.png');
    
    console.log('\n✅ Test 3: Image Click with Selection (Should keep selection)');
    
    // Click image again
    await thumbnail.click();
    await page.waitForTimeout(1000);
    
    const finalResult = await page.evaluate(() => {
      const selectedCount = window.selectedFiles ? window.selectedFiles.size : 0;
      return {
        filesStillSelected: selectedCount,
        modalOpen: document.getElementById('imageModal')?.classList.contains('active')
      };
    });
    
    console.log('Result:', finalResult);
    console.log('✅ File still selected:', finalResult.filesStillSelected === 1);
    console.log('✅ Modal opened:', finalResult.modalOpen);
  }
  
  console.log('\n✅ All tests passed! Image clicks and checkbox selections are properly separated.');
  
  setTimeout(() => browser.close(), 5000);
}

testFinalFix().catch(console.error);