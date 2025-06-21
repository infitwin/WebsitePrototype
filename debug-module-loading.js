import { chromium } from 'playwright';

async function debugModuleLoading() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Capture ALL console messages including errors
  const consoleMessages = [];
  page.on('console', msg => {
    const message = `[${msg.type()}] ${msg.text()}`;
    console.log(message);
    consoleMessages.push(message);
  });

  // Capture page errors
  page.on('pageerror', error => {
    console.log(`[PAGE ERROR] ${error.message}`);
    consoleMessages.push(`[PAGE ERROR] ${error.message}`);
  });

  // Capture request failures
  page.on('requestfailed', request => {
    console.log(`[REQUEST FAILED] ${request.url()} - ${request.failure().errorText}`);
    consoleMessages.push(`[REQUEST FAILED] ${request.url()} - ${request.failure().errorText}`);
  });

  try {
    console.log('=== DEBUGGING MODULE LOADING ===');
    
    // 1. Login first
    console.log('\n1. Logging in...');
    await page.goto('http://localhost:8357/pages/auth.html');
    await page.click('[data-tab="login"]');
    await page.fill('.login-email', 'weezer@yev.com');
    await page.fill('.login-password', '123456');
    await page.click('button:has-text("Access Your Memories")');
    await page.waitForURL('**/dashboard.html');
    
    // 2. Navigate to My Files and capture all activity
    console.log('\n2. Navigating to My Files...');
    await page.goto('http://localhost:8357/pages/my-files.html');
    
    // 3. Wait and see what happens
    console.log('\n3. Waiting for module loading...');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // 4. Check if the DOMContentLoaded event fired
    const domContentLoadedStatus = await page.evaluate(() => {
      return {
        readyState: document.readyState,
        hasInitializeMyFiles: typeof window.initializeMyFiles !== 'undefined'
      };
    });
    
    console.log('DOM Content Loaded Status:', domContentLoadedStatus);
    
    // 5. Try to manually import and call the function
    console.log('\n4. Manually testing module import...');
    const manualImportTest = await page.evaluate(async () => {
      try {
        console.log('Testing manual import...');
        const { initializeMyFiles } = await import('../js/pages/my-files.js');
        console.log('Import successful, function type:', typeof initializeMyFiles);
        
        // Try to call it
        console.log('Attempting to call initializeMyFiles...');
        await initializeMyFiles();
        console.log('initializeMyFiles completed');
        
        return { success: true };
      } catch (error) {
        console.error('Manual import failed:', error);
        return { 
          success: false, 
          error: error.message,
          stack: error.stack
        };
      }
    });
    
    console.log('Manual import test result:', manualImportTest);
    
    // 6. Wait a bit more to see if anything happens
    await page.waitForTimeout(2000);
    
    console.log('\n=== CONSOLE LOG SUMMARY ===');
    consoleMessages.forEach(msg => console.log(msg));
    
  } catch (error) {
    console.error('Error during debug:', error);
  } finally {
    await browser.close();
  }
}

debugModuleLoading();