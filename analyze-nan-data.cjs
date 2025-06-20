const { chromium } = require('playwright');

async function analyzeFileData() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log('🔍 Analyzing file data structure to fix NaN issues...');
  
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
  
  // Capture the actual file data structure
  const fileDataStructure = await page.evaluate(() => {
    // Look at the first file card to see what data is available
    const firstCard = document.querySelector('.file-card');
    if (!firstCard) return { error: 'No file cards found' };
    
    // Get the file ID and try to access the file data
    const fileId = firstCard.dataset.fileId;
    
    // Check what properties are available in currentFiles global variable
    const fileInfo = {
      fileId: fileId,
      currentFilesExists: typeof window.currentFiles !== 'undefined',
      currentFilesLength: window.currentFiles ? window.currentFiles.length : 0,
      firstFileData: window.currentFiles && window.currentFiles[0] ? Object.keys(window.currentFiles[0]) : [],
      firstFileExample: window.currentFiles && window.currentFiles[0] ? window.currentFiles[0] : null,
      
      // Check DOM content
      firstCardFileName: firstCard.querySelector('.file-name') ? firstCard.querySelector('.file-name').textContent : 'No file name element',
      firstCardMeta: firstCard.querySelector('.file-meta') ? firstCard.querySelector('.file-meta').textContent : 'No meta element'
    };
    
    return fileInfo;
  });
  
  console.log('📊 File data structure analysis:');
  console.log(JSON.stringify(fileDataStructure, null, 2));
  
  // Also check storage data
  const storageData = await page.evaluate(() => {
    const storageText = document.querySelector('.storage-text');
    const storagePercent = document.getElementById('storagePercent');
    
    return {
      storageTextContent: storageText ? storageText.textContent : 'No storage text',
      storagePercentContent: storagePercent ? storagePercent.textContent : 'No storage percent',
      
      // Check if storage calculation functions exist
      calculateStorageUsedExists: typeof window.calculateStorageUsed !== 'undefined'
    };
  });
  
  console.log('💾 Storage data analysis:');
  console.log(JSON.stringify(storageData, null, 2));
  
  await browser.close();
}

analyzeFileData().catch(console.error);