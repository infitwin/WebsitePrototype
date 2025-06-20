const { chromium } = require('playwright');

async function visualVerificationTest() {
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const page = await browser.newPage();
  
  console.log('🧪 Starting VISUAL VERIFICATION test...');
  
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
  await page.screenshot({ path: 'visual-1-initial-state.png', fullPage: true });
  console.log('📸 SCREENSHOT 1: visual-1-initial-state.png - Shows initial page state');
  
  // Count images
  const imageCount = await page.locator('.file-card img.file-thumbnail').count();
  console.log('📊 Image files found:', imageCount);
  
  if (imageCount > 0) {
    // Get first image card
    const firstCard = await page.locator('.file-card').filter({ 
      has: page.locator('img.file-thumbnail') 
    }).first();
    
    // SCREENSHOT 2: Before clicking image
    await page.screenshot({ path: 'visual-2-before-image-click.png', fullPage: true });
    console.log('📸 SCREENSHOT 2: visual-2-before-image-click.png - Before clicking image');
    
    // Click the image thumbnail
    const thumbnail = firstCard.locator('.file-thumbnail');
    await thumbnail.click();
    await page.waitForTimeout(1500);
    
    // SCREENSHOT 3: After clicking image
    await page.screenshot({ path: 'visual-3-after-image-click.png', fullPage: true });
    console.log('📸 SCREENSHOT 3: visual-3-after-image-click.png - After clicking image');
    
    // Get actual state
    const afterImageClick = await page.evaluate(() => {
      return {
        imageModalVisible: document.getElementById('imageModal')?.classList.contains('active'),
        selectedFilesCount: window.selectedFiles ? window.selectedFiles.size : 0,
        batchActionsDisplay: document.getElementById('batchActions')?.style.display,
        vectorizeButtonText: document.getElementById('vectorizeBtn')?.textContent?.trim(),
        anyCheckboxChecked: document.querySelectorAll('.file-checkbox:checked').length
      };
    });
    
    console.log('\n📊 ACTUAL STATE after image click:', JSON.stringify(afterImageClick, null, 2));
    
    // Close modal if open
    if (afterImageClick.imageModalVisible) {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(1000);
    }
    
    // Now test checkbox
    await firstCard.hover();
    await page.waitForTimeout(500);
    
    // SCREENSHOT 4: Hovering over card
    await page.screenshot({ path: 'visual-4-hovering-card.png', fullPage: true });
    console.log('📸 SCREENSHOT 4: visual-4-hovering-card.png - Hovering to show checkbox');
    
    // Click checkbox
    const checkbox = firstCard.locator('.file-checkbox');
    await checkbox.check();
    await page.waitForTimeout(1000);
    
    // SCREENSHOT 5: After checkbox selection
    await page.screenshot({ path: 'visual-5-after-checkbox.png', fullPage: true });
    console.log('📸 SCREENSHOT 5: visual-5-after-checkbox.png - After selecting checkbox');
    
    const afterCheckbox = await page.evaluate(() => {
      return {
        imageModalVisible: document.getElementById('imageModal')?.classList.contains('active'),
        selectedFilesCount: window.selectedFiles ? window.selectedFiles.size : 0,
        batchActionsDisplay: document.getElementById('batchActions')?.style.display,
        vectorizeButtonText: document.getElementById('vectorizeBtn')?.textContent?.trim(),
        checkboxChecked: document.querySelectorAll('.file-checkbox:checked').length,
        cardHasSelectedClass: document.querySelectorAll('.file-card.selected').length
      };
    });
    
    console.log('\n📊 ACTUAL STATE after checkbox:', JSON.stringify(afterCheckbox, null, 2));
    
    // Now click image again with selection
    await thumbnail.click();
    await page.waitForTimeout(1500);
    
    // SCREENSHOT 6: Image click with selection
    await page.screenshot({ path: 'visual-6-image-click-with-selection.png', fullPage: true });
    console.log('📸 SCREENSHOT 6: visual-6-image-click-with-selection.png - Clicking image with file selected');
    
    const finalState = await page.evaluate(() => {
      return {
        imageModalVisible: document.getElementById('imageModal')?.classList.contains('active'),
        selectedFilesCount: window.selectedFiles ? window.selectedFiles.size : 0,
        checkboxStillChecked: document.querySelectorAll('.file-checkbox:checked').length
      };
    });
    
    console.log('\n📊 FINAL STATE:', JSON.stringify(finalState, null, 2));
    
  } else {
    console.log('❌ NO IMAGES FOUND - Cannot test image click behavior');
    console.log('📸 Check visual-1-initial-state.png to see what files are available');
  }
  
  console.log('\n📸 PLEASE CHECK ALL SCREENSHOTS TO VERIFY BEHAVIOR');
  console.log('Screenshots saved:');
  console.log('- visual-1-initial-state.png');
  console.log('- visual-2-before-image-click.png'); 
  console.log('- visual-3-after-image-click.png');
  console.log('- visual-4-hovering-card.png');
  console.log('- visual-5-after-checkbox.png');
  console.log('- visual-6-image-click-with-selection.png');
  
  setTimeout(() => browser.close(), 5000);
}

visualVerificationTest().catch(console.error);