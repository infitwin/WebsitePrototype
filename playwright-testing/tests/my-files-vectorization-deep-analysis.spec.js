const { test, expect } = require('@playwright/test');

test.describe('My Files Page - Vectorization Deep Analysis', () => {
  const testCredentials = {
    email: 'weezer@yev.com',
    password: '123456'
  };

  async function loginUser(page) {
    console.log('🔐 Starting login process...');
    await page.goto('http://localhost:8357/pages/auth.html');
    
    // Click login tab if needed
    const loginTab = page.locator('[data-tab="login"]');
    if (await loginTab.isVisible()) {
      await loginTab.click();
    }
    
    // Fill login credentials
    await page.fill('.login-email', testCredentials.email);
    await page.fill('.login-password', testCredentials.password);
    
    // Click login button
    await page.click('button:has-text("Access Your Memories")');
    
    // Wait for navigation or bypass if needed
    try {
      await page.waitForURL('**/dashboard.html', { timeout: 5000 });
      console.log('✅ Redirected to dashboard');
    } catch {
      console.log('⚠️ No redirect, checking if already logged in');
    }
    
    // Navigate to My Files page
    await page.goto('http://localhost:8357/pages/my-files.html');
    await page.waitForLoadState('networkidle');
  }

  test('Deep Analysis: Page Layout and Structure', async ({ page }) => {
    await loginUser(page);
    
    console.log('\n📋 ANALYZING PAGE STRUCTURE...\n');
    
    // Take full page screenshot
    await page.screenshot({ path: 'playwright-testing/my-files-full-analysis.png', fullPage: true });
    
    // Check main sections
    const sections = {
      'Page Header': '.page-header',
      'Upload Section': '.upload-section',
      'File Browser Section': '.file-browser-section',
      'Filter Bar': '.filter-bar',
      'Batch Actions': '.batch-actions',
      'Files Container': '#filesContainer',
      'Faces Container': '#facesContainer',
      'Storage Info': '.storage-info-section'
    };
    
    for (const [name, selector] of Object.entries(sections)) {
      const element = page.locator(selector);
      const isVisible = await element.isVisible().catch(() => false);
      console.log(`${isVisible ? '✅' : '❌'} ${name}: ${selector}`);
      
      if (isVisible) {
        const box = await element.boundingBox();
        console.log(`   Position: ${box.x}, ${box.y} | Size: ${box.width}x${box.height}`);
      }
    }
  });

  test('Deep Analysis: Vectorization UI Elements', async ({ page }) => {
    await loginUser(page);
    
    console.log('\n🎯 ANALYZING VECTORIZATION UI ELEMENTS...\n');
    
    // Check for vectorization-specific elements
    const vectorizationElements = {
      'Vectorize Button': '.btn-batch-vectorize',
      'Vectorization Badge Container': '.vectorization-badge',
      'Face Count Badge Container': '.face-count-badge',
      'Type Filter with Vectorized Option': '#fileTypeFilter option[value="vectorized"]',
      'Type Filter with Faces Option': '#fileTypeFilter option[value="faces"]'
    };
    
    for (const [name, selector] of Object.entries(vectorizationElements)) {
      const element = page.locator(selector);
      const count = await element.count();
      console.log(`${count > 0 ? '✅' : '❌'} ${name}: Found ${count} instances`);
    }
    
    // Check filter options
    const filterOptions = await page.locator('#fileTypeFilter option').allTextContents();
    console.log('\n📑 Filter Options:', filterOptions);
  });

  test('Deep Analysis: File Upload and Selection Flow', async ({ page }) => {
    await loginUser(page);
    
    console.log('\n📤 TESTING FILE UPLOAD AND SELECTION...\n');
    
    // Check upload area
    const dropZone = page.locator('#dropZone');
    const dropZoneText = await dropZone.textContent();
    console.log('Drop Zone Text:', dropZoneText);
    
    // Check file input
    const fileInput = page.locator('#fileInput');
    const acceptedTypes = await fileInput.getAttribute('accept');
    console.log('Accepted File Types:', acceptedTypes);
    
    // Check if any files are already present
    const fileCount = await page.locator('.file-grid-item, .file-list-item').count();
    console.log(`\n📁 Files Found: ${fileCount}`);
    
    if (fileCount > 0) {
      // Analyze file structure
      const firstFile = page.locator('.file-grid-item, .file-list-item').first();
      const fileStructure = await firstFile.evaluate(el => {
        return {
          hasCheckbox: !!el.querySelector('.file-checkbox'),
          hasThumbnail: !!el.querySelector('.file-thumbnail-container'),
          hasName: !!el.querySelector('.file-name'),
          hasActions: !!el.querySelector('.file-actions'),
          hasVectorizationBadge: !!el.querySelector('.vectorization-badge'),
          hasFaceCountBadge: !!el.querySelector('.face-count-badge')
        };
      });
      console.log('File Item Structure:', fileStructure);
    }
  });

  test('Deep Analysis: Batch Actions and Vectorization Flow', async ({ page }) => {
    await loginUser(page);
    
    console.log('\n🔄 TESTING BATCH ACTIONS...\n');
    
    // Check if batch actions are visible
    const batchActions = page.locator('.batch-actions');
    let batchActionsVisible = await batchActions.isVisible();
    console.log(`Batch Actions Initially Visible: ${batchActionsVisible}`);
    
    // Try to select files
    const checkboxes = page.locator('.file-checkbox');
    const checkboxCount = await checkboxes.count();
    console.log(`Found ${checkboxCount} file checkboxes`);
    
    if (checkboxCount > 0) {
      // Select first few files
      const selectCount = Math.min(3, checkboxCount);
      for (let i = 0; i < selectCount; i++) {
        await checkboxes.nth(i).check();
      }
      
      // Check if batch actions appear
      await page.waitForTimeout(500);
      batchActionsVisible = await batchActions.isVisible();
      console.log(`Batch Actions After Selection: ${batchActionsVisible}`);
      
      if (batchActionsVisible) {
        // Check vectorize button
        const vectorizeBtn = page.locator('.btn-batch-vectorize');
        const btnVisible = await vectorizeBtn.isVisible();
        const btnText = btnVisible ? await vectorizeBtn.textContent() : 'Not Found';
        console.log(`Vectorize Button: ${btnVisible ? '✅' : '❌'} "${btnText}"`);
        
        // Screenshot of batch actions
        await batchActions.screenshot({ path: 'playwright-testing/batch-actions-vectorize.png' });
      }
    }
  });

  test('Deep Analysis: Face Extraction View', async ({ page }) => {
    await loginUser(page);
    
    console.log('\n👤 TESTING FACE EXTRACTION VIEW...\n');
    
    // Switch to faces view
    const typeFilter = page.locator('#fileTypeFilter');
    await typeFilter.selectOption('faces');
    await page.waitForTimeout(1000);
    
    // Check if faces container is visible
    const facesContainer = page.locator('#facesContainer');
    const facesVisible = await facesContainer.isVisible();
    console.log(`Faces Container Visible: ${facesVisible}`);
    
    if (facesVisible) {
      // Analyze faces structure
      const facesGrid = page.locator('#facesGrid');
      const faceItems = page.locator('.face-item');
      const faceCount = await faceItems.count();
      console.log(`Face Items Found: ${faceCount}`);
      
      if (faceCount > 0) {
        // Analyze first face item
        const firstFace = faceItems.first();
        const faceStructure = await firstFace.evaluate(el => {
          return {
            draggable: el.draggable,
            hasThumbnail: !!el.querySelector('.face-thumbnail'),
            hasConfidence: !!el.querySelector('.face-confidence'),
            hasSource: !!el.querySelector('.face-source'),
            classList: Array.from(el.classList)
          };
        });
        console.log('Face Item Structure:', faceStructure);
        
        // Test drag functionality
        console.log('\n🎯 Testing Drag Functionality...');
        await firstFace.hover();
        const cursor = await firstFace.evaluate(el => 
          window.getComputedStyle(el).cursor
        );
        console.log(`Cursor Style: ${cursor}`);
      } else {
        // Check empty state
        const emptyFaces = await page.locator('.empty-faces').textContent();
        console.log('Empty Faces Message:', emptyFaces);
      }
      
      await facesContainer.screenshot({ path: 'playwright-testing/faces-extraction-view.png' });
    }
  });

  test('Deep Analysis: Firestore Integration Elements', async ({ page }) => {
    await loginUser(page);
    
    console.log('\n🔥 ANALYZING FIRESTORE INTEGRATION...\n');
    
    // Check console for Firestore-related logs
    const consoleLogs = [];
    page.on('console', msg => {
      if (msg.text().includes('Firestore') || 
          msg.text().includes('vectoriz') || 
          msg.text().includes('quota')) {
        consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
      }
    });
    
    // Reload page to capture initialization logs
    await page.reload();
    await page.waitForTimeout(2000);
    
    console.log('Firestore-related Console Logs:');
    consoleLogs.forEach(log => console.log(log));
    
    // Check network requests
    const apiCalls = [];
    page.on('request', request => {
      const url = request.url();
      if (url.includes('firestore') || 
          url.includes('artifact') || 
          url.includes('vectoriz')) {
        apiCalls.push({
          method: request.method(),
          url: url,
          type: request.resourceType()
        });
      }
    });
    
    // Trigger some actions to see API calls
    const checkboxes = page.locator('.file-checkbox');
    if (await checkboxes.count() > 0) {
      await checkboxes.first().check();
      await page.waitForTimeout(1000);
    }
    
    console.log('\nAPI Calls Detected:');
    apiCalls.forEach(call => console.log(`${call.method} ${call.url}`));
  });

  test('Deep Analysis: Complete Visual Documentation', async ({ page }) => {
    await loginUser(page);
    
    console.log('\n📸 CREATING VISUAL DOCUMENTATION...\n');
    
    // Document each state
    const screenshots = [
      { name: 'initial-state', action: null },
      { name: 'file-hover', action: async () => {
        const firstFile = page.locator('.file-grid-item').first();
        if (await firstFile.count() > 0) await firstFile.hover();
      }},
      { name: 'files-selected', action: async () => {
        const checkboxes = page.locator('.file-checkbox');
        for (let i = 0; i < Math.min(3, await checkboxes.count()); i++) {
          await checkboxes.nth(i).check();
        }
      }},
      { name: 'vectorized-filter', action: async () => {
        await page.locator('#fileTypeFilter').selectOption('vectorized');
        await page.waitForTimeout(500);
      }},
      { name: 'faces-view', action: async () => {
        await page.locator('#fileTypeFilter').selectOption('faces');
        await page.waitForTimeout(500);
      }}
    ];
    
    for (const screenshot of screenshots) {
      if (screenshot.action) await screenshot.action();
      await page.screenshot({ 
        path: `playwright-testing/my-files-${screenshot.name}.png`,
        fullPage: true 
      });
      console.log(`✅ Captured: ${screenshot.name}`);
    }
  });

  test('Summary Report: Feature Completeness', async ({ page }) => {
    await loginUser(page);
    
    console.log('\n📊 FEATURE COMPLETENESS SUMMARY\n');
    
    const features = {
      'Vectorize Button': async () => {
        const btn = page.locator('.btn-batch-vectorize');
        return await btn.count() > 0;
      },
      'Image File Filtering': async () => {
        const fileInput = page.locator('#fileInput');
        const accept = await fileInput.getAttribute('accept');
        return accept && accept.includes('.jpg');
      },
      'Vectorization Status Badges': async () => {
        // Check if CSS classes exist
        const response = await page.goto('http://localhost:8357/css/pages/my-files.css');
        const css = await response.text();
        return css.includes('vectorization-badge');
      },
      'Face Count Badges': async () => {
        const response = await page.goto('http://localhost:8357/css/pages/my-files.css');
        const css = await response.text();
        return css.includes('face-count-badge');
      },
      'Faces View Filter': async () => {
        await page.goto('http://localhost:8357/pages/my-files.html');
        await loginUser(page);
        const option = page.locator('#fileTypeFilter option[value="faces"]');
        return await option.count() > 0;
      },
      'Drag Functionality': async () => {
        const response = await page.goto('http://localhost:8357/js/pages/my-files.js');
        const js = await response.text();
        return js.includes('dragstart') && js.includes('dataTransfer');
      }
    };
    
    console.log('Feature Implementation Status:');
    for (const [feature, check] of Object.entries(features)) {
      const implemented = await check();
      console.log(`${implemented ? '✅' : '❌'} ${feature}`);
    }
  });
});