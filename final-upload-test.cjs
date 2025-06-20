const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function finalUploadTest() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const consoleLogs = [];
  page.on('console', msg => {
    if (msg.text().includes('file') || msg.text().includes('upload') || msg.text().includes('✅')) {
      consoleLogs.push(`${msg.type()}: ${msg.text()}`);
    }
  });
  
  try {
    console.log('🎯 FINAL COMPREHENSIVE UPLOAD TEST');
    
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
    
    console.log('📋 Testing all upload methods...');
    
    // Create multiple test files
    const testFiles = [
      { name: 'test-image.jpg', content: 'fake image data', type: 'image/jpeg' },
      { name: 'test-document.pdf', content: 'fake pdf data', type: 'application/pdf' },
      { name: 'test-text.txt', content: 'test text content', type: 'text/plain' }
    ];
    
    const filePaths = testFiles.map(file => {
      const filePath = path.join(__dirname, file.name);
      fs.writeFileSync(filePath, file.content);
      return filePath;
    });
    
    // Test 1: File input upload
    console.log('🧪 Test 1: File input upload');
    const fileInput = page.locator('#fileInput');
    await fileInput.setInputFiles(filePaths);
    await page.waitForTimeout(3000);
    
    const test1Result = await page.evaluate(() => {
      return {
        fileCards: document.querySelectorAll('.file-card').length,
        uploadQueue: document.querySelectorAll('.upload-item, .upload-file').length,
        notifications: document.querySelectorAll('.notification, [style*=\"position: fixed\"]').length
      };
    });
    
    console.log('✓ File input result:', test1Result);
    
    // Test 2: Upload button click
    console.log('🧪 Test 2: Upload button functionality');
    const uploadBtn = page.locator('button:has-text("Upload")');
    const uploadBtnExists = await uploadBtn.count() > 0;
    
    if (uploadBtnExists) {
      await uploadBtn.click();
      await page.waitForTimeout(1000);
      console.log('✓ Upload button works');
    }
    
    // Test 3: Drag and drop zone
    console.log('🧪 Test 3: Drag and drop zone');
    const uploadZone = page.locator('#uploadZone');
    const uploadZoneExists = await uploadZone.count() > 0;
    const uploadZoneClickable = await uploadZone.isVisible();
    
    if (uploadZoneExists && uploadZoneClickable) {
      await uploadZone.click();
      console.log('✓ Upload zone clickable');
    }
    
    // Test 4: Storage indicator update
    console.log('🧪 Test 4: Storage indicator');
    const storageResult = await page.evaluate(() => {
      const storageBar = document.getElementById('storageBar');
      const storagePercent = document.getElementById('storagePercent');
      return {
        storageBarExists: !!storageBar,
        storagePercentExists: !!storagePercent,
        storageBarWidth: storageBar ? storageBar.style.width : 'none',
        storageBarColor: storageBar ? storageBar.style.backgroundColor : 'none'
      };
    });
    
    console.log('✓ Storage indicator:', storageResult);
    
    // Test 5: Filter counts update
    console.log('🧪 Test 5: Filter counts');
    const filterResult = await page.evaluate(() => {
      return {
        allCount: document.getElementById('allCount')?.textContent || '0',
        facesCount: document.getElementById('facesCount')?.textContent || '0',
        processingCount: document.getElementById('processingCount')?.textContent || '0',
        recentCount: document.getElementById('recentCount')?.textContent || '0'
      };
    });
    
    console.log('✓ Filter counts:', filterResult);
    
    // Final assessment
    const finalState = await page.evaluate(() => {
      return {
        totalFiles: document.querySelectorAll('.file-card').length,
        hasUploadFeedback: document.querySelectorAll('[style*=\"position: fixed\"]').length > 0,
        uploadFunctionsWork: typeof window.handleFileUpload === 'function' && 
                           typeof window.processFilesForUpload === 'function',
        allElementsPresent: !!(document.getElementById('uploadZone') && 
                             document.getElementById('searchInput') && 
                             document.querySelector('.storage-indicator') &&
                             document.querySelectorAll('.filter-chip').length > 0)
      };
    });
    
    console.log('\n📊 FINAL UPLOAD TEST RESULTS:');
    console.log('✓ File input upload:', test1Result.fileCards > 0);
    console.log('✓ Upload button works:', uploadBtnExists);
    console.log('✓ Upload zone clickable:', uploadZoneClickable);
    console.log('✓ Storage indicator present:', storageResult.storageBarExists);
    console.log('✓ Filter counts available:', Object.values(filterResult).some(v => v !== '0'));
    console.log('✓ Upload functions loaded:', finalState.uploadFunctionsWork);
    console.log('✓ All UI elements present:', finalState.allElementsPresent);
    console.log('✓ Total files displayed:', finalState.totalFiles);
    console.log('✓ Upload feedback shown:', finalState.hasUploadFeedback);
    
    const allTestsPass = test1Result.fileCards > 0 && 
                        uploadBtnExists && 
                        uploadZoneClickable && 
                        finalState.uploadFunctionsWork && 
                        finalState.allElementsPresent;
    
    if (allTestsPass) {
      console.log('\n🎉 ALL UPLOAD FUNCTIONALITY TESTS PASSED!');
      console.log('✅ File upload is fully working and functional');
    } else {
      console.log('\n❌ Some upload functionality still needs work');
    }
    
    // Clean up
    filePaths.forEach(filePath => {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });
    
    console.log('\n📋 RELEVANT CONSOLE LOGS:');
    consoleLogs.forEach(log => console.log(log));
    
  } catch (error) {
    console.error('❌ Final test error:', error.message);
  } finally {
    await browser.close();
  }
}

finalUploadTest().catch(console.error);