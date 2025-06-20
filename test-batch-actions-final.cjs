const { chromium } = require('playwright');

async function testBatchActionsFinal() {
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const page = await browser.newPage();
  
  console.log('🧪 Testing batch actions final placement...');
  
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
  
  // Select first file
  const firstCard = await page.locator('.file-card').first();
  await firstCard.hover();
  await page.waitForTimeout(500);
  
  const checkbox = firstCard.locator('.file-checkbox');
  await checkbox.check();
  await page.waitForTimeout(1000);
  
  // Take screenshot
  await page.screenshot({ path: 'batch-actions-final-result.png', fullPage: true });
  console.log('📸 SCREENSHOT: batch-actions-final-result.png');
  
  // Check batch actions
  const batchInfo = await page.evaluate(() => {
    const batch = document.getElementById('batchActions');
    const uploadZone = document.getElementById('uploadZone');
    const rect = batch ? batch.getBoundingClientRect() : null;
    const uploadRect = uploadZone ? uploadZone.getBoundingClientRect() : null;
    
    return {
      batchActions: {
        exists: !!batch,
        display: batch ? window.getComputedStyle(batch).display : 'not found',
        visible: batch ? batch.offsetHeight > 0 : false,
        position: rect ? { top: rect.top, left: rect.left, width: rect.width, height: rect.height } : null,
        parent: batch ? batch.parentElement.className : 'not found'
      },
      uploadZone: {
        position: uploadRect ? { top: uploadRect.top } : null
      },
      vectorizeButtonText: document.getElementById('vectorizeBtn')?.textContent?.trim()
    };
  });
  
  console.log('\n📊 Batch Actions Info:', JSON.stringify(batchInfo, null, 2));
  
  // Click image to test separation
  const imageCard = await page.locator('.file-card').filter({
    has: page.locator('img.file-thumbnail')
  }).first();
  
  if (await imageCard.count() > 0) {
    const thumbnail = imageCard.locator('.file-thumbnail');
    await thumbnail.click();
    await page.waitForTimeout(1500);
    
    await page.screenshot({ path: 'batch-actions-with-modal.png', fullPage: true });
    console.log('📸 SCREENSHOT: batch-actions-with-modal.png');
    
    const finalCheck = await page.evaluate(() => {
      return {
        modalOpen: document.getElementById('imageModal')?.classList.contains('active'),
        filesStillSelected: window.selectedFiles ? window.selectedFiles.size : 0,
        batchStillVisible: document.getElementById('batchActions')?.style.display !== 'none'
      };
    });
    
    console.log('\n📊 Final Check:', finalCheck);
  }
  
  setTimeout(() => browser.close(), 5000);
}

testBatchActionsFinal().catch(console.error);