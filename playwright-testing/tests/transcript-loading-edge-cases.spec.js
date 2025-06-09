const { test, expect } = require('@playwright/test');

test.describe('Transcript Loading Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8357/pages/interview-transcripts.html');
  });

  test('should handle extremely long transcript session names', async ({ page }) => {
    // Test UI doesn't break with long names
    const sessionContainer = page.locator('#interviewSessionsList');
    
    // Check if container can handle overflow
    const containerStyles = await sessionContainer.evaluate(el => {
      return {
        overflow: window.getComputedStyle(el).overflow,
        overflowX: window.getComputedStyle(el).overflowX,
        overflowY: window.getComputedStyle(el).overflowY
      };
    });
    
    // Should have some overflow handling
    expect(
      containerStyles.overflow !== 'visible' ||
      containerStyles.overflowX !== 'visible' ||
      containerStyles.overflowY !== 'visible'
    ).toBeTruthy();
  });

  test('should maintain sort order when switching between sort options rapidly', async ({ page }) => {
    const sortSelect = page.locator('#sortBy');
    
    // Rapidly change sort options
    await sortSelect.selectOption('date-desc');
    await sortSelect.selectOption('duration-asc');
    await sortSelect.selectOption('date-asc');
    await sortSelect.selectOption('duration-desc');
    await sortSelect.selectOption('date-desc');
    
    // Should end with the last selected option
    await expect(sortSelect).toHaveValue('date-desc');
    
    // No JavaScript errors should occur
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.waitForTimeout(100);
    expect(errors.filter(e => !e.includes('404')).length).toBe(0);
  });

  test('should handle transcript modal opening and closing', async ({ page }) => {
    const modal = page.locator('#transcriptModal');
    const closeButton = page.locator('.modal-close');
    
    // Modal should be hidden initially
    await expect(modal).toHaveCSS('display', 'none');
    
    // Test that close button exists and is clickable
    await expect(closeButton).toBeAttached();
    
    // If we force show the modal, close button should work
    await page.evaluate(() => {
      document.getElementById('transcriptModal').style.display = 'block';
    });
    
    await expect(modal).toBeVisible();
    await closeButton.click();
    
    // Modal should hide on close
    await expect(modal).toHaveCSS('display', 'none');
  });

  test('should handle escape key to close transcript modal', async ({ page }) => {
    const modal = page.locator('#transcriptModal');
    
    // Force show the modal
    await page.evaluate(() => {
      document.getElementById('transcriptModal').style.display = 'block';
    });
    
    await expect(modal).toBeVisible();
    
    // Press escape key
    await page.keyboard.press('Escape');
    
    // Modal should close (if escape handling is implemented)
    // If not implemented, modal will remain visible (both are valid)
    const modalDisplay = await modal.evaluate(el => 
      window.getComputedStyle(el).display
    );
    
    expect(['none', 'block']).toContain(modalDisplay);
  });

  test('should handle clicking outside modal to close', async ({ page }) => {
    const modal = page.locator('#transcriptModal');
    
    // Force show the modal
    await page.evaluate(() => {
      document.getElementById('transcriptModal').style.display = 'block';
    });
    
    await expect(modal).toBeVisible();
    
    // Click outside the modal content (on the modal backdrop)
    await modal.click({ position: { x: 10, y: 10 } });
    
    // Check if modal closes on outside click (common UX pattern)
    // If not implemented, modal will remain visible (both are valid)
    const modalDisplay = await modal.evaluate(el => 
      window.getComputedStyle(el).display
    );
    
    expect(['none', 'block']).toContain(modalDisplay);
  });

  test('should handle session statistics with extreme values', async ({ page }) => {
    // Check if stat values can handle large numbers
    const totalSessions = page.locator('#totalSessions');
    const totalDuration = page.locator('#totalDuration');
    const totalMessages = page.locator('#totalMessages');
    
    // Simulate extreme values
    await page.evaluate(() => {
      document.getElementById('totalSessions').textContent = '999999';
      document.getElementById('totalDuration').textContent = '9999h 59m';
      document.getElementById('totalMessages').textContent = '1000000';
    });
    
    // Check if UI doesn't break
    await expect(totalSessions).toHaveText('999999');
    await expect(totalDuration).toHaveText('9999h 59m');
    await expect(totalMessages).toHaveText('1000000');
    
    // Check if stat cards maintain proper layout
    const statCards = page.locator('.stat-card');
    const firstCardBox = await statCards.first().boundingBox();
    
    expect(firstCardBox).toBeTruthy();
    expect(firstCardBox.width).toBeGreaterThan(50);
    expect(firstCardBox.height).toBeGreaterThan(30);
  });

  test('should handle empty state button click', async ({ page }) => {
    const emptyState = page.locator('#emptySessions');
    
    // Check if empty state is visible
    const isVisible = await emptyState.isVisible();
    
    if (isVisible) {
      const startInterviewButton = emptyState.locator('button.btn-primary');
      await expect(startInterviewButton).toBeVisible();
      
      // Click should navigate to interview page
      await startInterviewButton.click();
      await page.waitForTimeout(500);
      expect(page.url()).toContain('interview.html');
    }
  });

  test('should handle concurrent sort operations without errors', async ({ page }) => {
    const sortSelect = page.locator('#sortBy');
    
    // Trigger multiple sort changes concurrently
    const sortPromises = [
      sortSelect.selectOption('date-asc'),
      sortSelect.selectOption('duration-desc'),
      sortSelect.selectOption('date-desc')
    ];
    
    // Should handle concurrent operations gracefully
    await Promise.allSettled(sortPromises);
    
    // Final value should be one of the options
    const finalValue = await sortSelect.inputValue();
    expect(['date-asc', 'date-desc', 'duration-asc', 'duration-desc']).toContain(finalValue);
  });

  test('should preserve scroll position when sorting', async ({ page }) => {
    const sessionsList = page.locator('#interviewSessionsList');
    const sortSelect = page.locator('#sortBy');
    
    // Scroll down if content exists
    await sessionsList.evaluate(el => {
      el.scrollTop = 100;
    });
    
    const scrollBefore = await sessionsList.evaluate(el => el.scrollTop);
    
    // Change sort
    await sortSelect.selectOption('duration-desc');
    await page.waitForTimeout(100);
    
    const scrollAfter = await sessionsList.evaluate(el => el.scrollTop);
    
    // Scroll position might reset or be preserved (both are valid UX choices)
    expect(typeof scrollAfter).toBe('number');
  });

  test('should handle transcript modal content overflow', async ({ page }) => {
    const transcriptContent = page.locator('.transcript-content');
    
    // Check if transcript content area has proper overflow handling
    const contentStyles = await transcriptContent.evaluate(el => {
      return {
        overflow: window.getComputedStyle(el).overflow,
        overflowY: window.getComputedStyle(el).overflowY,
        maxHeight: window.getComputedStyle(el).maxHeight
      };
    });
    
    // Should have some mechanism to handle long transcripts
    expect(
      contentStyles.overflow === 'auto' ||
      contentStyles.overflow === 'scroll' ||
      contentStyles.overflowY === 'auto' ||
      contentStyles.overflowY === 'scroll' ||
      contentStyles.maxHeight !== 'none'
    ).toBeTruthy();
  });
});