const { chromium } = require('playwright');

async function testManualRefresh() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const logs = [];
  page.on('console', msg => {
    if (msg.text().includes('file') || msg.text().includes('getUserFiles') || msg.text().includes('render') || msg.text().includes('📁')) {
      logs.push(`${msg.type()}: ${msg.text()}`);
    }
  });
  
  try {
    console.log('🔧 Testing manual file browser refresh...');
    
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
    
    // Check initial files
    console.log('📊 Checking initial file state...');
    const initial = await page.evaluate(() => {
      return {
        fileCards: document.querySelectorAll('.file-card').length,
        filesContainer: !!document.getElementById('filesContainer'),
        initFileBrowserExists: typeof window.initializeFileBrowser === 'function',
        getUserFilesExists: typeof window.getUserFiles === 'function'
      };
    });
    
    console.log('Initial state:', initial);
    
    // Manually trigger file browser refresh
    console.log('🔄 Manually triggering file browser refresh...');
    await page.evaluate(async () => {
      console.log('🔧 Manual refresh triggered');
      if (typeof window.initializeFileBrowser === 'function') {
        try {
          await window.initializeFileBrowser();
          console.log('✅ Manual refresh completed');
        } catch (error) {
          console.error('❌ Manual refresh failed:', error.message);
        }
      } else {
        console.log('❌ initializeFileBrowser function not available');
      }
    });
    
    await page.waitForTimeout(3000);
    
    // Check after manual refresh
    const afterRefresh = await page.evaluate(() => {
      return {
        fileCards: document.querySelectorAll('.file-card').length,
        filesContainerHTML: document.getElementById('filesContainer')?.innerHTML.length || 0,
        emptyStateDisplay: document.getElementById('emptyState')?.style.display || 'default',
        loadingStateDisplay: document.getElementById('loadingGrid')?.style.display || 'default'
      };
    });
    
    console.log('After refresh:', afterRefresh);
    
    // Test getUserFiles directly
    console.log('🔍 Testing getUserFiles directly...');
    const filesData = await page.evaluate(async () => {
      if (typeof window.getUserFiles === 'function') {
        try {
          const files = await window.getUserFiles();
          return {
            success: true,
            fileCount: files ? files.length : 0,
            dataType: typeof files,
            isArray: Array.isArray(files),
            firstFile: files && files.length > 0 ? files[0] : null
          };
        } catch (error) {
          return {
            success: false,
            error: error.message
          };
        }
      } else {
        return {
          success: false,
          error: 'getUserFiles function not available'
        };
      }
    });
    
    console.log('getUserFiles result:', filesData);
    
    console.log('\n📋 FILE-RELATED CONSOLE LOGS:');
    logs.forEach((log, i) => {
      console.log(`${i + 1}. ${log}`);
    });
    
    // Summary
    if (afterRefresh.fileCards > 0) {
      console.log('\n✅ FILES ARE BEING DISPLAYED');
    } else if (filesData.success && filesData.fileCount > 0) {
      console.log('\n⚠️ FILES EXIST IN DATABASE BUT NOT DISPLAYED IN UI');
      console.log('   - This indicates a rendering issue');
    } else {
      console.log('\n❌ NO FILES FOUND IN DATABASE OR DISPLAY ISSUE');
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  } finally {
    await browser.close();
  }
}

testManualRefresh().catch(console.error);