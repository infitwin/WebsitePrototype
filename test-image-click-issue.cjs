const { chromium } = require('playwright');

async function testImageClickIssue() {
  const browser = await chromium.launch({ headless: false, slowMo: 300 });
  const page = await browser.newPage();
  
  console.log('🧪 Testing image click vs checkbox selection issue...');
  
  // Monitor console logs
  page.on('console', msg => {
    if (msg.text().includes('showImageModal') || msg.text().includes('selectedFiles')) {
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
  
  // Check selected files state
  console.log('📊 Initial state check...');
  const initialState = await page.evaluate(() => {
    return {
      selectedFiles: window.selectedFiles ? Array.from(window.selectedFiles) : [],
      batchActionsVisible: document.getElementById('batchActions')?.style.display !== 'none'
    };
  });
  console.log('📊 Initial state:', initialState);
  
  // Find first image file
  const imageFiles = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('.file-card'));
    return cards.map((card, index) => {
      const thumbnail = card.querySelector('.file-thumbnail');
      const fileId = card.dataset.fileId;
      const isImage = thumbnail && thumbnail.tagName === 'IMG';
      return { index, fileId, isImage };
    }).filter(f => f.isImage);
  });
  
  console.log('📸 Found image files:', imageFiles);
  
  if (imageFiles.length > 0) {
    // Click on the first image thumbnail
    console.log('🖱️ Clicking on image thumbnail...');
    const firstImageCard = await page.locator('.file-card').nth(imageFiles[0].index);
    const thumbnail = firstImageCard.locator('.file-thumbnail');
    
    // Take screenshot before click
    await page.screenshot({ path: 'before-image-click.png', fullPage: true });
    
    // Click the image
    await thumbnail.click();
    await page.waitForTimeout(1000);
    
    // Check if image modal opened
    const imageModalVisible = await page.evaluate(() => {
      const modal = document.getElementById('imageModal');
      return modal && modal.classList.contains('active');
    });
    
    console.log('📊 Image modal visible:', imageModalVisible);
    
    // Check selected files state after image click
    const afterImageClick = await page.evaluate(() => {
      return {
        selectedFiles: window.selectedFiles ? Array.from(window.selectedFiles) : [],
        batchActionsVisible: document.getElementById('batchActions')?.style.display !== 'none',
        vectorizeButtonText: document.getElementById('vectorizeBtn')?.textContent || 'Not found'
      };
    });
    
    console.log('📊 After image click:', afterImageClick);
    
    // Take screenshot after click
    await page.screenshot({ path: 'after-image-click.png', fullPage: true });
    
    // Close modal if open
    if (imageModalVisible) {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    }
    
    // Now test checkbox selection
    console.log('🖱️ Testing checkbox selection...');
    await firstImageCard.hover();
    await page.waitForTimeout(500);
    
    const checkbox = firstImageCard.locator('.file-checkbox');
    await checkbox.check();
    await page.waitForTimeout(500);
    
    // Check state after checkbox
    const afterCheckbox = await page.evaluate(() => {
      return {
        selectedFiles: window.selectedFiles ? Array.from(window.selectedFiles) : [],
        batchActionsVisible: document.getElementById('batchActions')?.style.display !== 'none',
        vectorizeButtonText: document.getElementById('vectorizeBtn')?.textContent || 'Not found'
      };
    });
    
    console.log('📊 After checkbox selection:', afterCheckbox);
    
    // Take final screenshot
    await page.screenshot({ path: 'after-checkbox-selection.png', fullPage: true });
  }
  
  // Check the actual button text
  const buttonInfo = await page.evaluate(() => {
    const btn = document.getElementById('vectorizeBtn');
    return {
      exists: !!btn,
      innerHTML: btn?.innerHTML || 'Not found',
      textContent: btn?.textContent?.trim() || 'Not found',
      visible: btn ? window.getComputedStyle(btn).display !== 'none' : false
    };
  });
  
  console.log('🔘 Vectorize button info:', buttonInfo);
  
  setTimeout(() => browser.close(), 5000);
}

testImageClickIssue().catch(console.error);