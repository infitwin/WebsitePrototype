const { test, expect } = require('@playwright/test');

test.describe('Dashboard Category Tiles Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8357/pages/dashboard.html');
  });

  test('should handle extremely large category counts', async ({ page }) => {
    // Test if UI handles large numbers gracefully
    const categoryIds = ['recentCount', 'momentsCount', 'peopleCount', 'placesCount', 'projectsCount', 'insightsCount'];
    
    for (const id of categoryIds) {
      await page.evaluate((elementId) => {
        const element = document.getElementById(elementId);
        if (element) {
          element.textContent = '999999999';
        }
      }, id);
    }
    
    // Check if layout doesn't break
    const categoryTiles = page.locator('.category-tile');
    const tileCount = await categoryTiles.count();
    
    for (let i = 0; i < tileCount; i++) {
      const tile = categoryTiles.nth(i);
      const box = await tile.boundingBox();
      
      // Tiles should maintain reasonable dimensions
      expect(box.width).toBeGreaterThan(50);
      expect(box.height).toBeGreaterThan(50);
      
      // Check if count is still visible
      const count = await tile.locator('.category-count').textContent();
      expect(count).toBeTruthy();
    }
  });

  test('should handle rapid category tile clicks', async ({ page }) => {
    const categoryTiles = page.locator('.category-tile');
    const tileCount = await categoryTiles.count();
    
    // Click each tile rapidly multiple times
    for (let i = 0; i < tileCount; i++) {
      const tile = categoryTiles.nth(i);
      
      // Rapid clicks
      for (let j = 0; j < 5; j++) {
        await tile.click();
        // No wait between clicks
      }
    }
    
    // Page should remain stable
    await expect(page.locator('.symphony-dashboard')).toBeVisible();
    
    // No JavaScript errors
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.waitForTimeout(500);
    expect(errors.filter(e => !e.includes('404')).length).toBe(0);
  });

  test('should handle category tiles with missing data attributes', async ({ page }) => {
    // Remove data attributes to test resilience
    await page.evaluate(() => {
      const tiles = document.querySelectorAll('.category-tile');
      tiles.forEach(tile => {
        tile.removeAttribute('data-category');
      });
    });
    
    // Try clicking tiles without data attributes
    const tiles = page.locator('.category-tile');
    const firstTile = tiles.first();
    
    if (await firstTile.isVisible()) {
      await firstTile.click();
      
      // Should not cause errors
      await expect(page).not.toHaveURL(/error/);
    }
  });

  test('should handle category count updates', async ({ page }) => {
    const counts = ['recentCount', 'momentsCount', 'peopleCount'];
    
    // Simulate rapid count updates
    for (let i = 0; i < 10; i++) {
      for (const countId of counts) {
        await page.evaluate((id, value) => {
          const element = document.getElementById(id);
          if (element) {
            element.textContent = value.toString();
          }
        }, countId, Math.floor(Math.random() * 1000));
      }
      
      await page.waitForTimeout(50);
    }
    
    // Counts should be readable numbers
    for (const countId of counts) {
      const element = page.locator(`#${countId}`);
      const text = await element.textContent();
      const number = parseInt(text);
      
      expect(number).toBeGreaterThanOrEqual(0);
      expect(number).toBeLessThanOrEqual(999);
    }
  });

  test('should maintain tile hover states', async ({ page }) => {
    const tiles = page.locator('.category-tile');
    const tileCount = await tiles.count();
    
    if (tileCount > 0) {
      const firstTile = tiles.first();
      
      // Get initial styles
      const initialStyles = await firstTile.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          transform: styles.transform,
          boxShadow: styles.boxShadow,
          cursor: styles.cursor
        };
      });
      
      // Hover
      await firstTile.hover();
      await page.waitForTimeout(100);
      
      // Get hover styles
      const hoverStyles = await firstTile.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          transform: styles.transform,
          boxShadow: styles.boxShadow,
          cursor: styles.cursor
        };
      });
      
      // Should have pointer cursor at minimum
      expect(hoverStyles.cursor).toBe('pointer');
      
      // Move away
      await page.mouse.move(0, 0);
    }
  });

  test('should handle floating action button interactions', async ({ page }) => {
    const fab = page.locator('#addMemoryBtn');
    
    if (await fab.isVisible()) {
      // Test rapid clicks
      for (let i = 0; i < 3; i++) {
        await fab.click();
        await page.waitForTimeout(100);
      }
      
      // FAB should still be functional
      await expect(fab).toBeVisible();
      
      // Test hover state
      await fab.hover();
      
      const fabStyles = await fab.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          transform: styles.transform,
          boxShadow: styles.boxShadow
        };
      });
      
      // Should have some styling
      expect(fabStyles.transform || fabStyles.boxShadow).toBeTruthy();
    }
  });

  test('should handle widget container resizing', async ({ page }) => {
    // Test different viewport sizes
    const viewports = [
      { width: 1920, height: 1080 }, // Desktop
      { width: 768, height: 1024 }, // Tablet
      { width: 375, height: 667 }, // Mobile
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(300);
      
      // Check widgets grid adapts
      const widgetsGrid = page.locator('.widgets-grid');
      if (await widgetsGrid.isVisible()) {
        const gridStyles = await widgetsGrid.evaluate(el => {
          const styles = window.getComputedStyle(el);
          return {
            gridTemplateColumns: styles.gridTemplateColumns,
            gap: styles.gap
          };
        });
        
        // Should have grid styles
        expect(gridStyles.gridTemplateColumns).toBeTruthy();
        
        // On mobile, should be single column
        if (viewport.width < 768) {
          expect(gridStyles.gridTemplateColumns).toContain('1fr');
        }
      }
    }
  });

  test('should handle Neo4j graph container interactions', async ({ page }) => {
    const graphContainer = page.locator('#neo4j-graph-container');
    
    if (await graphContainer.isVisible()) {
      // Test clicking on graph area
      await graphContainer.click({ position: { x: 100, y: 100 } });
      await graphContainer.click({ position: { x: 200, y: 200 } });
      
      // Test dragging
      await page.mouse.move(150, 150);
      await page.mouse.down();
      await page.mouse.move(250, 250);
      await page.mouse.up();
      
      // Container should remain stable
      await expect(graphContainer).toBeVisible();
      
      const containerBox = await graphContainer.boundingBox();
      expect(containerBox.height).toBe(450); // Height should remain as specified
    }
  });

  test('should handle notification button badge updates', async ({ page }) => {
    const notificationBtn = page.locator('.notification-btn');
    
    if (await notificationBtn.isVisible()) {
      // Simulate badge updates
      await page.evaluate(() => {
        const btn = document.querySelector('.notification-btn');
        if (btn) {
          // Add a badge
          const badge = document.createElement('span');
          badge.className = 'notification-badge';
          badge.textContent = '99+';
          btn.appendChild(badge);
        }
      });
      
      // Click notification button
      await notificationBtn.click();
      
      // Should handle click without errors
      await expect(notificationBtn).toBeVisible();
    }
  });

  test('should handle empty state for all categories', async ({ page }) => {
    // Set all counts to 0
    const categoryIds = ['recentCount', 'momentsCount', 'peopleCount', 'placesCount', 'projectsCount', 'insightsCount'];
    
    for (const id of categoryIds) {
      await page.evaluate((elementId) => {
        const element = document.getElementById(elementId);
        if (element) {
          element.textContent = '0';
        }
      }, id);
    }
    
    // Click on empty category tiles
    const tiles = page.locator('.category-tile');
    const tileCount = await tiles.count();
    
    for (let i = 0; i < Math.min(tileCount, 3); i++) {
      await tiles.nth(i).click();
      await page.waitForTimeout(100);
    }
    
    // Should handle empty states gracefully
    await expect(page.locator('.symphony-dashboard')).toBeVisible();
  });
});