const { chromium } = require('playwright');

async function testVectorizationComplete() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log('🧪 Testing complete vectorization flow...');
  
  let alertMessage = '';
  page.on('dialog', async dialog => {
    alertMessage = dialog.message();
    console.log('🚨 ALERT:', alertMessage);
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
  
  console.log('📊 Step 1: Select an image file');
  
  // Find an image file specifically
  const imageFile = await page.evaluate(() => {
    const files = window.currentFiles || [];
    const imageFiles = files.filter(f => f.fileType && f.fileType.startsWith('image/'));
    console.log('Available image files:', imageFiles.map(f => ({ id: f.id, name: f.fileName, type: f.fileType })));
    return imageFiles[0] || null;
  });
  
  console.log('Found image file:', imageFile ? `${imageFile.fileName} (${imageFile.fileType})` : 'None');
  
  if (imageFile) {
    // Find the card for this specific file
    const fileCard = await page.locator(`.file-card[data-file-id="${imageFile.id}"]`);
    
    if (await fileCard.count() > 0) {
      console.log('📊 Step 2: Select the file');
      await fileCard.hover();
      await page.waitForTimeout(500);
      
      const checkbox = fileCard.locator('.file-checkbox');
      await checkbox.check();
      await page.waitForTimeout(1000);
      
      // Verify selection
      const selectionInfo = await page.evaluate(() => {
        return {
          selectedCount: window.selectedFiles ? window.selectedFiles.size : 0,
          selectedIds: window.selectedFiles ? Array.from(window.selectedFiles) : []
        };
      });
      
      console.log('📊 Selection Info:', selectionInfo);
      
      console.log('📊 Step 3: Click Vectorize Selected');
      await page.click('#vectorizeBtn');
      await page.waitForTimeout(3000);
      
      console.log('📊 Final Result:');
      console.log('Alert Message:', alertMessage || 'No alert shown');
      
      if (alertMessage.includes('Please select image files to vectorize')) {
        console.log('❌ BUG STILL EXISTS: Getting "Please select image files" even with image selected');
        
        // Debug the exact state
        const debugInfo = await page.evaluate((fileId) => {
          const selectedFiles = Array.from(window.selectedFiles);
          const file = window.currentFiles?.find(f => f.id === fileId);
          
          return {
            selectedFileIds: selectedFiles,
            lookingForFileId: fileId,
            foundFile: file ? {
              id: file.id,
              fileName: file.fileName,
              fileType: file.fileType,
              hasFileType: !!file.fileType,
              isImage: file.fileType && file.fileType.startsWith('image/')
            } : null,
            allFiles: window.currentFiles ? window.currentFiles.map(f => ({
              id: f.id,
              fileName: f.fileName,
              fileType: f.fileType
            })) : 'No currentFiles'
          };
        }, imageFile.id);
        
        console.log('🔍 Debug Info:', JSON.stringify(debugInfo, null, 2));
      } else {
        console.log('✅ SUCCESS: Vectorization initiated without error');
      }
    }
  }
  
  await browser.close();
}

testVectorizationComplete().catch(console.error);