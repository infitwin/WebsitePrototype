const { chromium } = require('playwright');

async function testVectorizationWithInjection() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log('🧪 Testing vectorization with comprehensive injection...');
  
  // Monitor all console logs
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
  
  // INJECT COMPREHENSIVE MONITORING
  await page.evaluate(() => {
    console.log('🔧 INJECTING MONITORING...');
    
    // Store originals
    const originalPerformVectorization = window.performVectorization;
    const originalUpdateFileVectorizationStatus = window.updateFileVectorizationStatus; 
    const originalUpdateFileVectorizationUI = window.updateFileVectorizationUI;
    const originalInitializeFileBrowser = window.initializeFileBrowser;
    const originalUpdateDoc = window.updateDoc;
    
    // Monitor window.currentFiles changes
    let currentFilesWatcher = window.currentFiles;
    Object.defineProperty(window, 'currentFiles', {
      get() { return currentFilesWatcher; },
      set(newValue) {
        console.log('📊 WINDOW.CURRENTFILES CHANGED:', {
          oldLength: currentFilesWatcher?.length || 0,
          newLength: newValue?.length || 0,
          filesWithFaces: newValue?.filter(f => f.faceCount > 0 || f.extractedFaces?.length > 0).length || 0
        });
        currentFilesWatcher = newValue;
      }
    });
    
    // Monitor DOM face indicator changes
    const faceObserver = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === 1 && node.classList?.contains('face-indicator')) {
              console.log('👤 FACE INDICATOR ADDED:', node.textContent.trim(), 'to card:', node.closest('.file-card')?.dataset.fileId);
            }
          });
          mutation.removedNodes.forEach(node => {
            if (node.nodeType === 1 && node.classList?.contains('face-indicator')) {
              console.log('❌ FACE INDICATOR REMOVED:', node.textContent.trim());
            }
          });
        }
        if (mutation.type === 'attributes' && mutation.target.classList?.contains('face-indicator')) {
          console.log('🔄 FACE INDICATOR MODIFIED:', mutation.target.textContent.trim());
        }
      });
    });
    faceObserver.observe(document.body, { childList: true, subtree: true, attributes: true });
    
    // Override performVectorization
    window.performVectorization = async function(fileIds) {
      console.log('🚀 INJECTION: performVectorization called with:', fileIds);
      
      const result = await originalPerformVectorization.call(this, fileIds);
      console.log('✅ INJECTION: performVectorization completed');
      return result;
    };
    
    // Override updateFileVectorizationStatus
    window.updateFileVectorizationStatus = async function(fileId, result) {
      console.log('💾 INJECTION: updateFileVectorizationStatus called:', {
        fileId,
        faceCount: result.results?.[0]?.faces?.length || 0
      });
      
      const updateResult = await originalUpdateFileVectorizationStatus.call(this, fileId, result);
      console.log('✅ INJECTION: Firebase update completed for:', fileId);
      return updateResult;
    };
    
    // Override updateFileVectorizationUI  
    window.updateFileVectorizationUI = function(fileId, result) {
      console.log('🎨 INJECTION: updateFileVectorizationUI called:', {
        fileId,
        faceCount: result.results?.[0]?.faces?.length || 0
      });
      
      const uiResult = originalUpdateFileVectorizationUI.call(this, fileId, result);
      console.log('✅ INJECTION: UI update completed for:', fileId);
      return uiResult;
    };
    
    // Override initializeFileBrowser
    window.initializeFileBrowser = async function() {
      console.log('🔄 INJECTION: initializeFileBrowser called (this will refresh window.currentFiles)');
      
      const browserResult = await originalInitializeFileBrowser.call(this);
      console.log('✅ INJECTION: initializeFileBrowser completed, window.currentFiles updated');
      return browserResult;
    };
    
    console.log('🔧 INJECTION COMPLETE - All functions monitored');
  });
  
  // Take before screenshot
  await page.screenshot({ path: 'before-vectorization-injection.png', fullPage: true });
  console.log('📸 Before screenshot saved');
  
  // Get file without faces for testing
  const cleanFileId = await page.evaluate(() => {
    const filesWithoutFaces = window.currentFiles?.filter(f => 
      (!f.faceCount || f.faceCount === 0) && 
      (!f.extractedFaces || f.extractedFaces.length === 0)
    ) || [];
    console.log('🎯 Files without faces available for testing:', filesWithoutFaces.length);
    return filesWithoutFaces[0]?.id;
  });
  
  if (!cleanFileId) {
    console.log('❌ No clean files available for testing');
    await browser.close();
    return;
  }
  
  console.log('🎯 Using clean file for testing:', cleanFileId);
  
  // Select the file
  const fileCard = page.locator(`[data-file-id="${cleanFileId}"]`);
  await fileCard.hover();
  await page.waitForTimeout(500);
  
  const checkbox = fileCard.locator('.file-checkbox');
  await checkbox.check();
  await page.waitForTimeout(1000);
  
  console.log('🔄 Starting vectorization with full monitoring...');
  await page.click('#vectorizeBtn');
  
  // Wait for vectorization to complete with extended time
  await page.waitForTimeout(15000);
  
  // Take after screenshot
  await page.screenshot({ path: 'after-vectorization-injection.png', fullPage: true });
  console.log('📸 After screenshot saved');
  
  // Final analysis
  const finalAnalysis = await page.evaluate(() => {
    const faceIndicators = document.querySelectorAll('.face-indicator');
    const currentFilesWithFaces = window.currentFiles?.filter(f => 
      f.faceCount > 0 || f.extractedFaces?.length > 0
    ) || [];
    
    return {
      domFaceIndicators: faceIndicators.length,
      dataFilesWithFaces: currentFilesWithFaces.length,
      faceIndicatorTexts: Array.from(faceIndicators).map(el => el.textContent.trim())
    };
  });
  
  console.log('📊 FINAL ANALYSIS:', finalAnalysis);
  
  await browser.close();
}

testVectorizationWithInjection().catch(console.error);