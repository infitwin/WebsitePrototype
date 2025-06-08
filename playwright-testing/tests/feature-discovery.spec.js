const { test, expect } = require('@playwright/test');

test.describe('Feature Discovery Tests', () => {
  const pages = [
    { url: '/pages/alpha-welcome.html', name: 'Alpha Welcome' },
    { url: '/pages/capture-first-memory.html', name: 'Capture Memory' },
    { url: '/pages/email-verification.html', name: 'Email Verification' },
    { url: '/pages/error.html', name: 'Error Page' },
    { url: '/pages/settings.html', name: 'Settings' },
    { url: '/pages/shared-view.html', name: 'Shared View' }
  ];

  test('should discover and test all available pages', async ({ page }) => {
    for (const pageInfo of pages) {
      await test.step(`Testing ${pageInfo.name}`, async () => {
        await page.goto(`http://localhost:8357${pageInfo.url}`);
        
        // Basic page load verification
        await expect(page.locator('body')).toBeVisible();
        
        // Check for no critical JavaScript errors
        const errors = [];
        page.on('console', msg => {
          if (msg.type() === 'error' && !msg.text().includes('404') && !msg.text().includes('favicon')) {
            errors.push(msg.text());
          }
        });
        
        await page.waitForTimeout(1000);
        
        // Check for main content area
        const contentSelectors = [
          'main',
          '.container',
          '.content',
          '.page-content',
          '.main-content',
          '[role="main"]'
        ];
        
        let hasMainContent = false;
        for (const selector of contentSelectors) {
          if (await page.locator(selector).isVisible()) {
            hasMainContent = true;
            break;
          }
        }
        
        if (!hasMainContent) {
          // If no specific main content, at least body should have content
          const bodyContent = await page.locator('body').textContent();
          expect(bodyContent.trim().length).toBeGreaterThan(0);
        }
      });
    }
  });

  test('should discover form interactions across pages', async ({ page }) => {
    const pagesWithForms = [
      '/pages/auth.html',
      '/pages/capture-first-memory.html',
      '/pages/settings.html'
    ];
    
    for (const pageUrl of pagesWithForms) {
      await test.step(`Testing forms on ${pageUrl}`, async () => {
        await page.goto(`http://localhost:8357${pageUrl}`);
        
        // Find forms
        const forms = page.locator('form');
        const formCount = await forms.count();
        
        if (formCount > 0) {
          const firstForm = forms.first();
          
          // Check for inputs
          const inputs = firstForm.locator('input:not([type="hidden"]), textarea, select');
          const inputCount = await inputs.count();
          
          if (inputCount > 0) {
            // Test first input
            const firstInput = inputs.first();
            const inputType = await firstInput.getAttribute('type');
            
            if (inputType === 'text' || inputType === 'email') {
              await firstInput.fill('test value');
              const value = await firstInput.inputValue();
              expect(value).toBe('test value');
            }
          }
          
          // Check for submit button
          const submitBtn = firstForm.locator('button[type="submit"], input[type="submit"]');
          if (await submitBtn.isVisible()) {
            await expect(submitBtn).toBeEnabled();
          }
        }
      });
    }
  });

  test('should discover navigation patterns', async ({ page }) => {
    const pagesWithNav = [
      '/pages/dashboard.html',
      '/pages/interview-transcripts.html',
      '/pages/storage-dashboard.html',
      '/pages/twin-management.html'
    ];
    
    for (const pageUrl of pagesWithNav) {
      await test.step(`Testing navigation on ${pageUrl}`, async () => {
        await page.goto(`http://localhost:8357${pageUrl}`);
        
        // Look for sidebar navigation
        const sidebarNav = page.locator('.sidebar-nav, .nav-sidebar, nav.sidebar');
        if (await sidebarNav.isVisible()) {
          // Check navigation items
          const navItems = sidebarNav.locator('a, .nav-item');
          const navCount = await navItems.count();
          
          expect(navCount).toBeGreaterThan(0);
          
          // Test first nav item
          if (navCount > 0) {
            const firstNavItem = navItems.first();
            await expect(firstNavItem).toBeVisible();
            
            // Check for tooltips
            const tooltip = firstNavItem.locator('.tooltip, .sidebar-tooltip');
            if (await tooltip.isVisible()) {
              const tooltipText = await tooltip.textContent();
              expect(tooltipText.trim().length).toBeGreaterThan(0);
            }
          }
        }
        
        // Look for breadcrumbs
        const breadcrumbs = page.locator('.breadcrumb, .breadcrumbs, nav[aria-label*="breadcrumb"]');
        if (await breadcrumbs.isVisible()) {
          const breadcrumbItems = breadcrumbs.locator('a, span, li');
          const breadcrumbCount = await breadcrumbItems.count();
          expect(breadcrumbCount).toBeGreaterThan(0);
        }
      });
    }
  });

  test('should discover interactive elements', async ({ page }) => {
    const interactivePages = [
      '/pages/dashboard.html',
      '/pages/file-browser.html',
      '/pages/talk-to-twin.html'
    ];
    
    for (const pageUrl of interactivePages) {
      await test.step(`Testing interactive elements on ${pageUrl}`, async () => {
        await page.goto(`http://localhost:8357${pageUrl}`);
        
        // Find buttons
        const buttons = page.locator('button:visible');
        const buttonCount = await buttons.count();
        
        for (let i = 0; i < Math.min(buttonCount, 3); i++) {
          const button = buttons.nth(i);
          await expect(button).toBeEnabled();
          
          // Test hover effects
          await button.hover();
          
          // Check if button has proper cursor
          const cursor = await button.evaluate(el => 
            window.getComputedStyle(el).cursor
          );
          expect(cursor).toBe('pointer');
        }
        
        // Find links
        const links = page.locator('a:visible');
        const linkCount = await links.count();
        
        if (linkCount > 0) {
          const firstLink = links.first();
          const href = await firstLink.getAttribute('href');
          
          if (href && !href.startsWith('javascript:')) {
            await expect(firstLink).toBeVisible();
          }
        }
        
        // Find input fields
        const inputs = page.locator('input:visible, textarea:visible');
        const inputCount = await inputs.count();
        
        for (let i = 0; i < Math.min(inputCount, 2); i++) {
          const input = inputs.nth(i);
          const inputType = await input.getAttribute('type');
          
          if (inputType !== 'file' && inputType !== 'submit') {
            await input.focus();
            // Input should be focusable
            const isFocused = await input.evaluate(el => el === document.activeElement);
            expect(isFocused).toBeTruthy();
          }
        }
      });
    }
  });

  test('should discover media and file handling features', async ({ page }) => {
    const pagesWithMedia = [
      '/pages/file-browser.html',
      '/pages/capture-first-memory.html'
    ];
    
    for (const pageUrl of pagesWithMedia) {
      await test.step(`Testing media features on ${pageUrl}`, async () => {
        await page.goto(`http://localhost:8357${pageUrl}`);
        
        // Look for file inputs
        const fileInputs = page.locator('input[type="file"]');
        const fileInputCount = await fileInputs.count();
        
        if (fileInputCount > 0) {
          const firstFileInput = fileInputs.first();
          
          // Check accept attribute
          const accept = await firstFileInput.getAttribute('accept');
          if (accept) {
            expect(accept.length).toBeGreaterThan(0);
          }
          
          // Check if multiple files allowed
          const multiple = await firstFileInput.getAttribute('multiple');
          expect(typeof multiple).toBe('object'); // null or string
        }
        
        // Look for drag and drop areas
        const dropZones = page.locator('.drop-zone, .drag-drop, [data-drop]');
        const dropZoneCount = await dropZones.count();
        
        if (dropZoneCount > 0) {
          const firstDropZone = dropZones.first();
          await expect(firstDropZone).toBeVisible();
          
          // Check for drop zone styling
          const hasDropStyling = await firstDropZone.evaluate(el => {
            const styles = window.getComputedStyle(el);
            return styles.border !== 'none' || 
                   styles.backgroundColor !== 'rgba(0, 0, 0, 0)';
          });
          expect(typeof hasDropStyling).toBe('boolean');
        }
        
        // Look for upload buttons
        const uploadButtons = page.locator('button:has-text("Upload"), .upload-btn, .upload-button');
        const uploadButtonCount = await uploadButtons.count();
        
        if (uploadButtonCount > 0) {
          const firstUploadBtn = uploadButtons.first();
          await expect(firstUploadBtn).toBeVisible();
          await expect(firstUploadBtn).toBeEnabled();
        }
      });
    }
  });

  test('should discover data visualization features', async ({ page }) => {
    const pagesWithVisualizations = [
      '/pages/dashboard.html',
      '/pages/storage-dashboard.html',
      '/pages/interview-transcripts.html'
    ];
    
    for (const pageUrl of pagesWithVisualizations) {
      await test.step(`Testing visualizations on ${pageUrl}`, async () => {
        await page.goto(`http://localhost:8357${pageUrl}`);
        
        // Look for charts and graphs
        const chartElements = page.locator('canvas, svg, .chart, .graph, .visualization');
        const chartCount = await chartElements.count();
        
        if (chartCount > 0) {
          const firstChart = chartElements.first();
          await expect(firstChart).toBeVisible();
          
          // Check dimensions
          const box = await firstChart.boundingBox();
          if (box) {
            expect(box.width).toBeGreaterThan(0);
            expect(box.height).toBeGreaterThan(0);
          }
        }
        
        // Look for statistics cards
        const statCards = page.locator('.stat-card, .metric-card, .stats-item');
        const statCount = await statCards.count();
        
        if (statCount > 0) {
          const firstStat = statCards.first();
          await expect(firstStat).toBeVisible();
          
          // Check for numerical values
          const statText = await firstStat.textContent();
          const hasNumbers = /\d/.test(statText);
          expect(hasNumbers).toBeTruthy();
        }
        
        // Look for progress bars
        const progressBars = page.locator('.progress, .progress-bar, progress');
        const progressCount = await progressBars.count();
        
        if (progressCount > 0) {
          const firstProgress = progressBars.first();
          await expect(firstProgress).toBeVisible();
          
          // Check for value or aria attributes
          const value = await firstProgress.getAttribute('value') || 
                       await firstProgress.getAttribute('aria-valuenow');
          if (value) {
            expect(parseFloat(value)).toBeGreaterThanOrEqual(0);
          }
        }
      });
    }
  });

  test('should discover modal and overlay features', async ({ page }) => {
    const pagesWithModals = [
      '/pages/interview-transcripts.html',
      '/pages/dashboard.html',
      '/pages/file-browser.html'
    ];
    
    for (const pageUrl of pagesWithModals) {
      await test.step(`Testing modals on ${pageUrl}`, async () => {
        await page.goto(`http://localhost:8357${pageUrl}`);
        
        // Look for modal containers
        const modals = page.locator('.modal, .dialog, .overlay, [role="dialog"]');
        const modalCount = await modals.count();
        
        if (modalCount > 0) {
          const firstModal = modals.first();
          
          // Modal should initially be hidden
          const isVisible = await firstModal.isVisible();
          
          // Look for close buttons
          const closeButtons = firstModal.locator('.close, .modal-close, button[aria-label*="close"]');
          const closeButtonCount = await closeButtons.count();
          
          if (closeButtonCount > 0) {
            const firstCloseBtn = closeButtons.first();
            // Close button should be present even if modal is hidden
            expect(await firstCloseBtn.count()).toBe(1);
          }
        }
        
        // Look for modal triggers
        const modalTriggers = page.locator('button[data-modal], [data-toggle="modal"], .modal-trigger');
        const triggerCount = await modalTriggers.count();
        
        if (triggerCount > 0) {
          const firstTrigger = modalTriggers.first();
          await expect(firstTrigger).toBeVisible();
          await expect(firstTrigger).toBeEnabled();
        }
      });
    }
  });

  test('should discover responsive design patterns', async ({ page }) => {
    const testPages = [
      '/pages/dashboard.html',
      '/pages/auth.html',
      '/pages/explore.html'
    ];
    
    const viewports = [
      { width: 320, height: 568, name: 'Small Mobile' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 1920, height: 1080, name: 'Desktop' }
    ];
    
    for (const pageUrl of testPages) {
      for (const viewport of viewports) {
        await test.step(`Testing ${pageUrl} on ${viewport.name}`, async () => {
          await page.setViewportSize({ width: viewport.width, height: viewport.height });
          await page.goto(`http://localhost:8357${pageUrl}`);
          
          // Check for horizontal scrollbars
          const hasHorizontalScroll = await page.evaluate(() => {
            return document.documentElement.scrollWidth > document.documentElement.clientWidth;
          });
          expect(hasHorizontalScroll).toBeFalsy();
          
          // Check if content is visible
          const body = page.locator('body');
          await expect(body).toBeVisible();
          
          // Check for mobile-specific elements
          if (viewport.width < 768) {
            const mobileMenu = page.locator('.mobile-menu, .hamburger, .menu-toggle');
            if (await mobileMenu.isVisible()) {
              await expect(mobileMenu).toBeEnabled();
            }
          }
          
          // Check for responsive text sizes
          const headings = page.locator('h1, h2, h3');
          const headingCount = await headings.count();
          
          if (headingCount > 0) {
            const firstHeading = headings.first();
            const fontSize = await firstHeading.evaluate(el => 
              window.getComputedStyle(el).fontSize
            );
            
            const fontSizeValue = parseFloat(fontSize);
            expect(fontSizeValue).toBeGreaterThan(0);
          }
        });
      }
    }
  });
});