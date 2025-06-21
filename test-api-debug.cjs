const { chromium } = require('playwright');

async function debugApiCall() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log('🔍 Debugging API call format...');
  
  // Monitor network requests
  page.on('request', request => {
    if (request.url().includes('process-image')) {
      console.log('📤 API REQUEST:', {
        url: request.url(),
        method: request.method(),
        headers: request.headers(),
        body: request.postData()
      });
    }
  });
  
  page.on('response', response => {
    if (response.url().includes('process-image')) {
      console.log('📥 API RESPONSE:', {
        status: response.status(),
        statusText: response.statusText(),
        headers: response.headers()
      });
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
  
  // Get file details for API format analysis
  const fileDetails = await page.evaluate(() => {
    const file = window.currentFiles?.find(f => 
      (!f.faceCount || f.faceCount === 0) && 
      (!f.extractedFaces || f.extractedFaces.length === 0)
    );
    return file ? {
      id: file.id,
      fileName: file.fileName,
      name: file.name,
      downloadURL: file.downloadURL,
      fileType: file.fileType,
      fileSize: file.fileSize,
      storagePath: file.storagePath
    } : null;
  });
  
  console.log('📁 File for testing:', fileDetails);
  
  if (!fileDetails) {
    console.log('❌ No clean file available');
    await browser.close();
    return;
  }
  
  // Select file and try vectorization
  const fileCard = page.locator(`[data-file-id="${fileDetails.id}"]`);
  await fileCard.hover();
  await page.waitForTimeout(500);
  
  const checkbox = fileCard.locator('.file-checkbox');
  await checkbox.check();
  await page.waitForTimeout(1000);
  
  console.log('🔄 Starting vectorization to capture API call...');
  await page.click('#vectorizeBtn');
  
  // Accept dialog
  await page.waitForTimeout(1000);
  
  // Wait for API call
  await page.waitForTimeout(5000);
  
  await browser.close();
}

debugApiCall().catch(console.error);