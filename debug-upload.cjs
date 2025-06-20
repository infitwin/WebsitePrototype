const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function debugUpload() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Capture all console logs and errors
  const consoleLogs = [];
  page.on('console', msg => {
    consoleLogs.push(`${msg.type()}: ${msg.text()}`);
  });
  
  page.on('pageerror', error => {
    consoleLogs.push(`PAGE ERROR: ${error.message}`);
  });
  
  try {
    console.log('🔍 Debugging upload process...');
    
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
    
    // Check what's loaded and available
    const debugInfo = await page.evaluate(() => {
      return {
        uploadFunctions: {
          handleFileUpload: typeof window.handleFileUpload,
          processFilesForUpload: typeof window.processFilesForUpload,
          initializeDragDrop: typeof window.initializeDragDrop,
          showNotification: typeof window.showNotification
        },
        moduleErrors: window.moduleLoadErrors || 'none',
        uploadZoneElement: !!document.getElementById('uploadZone'),
        fileInputElement: !!document.getElementById('fileInput'),
        uploadQueueElement: !!document.getElementById('uploadQueue'),
        filesContainerElement: !!document.getElementById('filesContainer')
      };
    });
    
    console.log('🔧 Debug info:', debugInfo);
    
    // Create test file
    const testFile = path.join(__dirname, 'debug-test.txt');
    fs.writeFileSync(testFile, 'debug test content');
    
    // Try manual upload trigger
    console.log('🧪 Testing manual upload...');
    
    // Inject debug logging
    await page.evaluate(() => {
      window.uploadDebugLogs = [];
      
      // Override console.log temporarily to capture upload logs
      const originalLog = console.log;
      console.log = function(...args) {
        window.uploadDebugLogs.push(args.join(' '));
        originalLog.apply(console, arguments);
      };
      
      // Override error handling
      window.addEventListener('error', (e) => {
        window.uploadDebugLogs.push('ERROR: ' + e.message);
      });
    });
    
    // Try file upload
    const fileInput = page.locator('#fileInput');
    await fileInput.setInputFiles(testFile);
    
    await page.waitForTimeout(3000);
    
    // Get debug results
    const uploadDebugResult = await page.evaluate(() => {
      return {
        debugLogs: window.uploadDebugLogs || [],
        uploadQueueChildren: document.getElementById('uploadQueue') ? document.getElementById('uploadQueue').children.length : 0,
        filesContainerChildren: document.getElementById('filesContainer') ? document.getElementById('filesContainer').children.length : 0,
        anyUploadElements: document.querySelectorAll('[class*="upload"], [id*="upload"]').length
      };
    });
    
    console.log('📊 Upload debug result:', uploadDebugResult);
    
    // Check if imports are working by testing them manually
    const importTest = await page.evaluate(async () => {
      try {
        // Test if modules can be imported manually
        const fileUIModule = await import('./js/file-ui.js');
        const fileServiceModule = await import('./js/file-service.js');
        
        return {
          fileUI: Object.keys(fileUIModule),
          fileService: Object.keys(fileServiceModule),
          importSuccess: true
        };
      } catch (error) {
        return {
          importError: error.message,
          importSuccess: false
        };
      }
    });
    
    console.log('📦 Import test:', importTest);
    
    // Clean up
    if (fs.existsSync(testFile)) {
      fs.unlinkSync(testFile);
    }
    
    console.log('\n📋 ALL CONSOLE LOGS:');
    consoleLogs.forEach((log, i) => {
      console.log(`${i + 1}. ${log}`);
    });
    
    console.log('\n🎯 DIAGNOSIS:');
    if (debugInfo.uploadFunctions.handleFileUpload === 'function') {
      console.log('✓ Upload functions are loaded');
    } else {
      console.log('❌ Upload functions not loaded - module import issue');
    }
    
    if (uploadDebugResult.debugLogs.length > 0) {
      console.log('✓ Upload process triggered with logs');
    } else {
      console.log('❌ Upload process not triggered or no logs captured');
    }
    
    if (importTest.importSuccess) {
      console.log('✓ Modules can be imported');
    } else {
      console.log('❌ Module import failed:', importTest.importError);
    }
    
  } catch (error) {
    console.error('❌ Debug error:', error.message);
  } finally {
    await browser.close();
  }
}

debugUpload().catch(console.error);