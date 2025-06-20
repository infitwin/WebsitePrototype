const { chromium } = require('playwright');

async function debugDelete() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Capture all console messages
  const logs = [];
  page.on('console', msg => {
    logs.push(`${msg.type()}: ${msg.text()}`);
  });
  
  page.on('pageerror', error => {
    logs.push(`PAGE ERROR: ${error.message}`);
  });
  
  try {
    console.log('🔍 Debugging delete functionality - what actually happens?');
    
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
    
    // Check if delete functions exist
    const debugInfo = await page.evaluate(() => {
      const firstCard = document.querySelector('.file-card');
      return {
        totalCards: document.querySelectorAll('.file-card').length,
        deleteButtons: document.querySelectorAll('.delete-btn').length,
        firstCardHasFileId: firstCard ? !!firstCard.dataset.fileId : false,
        firstCardFileId: firstCard ? firstCard.dataset.fileId : 'none',
        deleteFileFunction: typeof window.deleteFile === 'function',
        showDeleteConfirmationFunction: typeof window.showDeleteConfirmation === 'function',
        modalExists: !!document.getElementById('deleteModal'),
        confirmButtonExists: !!document.querySelector('.modal-confirm')
      };
    });
    
    console.log('🔍 Debug info:', debugInfo);
    
    if (debugInfo.deleteButtons === 0) {
      console.log('❌ No delete buttons found');
      return;
    }
    
    // Try clicking delete button
    console.log('🗑️ Clicking first delete button...');
    await page.click('.delete-btn');
    await page.waitForTimeout(1000);
    
    // Check modal state
    const modalState = await page.evaluate(() => {
      const modal = document.getElementById('deleteModal');
      return {
        modalActive: modal ? modal.classList.contains('active') : false,
        modalVisible: modal ? modal.style.display !== 'none' : false,
        confirmButton: !!document.querySelector('.modal-confirm'),
        cancelButton: !!document.querySelector('.modal-cancel')
      };
    });
    
    console.log('📋 Modal state:', modalState);
    
    if (modalState.modalActive) {
      console.log('✅ Clicking confirm button...');
      await page.click('.modal-confirm');
      await page.waitForTimeout(3000); // Wait longer to see what happens
      
      // Check what happened
      const postDeleteState = await page.evaluate(() => {
        return {
          totalCards: document.querySelectorAll('.file-card').length,
          modalActive: document.getElementById('deleteModal')?.classList.contains('active') || false
        };
      });
      
      console.log('📊 Post-delete state:', postDeleteState);
      
      if (postDeleteState.totalCards < debugInfo.totalCards) {
        console.log('✅ File was removed from DOM');
      } else {
        console.log('❌ File was NOT removed from DOM');
      }
    }
    
    // Show all console logs to see what went wrong
    console.log('\n📋 ALL CONSOLE LOGS:');
    logs.forEach((log, i) => {
      if (log.includes('delete') || log.includes('Delete') || log.includes('🗑️') || log.includes('ERROR') || log.includes('Failed')) {
        console.log(`${i + 1}. ${log}`);
      }
    });
    
    // Check if deleteFile function is available and working
    const deleteTest = await page.evaluate(async () => {
      if (typeof window.deleteFile === 'function') {
        try {
          // Try to call deleteFile with a test ID
          await window.deleteFile('test-id');
          return { success: true, error: null };
        } catch (error) {
          return { success: false, error: error.message };
        }
      } else {
        return { success: false, error: 'deleteFile function not available' };
      }
    });
    
    console.log('\n🧪 Delete function test:', deleteTest);
    
  } catch (error) {
    console.error('❌ Debug error:', error.message);
  } finally {
    await browser.close();
  }
}

debugDelete().catch(console.error);