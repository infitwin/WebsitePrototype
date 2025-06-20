const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function testVisualUpload() {
  const browser = await chromium.launch({ headless: false }); // Visual mode to see what happens
  const page = await browser.newPage();
  
  try {
    console.log('👀 Visual test - checking if uploaded files show in UI...');
    
    // Login flow
    await page.goto('http://localhost:8357/pages/my-files.html');
    await page.waitForTimeout(2000);
    
    const loginTab = await page.locator('[data-tab="login"]').count();
    if (loginTab > 0) {
      await page.click('[data-tab="login"]');
      await page.fill('.login-email', 'weezer@yev.com');
      await page.fill('.login-password', '123456');
      await page.click('button:has-text("Access Your Memories")');
      await page.waitForTimeout(3000);
    }
    
    const skipButton = await page.locator('button:has-text("Skip for Testing")').count();
    if (skipButton > 0) {
      await page.click('button:has-text("Skip for Testing")');
      await page.waitForTimeout(2000);
    }
    
    await page.goto('http://localhost:8357/pages/my-files.html');
    await page.waitForTimeout(3000);
    
    // Take screenshot before upload
    await page.screenshot({ path: 'before-upload.png', fullPage: true });
    console.log('📸 Before upload screenshot: before-upload.png');
    
    // Check initial state
    const beforeUpload = await page.evaluate(() => {
      const fileCards = document.querySelectorAll('.file-card');
      const filesContainer = document.getElementById('filesContainer');
      return {
        fileCardsCount: fileCards.length,
        filesContainerHTML: filesContainer ? filesContainer.innerHTML.length : 0,
        filesContainerChildren: filesContainer ? filesContainer.children.length : 0,
        emptyStateVisible: document.querySelector('.empty-state')?.style.display || 'none',
        uploadZoneVisible: document.getElementById('uploadZone')?.style.display || 'block'
      };
    });
    
    console.log('📊 Before upload state:', beforeUpload);
    
    // Create test file
    const testFile = path.join(__dirname, 'visual-test.txt');
    fs.writeFileSync(testFile, 'This is a visual test file');
    
    // Upload file
    console.log('📁 Uploading file...');
    const fileInput = page.locator('#fileInput');
    await fileInput.setInputFiles(testFile);
    
    // Wait and watch for changes
    await page.waitForTimeout(5000);
    
    // Take screenshot after upload
    await page.screenshot({ path: 'after-upload.png', fullPage: true });
    console.log('📸 After upload screenshot: after-upload.png');
    
    // Check state after upload
    const afterUpload = await page.evaluate(() => {
      const fileCards = document.querySelectorAll('.file-card');
      const filesContainer = document.getElementById('filesContainer');
      const uploadQueue = document.getElementById('uploadQueue');
      
      return {
        fileCardsCount: fileCards.length,
        filesContainerHTML: filesContainer ? filesContainer.innerHTML.length : 0,
        filesContainerChildren: filesContainer ? filesContainer.children.length : 0,
        uploadQueueChildren: uploadQueue ? uploadQueue.children.length : 0,
        emptyStateVisible: document.querySelector('.empty-state')?.style.display || 'none',
        uploadZoneVisible: document.getElementById('uploadZone')?.style.display || 'block',
        // Look for any upload-related elements
        uploadElements: document.querySelectorAll('[class*="upload"], [id*="upload"]').length,
        // Check if any new elements appeared
        allDivs: document.querySelectorAll('div').length
      };
    });
    
    console.log('📊 After upload state:', afterUpload);
    
    // Check for any console logs or errors during upload
    const uploadLogs = await page.evaluate(() => {
      return window.uploadDebugInfo || 'no debug info';
    });
    
    console.log('📋 Upload debug info:', uploadLogs);
    
    // Compare before and after
    console.log('\n🔍 COMPARISON:');
    console.log('File cards before:', beforeUpload.fileCardsCount);
    console.log('File cards after:', afterUpload.fileCardsCount);
    console.log('Files container children before:', beforeUpload.filesContainerChildren);
    console.log('Files container children after:', afterUpload.filesContainerChildren);
    console.log('Upload queue items:', afterUpload.uploadQueueChildren);
    console.log('Upload elements total:', afterUpload.uploadElements);
    
    if (afterUpload.fileCardsCount > beforeUpload.fileCardsCount) {
      console.log('✅ Files are showing in UI after upload');
    } else if (afterUpload.uploadQueueChildren > 0) {
      console.log('⚠️ Files in upload queue but not in main file grid yet');
    } else {
      console.log('❌ Files not showing in UI - need to investigate');
    }
    
    // Clean up
    if (fs.existsSync(testFile)) {
      fs.unlinkSync(testFile);
    }
    
  } catch (error) {
    console.error('❌ Visual test error:', error.message);
  } finally {
    console.log('\n⏳ Keeping browser open for 10 seconds to see the state...');
    await page.waitForTimeout(10000);
    await browser.close();
  }
}

testVisualUpload().catch(console.error);