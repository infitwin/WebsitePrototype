const { test, expect } = require('@playwright/test');

test.describe('Face Bounding Box Display', () => {
  test('should display bounding box overlays on images with faces', async ({ page }) => {
    // Login first
    await page.goto('http://localhost:8357/pages/auth.html');
    await page.click('[data-tab="login"]');
    await page.fill('.login-email', 'weezer@yev.com');
    await page.fill('.login-password', '123456');
    await page.click('button:has-text("Access Your Memories")');
    await page.waitForURL('**/dashboard.html');
    
    // Navigate to My Files
    await page.goto('http://localhost:8357/pages/my-files.html');
    await page.waitForTimeout(2000); // Wait for files to load
    
    // Check if any images have face indicators
    const faceIndicators = await page.locator('.file-card:has(.face-indicator)').count();
    console.log(`Found ${faceIndicators} files with face indicators`);
    
    // Find a file with faces (test-image5.jpg has 1 face)
    const fileWithFace = await page.locator('.file-card:has-text("test-image5.jpg")').first();
    const hasFaceIndicator = await fileWithFace.locator('.face-indicator').count() > 0;
    
    if (hasFaceIndicator) {
      console.log('Found face indicator on test-image5.jpg');
      
      // Click on the image to potentially open face overlay
      await fileWithFace.locator('img').click();
      await page.waitForTimeout(1000);
      
      // Check for face overlay elements
      const faceOverlay = await page.locator('.face-overlay').count();
      const faceBoundingBox = await page.locator('.face-bounding-box').count();
      const faceModal = await page.locator('.face-modal').count();
      const faceViewer = await page.locator('.face-viewer').count();
      
      console.log('Face overlay elements found:');
      console.log(`- .face-overlay: ${faceOverlay}`);
      console.log(`- .face-bounding-box: ${faceBoundingBox}`);
      console.log(`- .face-modal: ${faceModal}`);
      console.log(`- .face-viewer: ${faceViewer}`);
      
      // Check for any modal or overlay that might appear
      const anyModal = await page.locator('.modal, [role="dialog"], .overlay').count();
      console.log(`- Any modal/dialog/overlay: ${anyModal}`);
      
      // Check what happens in the UI
      const visibleElements = await page.evaluate(() => {
        const elements = [];
        // Check for any elements that might be showing face data
        document.querySelectorAll('*').forEach(el => {
          const style = window.getComputedStyle(el);
          if (el.classList.contains('face') || 
              el.classList.contains('bounding') || 
              el.classList.contains('overlay') ||
              el.id.includes('face') ||
              el.className.includes('face')) {
            elements.push({
              tag: el.tagName,
              id: el.id,
              classes: el.className,
              visible: style.display !== 'none' && style.visibility !== 'hidden',
              zIndex: style.zIndex
            });
          }
        });
        return elements;
      });
      
      console.log('Face-related elements in DOM:', JSON.stringify(visibleElements, null, 2));
      
      // Take a screenshot to see current state
      await page.screenshot({ path: 'face-click-result.png', fullPage: false });
      console.log('Screenshot saved as face-click-result.png');
      
      // Try clicking the face indicator itself
      const indicator = await fileWithFace.locator('.face-indicator');
      if (await indicator.count() > 0) {
        console.log('Clicking face indicator directly...');
        await indicator.click();
        await page.waitForTimeout(1000);
        
        // Check again for any overlays
        const afterClickOverlay = await page.locator('.face-overlay, .face-modal, .face-viewer, .modal').count();
        console.log(`After clicking indicator, overlay elements: ${afterClickOverlay}`);
        
        await page.screenshot({ path: 'face-indicator-click-result.png', fullPage: false });
      }
    }
    
    // Also check the face data structure in the file
    const faceData = await page.evaluate(() => {
      const fileCards = document.querySelectorAll('.file-card');
      for (const card of fileCards) {
        if (card.textContent.includes('test-image5.jpg')) {
          // Try to get the file data
          const fileId = card.dataset.fileId;
          return { fileId, cardHTML: card.innerHTML };
        }
      }
      return null;
    });
    
    console.log('File card data:', faceData);
    
    // Final check: are bounding boxes being rendered?
    const boundingBoxesRendered = faceOverlay > 0 || faceBoundingBox > 0;
    console.log(`\nBounding boxes rendered: ${boundingBoxesRendered}`);
    
    // The test should fail if no bounding boxes are shown
    expect(boundingBoxesRendered).toBe(true);
  });
});