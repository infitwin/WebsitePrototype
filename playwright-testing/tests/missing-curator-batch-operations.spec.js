const { test, expect } = require('@playwright/test');

// Helper function for login
async function loginUser(page) {
  await page.goto('http://localhost:8357/pages/auth.html');
  await page.click('[data-tab="login"]');
  await page.fill('.login-email', 'weezer@yev.com');
  await page.fill('.login-password', '123456');
  await page.click('button:has-text("Access Your Memories")');
  await page.waitForURL('**/dashboard.html');
}

test.describe('Required Elements - Curator Batch Operations & Progress', () => {
  const requiredElements = [
    { 
      name: 'Batch Selection Checkbox', 
      selectors: [
        'input[type="checkbox"].batch-select',
        '.memory-checkbox',
        '[data-testid="batch-select"]',
        '.select-memory',
        '.node-checkbox'
      ]
    },
    { 
      name: 'Select All Checkbox', 
      selectors: [
        'input[type="checkbox"].select-all',
        '#selectAll',
        '[data-testid="select-all"]',
        '.select-all-memories'
      ]
    },
    { 
      name: 'Bulk Actions Menu', 
      selectors: [
        '.bulk-actions',
        '.batch-operations',
        '[data-testid="bulk-actions"]',
        '.selected-actions'
      ]
    },
    { 
      name: 'Progress Indicator', 
      selectors: [
        '.curation-progress',
        '.progress-bar',
        '[data-testid="progress-indicator"]',
        '.completion-meter',
        '.progress-tracker'
      ]
    },
    { 
      name: 'Undo Button', 
      selectors: [
        'button:has-text("Undo")',
        '[aria-label="Undo"]',
        '.undo-button',
        '[data-action="undo"]',
        '.toolbar-undo'
      ]
    },
    { 
      name: 'Redo Button', 
      selectors: [
        'button:has-text("Redo")',
        '[aria-label="Redo"]',
        '.redo-button',
        '[data-action="redo"]',
        '.toolbar-redo'
      ]
    },
    { 
      name: 'Memory Statistics Panel', 
      selectors: [
        '.memory-stats',
        '.statistics-panel',
        '[data-testid="memory-analytics"]',
        '.analytics-dashboard',
        '.stats-overview'
      ]
    },
    { 
      name: 'Help Button', 
      selectors: [
        'button:has-text("Help")',
        '[aria-label="Help"]',
        '.help-button',
        '[data-action="help"]',
        '.tutorial-button'
      ]
    },
    { 
      name: 'User Profile Display', 
      selectors: [
        '.user-profile',
        '.user-info',
        '[data-testid="user-display"]',
        '.current-user',
        '.user-avatar'
      ]
    },
    { 
      name: 'Auto-save Indicator', 
      selectors: [
        '.auto-save-status',
        '.save-indicator',
        '[data-testid="save-status"]',
        '.saving-status',
        'text=Auto-saved'
      ]
    },
    { 
      name: 'Memory Preview', 
      selectors: [
        '.memory-preview',
        '.preview-panel',
        '[data-testid="memory-preview"]',
        '.node-preview',
        '.hover-preview'
      ]
    },
    { 
      name: 'Tags Input', 
      selectors: [
        '.tags-input',
        '.memory-tags',
        '[data-testid="tags"]',
        '.tag-selector',
        'input[placeholder*="tag"]'
      ]
    }
  ];
  
  test.beforeEach(async ({ page }) => {
    // Login first if needed for authenticated pages
    await loginUser(page);
    
    // Navigate to curator page
    await page.goto('http://localhost:8357/pages/curator.html');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Dismiss welcome modal if present
    const welcomeButton = page.locator('button:has-text("I Understand - Start Curating")');
    if (await welcomeButton.isVisible()) {
      await welcomeButton.click();
      await page.waitForTimeout(1000);
    }
  });
  
  requiredElements.forEach(({ name, selectors }) => {
    test(`should have ${name}`, async ({ page }) => {
      let found = false;
      
      // Check each selector
      for (const selector of selectors) {
        const count = await page.locator(selector).count();
        if (count > 0) {
          found = true;
          break;
        }
      }
      
      // Take screenshot if element is missing
      if (!found) {
        await page.screenshot({ 
          path: `playwright-testing/screenshots/missing-${name.toLowerCase().replace(/\s+/g, '-')}-curator.png`,
          fullPage: true
        });
      }
      
      expect(found).toBeTruthy();
    });
  });
  
  test('should display curation progress percentage', async ({ page }) => {
    // Look for any progress percentage display
    const progressSelectors = [
      'text=/\\d+%/',
      '.progress-percentage',
      '[data-testid="progress-percent"]',
      '.completion-percentage'
    ];
    
    let found = false;
    for (const selector of progressSelectors) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        found = true;
        break;
      }
    }
    
    if (!found) {
      await page.screenshot({ 
        path: 'playwright-testing/screenshots/missing-progress-percentage-curator.png',
        fullPage: true
      });
    }
    
    expect(found).toBeTruthy();
  });
  
  test('should have memory count display', async ({ page }) => {
    // Check for memory count indicators
    const countSelectors = [
      'text=/\\d+ memories?/',
      '.memory-count',
      '[data-testid="memory-count"]',
      '.total-memories'
    ];
    
    let found = false;
    for (const selector of countSelectors) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        found = true;
        break;
      }
    }
    
    if (!found) {
      await page.screenshot({ 
        path: 'playwright-testing/screenshots/missing-memory-count-curator.png',
        fullPage: true
      });
    }
    
    expect(found).toBeTruthy();
  });
  
  test('should have keyboard shortcuts help', async ({ page }) => {
    // Look for keyboard shortcuts documentation
    const shortcutSelectors = [
      'text=Keyboard shortcuts',
      'text=Ctrl+Z',
      'text=Cmd+Z',
      '.keyboard-shortcuts',
      '[data-testid="shortcuts-help"]'
    ];
    
    let found = false;
    for (const selector of shortcutSelectors) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        found = true;
        break;
      }
    }
    
    if (!found) {
      await page.screenshot({ 
        path: 'playwright-testing/screenshots/missing-keyboard-shortcuts-curator.png',
        fullPage: true
      });
    }
    
    expect(found).toBeTruthy();
  });
});