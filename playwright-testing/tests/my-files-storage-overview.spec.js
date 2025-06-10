const { test, expect } = require('@playwright/test');

test.describe('My Files Storage Overview', () => {
  
  // Helper function for login (from conversation context)
  async function loginUser(page) {
    await page.goto('http://localhost:8357/pages/auth.html');
    await page.click('[data-tab="login"]');
    await page.fill('.login-email', 'weezer@yev.com');
    await page.fill('.login-password', '123456');
    await page.click('button:has-text("Access Your Memories")');
    await page.waitForURL('**/dashboard.html');
  }

  test.beforeEach(async ({ page }) => {
    // Login with test credentials 
    await loginUser(page);
    // Navigate to My Files page
    await page.goto('http://localhost:8357/pages/my-files.html');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Storage Breakdown Chart', () => {
    test('should display storage breakdown section', async ({ page }) => {
      // Check for storage overview section
      await expect(page.locator('.storage-overview-section')).toBeVisible();
      await expect(page.locator('h2:has-text("Storage Overview")')).toBeVisible();
    });

    test('should have storage breakdown chart', async ({ page }) => {
      // Check for chart container
      const chartCard = page.locator('.chart-card');
      await expect(chartCard).toBeVisible();
      await expect(chartCard.locator('h3:has-text("Storage Breakdown")')).toBeVisible();
      
      // Check for chart element
      const chartContainer = page.locator('#storageDonutChart');
      await expect(chartContainer).toBeVisible();
      
      // Take screenshot of chart area
      await chartCard.screenshot({ path: 'storage-breakdown-chart.png' });
    });

    test('should load chart data without errors', async ({ page }) => {
      const errors = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      // Wait for chart to potentially load
      await page.waitForTimeout(3000);
      
      // Check for chart-related errors
      const chartErrors = errors.filter(error => 
        error.includes('chart') || 
        error.includes('donut') ||
        error.includes('storage') ||
        error.includes('breakdown')
      );
      
      if (chartErrors.length > 0) {
        await page.screenshot({ path: 'storage-chart-errors.png' });
        console.log('Chart errors found:', chartErrors);
      }
      
      expect(chartErrors.length).toBe(0);
    });
  });

  test.describe('Quick Stats Section', () => {
    test('should display quick stats card', async ({ page }) => {
      const statsCard = page.locator('.stats-card');
      await expect(statsCard).toBeVisible();
      await expect(statsCard.locator('h3:has-text("Quick Stats")')).toBeVisible();
    });

    test('should show all required stats', async ({ page }) => {
      const requiredStats = [
        { id: 'totalUsed', label: 'Total Used' },
        { id: 'totalFiles', label: 'Total Files' },
        { id: 'largestFile', label: 'Largest File' },
        { id: 'avgFileSize', label: 'Average Size' }
      ];

      for (const stat of requiredStats) {
        const statValue = page.locator(`#${stat.id}`);
        const statLabel = page.locator(`.stat-label:has-text("${stat.label}")`);
        
        await expect(statValue).toBeVisible();
        await expect(statLabel).toBeVisible();
        
        // Check that stat value has content
        const valueText = await statValue.textContent();
        expect(valueText.length).toBeGreaterThan(0);
      }
    });

    test('should display meaningful stat values', async ({ page }) => {
      // Check that stats show actual values, not just "0"
      const totalUsed = await page.locator('#totalUsed').textContent();
      const totalFiles = await page.locator('#totalFiles').textContent();
      
      // Values should contain units or numbers
      expect(totalUsed).toMatch(/\d+\s*(GB|MB|KB|Bytes)/);
      expect(totalFiles).toMatch(/\d+/);
      
      // Take screenshot of stats section
      await page.locator('.stats-card').screenshot({ path: 'storage-quick-stats.png' });
    });
  });

  test.describe('Storage Usage Meter', () => {
    test('should display storage usage meter', async ({ page }) => {
      const storageCard = page.locator('.storage-card');
      await expect(storageCard).toBeVisible();
      await expect(storageCard.locator('h3:has-text("Storage Usage")')).toBeVisible();
    });

    test('should show progress bar and details', async ({ page }) => {
      // Check storage meter elements
      await expect(page.locator('.storage-meter')).toBeVisible();
      await expect(page.locator('.storage-used')).toBeVisible();
      await expect(page.locator('#storageText')).toBeVisible();
      await expect(page.locator('#storagePercent')).toBeVisible();
      
      // Check that details have content
      const storageText = await page.locator('#storageText').textContent();
      const storagePercent = await page.locator('#storagePercent').textContent();
      
      expect(storageText).toMatch(/\d+\s*(MB|GB)\s+of\s+\d+\s*(MB|GB)\s+used/);
      expect(storagePercent).toMatch(/\d+%/);
    });

    test('should have functional progress bar', async ({ page }) => {
      const progressBar = page.locator('.storage-used');
      const width = await progressBar.evaluate(el => el.style.width);
      
      // Progress bar should have some width set
      expect(width).toMatch(/\d+%/);
      
      // Take screenshot of storage meter
      await page.locator('.storage-card').screenshot({ path: 'storage-usage-meter.png' });
    });
  });

  test.describe('Quick Actions', () => {
    test('should display quick actions section', async ({ page }) => {
      const quickActions = page.locator('.quick-actions');
      await expect(quickActions).toBeVisible();
      await expect(quickActions.locator('h3:has-text("Quick Actions")')).toBeVisible();
    });

    test('should have optimize and export buttons', async ({ page }) => {
      const optimizeBtn = page.locator('#optimizeBtn');
      const exportBtn = page.locator('#exportBtn');
      
      await expect(optimizeBtn).toBeVisible();
      await expect(exportBtn).toBeVisible();
      
      // Check button text content
      await expect(optimizeBtn.locator('.action-text')).toHaveText('Optimize Storage');
      await expect(exportBtn.locator('.action-text')).toHaveText('Export Report');
      
      // Check button icons
      await expect(optimizeBtn.locator('.action-icon')).toHaveText('🔧');
      await expect(exportBtn.locator('.action-icon')).toHaveText('📊');
    });

    test('should have clickable action buttons', async ({ page }) => {
      const optimizeBtn = page.locator('#optimizeBtn');
      const exportBtn = page.locator('#exportBtn');
      
      await expect(optimizeBtn).toBeEnabled();
      await expect(exportBtn).toBeEnabled();
      
      // Test button hover effects
      await optimizeBtn.hover();
      await page.waitForTimeout(300);
      await exportBtn.hover();
      await page.waitForTimeout(300);
      
      // Take screenshot of actions section
      await page.locator('.quick-actions').screenshot({ path: 'storage-quick-actions.png' });
    });
  });

  test.describe('Storage Overview Integration', () => {
    test('should update when files are present', async ({ page }) => {
      // Wait for potential file loading
      await page.waitForTimeout(5000);
      
      // Check if files are loaded (from conversation context, files exist)
      const filesContainer = page.locator('#filesContainer');
      const emptyState = page.locator('#emptyState');
      
      // If files are present, storage should reflect this
      const totalFiles = await page.locator('#totalFiles').textContent();
      const totalUsed = await page.locator('#totalUsed').textContent();
      
      // Log current state for debugging
      console.log('Total files:', totalFiles);
      console.log('Total used:', totalUsed);
      
      // Take full page screenshot to see current state
      await page.screenshot({ path: 'my-files-storage-overview-full.png', fullPage: true });
    });

    test('should handle data loading errors gracefully', async ({ page }) => {
      const errors = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      // Wait for storage data to load
      await page.waitForTimeout(5000);
      
      // Check for storage-related errors
      const storageErrors = errors.filter(error => 
        error.includes('storage') || 
        error.includes('calculateStorageUsed') ||
        error.includes('getStorageBreakdown')
      );
      
      if (storageErrors.length > 0) {
        await page.screenshot({ path: 'storage-data-errors.png' });
        console.log('Storage data errors:', storageErrors);
      }
      
      // Storage overview should still be visible even with errors
      await expect(page.locator('.storage-overview-section')).toBeVisible();
    });
  });

  test.describe('Missing Elements Detection', () => {
    const requiredElements = [
      { name: 'Storage Breakdown Chart', selectors: ['#storageDonutChart', '.chart-card'] },
      { name: 'Quick Stats Grid', selectors: ['.stats-grid', '.stat-item'] },
      { name: 'Storage Usage Meter', selectors: ['.storage-meter', '.storage-used'] },
      { name: 'Quick Actions', selectors: ['.quick-actions', '#optimizeBtn', '#exportBtn'] },
      { name: 'Storage Overview Section', selectors: ['.storage-overview-section'] }
    ];

    requiredElements.forEach(({ name, selectors }) => {
      test(`should have ${name}`, async ({ page }) => {
        let found = false;
        for (const selector of selectors) {
          const element = page.locator(selector);
          if (await element.count() > 0) {
            found = true;
            break;
          }
        }
        
        if (!found) {
          await page.screenshot({ path: `missing-${name.toLowerCase().replace(/\s+/g, '-')}.png` });
        }
        
        expect(found).toBeTruthy();
      });
    });
  });
});