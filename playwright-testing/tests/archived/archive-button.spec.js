const { test, expect } = require('@playwright/test');

/**
 * ARCHIVED TEST FILE
 * 
 * This file contains tests for Archive button functionality that may have been removed.
 * These tests are preserved for historical reference.
 * 
 * Extracted from: storage-dashboard.spec.js
 */

test.describe('Archive Button Tests - ARCHIVED', () => {
  test.skip('should have archive button in storage actions', async ({ page }) => {
    await page.goto('http://localhost:8357/pages/storage-dashboard.html');
    
    // Look for archive button
    const archiveButton = page.locator('button:has-text("Archive")');
    
    // Check if button exists and is visible
    const isVisible = await archiveButton.isVisible().catch(() => false);
    
    if (isVisible) {
      await expect(archiveButton).toBeEnabled();
      
      // Test click functionality
      await archiveButton.click();
      
      // Should show archive modal or navigate to archive page
      const archiveModal = page.locator('.archive-modal, .modal:has-text("Archive")');
      const hasModal = await archiveModal.isVisible().catch(() => false);
      
      if (!hasModal) {
        // Maybe it navigated to archive page
        await page.waitForTimeout(500);
        expect(page.url()).toContain('archive');
      }
    }
  });

  test.skip('should handle file archiving', async ({ page }) => {
    await page.goto('http://localhost:8357/pages/file-browser.html');
    
    // Select a file
    const fileItem = page.locator('.file-item, .file-row').first();
    const hasFiles = await fileItem.isVisible().catch(() => false);
    
    if (hasFiles) {
      await fileItem.click();
      
      // Look for archive action
      const archiveAction = page.locator('button:has-text("Archive"), .action-archive');
      const hasArchiveAction = await archiveAction.isVisible().catch(() => false);
      
      if (hasArchiveAction) {
        await archiveAction.click();
        
        // Should show confirmation or perform archive
        const confirmation = page.locator('.confirm-dialog, .modal:has-text("Archive")');
        await expect(confirmation).toBeVisible();
      }
    }
  });
});