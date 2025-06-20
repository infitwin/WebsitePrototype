const { test, expect } = require('@playwright/test');

test.describe('My Files Page Feature Audit', () => {
  test.beforeEach(async ({ page }) => {
    // Start at auth page and login
    await page.goto('http://localhost:8357/pages/auth.html');
    await page.click('[data-tab="login"]');
    await page.fill('.login-email', 'weezer@yev.com');
    await page.fill('.login-password', '123456');
    await page.click('button:has-text("Access Your Memories")');
    await page.waitForURL('**/dashboard.html');
    
    // Navigate to My Files
    await page.goto('http://localhost:8357/pages/my-files.html');
    await page.waitForLoadState('networkidle');
  });

  test('audit all implemented features', async ({ page }) => {
    console.log('\n=== MY FILES PAGE FEATURE AUDIT ===\n');
    
    // 1. Check page title and basic layout
    await expect(page).toHaveTitle(/My Files/);
    console.log('✓ Page loads with correct title');
    
    // 2. Check sidebar navigation
    const sidebar = await page.locator('.sidebar').isVisible();
    console.log(sidebar ? '✓ Sidebar is visible' : '✗ Sidebar is missing');
    
    // 3. Check file upload functionality
    const uploadButton = await page.locator('button:has-text("Upload Files")').isVisible();
    console.log(uploadButton ? '✓ Upload button is present' : '✗ Upload button is missing');
    
    // 4. Check vectorization UI elements
    const vectorizeButton = await page.locator('button:has-text("Vectorize Selected")').count();
    console.log(vectorizeButton > 0 ? '✓ Vectorize button is present' : '✗ Vectorize button is missing');
    
    // 5. Check quota widget
    const quotaWidget = await page.locator('.vectorization-quota').isVisible();
    console.log(quotaWidget ? '✓ Quota widget is visible' : '✗ Quota widget is missing');
    
    // 6. Check view toggle (grid/list)
    const viewToggle = await page.locator('.view-toggle').isVisible();
    console.log(viewToggle ? '✓ View toggle is present' : '✗ View toggle is missing');
    
    // 7. Check search functionality
    const searchInput = await page.locator('.search-controls input[type="search"]').isVisible();
    console.log(searchInput ? '✓ Search input is present' : '✗ Search input is missing');
    
    // 8. Check batch actions
    const batchActions = await page.locator('.batch-actions').count();
    console.log(batchActions > 0 ? '✓ Batch actions are present' : '✗ Batch actions are missing');
    
    // 9. Check for Faces view/tab
    const facesTab = await page.locator('button:has-text("Faces"), [data-tab="faces"], .tab:has-text("Faces")').count();
    const facesView = await page.locator('.faces-view, #facesView, .extracted-faces').count();
    console.log(facesTab > 0 ? '✓ Faces tab/button is present' : '✗ Faces tab/button is MISSING');
    console.log(facesView > 0 ? '✓ Faces view container is present' : '✗ Faces view container is MISSING');
    
    // 10. Check file display
    const fileItems = await page.locator('.file-grid-item, .file-list-item').count();
    console.log(`✓ ${fileItems} files displayed`);
    
    // 11. Check for vectorization status indicators
    const vectorizationStatus = await page.locator('.vectorization-status, .vector-badge').first().count();
    console.log(vectorizationStatus > 0 ? '✓ Vectorization status indicators present' : '✗ Vectorization status indicators MISSING');
    
    // 12. Check storage usage display
    const storageDisplay = await page.locator('.storage-info, .storage-usage').isVisible();
    console.log(storageDisplay ? '✓ Storage usage display is present' : '✗ Storage usage display is missing');
    
    // 13. Take screenshot for visual inspection
    await page.screenshot({ path: 'my-files-audit.png', fullPage: true });
    console.log('\n✓ Screenshot saved as my-files-audit.png');
    
    // 14. Check for extracted faces data
    const extractedFaces = await page.evaluate(() => {
      // Check if any files have extractedFaces data
      const files = window.currentFiles || [];
      return files.filter(f => f.extractedFaces && f.extractedFaces.length > 0);
    });
    console.log(`\n✓ ${extractedFaces.length} files have extracted faces data`);
    
    // 15. Look for face assignment UI
    const faceAssignment = await page.locator('.face-assignment, .assign-face, [draggable="true"].face').count();
    console.log(faceAssignment > 0 ? '✓ Face assignment UI is present' : '✗ Face assignment UI is MISSING');
    
    // Summary
    console.log('\n=== MISSING FEATURES ===');
    if (facesTab === 0) console.log('- Faces tab/view for showing extracted face thumbnails');
    if (vectorizationStatus === 0) console.log('- Vectorization status badges on files');
    if (faceAssignment === 0) console.log('- Face assignment/dragging functionality');
    
    console.log('\n=== AUDIT COMPLETE ===\n');
  });
  
  test('check for face library implementation', async ({ page }) => {
    // Look for any face-related elements
    const faceElements = await page.evaluate(() => {
      const selectors = [
        '.face-library',
        '.faces-container',
        '.extracted-faces',
        '[data-face-id]',
        '.face-thumbnail',
        '.face-grid',
        'button:has-text("View Faces")',
        'button:has-text("Faces")'
      ];
      
      const found = {};
      selectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          found[selector] = elements.length;
        }
      });
      
      return found;
    });
    
    console.log('\n=== FACE LIBRARY ELEMENTS SEARCH ===');
    if (Object.keys(faceElements).length === 0) {
      console.log('No face library elements found on the page');
    } else {
      Object.entries(faceElements).forEach(([selector, count]) => {
        console.log(`Found ${count} elements matching: ${selector}`);
      });
    }
  });
});