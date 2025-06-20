const { chromium } = require('playwright');

async function testScrollCheck() {
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const page = await browser.newPage();
  
  console.log('🧪 Checking batch actions with scrolling...');
  
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
  
  // Check where batch actions are
  const batchLocation = await page.evaluate(() => {
    const batch = document.getElementById('batchActions');
    const rect = batch ? batch.getBoundingClientRect() : null;
    
    // Also check computed styles
    const styles = batch ? window.getComputedStyle(batch) : null;
    
    // Scroll to batch actions if they exist
    if (batch) {
      batch.scrollIntoView({ behavior: 'instant', block: 'start' });
    }
    
    return {
      exists: !!batch,
      rect: rect,
      styles: styles ? {
        display: styles.display,
        visibility: styles.visibility,
        position: styles.position,
        top: styles.top,
        zIndex: styles.zIndex,
        background: styles.background
      } : null,
      innerHTML: batch ? batch.innerHTML.substring(0, 100) : 'not found'
    };
  });
  
  console.log('\n📊 Batch Actions Location:', JSON.stringify(batchLocation, null, 2));
  
  // Take screenshot after scrolling
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'batch-actions-scrolled.png', fullPage: true });
  console.log('📸 SCREENSHOT: batch-actions-scrolled.png');
  
  // Try to click the vectorize button directly
  try {
    await page.click('#vectorizeBtn', { timeout: 2000 });
    console.log('✅ Successfully clicked vectorize button');
  } catch (e) {
    console.log('❌ Could not click vectorize button:', e.message);
    
    // Try to make it visible with JavaScript
    await page.evaluate(() => {
      const batch = document.getElementById('batchActions');
      if (batch) {
        batch.style.display = 'block !important';
        batch.style.visibility = 'visible !important';
        batch.style.opacity = '1 !important';
        batch.style.position = 'relative !important';
        batch.style.zIndex = '1000 !important';
      }
    });
    
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'batch-actions-forced-visible.png', fullPage: true });
    console.log('📸 SCREENSHOT: batch-actions-forced-visible.png - After forcing visibility');
  }
  
  setTimeout(() => browser.close(), 5000);
}

testScrollCheck().catch(console.error);