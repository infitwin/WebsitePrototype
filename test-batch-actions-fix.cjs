const { chromium } = require('playwright');

async function testBatchActionsFix() {
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const page = await browser.newPage();
  
  console.log('🧪 Testing batch actions visibility fix...');
  
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
  
  // Find any file card
  const fileCard = await page.locator('.file-card').first();
  
  if (await fileCard.count() > 0) {
    console.log('✅ Found file card');
    
    // Hover and select
    await fileCard.hover();
    await page.waitForTimeout(500);
    
    const checkbox = fileCard.locator('.file-checkbox');
    await checkbox.check();
    await page.waitForTimeout(1000);
    
    // SCREENSHOT: Should show batch actions bar
    await page.screenshot({ path: 'batch-actions-fixed.png', fullPage: true });
    console.log('📸 SCREENSHOT: batch-actions-fixed.png - Should show batch actions bar');
    
    // Check if batch actions are visible
    const batchActionsInfo = await page.evaluate(() => {
      const batchActions = document.getElementById('batchActions');
      const vectorizeBtn = document.getElementById('vectorizeBtn');
      return {
        exists: !!batchActions,
        display: batchActions ? window.getComputedStyle(batchActions).display : 'not found',
        visibility: batchActions ? window.getComputedStyle(batchActions).visibility : 'not found',
        height: batchActions ? batchActions.offsetHeight : 0,
        vectorizeBtnText: vectorizeBtn ? vectorizeBtn.textContent.trim() : 'not found',
        selectedCount: window.selectedFiles ? window.selectedFiles.size : 0
      };
    });
    
    console.log('\n📊 Batch Actions Info:', JSON.stringify(batchActionsInfo, null, 2));
    
    // Also check if it's in the right position
    const position = await page.locator('#batchActions').boundingBox();
    console.log('📍 Batch Actions Position:', position);
  }
  
  setTimeout(() => browser.close(), 5000);
}

testBatchActionsFix().catch(console.error);