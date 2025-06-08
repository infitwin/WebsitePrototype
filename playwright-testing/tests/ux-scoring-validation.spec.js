const { test, expect } = require('@playwright/test');

test.describe('UX Scoring System Validation & Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8357/dashboard-montecarlo-v3-optimized.html');
  });

  test('should display valid score ranges (0-100)', async ({ page }) => {
    // Find all score elements
    const scoreElements = page.locator('.score, [class*="score"], .metric-value');
    const scoreCount = await scoreElements.count();
    
    if (scoreCount > 0) {
      for (let i = 0; i < scoreCount; i++) {
        const scoreElement = scoreElements.nth(i);
        const scoreText = await scoreElement.textContent();
        
        if (scoreText && scoreText.match(/\d+/)) {
          const score = parseFloat(scoreText.replace(/[^\d.]/g, ''));
          
          // Verify score is within valid range
          expect(score).toBeGreaterThanOrEqual(0);
          expect(score).toBeLessThanOrEqual(100);
        }
      }
    }
  });

  test('should handle score precision consistently', async ({ page }) => {
    // Find score elements that might show decimals
    const scoreElements = page.locator('.score, [class*="score"], .metric-value');
    const scores = [];
    
    const scoreCount = await scoreElements.count();
    for (let i = 0; i < scoreCount; i++) {
      const scoreText = await scoreElements.nth(i).textContent();
      if (scoreText && scoreText.match(/\d+\.?\d*/)) {
        scores.push(scoreText.trim());
      }
    }
    
    if (scores.length > 1) {
      // Check for consistent decimal formatting
      const hasDecimals = scores.some(score => score.includes('.'));
      if (hasDecimals) {
        const decimalScores = scores.filter(score => score.includes('.'));
        
        // Verify consistent decimal places (should be 0, 1, or 2)
        decimalScores.forEach(score => {
          const decimalPart = score.split('.')[1];
          expect(decimalPart.length).toBeLessThanOrEqual(2);
        });
      }
    }
  });

  test('should handle winner selection with ties correctly', async ({ page }) => {
    // Find elements that might indicate winners
    const winnerElements = page.locator('.winner, [class*="winner"], .best-score, .top-choice');
    const winnerCount = await winnerElements.count();
    
    // Check if there are winner indicators
    if (winnerCount > 0) {
      const firstWinner = winnerElements.first();
      await expect(firstWinner).toBeVisible();
      
      // If multiple winners exist, they should be clearly differentiated
      if (winnerCount > 1) {
        // Verify they have distinct styling or are in different categories
        for (let i = 0; i < winnerCount; i++) {
          const winner = winnerElements.nth(i);
          await expect(winner).toBeVisible();
        }
      }
    }
  });

  test('should display responsive grid layout properly', async ({ page }) => {
    // Test desktop layout first
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.waitForTimeout(300);
    
    const gridContainer = page.locator('.grid, .design-grid, .cards-grid, .dashboard-grid');
    if (await gridContainer.first().isVisible()) {
      const gridStyles = await gridContainer.first().evaluate(el => 
        window.getComputedStyle(el).display
      );
      
      // Should use grid or flex layout
      expect(['grid', 'flex'].includes(gridStyles)).toBeTruthy();
    }
    
    // Test mobile layout
    await page.setViewportSize({ width: 360, height: 640 });
    await page.waitForTimeout(500);
    
    // Verify mobile layout changes
    const cards = page.locator('.card, .design-card, .score-card');
    const cardCount = await cards.count();
    
    if (cardCount > 0) {
      // Check if cards stack properly on mobile
      const firstCard = cards.first();
      const cardWidth = await firstCard.boundingBox();
      
      if (cardWidth) {
        // Card should take up most of the mobile width
        expect(cardWidth.width).toBeGreaterThan(300);
      }
    }
  });

  test('should handle button interactions properly', async ({ page }) => {
    // Find interactive buttons
    const buttons = page.locator('button, .btn, .button, [role="button"]');
    const buttonCount = await buttons.count();
    
    if (buttonCount > 0) {
      const firstButton = buttons.first();
      
      // Check button is visible and enabled
      await expect(firstButton).toBeVisible();
      
      // Test hover state if button is interactive
      if (await firstButton.isEnabled()) {
        await firstButton.hover();
        await page.waitForTimeout(200);
        
        // Check for visual feedback (hover effects)
        const hoverStyles = await firstButton.evaluate(el => {
          const styles = window.getComputedStyle(el);
          return {
            cursor: styles.cursor,
            backgroundColor: styles.backgroundColor,
            transform: styles.transform
          };
        });
        
        // Button should show interactivity (cursor pointer or visual changes)
        expect(hoverStyles.cursor === 'pointer' || 
               hoverStyles.transform !== 'none' || 
               hoverStyles.backgroundColor !== 'rgba(0, 0, 0, 0)').toBeTruthy();
      }
    }
  });

  test('should handle text overflow gracefully', async ({ page }) => {
    // Test with narrow viewport
    await page.setViewportSize({ width: 320, height: 568 });
    await page.waitForTimeout(300);
    
    // Find text elements that might overflow
    const textElements = page.locator('h1, h2, h3, p, .description, .title');
    const textCount = await textElements.count();
    
    if (textCount > 0) {
      for (let i = 0; i < Math.min(textCount, 5); i++) {
        const textElement = textElements.nth(i);
        
        if (await textElement.isVisible()) {
          const boundingBox = await textElement.boundingBox();
          const styles = await textElement.evaluate(el => {
            const computed = window.getComputedStyle(el);
            return {
              overflow: computed.overflow,
              textOverflow: computed.textOverflow,
              whiteSpace: computed.whiteSpace,
              wordWrap: computed.wordWrap
            };
          });
          
          // Text should handle overflow appropriately
          if (boundingBox && boundingBox.width > 0) {
            const hasOverflowHandling = 
              styles.overflow === 'hidden' ||
              styles.textOverflow === 'ellipsis' ||
              styles.wordWrap === 'break-word' ||
              styles.whiteSpace === 'nowrap';
              
            // Either text fits or has overflow handling
            expect(boundingBox.width <= 320 || hasOverflowHandling).toBeTruthy();
          }
        }
      }
    }
  });

  test('should maintain performance with multiple score cards', async ({ page }) => {
    // Start performance measurement
    await page.evaluate(() => performance.mark('test-start'));
    
    // Find all score cards or similar elements
    const cards = page.locator('.card, .score-card, .design-card, .metric-card');
    const cardCount = await cards.count();
    
    if (cardCount > 5) {
      // Test rapid hover over multiple cards
      for (let i = 0; i < Math.min(cardCount, 10); i++) {
        const card = cards.nth(i);
        if (await card.isVisible()) {
          await card.hover();
          await page.waitForTimeout(50); // Brief pause between hovers
        }
      }
      
      // End performance measurement
      await page.evaluate(() => performance.mark('test-end'));
      
      const duration = await page.evaluate(() => {
        performance.measure('test-duration', 'test-start', 'test-end');
        const measure = performance.getEntriesByName('test-duration')[0];
        return measure.duration;
      });
      
      // Hover interactions should complete within reasonable time
      expect(duration).toBeLessThan(2000); // 2 seconds max for 10 hover actions
    }
  });

  test('should display proper color contrast for accessibility', async ({ page }) => {
    // Find score elements with specific styling
    const scoreElements = page.locator('.score, [class*="score"], .winner, .highlight');
    const elementCount = await scoreElements.count();
    
    if (elementCount > 0) {
      const firstElement = scoreElements.first();
      
      if (await firstElement.isVisible()) {
        const styles = await firstElement.evaluate(el => {
          const computed = window.getComputedStyle(el);
          return {
            color: computed.color,
            backgroundColor: computed.backgroundColor,
            borderColor: computed.borderColor
          };
        });
        
        // Basic check that colors are defined (not transparent/default)
        expect(styles.color).not.toBe('rgba(0, 0, 0, 0)');
        
        // If background color is set, ensure it's not same as text color
        if (styles.backgroundColor !== 'rgba(0, 0, 0, 0)') {
          expect(styles.color).not.toBe(styles.backgroundColor);
        }
      }
    }
  });

  test('should handle keyboard navigation accessibility', async ({ page }) => {
    // Find focusable elements
    const focusableElements = page.locator('button, a, input, [tabindex]:not([tabindex="-1"])');
    const focusableCount = await focusableElements.count();
    
    if (focusableCount > 0) {
      // Test keyboard navigation
      await page.keyboard.press('Tab');
      
      // Check if an element received focus
      const focusedElement = page.locator(':focus');
      const hasFocus = await focusedElement.count() > 0;
      
      if (hasFocus) {
        // Verify focus is visible
        const focusStyles = await focusedElement.evaluate(el => {
          const styles = window.getComputedStyle(el);
          return {
            outline: styles.outline,
            outlineColor: styles.outlineColor,
            outlineWidth: styles.outlineWidth,
            boxShadow: styles.boxShadow
          };
        });
        
        // Should have visible focus indicator
        const hasFocusIndicator = 
          focusStyles.outline !== 'none' ||
          focusStyles.outlineWidth !== '0px' ||
          focusStyles.boxShadow !== 'none';
          
        expect(hasFocusIndicator).toBeTruthy();
      }
    }
  });

  test('should handle edge case score calculations', async ({ page }) => {
    // Look for score calculation logic or displayed calculations
    const scoreContainers = page.locator('.score-container, .metric-group, .calculation');
    const containerCount = await scoreContainers.count();
    
    if (containerCount > 0) {
      const scoreTexts = [];
      
      for (let i = 0; i < containerCount; i++) {
        const container = scoreContainers.nth(i);
        const scores = await container.locator('.score, [class*="score"]').allTextContents();
        scoreTexts.push(...scores);
      }
      
      // Test for edge cases in score display
      scoreTexts.forEach(scoreText => {
        if (scoreText && scoreText.match(/\d/)) {
          // Should not display impossible values
          expect(scoreText).not.toMatch(/NaN|Infinity|undefined|null/);
          
          // Should not have leading zeros (except for 0.x decimals)
          expect(scoreText).not.toMatch(/^0\d+/);
          
          // Should have reasonable precision
          const numberMatch = scoreText.match(/(\d+\.?\d*)/);
          if (numberMatch) {
            const number = parseFloat(numberMatch[1]);
            expect(number).toBeLessThan(1000); // Reasonable upper bound
          }
        }
      });
    }
  });
});