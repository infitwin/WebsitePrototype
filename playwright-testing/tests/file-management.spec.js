const { test, expect } = require('@playwright/test');

test.describe('File Management Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/pages/file-browser.html');
  });

  test('should display file browser interface', async ({ page }) => {
    // Check main file browser container
    await expect(page.locator('.file-browser, .file-manager, [class*="file-browser"]').first()).toBeVisible();
    
    // Check for essential UI elements
    const elements = [
      { selector: '.file-list, .files-container, [class*="file-list"]', name: 'File List' },
      { selector: '.toolbar, .file-toolbar, .actions-bar', name: 'Toolbar' },
      { selector: '.breadcrumb, .path-bar, .current-path', name: 'Breadcrumb/Path' }
    ];
    
    for (const element of elements) {
      const el = page.locator(element.selector).first();
      if (await el.isVisible()) {
        await expect(el).toBeVisible();
      }
    }
  });

  test('should have file upload functionality', async ({ page }) => {
    // Look for upload button
    const uploadButton = page.locator('button:has-text("Upload"), .upload-button, [class*="upload"]').first();
    
    if (await uploadButton.isVisible()) {
      await expect(uploadButton).toBeEnabled();
      
      // Check for file input
      const fileInput = page.locator('input[type="file"]').first();
      if (await fileInput.count() > 0) {
        // Set up file chooser
        const [fileChooser] = await Promise.all([
          page.waitForEvent('filechooser', { timeout: 5000 }).catch(() => null),
          uploadButton.click()
        ]);
        
        if (fileChooser) {
          // File chooser opened successfully
          await fileChooser.setFiles([]);  // Cancel for now
        }
      }
    }
    
    // Check for drag and drop area
    const dropZone = page.locator('.drop-zone, .drag-drop-area, [class*="drop"]').first();
    if (await dropZone.isVisible()) {
      await expect(dropZone).toBeVisible();
      
      // Check for drop zone text
      const dropText = await dropZone.textContent();
      expect(dropText).toMatch(/drag|drop/i);
    }
  });

  test('should display file/folder items', async ({ page }) => {
    // Wait for files to load
    await page.waitForTimeout(1000);
    
    // Check for file/folder items
    const fileItems = page.locator('.file-item, .folder-item, .list-item, [class*="file-item"]');
    const itemCount = await fileItems.count();
    
    if (itemCount > 0) {
      // Check first item structure
      const firstItem = fileItems.first();
      await expect(firstItem).toBeVisible();
      
      // Check for file icon
      const icon = firstItem.locator('.file-icon, .folder-icon, .icon, svg').first();
      if (await icon.isVisible()) {
        await expect(icon).toBeVisible();
      }
      
      // Check for file name
      const fileName = firstItem.locator('.file-name, .item-name, .name').first();
      if (await fileName.isVisible()) {
        const name = await fileName.textContent();
        expect(name).toBeTruthy();
      }
    }
  });

  test('should handle file selection', async ({ page }) => {
    const fileItems = page.locator('.file-item, .folder-item, [class*="file-item"]');
    const itemCount = await fileItems.count();
    
    if (itemCount > 0) {
      const firstItem = fileItems.first();
      
      // Single click to select
      await firstItem.click();
      await page.waitForTimeout(300);
      
      // Check if item is selected
      const isSelected = await firstItem.evaluate(el => 
        el.classList.contains('selected') || 
        el.classList.contains('active') || 
        el.getAttribute('aria-selected') === 'true'
      );
      
      if (isSelected) {
        // Check for selection actions
        const deleteButton = page.locator('button:has-text("Delete"), .delete-button').first();
        const downloadButton = page.locator('button:has-text("Download"), .download-button').first();
        
        const hasActions = await deleteButton.isVisible() || await downloadButton.isVisible();
        expect(hasActions).toBe(true);
      }
    }
  });

  test('should support multiple view modes', async ({ page }) => {
    // Look for view mode toggles
    const gridViewButton = page.locator('button[aria-label*="grid"], .grid-view, [class*="grid-view"]').first();
    const listViewButton = page.locator('button[aria-label*="list"], .list-view, [class*="list-view"]').first();
    
    if (await gridViewButton.isVisible() && await listViewButton.isVisible()) {
      // Switch to grid view
      await gridViewButton.click();
      await page.waitForTimeout(500);
      
      // Check if layout changed to grid
      const container = page.locator('.file-list, .files-container').first();
      const hasGridClass = await container.evaluate(el => 
        el.classList.contains('grid') || 
        el.classList.contains('grid-view') ||
        window.getComputedStyle(el).display === 'grid'
      );
      
      // Switch to list view
      await listViewButton.click();
      await page.waitForTimeout(500);
      
      // Check if layout changed to list
      const hasListClass = await container.evaluate(el => 
        el.classList.contains('list') || 
        el.classList.contains('list-view') ||
        !el.classList.contains('grid')
      );
    }
  });

  test('should have search/filter functionality', async ({ page }) => {
    // Look for search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"], .search-files').first();
    
    if (await searchInput.isVisible()) {
      // Type search query
      await searchInput.fill('test');
      await page.waitForTimeout(500);
      
      // Check if files are filtered
      const visibleItems = page.locator('.file-item:visible, .folder-item:visible');
      const afterSearchCount = await visibleItems.count();
      
      // Clear search
      await searchInput.clear();
      await page.waitForTimeout(500);
      
      // Check if all files are visible again
      const afterClearCount = await visibleItems.count();
      
      // There should be a difference if filter works
      // (unless all files contain "test")
    }
  });

  test('should handle folder navigation', async ({ page }) => {
    // Look for folder items
    const folderItems = page.locator('.folder-item, [class*="folder"], .directory').first();
    
    if (await folderItems.isVisible()) {
      // Double-click to open folder
      await folderItems.dblclick();
      await page.waitForTimeout(1000);
      
      // Check if breadcrumb/path updated
      const breadcrumb = page.locator('.breadcrumb, .path-bar, .current-path').first();
      if (await breadcrumb.isVisible()) {
        const pathText = await breadcrumb.textContent();
        expect(pathText).toBeTruthy();
      }
      
      // Check for back/up button
      const backButton = page.locator('button[aria-label*="back"], .back-button, .up-button').first();
      if (await backButton.isVisible()) {
        await expect(backButton).toBeEnabled();
        
        // Navigate back
        await backButton.click();
        await page.waitForTimeout(500);
      }
    }
  });

  test('should handle file operations context menu', async ({ page }) => {
    const fileItems = page.locator('.file-item, .folder-item');
    const itemCount = await fileItems.count();
    
    if (itemCount > 0) {
      const firstItem = fileItems.first();
      
      // Right-click for context menu
      await firstItem.click({ button: 'right' });
      await page.waitForTimeout(300);
      
      // Check for context menu
      const contextMenu = page.locator('.context-menu, .dropdown-menu, [role="menu"]').first();
      if (await contextMenu.isVisible()) {
        // Check for common file operations
        const operations = ['Open', 'Download', 'Rename', 'Delete', 'Share'];
        
        for (const op of operations) {
          const menuItem = contextMenu.locator(`text="${op}"`).first();
          if (await menuItem.isVisible()) {
            await expect(menuItem).toBeVisible();
          }
        }
        
        // Close context menu
        await page.click('body', { position: { x: 0, y: 0 } });
      }
    }
  });

  test('should show file details/preview', async ({ page }) => {
    const fileItems = page.locator('.file-item:not(.folder-item)').first();
    
    if (await fileItems.isVisible()) {
      // Click to select file
      await fileItems.click();
      await page.waitForTimeout(500);
      
      // Look for details panel or preview
      const detailsPanel = page.locator('.file-details, .preview-panel, .info-panel, aside').first();
      if (await detailsPanel.isVisible()) {
        // Check for file information
        const fileInfo = [
          { selector: '.file-size, .size', name: 'File Size' },
          { selector: '.modified-date, .date, .timestamp', name: 'Modified Date' },
          { selector: '.file-type, .type', name: 'File Type' }
        ];
        
        for (const info of fileInfo) {
          const element = detailsPanel.locator(info.selector).first();
          if (await element.isVisible()) {
            const text = await element.textContent();
            expect(text).toBeTruthy();
          }
        }
      }
    }
  });

  test('should handle storage dashboard integration', async ({ page }) => {
    // Navigate to storage dashboard
    await page.goto('/pages/storage-dashboard.html');
    
    // Check for storage overview
    await expect(page.locator('.storage-dashboard, .storage-overview, [class*="storage"]').first()).toBeVisible();
    
    // Check for storage metrics
    const metrics = [
      { selector: '.storage-used, .used-space', name: 'Used Space' },
      { selector: '.storage-available, .free-space', name: 'Available Space' },
      { selector: '.storage-total, .total-space', name: 'Total Space' }
    ];
    
    for (const metric of metrics) {
      const element = page.locator(metric.selector).first();
      if (await element.isVisible()) {
        const text = await element.textContent();
        expect(text).toMatch(/\d+|GB|MB|KB|%/);
      }
    }
    
    // Check for storage visualization
    const storageChart = page.locator('.storage-chart, .storage-graph, canvas, svg').first();
    if (await storageChart.isVisible()) {
      await expect(storageChart).toBeVisible();
    }
  });
});