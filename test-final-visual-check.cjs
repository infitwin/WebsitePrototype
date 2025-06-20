const { chromium } = require('playwright');

async function testFinalVisualCheck() {
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const page = await browser.newPage();
  
  console.log('🧪 Final visual check of all fixes...');
  
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
  
  // Move batch actions to correct location
  await page.evaluate(() => {
    const batchActions = document.getElementById('batchActions');
    const symphonyContent = document.querySelector('.symphony-content');
    const uploadZone = document.getElementById('uploadZone');
    
    if (batchActions && symphonyContent && uploadZone) {
      // Insert batch actions right before the upload zone
      symphonyContent.insertBefore(batchActions, uploadZone);
      console.log('Moved batch actions to correct location');
    }
  });
  
  // SCREENSHOT 1: Initial state
  await page.screenshot({ path: 'final-1-initial.png', fullPage: true });
  console.log('📸 1. Initial state: final-1-initial.png');
  
  // Select first file
  const firstCard = await page.locator('.file-card').first();
  await firstCard.hover();
  await page.waitForTimeout(500);
  
  const checkbox = firstCard.locator('.file-checkbox');
  await checkbox.check();
  await page.waitForTimeout(1000);
  
  // SCREENSHOT 2: With selection
  await page.screenshot({ path: 'final-2-selected.png', fullPage: true });
  console.log('📸 2. File selected: final-2-selected.png');
  
  // Check batch actions visibility
  const batchInfo = await page.evaluate(() => {
    const batch = document.getElementById('batchActions');
    const rect = batch ? batch.getBoundingClientRect() : null;
    return {
      visible: batch ? batch.style.display !== 'none' : false,
      position: rect ? { top: rect.top, height: rect.height } : null,
      buttonText: document.getElementById('vectorizeBtn')?.textContent?.trim()
    };
  });
  
  console.log('\n📊 Batch Actions Info:', batchInfo);
  
  // Click image to test modal
  const imageCard = await page.locator('.file-card').filter({
    has: page.locator('img.file-thumbnail')
  }).first();
  
  if (await imageCard.count() > 0) {
    const thumbnail = imageCard.locator('.file-thumbnail');
    await thumbnail.click();
    await page.waitForTimeout(1500);
    
    // SCREENSHOT 3: Image modal with selection
    await page.screenshot({ path: 'final-3-modal.png', fullPage: true });
    console.log('📸 3. Image modal open: final-3-modal.png');
    
    // Check if selection is maintained
    const stillSelected = await page.evaluate(() => window.selectedFiles ? window.selectedFiles.size : 0);
    console.log('📊 Files still selected:', stillSelected);
  }
  
  console.log('\n✅ Check all screenshots to verify fixes');
  
  setTimeout(() => browser.close(), 5000);
}

testFinalVisualCheck().catch(console.error);