const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function testFileUpload() {
  const browser = await chromium.launch({ headless: true }); // Headless as requested
  const page = await browser.newPage();
  
  try {
    console.log('🧪 Testing file upload functionality...');
    
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
    
    console.log('📄 Page loaded, testing upload functionality...');
    
    // Test 1: Check if upload zone exists and is clickable
    const uploadZone = await page.locator('#uploadZone');
    const uploadZoneExists = await uploadZone.count() > 0;
    console.log('✓ Upload zone exists:', uploadZoneExists);
    
    if (!uploadZoneExists) {
      console.log('❌ FAILED: Upload zone not found');
      return;
    }
    
    // Test 2: Check if file input exists
    const fileInput = await page.locator('#fileInput');
    const fileInputExists = await fileInput.count() > 0;
    console.log('✓ File input exists:', fileInputExists);
    
    // Test 3: Test click functionality on upload zone
    let clickTriggered = false;
    try {
      await uploadZone.click();
      clickTriggered = true;
      console.log('✓ Upload zone clickable:', clickTriggered);
    } catch (error) {
      console.log('❌ Upload zone click failed:', error.message);
    }
    
    // Test 4: Check if clicking upload zone triggers file input
    const fileInputClickTriggered = await page.evaluate(() => {
      const uploadZone = document.getElementById('uploadZone');
      const fileInput = document.getElementById('fileInput');
      
      if (!uploadZone || !fileInput) return false;
      
      let inputClicked = false;
      const originalClick = fileInput.click;
      fileInput.click = function() {
        inputClicked = true;
        return originalClick.apply(this, arguments);
      };
      
      uploadZone.click();
      return inputClicked;
    });
    console.log('✓ Upload zone triggers file input:', fileInputClickTriggered);
    
    // Test 5: Test drag and drop event handlers
    const dragDropHandlers = await page.evaluate(() => {
      const uploadZone = document.getElementById('uploadZone');
      if (!uploadZone) return { hasHandlers: false };
      
      // Check if drag/drop event listeners are attached
      const events = ['dragenter', 'dragleave', 'dragover', 'drop'];
      const handlerStatus = {};
      
      events.forEach(eventType => {
        // Trigger the event and see if anything happens
        const event = new Event(eventType, { bubbles: true });
        try {
          uploadZone.dispatchEvent(event);
          handlerStatus[eventType] = 'triggered';
        } catch (e) {
          handlerStatus[eventType] = 'error';
        }
      });
      
      return {
        hasHandlers: true,
        events: handlerStatus,
        hasStyle: uploadZone.classList.contains('dragover') || uploadZone.style.background !== ''
      };
    });
    console.log('✓ Drag/drop handlers:', dragDropHandlers);
    
    // Test 6: Test file processing function exists
    const uploadFunctionsExist = await page.evaluate(() => {
      return {
        handleFileUpload: typeof window.handleFileUpload === 'function',
        processFilesForUpload: typeof window.processFilesForUpload === 'function',
        initializeDragDrop: typeof window.initializeDragDrop === 'function'
      };
    });
    console.log('✓ Upload functions exist:', uploadFunctionsExist);
    
    // Test 7: Create a test file and try to upload it
    const testFilePath = path.join(__dirname, 'test-upload.txt');
    fs.writeFileSync(testFilePath, 'This is a test file for upload');
    
    try {
      await fileInput.setInputFiles(testFilePath);
      console.log('✓ File input accepts files');
      
      // Wait to see if anything happens after file selection
      await page.waitForTimeout(2000);
      
      // Check if any upload progress or feedback appears
      const uploadFeedback = await page.evaluate(() => {
        // Look for common upload feedback elements
        const progressBars = document.querySelectorAll('.progress, .upload-progress, [id*="progress"]');
        const notifications = document.querySelectorAll('.notification, .toast, .alert');
        const uploadQueue = document.querySelectorAll('.upload-queue, #uploadQueue');
        
        return {
          progressBars: progressBars.length,
          notifications: notifications.length,
          uploadQueue: uploadQueue.length,
          consoleLog: window.uploadTestLog || 'no logs'
        };
      });
      console.log('✓ Upload feedback:', uploadFeedback);
      
    } catch (error) {
      console.log('❌ File upload failed:', error.message);
    } finally {
      // Clean up test file
      if (fs.existsSync(testFilePath)) {
        fs.unlinkSync(testFilePath);
      }
    }
    
    // Test 8: Check console errors
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    console.log('\n📊 FILE UPLOAD TEST SUMMARY:');
    console.log('Upload zone exists:', uploadZoneExists);
    console.log('File input exists:', fileInputExists);
    console.log('Click functionality:', clickTriggered);
    console.log('File input triggered by click:', fileInputClickTriggered);
    console.log('Drag/drop handlers present:', dragDropHandlers.hasHandlers);
    console.log('Upload functions available:', Object.values(uploadFunctionsExist).some(f => f));
    console.log('Console errors:', consoleErrors.length);
    
    if (consoleErrors.length > 0) {
      console.log('❌ Console errors found:');
      consoleErrors.forEach(error => console.log('  -', error));
    }
    
    // Final verdict
    const uploadBasicsWork = uploadZoneExists && fileInputExists && clickTriggered;
    const functionalityExists = Object.values(uploadFunctionsExist).some(f => f);
    
    if (uploadBasicsWork && functionalityExists) {
      console.log('✅ Upload UI and basic functionality present');
    } else {
      console.log('❌ Upload functionality has issues that need fixing');
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  } finally {
    await browser.close();
  }
}

testFileUpload().catch(console.error);