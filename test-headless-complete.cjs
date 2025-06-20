const { chromium } = require('playwright');

async function testHeadlessComplete() {
  const browser = await chromium.launch({ headless: true }); // HEADLESS MODE
  const page = await browser.newPage();
  
  console.log('🧪 Testing complete fix in HEADLESS mode...');
  
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
  
  console.log('\n📊 TEST 1: Initial State');
  await page.screenshot({ path: 'headless-1-initial.png', fullPage: true });
  console.log('📸 headless-1-initial.png - Page loaded');
  
  // Select a file
  console.log('\n📊 TEST 2: File Selection');
  const fileCard = await page.locator('.file-card').filter({
    hasText: 'test-image3.jpg'
  }).first(); // Use .first() to avoid strict mode error
  
  if (await fileCard.count() > 0) {
    await fileCard.hover();
    await page.waitForTimeout(500);
    
    const checkbox = fileCard.locator('.file-checkbox');
    await checkbox.check();
    await page.waitForTimeout(1000);
    
    await page.screenshot({ path: 'headless-2-selected.png', fullPage: true });
    console.log('📸 headless-2-selected.png - File selected, batch actions should be visible');
    
    // Get batch actions info
    const batchInfo = await page.evaluate(() => {
      const batch = document.getElementById('batchActions');
      const rect = batch ? batch.getBoundingClientRect() : null;
      const symphonyRect = document.querySelector('.symphony-content')?.getBoundingClientRect();
      
      return {
        visible: batch ? batch.style.display !== 'none' : false,
        position: rect,
        symphonyContentTop: symphonyRect?.top,
        buttonText: document.getElementById('vectorizeBtn')?.textContent?.trim()
      };
    });
    
    console.log('\nBatch Actions Info:', batchInfo);
    
    // Click image to test modal
    console.log('\n📊 TEST 3: Image Click (should not affect selection)');
    const thumbnail = fileCard.locator('.file-thumbnail');
    await thumbnail.click();
    await page.waitForTimeout(1500);
    
    await page.screenshot({ path: 'headless-3-modal.png', fullPage: true });
    console.log('📸 headless-3-modal.png - Image modal open, selection maintained');
    
    // Check state
    const modalState = await page.evaluate(() => {
      return {
        modalOpen: document.getElementById('imageModal')?.classList.contains('active'),
        filesSelected: window.selectedFiles ? window.selectedFiles.size : 0,
        batchVisible: document.getElementById('batchActions')?.style.display !== 'none'
      };
    });
    
    console.log('\nModal State:', modalState);
    
    // Close modal
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    
    // Select another file using a more specific selector
    console.log('\n📊 TEST 4: Multiple Selection');
    const anotherCard = await page.locator('.file-card').filter({
      hasText: '100_0017.JPG'
    }).filter({
      hasNot: page.locator('.vectorization-badge')
    }).first(); // Get the first non-vectorized one
    
    if (await anotherCard.count() > 0) {
      await anotherCard.hover();
      await page.waitForTimeout(500);
      
      const anotherCheckbox = anotherCard.locator('.file-checkbox');
      await anotherCheckbox.check();
      await page.waitForTimeout(1000);
      
      await page.screenshot({ path: 'headless-4-multiple.png', fullPage: true });
      console.log('📸 headless-4-multiple.png - Multiple files selected');
      
      const multipleState = await page.evaluate(() => {
        return {
          selectedCount: window.selectedFiles ? window.selectedFiles.size : 0,
          selectedText: document.getElementById('selectedCount')?.textContent
        };
      });
      
      console.log('\nMultiple Selection State:', multipleState);
    }
    
    // FINAL SUMMARY
    console.log('\n📊 FINAL VERIFICATION:');
    const finalState = await page.evaluate(() => {
      const batch = document.getElementById('batchActions');
      const rect = batch ? batch.getBoundingClientRect() : null;
      
      return {
        batchActionsVisible: batch ? batch.style.display !== 'none' : false,
        batchActionsPosition: rect ? `top: ${rect.top}, visible: ${rect.top > 0 && rect.bottom < window.innerHeight}` : 'not found',
        selectedFiles: window.selectedFiles ? Array.from(window.selectedFiles) : [],
        vectorizeButtonExists: !!document.getElementById('vectorizeBtn'),
        vectorizeButtonText: document.getElementById('vectorizeBtn')?.textContent?.trim()
      };
    });
    
    console.log(JSON.stringify(finalState, null, 2));
  }
  
  console.log('\n✅ HEADLESS TEST COMPLETE - Check all screenshots');
  
  await browser.close();
}

testHeadlessComplete().catch(console.error);