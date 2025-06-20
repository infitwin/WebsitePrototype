const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function testUploadDetailed() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    console.log('🧪 Detailed file upload test...');
    
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
    
    // Create test files
    const testFile1 = path.join(__dirname, 'test-image.jpg');
    const testFile2 = path.join(__dirname, 'test-document.pdf');
    
    fs.writeFileSync(testFile1, 'fake image data');
    fs.writeFileSync(testFile2, 'fake pdf data');
    
    console.log('📁 Created test files');
    
    // Test file input upload
    console.log('🧪 Testing file input upload...');
    const fileInput = page.locator('#fileInput');
    await fileInput.setInputFiles([testFile1, testFile2]);
    
    await page.waitForTimeout(3000);
    
    // Check if upload queue shows progress
    const uploadResult = await page.evaluate(() => {
      return {
        uploadQueueItems: document.querySelectorAll('.upload-item, .upload-file, .upload-card').length,
        progressBars: document.querySelectorAll('.progress, .progress-bar, [class*="progress"]').length,
        fileCards: document.querySelectorAll('.file-card').length,
        notifications: document.querySelectorAll('.notification, .toast, .alert').length,
        consoleMessages: window.uploadTestLog || 'none'
      };
    });
    
    console.log('📊 Upload result:', uploadResult);
    
    // Test drag and drop simulation
    console.log('🧪 Testing drag and drop...');
    
    // Simulate drag and drop
    await page.evaluate(() => {
      const uploadZone = document.getElementById('uploadZone');
      const fileInput = document.getElementById('fileInput');
      
      if (uploadZone && fileInput) {
        // Simulate drag over
        const dragOverEvent = new DragEvent('dragover', { bubbles: true, cancelable: true });
        uploadZone.dispatchEvent(dragOverEvent);
        
        // Simulate drop with files
        const file1 = new File(['test content'], 'test-drag.txt', { type: 'text/plain' });
        const file2 = new File(['test image'], 'test-drag.jpg', { type: 'image/jpeg' });
        
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file1);
        dataTransfer.items.add(file2);
        
        const dropEvent = new DragEvent('drop', {
          bubbles: true,
          cancelable: true,
          dataTransfer: dataTransfer
        });
        
        uploadZone.dispatchEvent(dropEvent);
        
        // Log for debugging
        window.dragDropTestResult = 'drag drop simulated';
      }
    });
    
    await page.waitForTimeout(2000);
    
    const dragResult = await page.evaluate(() => {
      return {
        dragDropResult: window.dragDropTestResult || 'no result',
        uploadZoneHasDragover: document.getElementById('uploadZone').classList.contains('dragover'),
        totalUploadItems: document.querySelectorAll('.upload-item, .upload-file, .upload-card').length,
        totalFileCards: document.querySelectorAll('.file-card').length
      };
    });
    
    console.log('📊 Drag result:', dragResult);
    
    // Test upload button click
    console.log('🧪 Testing upload button...');
    const uploadButton = page.locator('button:has-text("Upload")');
    const uploadButtonExists = await uploadButton.count() > 0;
    
    if (uploadButtonExists) {
      await uploadButton.click();
      await page.waitForTimeout(1000);
      console.log('✓ Upload button clicked');
    } else {
      console.log('❌ Upload button not found');
    }
    
    // Final assessment
    console.log('\n🎯 DETAILED UPLOAD TEST RESULTS:');
    console.log('File input upload worked:', uploadResult.uploadQueueItems > 0 || uploadResult.fileCards > 0);
    console.log('Progress indicators present:', uploadResult.progressBars > 0);
    console.log('Drag and drop simulation:', dragResult.dragDropResult);
    console.log('Upload button available:', uploadButtonExists);
    
    // Clean up test files
    [testFile1, testFile2].forEach(file => {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
      }
    });
    
    const uploadWorks = (uploadResult.uploadQueueItems > 0 || uploadResult.fileCards > 0) && uploadButtonExists;
    
    if (uploadWorks) {
      console.log('✅ FILE UPLOAD FUNCTIONALITY IS WORKING');
    } else {
      console.log('❌ FILE UPLOAD NEEDS MORE FIXES');
    }
    
  } catch (error) {
    console.error('❌ Detailed test error:', error.message);
  } finally {
    await browser.close();
  }
}

testUploadDetailed().catch(console.error);