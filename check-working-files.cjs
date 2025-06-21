const { chromium } = require('playwright');

async function checkWorkingFiles() {
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
  
  const workingFiles = await page.evaluate(() => {
    const filesWithFaces = window.currentFiles?.filter(f => 
      f.faceCount > 0 || (f.extractedFaces && f.extractedFaces.length > 0)
    ) || [];
    return filesWithFaces.map(f => ({
      id: f.id,
      fileName: f.fileName,
      uploadedAt: f.uploadedAt,
      vectorizationCompletedAt: f.vectorizationCompletedAt,
      hasError: f.vectorizationError ? true : false,
      faceCount: f.faceCount,
      extractedFacesLength: f.extractedFaces ? f.extractedFaces.length : 0
    }));
  });
  
  console.log('📁 ALL WORKING VECTORIZED FILES:');
  workingFiles.forEach(f => console.log(JSON.stringify(f, null, 2)));
  
  await browser.close();
}

checkWorkingFiles().catch(console.error);