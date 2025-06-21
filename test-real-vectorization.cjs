const { chromium } = require('playwright');

async function testRealVectorization() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log('🧪 Testing vectorization with real image file...');
  
  // Monitor network requests with full details
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
  
  page.on('response', async response => {
    if (response.url().includes('process-image')) {
      console.log('📥 API RESPONSE:', {
        status: response.status(),
        statusText: response.statusText(),
        headers: response.headers()
      });
      
      try {
        const responseText = await response.text();
        console.log('📥 RESPONSE BODY:', responseText);
      } catch (e) {
        console.log('📥 Could not read response body:', e.message);
      }
    }
  });
  
  // Monitor console logs
  page.on('console', msg => {
    console.log('BROWSER:', msg.type().toUpperCase(), msg.text());
  });
  
  page.on('dialog', async dialog => {
    console.log('🚨 DIALOG:', dialog.message());
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
  
  // Use the test-image3.jpg file (6MB image file)
  const targetFileId = 'file_1750436548522_i7a3s6sze';
  
  console.log('🎯 Testing with real image file:', targetFileId);
  
  // Take before screenshot
  await page.screenshot({ path: 'before-real-vectorization.png', fullPage: true });
  console.log('📸 Before screenshot saved');
  
  // Select the real image file
  const fileCard = page.locator(`[data-file-id="${targetFileId}"]`);
  await fileCard.hover();
  await page.waitForTimeout(500);
  
  const checkbox = fileCard.locator('.file-checkbox');
  await checkbox.check();
  await page.waitForTimeout(1000);
  
  console.log('🔄 Starting vectorization with real image...');
  await page.click('#vectorizeBtn');
  
  // Wait for vectorization to complete
  await page.waitForTimeout(15000);
  
  // Take after screenshot  
  await page.screenshot({ path: 'after-real-vectorization.png', fullPage: true });
  console.log('📸 After screenshot saved');
  
  // Check final state
  const finalState = await page.evaluate(() => {
    const faceIndicators = document.querySelectorAll('.face-indicator');
    const targetFile = window.currentFiles?.find(f => f.id === 'file_1750436548522_i7a3s6sze');
    
    return {
      domFaceIndicators: faceIndicators.length,
      faceIndicatorTexts: Array.from(faceIndicators).map(el => el.textContent.trim()),
      targetFileData: targetFile ? {
        faceCount: targetFile.faceCount,
        extractedFaces: targetFile.extractedFaces?.length,
        vectorizationStatus: targetFile.vectorizationStatus
      } : null
    };
  });
  
  console.log('📊 FINAL STATE:', JSON.stringify(finalState, null, 2));
  
  await browser.close();
}

testRealVectorization().catch(console.error);