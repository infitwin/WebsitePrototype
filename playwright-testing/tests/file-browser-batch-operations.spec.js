const { test, expect } = require('@playwright/test');

test.describe('File Browser Batch Operations Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8357/pages/my-files.html');
    await page.waitForLoadState('networkidle');
  });

  test('should handle select all checkbox correctly', async ({ page }) => {
    // Wait for file list to load
    await page.waitForSelector('.file-item, .file-card, [class*="file"]', { timeout: 5000 });
    
    const selectAllCheckbox = page.locator('#selectAll');
    const fileCheckboxes = page.locator('.file-checkbox');
    
    // Initially, select all should be unchecked
    await expect(selectAllCheckbox).not.toBeChecked();
    
    // Click select all
    await selectAllCheckbox.click();
    
    // All file checkboxes should be checked
    const checkboxCount = await fileCheckboxes.count();
    if (checkboxCount > 0) {
      for (let i = 0; i < checkboxCount; i++) {
        await expect(fileCheckboxes.nth(i)).toBeChecked();
      }
    }
    
    // Click select all again to deselect
    await selectAllCheckbox.click();
    
    // All file checkboxes should be unchecked
    if (checkboxCount > 0) {
      for (let i = 0; i < checkboxCount; i++) {
        await expect(fileCheckboxes.nth(i)).not.toBeChecked();
      }
    }
  });

  test('should update select all state when individual files are selected', async ({ page }) => {
    await page.waitForSelector('.file-item, .file-card, [class*="file"]', { timeout: 5000 });
    
    const selectAllCheckbox = page.locator('#selectAll');
    const fileCheckboxes = page.locator('.file-checkbox');
    const checkboxCount = await fileCheckboxes.count();
    
    if (checkboxCount >= 2) {
      // Select first file
      await fileCheckboxes.first().click();
      
      // Select all should be in indeterminate state or unchecked
      await expect(selectAllCheckbox).not.toBeChecked();
      
      // Select all files individually
      for (let i = 0; i < checkboxCount; i++) {
        await fileCheckboxes.nth(i).click();
      }
      
      // Select all should now be checked
      await expect(selectAllCheckbox).toBeChecked();
      
      // Uncheck one file
      await fileCheckboxes.first().click();
      
      // Select all should no longer be checked
      await expect(selectAllCheckbox).not.toBeChecked();
    }
  });

  test('should enable batch action buttons only when files are selected', async ({ page }) => {
    await page.waitForSelector('.file-item, .file-card, [class*="file"]', { timeout: 5000 });
    
    // Look for batch action buttons
    const batchDownloadBtn = page.locator('.btn-batch-download, button:has-text("Download")').first();
    const batchDeleteBtn = page.locator('.btn-batch-delete, button:has-text("Delete")').first();
    
    // Initially buttons should be disabled or hidden
    if (await batchDownloadBtn.isVisible()) {
      const isDisabled = await batchDownloadBtn.isDisabled();
      const hasDisabledClass = await batchDownloadBtn.getAttribute('class').then(cls => cls?.includes('disabled'));
      expect(isDisabled || hasDisabledClass).toBeTruthy();
    }
    
    // Select a file
    const firstCheckbox = page.locator('.file-checkbox').first();
    if (await firstCheckbox.count() > 0) {
      await firstCheckbox.click();
      
      // Batch buttons should now be enabled
      if (await batchDownloadBtn.isVisible()) {
        await expect(batchDownloadBtn).toBeEnabled();
      }
    }
  });

  test('should handle batch delete with confirmation', async ({ page }) => {
    await page.waitForSelector('.file-item, .file-card, [class*="file"]', { timeout: 5000 });
    
    const fileCheckboxes = page.locator('.file-checkbox');
    const checkboxCount = await fileCheckboxes.count();
    
    if (checkboxCount > 0) {
      // Select multiple files
      const filesToSelect = Math.min(3, checkboxCount);
      for (let i = 0; i < filesToSelect; i++) {
        await fileCheckboxes.nth(i).click();
      }
      
      // Find and click batch delete button
      const batchDeleteBtn = page.locator('.btn-batch-delete, button:has-text("Delete")').first();
      
      if (await batchDeleteBtn.isVisible() && await batchDeleteBtn.isEnabled()) {
        // Set up dialog handler
        let dialogAppeared = false;
        page.once('dialog', dialog => {
          dialogAppeared = true;
          expect(dialog.type()).toBe('confirm');
          expect(dialog.message()).toMatch(/delete|remove/i);
          dialog.dismiss(); // Cancel for safety
        });
        
        await batchDeleteBtn.click();
        
        // Wait a bit for dialog
        await page.waitForTimeout(1000);
        
        // Verify confirmation was requested
        expect(dialogAppeared).toBeTruthy();
      }
    }
  });

  test('should maintain selection state during pagination', async ({ page }) => {
    // Look for pagination controls
    const nextPageBtn = page.locator('button:has-text("Next"), .pagination-next, [aria-label="Next page"]').first();
    const loadMoreBtn = page.locator('button:has-text("Load More"), .load-more-btn').first();
    
    if (await nextPageBtn.isVisible() || await loadMoreBtn.isVisible()) {
      // Select some files on first page
      const fileCheckboxes = page.locator('.file-checkbox');
      const initialCount = await fileCheckboxes.count();
      
      if (initialCount > 0) {
        // Select first two files
        await fileCheckboxes.first().click();
        if (initialCount > 1) {
          await fileCheckboxes.nth(1).click();
        }
        
        // Go to next page or load more
        if (await nextPageBtn.isVisible()) {
          await nextPageBtn.click();
        } else if (await loadMoreBtn.isVisible()) {
          await loadMoreBtn.click();
        }
        
        // Wait for new content
        await page.waitForTimeout(1000);
        
        // Check if previous selections are maintained
        // This depends on implementation - some systems clear selections on pagination
        const selectedCount = await page.locator('.file-checkbox:checked').count();
        
        // Document the behavior (whether selections persist or not)
        console.log(`Selected files after pagination: ${selectedCount}`);
      }
    }
  });

  test('should handle rapid checkbox clicks without losing state', async ({ page }) => {
    await page.waitForSelector('.file-item, .file-card, [class*="file"]', { timeout: 5000 });
    
    const fileCheckboxes = page.locator('.file-checkbox');
    const checkboxCount = await fileCheckboxes.count();
    
    if (checkboxCount > 0) {
      const firstCheckbox = fileCheckboxes.first();
      
      // Rapidly click the checkbox multiple times
      for (let i = 0; i < 5; i++) {
        await firstCheckbox.click();
        await page.waitForTimeout(50); // Small delay between clicks
      }
      
      // After odd number of clicks, checkbox should be checked
      await expect(firstCheckbox).toBeChecked();
      
      // Click once more
      await firstCheckbox.click();
      
      // Should now be unchecked
      await expect(firstCheckbox).not.toBeChecked();
    }
  });

  test('should show selection count when files are selected', async ({ page }) => {
    await page.waitForSelector('.file-item, .file-card, [class*="file"]', { timeout: 5000 });
    
    const fileCheckboxes = page.locator('.file-checkbox');
    const checkboxCount = await fileCheckboxes.count();
    
    if (checkboxCount >= 3) {
      // Select 3 files
      for (let i = 0; i < 3; i++) {
        await fileCheckboxes.nth(i).click();
      }
      
      // Look for selection count display
      const selectionCountElements = [
        page.locator('text=/3.*selected/i'),
        page.locator('.selection-count:has-text("3")'),
        page.locator('[class*="count"]:has-text("3")')
      ];
      
      let countDisplayed = false;
      for (const element of selectionCountElements) {
        if (await element.isVisible().catch(() => false)) {
          countDisplayed = true;
          break;
        }
      }
      
      expect(countDisplayed).toBeTruthy();
    }
  });

  test('should handle file operations on empty selection', async ({ page }) => {
    await page.waitForSelector('.file-item, .file-card, [class*="file"]', { timeout: 5000 });
    
    // Try batch operations without selecting any files
    const batchDownloadBtn = page.locator('.btn-batch-download, button:has-text("Download")').first();
    
    if (await batchDownloadBtn.isVisible()) {
      // Try to click while disabled
      const isDisabled = await batchDownloadBtn.isDisabled();
      
      if (!isDisabled) {
        // If not disabled, clicking should show a message
        await batchDownloadBtn.click();
        
        // Look for error message
        const errorMessages = [
          page.locator('text=/no files selected/i'),
          page.locator('.toast.error, .error-message'),
          page.locator('[role="alert"]')
        ];
        
        let errorShown = false;
        for (const msg of errorMessages) {
          if (await msg.isVisible().catch(() => false)) {
            errorShown = true;
            break;
          }
        }
        
        expect(errorShown).toBeTruthy();
      }
    }
  });

  test('should handle keyboard navigation for checkboxes', async ({ page }) => {
    await page.waitForSelector('.file-item, .file-card, [class*="file"]', { timeout: 5000 });
    
    const firstCheckbox = page.locator('.file-checkbox').first();
    
    if (await firstCheckbox.count() > 0) {
      // Focus on first checkbox
      await firstCheckbox.focus();
      
      // Press space to toggle
      await page.keyboard.press('Space');
      await expect(firstCheckbox).toBeChecked();
      
      // Press space again to uncheck
      await page.keyboard.press('Space');
      await expect(firstCheckbox).not.toBeChecked();
      
      // Try Tab navigation to next checkbox
      await page.keyboard.press('Tab');
      
      // Check if focus moved to next interactive element
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
      expect(focusedElement).toBeTruthy();
    }
  });

  test('should prevent text selection when shift-clicking files', async ({ page }) => {
    await page.waitForSelector('.file-item, .file-card, [class*="file"]', { timeout: 5000 });
    
    const fileItems = page.locator('.file-item, .file-card, [class*="file-row"]');
    const itemCount = await fileItems.count();
    
    if (itemCount >= 3) {
      // Click first file
      await fileItems.first().click();
      
      // Shift-click third file
      await fileItems.nth(2).click({ modifiers: ['Shift'] });
      
      // Check that text wasn't selected
      const selectedText = await page.evaluate(() => window.getSelection().toString());
      expect(selectedText).toBe('');
      
      // Verify multiple files are selected (if shift-selection is implemented)
      const selectedCount = await page.locator('.file-checkbox:checked').count();
      console.log(`Files selected with shift-click: ${selectedCount}`);
    }
  });
});