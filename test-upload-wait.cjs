const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function testUploadWithWait() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Capture console logs to see what's happening
  const logs = [];
  page.on('console', msg => {
    logs.push(`${msg.type()}: ${msg.text()}`);
  });
  
  try {
    console.log('⏱️ Testing upload with extended wait to see refresh...');
    
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
    
    // Check initial state
    console.log('📊 Initial state...');
    const initial = await page.evaluate(() => {
      return {
        fileCards: document.querySelectorAll('.file-card').length,
        filesContainer: document.getElementById('filesContainer')?.innerHTML || 'not found',
        emptyState: document.getElementById('emptyState')?.style.display || 'none'
      };
    });
    console.log('Initial files:', initial.fileCards);
    
    // Create and upload file
    const testFile = path.join(__dirname, 'wait-test.txt');
    fs.writeFileSync(testFile, 'Testing file display after upload');
    
    console.log('📁 Uploading file...');
    const fileInput = page.locator('#fileInput');
    await fileInput.setInputFiles(testFile);
    
    // Wait and check multiple times
    for (let i = 1; i <= 6; i++) {
      await page.waitForTimeout(1000);
      const state = await page.evaluate(() => {
        return {
          fileCards: document.querySelectorAll('.file-card').length,
          uploadQueue: document.getElementById('uploadQueue')?.children.length || 0,
          emptyState: document.getElementById('emptyState')?.style.display || 'none',
          filesContainerEmpty: document.getElementById('filesContainer')?.innerHTML.length === 0
        };
      });
      
      console.log(`⏱️ After ${i} seconds:`, state);
      
      if (state.fileCards > initial.fileCards) {
        console.log(`✅ Files appeared after ${i} seconds!`);
        break;
      }
    }
    
    // Check console logs for debugging
    console.log('\n📋 CONSOLE LOGS (last 20):');
    logs.slice(-20).forEach((log, i) => {
      if (log.includes('file') || log.includes('upload') || log.includes('render') || log.includes('refresh')) {
        console.log(`${i + 1}. ${log}`);
      }
    });
    
    // Final check of what's in the DOM
    const finalState = await page.evaluate(() => {
      const container = document.getElementById('filesContainer');
      return {
        containerExists: !!container,
        containerHTML: container ? container.innerHTML.substring(0, 200) : 'not found',
        allFileCards: document.querySelectorAll('.file-card').length,
        uploadQueueItems: document.getElementById('uploadQueue')?.children.length || 0,
        emptyStateDisplay: document.getElementById('emptyState')?.style.display || 'default'
      };
    });
    
    console.log('\n🔍 FINAL STATE:');
    console.log('Files container exists:', finalState.containerExists);
    console.log('Container HTML preview:', finalState.containerHTML);
    console.log('Total file cards:', finalState.allFileCards);
    console.log('Upload queue items:', finalState.uploadQueueItems);
    console.log('Empty state display:', finalState.emptyStateDisplay);
    
    if (finalState.allFileCards > 0) {
      console.log('✅ FILES ARE SHOWING IN UI');
    } else if (finalState.uploadQueueItems > 0) {
      console.log('⚠️ FILES IN UPLOAD QUEUE BUT NOT DISPLAYED IN MAIN GRID');
    } else {
      console.log('❌ NO FILES VISIBLE ANYWHERE');
    }
    
    // Clean up
    if (fs.existsSync(testFile)) {
      fs.unlinkSync(testFile);
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  } finally {
    await browser.close();
  }
}

testUploadWithWait().catch(console.error);