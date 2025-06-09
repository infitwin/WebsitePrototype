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

test.describe('Required Elements - My Files Advanced Features', () => {
  const requiredElements = [
    { 
      name: 'File Sharing Controls', 
      selectors: [
        'button:has-text("Share")',
        '.share-file',
        '.file-sharing',
        '[data-action="share"]',
        '.privacy-toggle'
      ]
    },
    { 
      name: 'File Metadata Editor', 
      selectors: [
        'button:has-text("Properties")',
        'button:has-text("Edit Details")',
        '.file-metadata',
        '.edit-metadata',
        '[data-action="edit-properties"]'
      ]
    },
    { 
      name: 'Tags Input Field', 
      selectors: [
        'input[placeholder*="tag"]',
        'input[placeholder*="Tag"]',
        '.tags-input',
        '.file-tags',
        '[data-testid="tags"]'
      ]
    },
    { 
      name: 'Description Field', 
      selectors: [
        'textarea[placeholder*="description"]',
        'textarea[placeholder*="Description"]',
        '.description-input',
        '.file-description',
        '[data-testid="description"]'
      ]
    },
    { 
      name: 'New Folder Button', 
      selectors: [
        'button:has-text("New Folder")',
        'button:has-text("Create Folder")',
        '.create-folder',
        '[data-action="create-folder"]',
        '.add-folder'
      ]
    },
    { 
      name: 'Folder Organization', 
      selectors: [
        '.folder-tree',
        '.directory-structure',
        '.file-tree',
        '[data-testid="folder-tree"]',
        '.folders-panel'
      ]
    },
    { 
      name: 'File Version History', 
      selectors: [
        'button:has-text("History")',
        'button:has-text("Versions")',
        '.version-history',
        '.file-versions',
        '[data-action="history"]'
      ]
    },
    { 
      name: 'File Backup Options', 
      selectors: [
        'button:has-text("Backup")',
        'button:has-text("Archive")',
        '.backup-file',
        '[data-action="backup"]',
        '.create-backup'
      ]
    },
    { 
      name: 'File Compression Tools', 
      selectors: [
        'button:has-text("Compress")',
        'button:has-text("Zip")',
        'button:has-text("Archive")',
        '.compress-files',
        '[data-action="compress"]'
      ]
    },
    { 
      name: 'File Permissions Panel', 
      selectors: [
        'button:has-text("Permissions")',
        'button:has-text("Access Control")',
        '.file-permissions',
        '.access-control',
        '[data-action="permissions"]'
      ]
    },
    { 
      name: 'Recent Files Section', 
      selectors: [
        '.recent-files',
        '.recently-uploaded',
        '[data-testid="recent-files"]',
        '.activity-feed',
        '.file-activity'
      ]
    },
    { 
      name: 'Advanced Search Filters', 
      selectors: [
        '.search-filters',
        'button:has-text("Advanced Search")',
        '.filter-options',
        '[data-testid="search-filters"]',
        '.advanced-filter'
      ]
    },
    { 
      name: 'File Move/Copy Controls', 
      selectors: [
        'button:has-text("Move")',
        'button:has-text("Copy")',
        '.move-file',
        '.copy-file',
        '[data-action="move"]'
      ]
    },
    { 
      name: 'File Upload Progress', 
      selectors: [
        '.upload-progress',
        '.progress-bar',
        '[data-testid="upload-progress"]',
        '.upload-status',
        '.transfer-progress'
      ]
    },
    { 
      name: 'File Thumbnail Generator', 
      selectors: [
        '.file-thumbnail',
        '.thumbnail-grid',
        '[data-testid="thumbnail"]',
        '.preview-grid',
        '.file-preview-thumb'
      ]
    }
  ];
  
  test.beforeEach(async ({ page }) => {
    // Login first
    await loginUser(page);
    
    // Navigate to my files page
    await page.goto('http://localhost:8357/pages/my-files.html');
    
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
          path: `playwright-testing/screenshots/missing-${name.toLowerCase().replace(/\s+/g, '-')}-my-files.png`,
          fullPage: true
        });
      }
      
      expect(found).toBeTruthy();
    });
  });
  
  test('should have working search functionality', async ({ page }) => {
    // Check if search is actually functional
    const searchInput = page.locator('input[placeholder*="Search"]');
    
    if (await searchInput.count() > 0) {
      // Type in search box
      await searchInput.fill('test');
      
      // Check if search results appear or filter is applied
      await page.waitForTimeout(1000);
      
      // Look for search results indication
      const searchResults = [
        '.search-results',
        '.filtered-files',
        '[data-testid="search-results"]',
        '.no-results'
      ];
      
      let hasResults = false;
      for (const selector of searchResults) {
        if (await page.locator(selector).count() > 0) {
          hasResults = true;
          break;
        }
      }
      
      if (!hasResults) {
        await page.screenshot({ 
          path: 'playwright-testing/screenshots/non-functional-search-my-files.png',
          fullPage: true
        });
      }
      
      expect(hasResults).toBeTruthy();
    }
  });
  
  test('should support file upload validation', async ({ page }) => {
    // Check for file upload validation messages
    const validationSelectors = [
      '.upload-error',
      '.file-error',
      '.validation-message',
      '[data-testid="upload-validation"]',
      '.error-message'
    ];
    
    let hasValidation = false;
    for (const selector of validationSelectors) {
      if (await page.locator(selector).count() > 0) {
        hasValidation = true;
        break;
      }
    }
    
    if (!hasValidation) {
      await page.screenshot({ 
        path: 'playwright-testing/screenshots/missing-upload-validation-my-files.png',
        fullPage: true
      });
    }
    
    expect(hasValidation).toBeTruthy();
  });
  
  test('should show storage optimization suggestions', async ({ page }) => {
    // Check for storage optimization features
    const optimizationSelectors = [
      '.storage-optimization',
      'button:has-text("Optimize")',
      'button:has-text("Clean Up")',
      '.cleanup-suggestions',
      '[data-testid="storage-tips"]'
    ];
    
    let hasOptimization = false;
    for (const selector of optimizationSelectors) {
      if (await page.locator(selector).count() > 0) {
        hasOptimization = true;
        break;
      }
    }
    
    if (!hasOptimization) {
      await page.screenshot({ 
        path: 'playwright-testing/screenshots/missing-storage-optimization-my-files.png',
        fullPage: true
      });
    }
    
    expect(hasOptimization).toBeTruthy();
  });
  
  test('should handle file operations gracefully', async ({ page }) => {
    // Check for file operation status indicators
    const operationSelectors = [
      '.operation-status',
      '.file-operation',
      '.action-feedback',
      '[data-testid="operation-status"]',
      '.status-indicator'
    ];
    
    let hasOperationFeedback = false;
    for (const selector of operationSelectors) {
      if (await page.locator(selector).count() > 0) {
        hasOperationFeedback = true;
        break;
      }
    }
    
    if (!hasOperationFeedback) {
      await page.screenshot({ 
        path: 'playwright-testing/screenshots/missing-operation-feedback-my-files.png',
        fullPage: true
      });
    }
    
    expect(hasOperationFeedback).toBeTruthy();
  });
});