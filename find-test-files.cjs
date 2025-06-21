const { chromium } = require('playwright');

async function findTestFiles() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
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
  
  const testableFiles = await page.evaluate(() => {
    return window.currentFiles?.map(f => ({
      id: f.id,
      fileName: f.fileName,
      fileSize: f.fileSize,
      fileType: f.fileType,
      hasVectorization: (f.faceCount > 0 || (f.extractedFaces && f.extractedFaces.length > 0)),
      isImage: f.fileType && f.fileType.startsWith('image/'),
      isLargeEnough: f.fileSize > 1000
    })).filter(f => f.isImage && f.isLargeEnough && !f.hasVectorization) || [];
  });
  
  console.log('📁 FILES SUITABLE FOR TESTING:');
  testableFiles.forEach(f => console.log(JSON.stringify(f, null, 2)));
  
  await browser.close();
}

findTestFiles().catch(console.error);