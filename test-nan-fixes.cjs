const { chromium } = require('playwright');

async function testNaNFixes() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log('🧪 Testing NaN fixes...');
  
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
  await page.waitForTimeout(8000); // Wait for file loading
  
  // Take screenshot after fixes
  await page.screenshot({ path: 'nan-fixes-applied.png', fullPage: true });
  console.log('📸 Screenshot after NaN fixes saved');
  
  // Check for NaN occurrences
  const nanCheck = await page.evaluate(() => {
    const storageText = document.querySelector('.storage-text') ? document.querySelector('.storage-text').textContent : 'No storage text';
    const storagePercent = document.getElementById('storagePercent') ? document.getElementById('storagePercent').textContent : 'No storage percent';
    
    const fileNames = Array.from(document.querySelectorAll('.file-name')).map(el => el.textContent.trim());
    const fileMetas = Array.from(document.querySelectorAll('.file-meta')).map(el => el.textContent.trim());
    
    return {
      storageText,
      storagePercent,
      fileNamesWithNaN: fileNames.filter(name => name.includes('NaN') || name === ''),
      fileMetasWithNaN: fileMetas.filter(meta => meta.includes('NaN') || meta.includes('Invalid')),
      totalFiles: document.querySelectorAll('.file-card').length,
      totalFileNames: fileNames.length,
      sampleFileNames: fileNames.slice(0, 5),
      sampleFileMetas: fileMetas.slice(0, 3)
    };
  });
  
  console.log('📊 NaN check results:');
  console.log(JSON.stringify(nanCheck, null, 2));
  
  if (nanCheck.fileNamesWithNaN.length === 0 && 
      nanCheck.fileMetasWithNaN.length === 0 && 
      !nanCheck.storageText.includes('NaN') &&
      !nanCheck.storagePercent.includes('NaN')) {
    console.log('✅ ALL NaN ERRORS FIXED!');
  } else {
    console.log('❌ Some NaN errors still remain');
  }
  
  await browser.close();
}

testNaNFixes().catch(console.error);