const { chromium } = require('playwright');

async function testVectorizationFix() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log('🧪 Testing vectorization fix...');
  
  // Monitor console for errors and alerts
  page.on('console', msg => {
    if (msg.type() === 'error' || msg.text().includes('vectoriz') || msg.text().includes('select')) {
      console.log('BROWSER:', msg.type().toUpperCase(), msg.text());
    }
  });
  
  page.on('dialog', async dialog => {
    console.log('🚨 ALERT:', dialog.message());
    await dialog.accept();
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
  
  // Check if currentFiles is available
  const filesInfo = await page.evaluate(() => {
    return {
      localCurrentFiles: typeof currentFiles !== 'undefined' ? currentFiles?.length : 'undefined',
      windowCurrentFiles: window.currentFiles ? window.currentFiles.length : 'undefined',
      selectedFiles: window.selectedFiles ? window.selectedFiles.size : 'undefined'
    };
  });
  
  console.log('📊 Files Info:', filesInfo);
  
  // Select an image file
  const imageCard = await page.locator('.file-card').filter({
    has: page.locator('img.file-thumbnail')
  }).first();
  
  if (await imageCard.count() > 0) {
    await imageCard.hover();
    await page.waitForTimeout(500);
    
    const checkbox = imageCard.locator('.file-checkbox');
    await checkbox.check();
    await page.waitForTimeout(1000);
    
    // Check what files are available for vectorization
    const vectorizationCheck = await page.evaluate(() => {
      const selectedFiles = Array.from(window.selectedFiles);
      console.log('Selected file IDs:', selectedFiles);
      
      const imageFiles = selectedFiles.filter(fileId => {
        const file = window.currentFiles?.find(f => f.id === fileId);
        console.log('Found file for ID', fileId, ':', file);
        if (file) {
          console.log('File type:', file.fileType || file.type);
          console.log('Is image:', file.fileType && file.fileType.startsWith('image/'));
        }
        return file && file.fileType && file.fileType.startsWith('image/');
      });
      
      return {
        selectedCount: selectedFiles.length,
        imageFilesCount: imageFiles.length,
        selectedFileIds: selectedFiles,
        imageFileIds: imageFiles
      };
    });
    
    console.log('📊 Vectorization Check:', vectorizationCheck);
    
    // Try clicking vectorize button
    console.log('🔄 Clicking Vectorize Selected button...');
    await page.click('#vectorizeBtn');
    await page.waitForTimeout(2000);
    
    console.log('✅ Test complete');
  }
  
  await browser.close();
}

testVectorizationFix().catch(console.error);