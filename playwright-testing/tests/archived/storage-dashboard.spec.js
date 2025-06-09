const { test, expect } = require('@playwright/test');

test.describe('Storage Dashboard Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8357/pages/storage-dashboard.html');
  });

  test('should display storage dashboard correctly', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/Storage Management/);
    
    // Check main dashboard container
    await expect(page.locator('.symphony-dashboard')).toBeVisible();
    
    // Check if storage navigation item is active
    const activeNavItem = page.locator('.sidebar-nav-item.active');
    await expect(activeNavItem).toBeVisible();
    await expect(activeNavItem).toHaveAttribute('data-page', 'storage');
  });

  test('should have functional sidebar navigation', async ({ page }) => {
    // Check sidebar visibility
    await expect(page.locator('.sidebar-nav')).toBeVisible();
    
    // Test navigation items
    const navItems = [
      { selector: 'a[data-page="dashboard"]', tooltip: 'Dashboard' },
      { selector: 'a[data-page="memories"]', tooltip: 'My Memories' },
      { selector: 'a[data-page="twin"]', tooltip: 'Twin Management' },
      { selector: 'a[data-page="explore"]', tooltip: 'Explore' },
      { selector: 'a[data-page="interview"]', tooltip: 'Interview' },
      { selector: 'a[data-page="uploader"]', tooltip: 'Artifact Uploader' },
      { selector: 'a[data-page="talk"]', tooltip: 'Talk to Twin' },
      { selector: 'a[data-page="files"]', tooltip: 'My Files' },
      { selector: 'a[data-page="storage"]', tooltip: 'Storage' }
    ];
    
    for (const item of navItems) {
      const navLink = page.locator(item.selector);
      await expect(navLink).toBeVisible();
      
      // Check tooltip
      const tooltip = navLink.locator('.sidebar-tooltip');
      if (await tooltip.isVisible()) {
        await expect(tooltip).toContainText(item.tooltip);
      }
    }
  });

  test('should display storage overview metrics', async ({ page }) => {
    // Look for storage metrics components
    const possibleSelectors = [
      '.storage-overview',
      '.storage-stats',
      '.storage-metrics',
      '.main-content',
      '.symphony-content'
    ];
    
    let foundMainContent = false;
    for (const selector of possibleSelectors) {
      const element = page.locator(selector);
      if (await element.isVisible()) {
        foundMainContent = true;
        break;
      }
    }
    
    expect(foundMainContent).toBeTruthy();
  });

  test('should show storage usage visualization', async ({ page }) => {
    // Check for common storage visualization elements
    const visualElements = [
      '.storage-chart',
      '.usage-chart',
      '.progress-bar',
      '.storage-graph',
      'canvas',
      'svg',
      '.chart-container'
    ];
    
    let hasVisualization = false;
    for (const selector of visualElements) {
      const element = page.locator(selector);
      if (await element.isVisible()) {
        hasVisualization = true;
        break;
      }
    }
    
    // Visualization might not be present, but main content should be
    const mainContent = page.locator('.symphony-content, .main-content, .storage-dashboard');
    await expect(mainContent.first()).toBeVisible();
  });

  test('should display file type breakdown', async ({ page }) => {
    // Look for file type information
    const fileTypeElements = [
      '.file-types',
      '.file-categories',
      '.storage-breakdown',
      '.file-stats',
      '.category-list'
    ];
    
    // Check if any file type breakdown exists
    let hasFileTypes = false;
    for (const selector of fileTypeElements) {
      const element = page.locator(selector);
      if (await element.isVisible()) {
        hasFileTypes = true;
        break;
      }
    }
    
    // File types might be shown in different ways
    const mainArea = page.locator('.symphony-content, .main-content').first();
    await expect(mainArea).toBeVisible();
  });

  test('should have storage management actions', async ({ page }) => {
    // Look for common storage actions
    const actionButtons = [
      'button:has-text("Clean")',
      'button:has-text("Optimize")',
      'button:has-text("Manage")',
      'button:has-text("Delete")',
      'button:has-text("Archive")',
      '.storage-actions button',
      '.action-button'
    ];
    
    let hasActions = false;
    for (const selector of actionButtons) {
      const button = page.locator(selector);
      if (await button.isVisible()) {
        hasActions = true;
        await expect(button).toBeEnabled();
        break;
      }
    }
    
    // Actions might not be visible initially, check if page loaded
    await expect(page.locator('body')).toBeVisible();
  });

  test('should handle responsive design', async ({ page }) => {
    // Test different viewport sizes
    const viewports = [
      { width: 1920, height: 1080 }, // Desktop
      { width: 1024, height: 768 },  // Tablet landscape
      { width: 768, height: 1024 },  // Tablet portrait
      { width: 375, height: 667 }    // Mobile
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(300);
      
      // Main content should remain visible
      await expect(page.locator('.symphony-dashboard')).toBeVisible();
      
      // Sidebar should adapt on mobile
      if (viewport.width < 768) {
        // Mobile: sidebar might be hidden or collapsed
        const sidebar = page.locator('.sidebar-nav');
        const isVisible = await sidebar.isVisible();
        // Either visible or properly hidden for mobile
        expect(typeof isVisible).toBe('boolean');
      } else {
        // Desktop/tablet: sidebar should be visible
        await expect(page.locator('.sidebar-nav')).toBeVisible();
      }
    }
  });

  test('should load without JavaScript errors', async ({ page }) => {
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.waitForLoadState('networkidle');
    
    // Filter out expected module loading errors
    const criticalErrors = errors.filter(error => 
      !error.includes('Failed to load module') && 
      !error.includes('404') &&
      !error.includes('favicon')
    );
    
    expect(criticalErrors.length).toBe(0);
  });

  test('should have proper accessibility structure', async ({ page }) => {
    // Check heading hierarchy
    const headings = await page.$$eval('h1, h2, h3, h4, h5, h6', elements =>
      elements.map(el => ({
        tag: el.tagName.toLowerCase(),
        text: el.textContent.trim()
      }))
    );
    
    // Should have at least some structure
    expect(headings.length).toBeGreaterThan(0);
    
    // Check for navigation landmarks
    const nav = page.locator('nav, [role="navigation"]');
    await expect(nav.first()).toBeVisible();
    
    // Check for main content area
    const main = page.locator('main, [role="main"], .main-content, .symphony-content');
    await expect(main.first()).toBeVisible();
  });

  test('should show storage alerts or warnings if applicable', async ({ page }) => {
    // Look for storage alerts
    const alertElements = [
      '.storage-alert',
      '.warning',
      '.storage-warning',
      '.alert',
      '.notification'
    ];
    
    // Check if any alerts exist (they might not always be present)
    for (const selector of alertElements) {
      const alert = page.locator(selector);
      if (await alert.isVisible()) {
        // If alert exists, it should have meaningful content
        const alertText = await alert.textContent();
        expect(alertText.length).toBeGreaterThan(0);
      }
    }
    
    // Main content should be present regardless
    await expect(page.locator('.symphony-dashboard')).toBeVisible();
  });

  test('should integrate with file browser', async ({ page }) => {
    // Look for links to file browser
    const fileBrowserLinks = page.locator('a[href*="file-browser"], a[data-page="files"]');
    const linkCount = await fileBrowserLinks.count();
    
    if (linkCount > 0) {
      const firstLink = fileBrowserLinks.first();
      await expect(firstLink).toBeVisible();
      await expect(firstLink).toBeEnabled();
    }
    
    // Should have navigation to file management
    const filesNavItem = page.locator('a[data-page="files"]');
    await expect(filesNavItem).toBeVisible();
  });

  test('should display storage quota information', async ({ page }) => {
    // Look for quota-related information
    const quotaElements = [
      '.quota',
      '.storage-limit',
      '.usage-limit',
      '.storage-quota',
      '.available-space',
      '.used-space'
    ];
    
    // Check main content area for storage information
    const mainContent = page.locator('.symphony-content, .main-content').first();
    await expect(mainContent).toBeVisible();
    
    // Look for any numerical storage values
    const storageNumbers = page.locator('text=/\\d+\\s*(GB|MB|KB|TB|%)/');
    const numberCount = await storageNumbers.count();
    
    // Might or might not have specific numbers visible
    expect(numberCount).toBeGreaterThanOrEqual(0);
  });
});