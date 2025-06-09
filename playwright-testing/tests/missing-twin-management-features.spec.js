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

test.describe('Required Elements - Twin Management Core Features', () => {
  const requiredElements = [
    { 
      name: 'Create New Twin Button', 
      selectors: [
        'button:has-text("Create New Twin")',
        'button:has-text("New Twin")',
        'button:has-text("Add Twin")',
        '.create-twin-button',
        '[data-action="create-twin"]',
        '.add-twin'
      ]
    },
    { 
      name: 'Twin Creation Wizard', 
      selectors: [
        '.twin-creation-wizard',
        '.new-twin-form',
        '[data-testid="twin-wizard"]',
        '.create-twin-modal',
        '.twin-setup'
      ]
    },
    { 
      name: 'Delete Twin Button', 
      selectors: [
        'button:has-text("Delete")',
        'button:has-text("Remove")',
        '.delete-twin',
        '[data-action="delete"]',
        '.twin-delete'
      ]
    },
    { 
      name: 'Clone Twin Button', 
      selectors: [
        'button:has-text("Clone")',
        'button:has-text("Duplicate")',
        '.clone-twin',
        '[data-action="clone"]',
        '.duplicate-twin'
      ]
    },
    { 
      name: 'Export Twin Button', 
      selectors: [
        'button:has-text("Export")',
        'button:has-text("Download")',
        '.export-twin',
        '[data-action="export"]',
        '.download-twin'
      ]
    },
    { 
      name: 'Import Twin Button', 
      selectors: [
        'button:has-text("Import")',
        'button:has-text("Upload")',
        '.import-twin',
        '[data-action="import"]',
        '.upload-twin'
      ]
    },
    { 
      name: 'Twin Privacy Toggle', 
      selectors: [
        '.privacy-toggle',
        'button:has-text("Make Public")',
        'button:has-text("Make Private")',
        '.visibility-control',
        '[data-action="toggle-privacy"]'
      ]
    },
    { 
      name: 'Twin Backup Button', 
      selectors: [
        'button:has-text("Backup")',
        'button:has-text("Save Backup")',
        '.backup-twin',
        '[data-action="backup"]',
        '.create-backup'
      ]
    },
    { 
      name: 'Version History', 
      selectors: [
        '.version-history',
        'button:has-text("History")',
        '.twin-timeline',
        '[data-testid="version-history"]',
        '.history-panel'
      ]
    },
    { 
      name: 'Twin Settings Panel', 
      selectors: [
        '.twin-settings',
        'button:has-text("Settings")',
        '.configuration-panel',
        '[data-action="settings"]',
        '.twin-config'
      ]
    },
    { 
      name: 'Twin Search Box', 
      selectors: [
        'input[placeholder*="Search twins"]',
        'input[placeholder*="Find twin"]',
        '.twin-search',
        '[data-testid="twin-search"]',
        '.search-twins'
      ]
    },
    { 
      name: 'Twin Filter Options', 
      selectors: [
        '.twin-filters',
        '.filter-dropdown',
        'select[name*="filter"]',
        '[data-testid="twin-filter"]',
        '.filter-controls'
      ]
    },
    { 
      name: 'Select All Checkbox', 
      selectors: [
        'input[type="checkbox"].select-all',
        '#selectAllTwins',
        '[data-testid="select-all-twins"]',
        '.select-all-twins'
      ]
    },
    { 
      name: 'Twin Selection Checkbox', 
      selectors: [
        'input[type="checkbox"].twin-select',
        '.twin-checkbox',
        '[data-testid="twin-select"]',
        '.select-twin'
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
      name: 'Twin Status Indicator', 
      selectors: [
        '.twin-status',
        '.health-indicator',
        '[data-testid="twin-health"]',
        '.status-badge',
        '.twin-health'
      ]
    },
    { 
      name: 'Twin Categories', 
      selectors: [
        '.twin-categories',
        '.category-tags',
        '[data-testid="twin-tags"]',
        '.twin-tags',
        '.categories'
      ]
    },
    { 
      name: 'Twin List View Toggle', 
      selectors: [
        '.view-toggle',
        'button:has-text("List View")',
        'button:has-text("Grid View")',
        '[data-view="list"]',
        '.layout-toggle'
      ]
    },
    { 
      name: 'Multiple Twin Cards', 
      selectors: [
        '.twin-card:nth-child(2)',
        '.twin-item:nth-child(2)',
        '[data-testid="twin-card"]:nth-child(2)'
      ]
    },
    { 
      name: 'User Authentication UI', 
      selectors: [
        '.user-profile',
        '.user-info',
        'button:has-text("Logout")',
        '.current-user',
        '.user-avatar'
      ]
    }
  ];
  
  test.beforeEach(async ({ page }) => {
    // Login first
    await loginUser(page);
    
    // Navigate to twin management page
    await page.goto('http://localhost:8357/pages/twin-management.html');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
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
          path: `playwright-testing/screenshots/missing-${name.toLowerCase().replace(/\s+/g, '-')}-twin-management.png`,
          fullPage: true
        });
      }
      
      expect(found).toBeTruthy();
    });
  });
  
  test('should support multiple twins display', async ({ page }) => {
    // Check if page shows multiple twins or has capacity for them
    const twinElements = [
      '.twin-card',
      '.twin-item',
      '[data-testid="twin"]',
      '.twin-container'
    ];
    
    let totalTwins = 0;
    for (const selector of twinElements) {
      const count = await page.locator(selector).count();
      totalTwins += count;
    }
    
    if (totalTwins <= 1) {
      await page.screenshot({ 
        path: 'playwright-testing/screenshots/missing-multiple-twins-support-twin-management.png',
        fullPage: true
      });
    }
    
    // Should support more than one twin
    expect(totalTwins).toBeGreaterThan(1);
  });
  
  test('should have proper navigation for twin management workflow', async ({ page }) => {
    // Check for workflow navigation elements
    const workflowElements = [
      'button:has-text("Next")',
      'button:has-text("Previous")', 
      'button:has-text("Continue")',
      '.wizard-navigation',
      '.step-indicator'
    ];
    
    let hasWorkflow = false;
    for (const selector of workflowElements) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        hasWorkflow = true;
        break;
      }
    }
    
    if (!hasWorkflow) {
      await page.screenshot({ 
        path: 'playwright-testing/screenshots/missing-workflow-navigation-twin-management.png',
        fullPage: true
      });
    }
    
    expect(hasWorkflow).toBeTruthy();
  });
  
  test('should have twin activity or recent actions display', async ({ page }) => {
    // Check for activity feed or recent actions
    const activitySelectors = [
      '.twin-activity',
      '.recent-actions',
      '.activity-feed',
      '[data-testid="twin-activity"]',
      '.action-history'
    ];
    
    let hasActivity = false;
    for (const selector of activitySelectors) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        hasActivity = true;
        break;
      }
    }
    
    if (!hasActivity) {
      await page.screenshot({ 
        path: 'playwright-testing/screenshots/missing-twin-activity-twin-management.png',
        fullPage: true
      });
    }
    
    expect(hasActivity).toBeTruthy();
  });
  
  test('should have proper error handling displays', async ({ page }) => {
    // Check for error states or messages
    const errorSelectors = [
      '.error-message',
      '.alert-error',
      '[role="alert"]',
      '.notification',
      '.toast'
    ];
    
    // This test checks if error handling UI exists (even if not currently shown)
    let hasErrorHandling = false;
    for (const selector of errorSelectors) {
      const elements = await page.locator(selector).all();
      if (elements.length > 0) {
        hasErrorHandling = true;
        break;
      }
    }
    
    // Note: This test might legitimately fail if no error UI is implemented
    // That would indicate missing error handling, which is important feedback
    if (!hasErrorHandling) {
      await page.screenshot({ 
        path: 'playwright-testing/screenshots/missing-error-handling-twin-management.png',
        fullPage: true
      });
    }
    
    expect(hasErrorHandling).toBeTruthy();
  });
});