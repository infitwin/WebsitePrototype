const { chromium } = require('playwright');

async function testDeleteFunctionality() {
  const browser = await chromium.launch({ headless: false }); // Visual to see what happens
  const page = await browser.newPage();
  
  try {
    console.log('🗑️ Testing file deletion and layout updates...');
    
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
    
    // Take before screenshot
    await page.screenshot({ path: 'before-delete.png', fullPage: true });
    console.log('📸 Before delete: before-delete.png');
    
    // Check initial state
    const beforeDelete = await page.evaluate(() => {
      return {
        totalFiles: document.querySelectorAll('.file-card').length,
        allCount: document.getElementById('allCount')?.textContent || '0',
        facesCount: document.getElementById('facesCount')?.textContent || '0',
        processingCount: document.getElementById('processingCount')?.textContent || '0',
        recentCount: document.getElementById('recentCount')?.textContent || '0',
        deleteButtons: document.querySelectorAll('.delete-btn').length,
        deleteModal: !!document.getElementById('deleteModal')
      };
    });
    
    console.log('📊 Before delete state:', beforeDelete);
    
    if (beforeDelete.deleteButtons === 0) {
      console.log('❌ No delete buttons found - cannot test deletion');
      return;
    }
    
    // Try to delete a file
    console.log('🗑️ Attempting to delete first file...');
    
    // Click first delete button
    const deleteButtons = page.locator('.delete-btn');
    await deleteButtons.first().click();
    await page.waitForTimeout(1000);
    
    // Check if delete modal appears
    const modalAppeared = await page.evaluate(() => {
      const modal = document.getElementById('deleteModal');
      return modal ? modal.classList.contains('active') : false;
    });
    
    console.log('📋 Delete modal appeared:', modalAppeared);
    
    if (modalAppeared) {
      // Take screenshot of modal
      await page.screenshot({ path: 'delete-modal.png', fullPage: true });
      console.log('📸 Delete modal: delete-modal.png');
      
      // Confirm deletion
      const confirmButton = page.locator('.modal-confirm');
      const confirmExists = await confirmButton.count() > 0;
      
      if (confirmExists) {
        console.log('✅ Clicking confirm delete...');
        await confirmButton.click();
        await page.waitForTimeout(2000); // Wait for deletion animation and update
        
        // Take after screenshot
        await page.screenshot({ path: 'after-delete.png', fullPage: true });
        console.log('📸 After delete: after-delete.png');
        
        // Check state after deletion
        const afterDelete = await page.evaluate(() => {
          return {
            totalFiles: document.querySelectorAll('.file-card').length,
            allCount: document.getElementById('allCount')?.textContent || '0',
            facesCount: document.getElementById('facesCount')?.textContent || '0',
            processingCount: document.getElementById('processingCount')?.textContent || '0',
            recentCount: document.getElementById('recentCount')?.textContent || '0',
            emptyStateVisible: document.getElementById('emptyState')?.style.display !== 'none',
            modalStillActive: document.getElementById('deleteModal')?.classList.contains('active') || false
          };
        });
        
        console.log('📊 After delete state:', afterDelete);
        
        // Analyze what happened
        console.log('\n🔍 DELETE FUNCTIONALITY ANALYSIS:');
        console.log('Files before:', beforeDelete.totalFiles);
        console.log('Files after:', afterDelete.totalFiles);
        console.log('File removed from DOM:', beforeDelete.totalFiles > afterDelete.totalFiles);
        
        console.log('\n📊 FILTER COUNT UPDATES:');
        console.log(`All: ${beforeDelete.allCount} → ${afterDelete.allCount}`);
        console.log(`Faces: ${beforeDelete.facesCount} → ${afterDelete.facesCount}`);
        console.log(`Processing: ${beforeDelete.processingCount} → ${afterDelete.processingCount}`);
        console.log(`Recent: ${beforeDelete.recentCount} → ${afterDelete.recentCount}`);
        
        const countsUpdated = (
          beforeDelete.allCount !== afterDelete.allCount ||
          beforeDelete.facesCount !== afterDelete.facesCount ||
          beforeDelete.processingCount !== afterDelete.processingCount ||
          beforeDelete.recentCount !== afterDelete.recentCount
        );
        
        console.log('Filter counts updated:', countsUpdated);
        console.log('Modal closed:', !afterDelete.modalStillActive);
        console.log('Empty state shown:', afterDelete.emptyStateVisible);
        
        // Final assessment
        const deletionWorked = beforeDelete.totalFiles > afterDelete.totalFiles;
        const layoutUpdated = countsUpdated;
        
        if (deletionWorked && layoutUpdated) {
          console.log('\n✅ DELETE FUNCTIONALITY WORKING CORRECTLY');
        } else if (deletionWorked && !layoutUpdated) {
          console.log('\n⚠️ FILE DELETED BUT LAYOUT NOT UPDATED');
          console.log('❌ ISSUE: Filter counts not updating after deletion');
        } else if (!deletionWorked) {
          console.log('\n❌ DELETE FUNCTIONALITY NOT WORKING');
          console.log('❌ ISSUE: File not removed from DOM');
        }
        
      } else {
        console.log('❌ Confirm button not found in modal');
      }
    } else {
      console.log('❌ Delete modal did not appear');
    }
    
  } catch (error) {
    console.error('❌ Delete test error:', error.message);
  } finally {
    console.log('\n⏳ Keeping browser open for 10 seconds to see final state...');
    await page.waitForTimeout(10000);
    await browser.close();
  }
}

testDeleteFunctionality().catch(console.error);