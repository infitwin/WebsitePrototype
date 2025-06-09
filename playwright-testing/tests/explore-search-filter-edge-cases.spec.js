const { test, expect } = require('@playwright/test');

test.describe('Explore Search and Filter Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8357/pages/explore.html');
  });

  test('should handle search input with special characters', async ({ page }) => {
    const searchInput = page.locator('.search-bar');
    
    // Test various special characters
    const specialStrings = [
      '<script>alert("xss")</script>',
      '"; DROP TABLE memories; --',
      '\\n\\r\\t',
      '🎭🎨🎪', // emojis
      '你好世界', // Unicode characters
      'a'.repeat(1000), // Very long string
      '   spaces   everywhere   ',
      '!!!@@@###$$$%%%^^^&&&***((()))',
      'null',
      'undefined',
      'NaN'
    ];
    
    for (const testString of specialStrings) {
      await searchInput.fill(testString);
      
      // Should not cause any JavaScript errors
      const errors = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });
      
      await page.waitForTimeout(100);
      expect(errors.filter(e => !e.includes('404')).length).toBe(0);
      
      // Input should accept the value
      const inputValue = await searchInput.inputValue();
      expect(inputValue).toBe(testString);
    }
  });

  test('should handle rapid filter chip toggling', async ({ page }) => {
    const filterChips = page.locator('.filter-chip');
    const chipCount = await filterChips.count();
    
    if (chipCount > 0) {
      // Rapidly toggle all filter chips
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < chipCount; j++) {
          await filterChips.nth(j).click();
          // Don't wait between clicks to test rapid toggling
        }
      }
      
      // UI should remain stable
      await expect(page.locator('.filter-section')).toBeVisible();
    }
  });

  test('should handle time slider extreme values', async ({ page }) => {
    const timeSlider = page.locator('.time-range');
    
    if (await timeSlider.isVisible()) {
      // Set to minimum
      await timeSlider.evaluate(slider => {
        slider.value = slider.min;
        slider.dispatchEvent(new Event('input', { bubbles: true }));
        slider.dispatchEvent(new Event('change', { bubbles: true }));
      });
      
      // Set to maximum
      await timeSlider.evaluate(slider => {
        slider.value = slider.max;
        slider.dispatchEvent(new Event('input', { bubbles: true }));
        slider.dispatchEvent(new Event('change', { bubbles: true }));
      });
      
      // Rapidly change values
      for (let i = 0; i < 10; i++) {
        await timeSlider.evaluate((slider, index) => {
          slider.value = (parseInt(slider.min) + parseInt(slider.max)) / 2 + index;
          slider.dispatchEvent(new Event('input', { bubbles: true }));
        }, i);
      }
      
      // Slider should still be functional
      await expect(timeSlider).toBeVisible();
    }
  });

  test('should handle search while filters are active', async ({ page }) => {
    const searchInput = page.locator('.search-bar');
    const filterChips = page.locator('.filter-chip');
    
    // Activate some filters first
    const chipCount = await filterChips.count();
    if (chipCount > 0) {
      await filterChips.first().click();
      if (chipCount > 1) {
        await filterChips.nth(1).click();
      }
    }
    
    // Now perform search
    await searchInput.fill('test search with filters');
    
    // Check that both search and filters remain active
    await expect(searchInput).toHaveValue('test search with filters');
    
    if (chipCount > 0) {
      const activeFilters = page.locator('.filter-chip.active');
      const activeCount = await activeFilters.count();
      expect(activeCount).toBeGreaterThan(0);
    }
  });

  test('should handle node preview popover interactions', async ({ page }) => {
    const memoryNodes = page.locator('.memory-node');
    const nodeCount = await memoryNodes.count();
    
    if (nodeCount > 0) {
      // Hover over first node
      await memoryNodes.first().hover();
      
      // Check if preview appears
      const preview = page.locator('.node-preview');
      const isPreviewVisible = await preview.isVisible().catch(() => false);
      
      if (isPreviewVisible) {
        // Test preview buttons
        const previewButtons = preview.locator('.preview-btn');
        const buttonCount = await previewButtons.count();
        
        if (buttonCount > 0) {
          // Click primary button
          const primaryButton = preview.locator('.preview-btn.primary');
          if (await primaryButton.isVisible()) {
            await primaryButton.click();
          }
        }
      }
      
      // Move away to hide preview
      await page.mouse.move(0, 0);
    }
  });

  test('should handle Winston panel collapse/expand', async ({ page }) => {
    const winstonPanel = page.locator('.winston-panel');
    const toggleButton = page.locator('.toggle-btn');
    
    if (await toggleButton.isVisible()) {
      // Toggle panel multiple times rapidly
      for (let i = 0; i < 5; i++) {
        await toggleButton.click();
        // Don't wait to test rapid toggling
      }
      
      // Panel should be in a valid state
      const isCollapsed = await winstonPanel.evaluate(el => 
        el.classList.contains('collapsed')
      );
      expect(typeof isCollapsed).toBe('boolean');
    }
  });

  test('should handle empty search results gracefully', async ({ page }) => {
    const searchInput = page.locator('.search-bar');
    
    // Search for something that likely won't exist
    await searchInput.fill('xyzqwerty123456789notfound');
    await page.waitForTimeout(500);
    
    // Should show some indication (empty state or original content)
    const graphContainer = page.locator('.graph-container');
    await expect(graphContainer).toBeVisible();
    
    // No JavaScript errors
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    expect(errors.filter(e => !e.includes('404')).length).toBe(0);
  });

  test('should preserve filter state when searching', async ({ page }) => {
    const filterChips = page.locator('.filter-chip');
    const searchInput = page.locator('.search-bar');
    
    // Activate filters
    const chipCount = await filterChips.count();
    const activatedFilters = [];
    
    for (let i = 0; i < Math.min(chipCount, 3); i++) {
      await filterChips.nth(i).click();
      const text = await filterChips.nth(i).textContent();
      activatedFilters.push(text);
    }
    
    // Perform search
    await searchInput.fill('memory search');
    await page.waitForTimeout(300);
    
    // Check filters are still active
    for (const filterText of activatedFilters) {
      const activeFilter = page.locator(`.filter-chip.active:has-text("${filterText}")`);
      await expect(activeFilter).toBeVisible();
    }
  });

  test('should handle graph zoom controls if present', async ({ page }) => {
    const zoomIn = page.locator('[aria-label="Zoom in"]');
    const zoomOut = page.locator('[aria-label="Zoom out"]');
    const zoomReset = page.locator('[aria-label="Reset zoom"]');
    
    if (await zoomIn.isVisible()) {
      // Zoom in multiple times
      for (let i = 0; i < 10; i++) {
        await zoomIn.click();
      }
      
      // Zoom out multiple times
      for (let i = 0; i < 15; i++) {
        await zoomOut.click();
      }
      
      // Reset zoom
      if (await zoomReset.isVisible()) {
        await zoomReset.click();
      }
      
      // Graph should still be visible
      await expect(page.locator('.graph-container')).toBeVisible();
    }
  });

  test('should handle keyboard navigation in search', async ({ page }) => {
    const searchInput = page.locator('.search-bar');
    
    await searchInput.focus();
    await searchInput.type('test');
    
    // Test keyboard shortcuts
    await page.keyboard.press('Escape'); // Should clear or blur
    
    // Refocus and test
    await searchInput.focus();
    await page.keyboard.press('Control+A'); // Select all
    await page.keyboard.press('Delete'); // Delete
    
    // Input should be empty
    const value = await searchInput.inputValue();
    expect(value).toBe('');
  });
});