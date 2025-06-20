const { chromium } = require('playwright');

async function testVectorizationUI() {
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const page = await browser.newPage();
  
  console.log('🧪 Testing vectorization UI implementation...');
  
  // Monitor console logs
  page.on('console', msg => {
    if (msg.text().includes('vectoriz') || msg.text().includes('🚀')) {
      console.log('BROWSER:', msg.text());
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
  
  // Check for new UI elements
  const uiElements = await page.evaluate(() => {
    return {
      quotaWidget: !!document.getElementById('vectorizationQuota'),
      quotaText: document.getElementById('quotaText')?.textContent || 'Not found',
      batchActions: !!document.getElementById('batchActions'),
      vectorizeButton: !!document.getElementById('vectorizeBtn'),
      checkboxes: document.querySelectorAll('.file-checkbox').length,
      vectorizedBadges: document.querySelectorAll('.vectorization-badge').length,
      faceIndicators: document.querySelectorAll('.face-indicator').length
    };
  });
  
  console.log('📊 UI Elements found:', uiElements);
  
  // Test file selection
  const checkboxes = await page.locator('.file-checkbox').all();
  if (checkboxes.length > 0) {
    console.log('✅ Found', checkboxes.length, 'file checkboxes');
    
    // Hover over first file to show checkbox
    const firstCard = await page.locator('.file-card').first();
    await firstCard.hover();
    await page.waitForTimeout(500);
    
    // Click first checkbox
    console.log('📌 Selecting first file...');
    await checkboxes[0].check();
    await page.waitForTimeout(500);
    
    // Check if batch actions appeared
    const batchActionsVisible = await page.evaluate(() => {
      const batchActions = document.getElementById('batchActions');
      return batchActions && batchActions.style.display !== 'none';
    });
    
    console.log('📊 Batch actions visible:', batchActionsVisible);
    
    // Take screenshot
    await page.screenshot({ path: 'vectorization-ui-test.png', fullPage: true });
    console.log('📸 Screenshot saved: vectorization-ui-test.png');
    
    if (batchActionsVisible) {
      console.log('✅ Batch actions appeared!');
      
      // Click vectorize button
      console.log('🔄 Clicking vectorize button...');
      await page.click('#vectorizeBtn');
      await page.waitForTimeout(2000);
      
      // Handle confirmation dialog
      page.on('dialog', async dialog => {
        console.log('📋 Dialog:', dialog.message());
        await dialog.accept();
      });
    }
  } else {
    console.log('❌ No file checkboxes found');
  }
  
  setTimeout(() => browser.close(), 5000);
}

testVectorizationUI().catch(console.error);