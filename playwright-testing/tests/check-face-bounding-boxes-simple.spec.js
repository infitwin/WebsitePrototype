const { test, expect } = require('@playwright/test');

test('check face bounding box display', async ({ page }) => {
  // Login
  await page.goto('http://localhost:8357/pages/auth.html');
  await page.click('[data-tab="login"]');
  await page.fill('.login-email', 'weezer@yev.com');
  await page.fill('.login-password', '123456');
  await page.click('button:has-text("Access Your Memories")');
  await page.waitForURL('**/dashboard.html');
  
  // Go to My Files
  await page.goto('http://localhost:8357/pages/my-files.html');
  await page.waitForTimeout(2000);
  
  // Find test-image5.jpg which has a face
  const fileCard = await page.locator('.file-card:has-text("test-image5.jpg")').first();
  
  // Click on the image
  await fileCard.locator('img').click();
  await page.waitForTimeout(1000);
  
  // Check what modal appeared
  const modalVisible = await page.locator('.face-modal').isVisible();
  console.log('Face modal visible:', modalVisible);
  
  if (modalVisible) {
    // Get modal content
    const modalContent = await page.locator('.face-modal').innerHTML();
    console.log('Modal content preview:', modalContent.substring(0, 500));
    
    // Check for canvas or svg elements that might render bounding boxes
    const hasCanvas = await page.locator('.face-modal canvas').count() > 0;
    const hasSvg = await page.locator('.face-modal svg').count() > 0;
    const hasOverlay = await page.locator('.face-modal .bounding-box, .face-modal .face-box').count() > 0;
    
    console.log('Rendering elements:');
    console.log('- Canvas:', hasCanvas);
    console.log('- SVG:', hasSvg);  
    console.log('- Overlay divs:', hasOverlay);
    
    // Take screenshot of modal
    await page.screenshot({ path: 'face-modal-content.png', fullPage: false });
    
    // Check modal structure
    const modalStructure = await page.evaluate(() => {
      const modal = document.querySelector('.face-modal');
      if (!modal) return null;
      
      // Find all child elements
      const structure = {
        hasImage: !!modal.querySelector('img'),
        imageCount: modal.querySelectorAll('img').length,
        canvasCount: modal.querySelectorAll('canvas').length,
        svgCount: modal.querySelectorAll('svg').length,
        divCount: modal.querySelectorAll('div').length,
        classes: Array.from(modal.querySelectorAll('*')).map(el => el.className).filter(c => c && c.includes('face') || c.includes('box'))
      };
      
      return structure;
    });
    
    console.log('Modal structure:', JSON.stringify(modalStructure, null, 2));
  }
  
  // Also check face indicators
  const faceIndicator = await fileCard.locator('.face-indicator');
  if (await faceIndicator.count() > 0) {
    const indicatorText = await faceIndicator.textContent();
    console.log('Face indicator shows:', indicatorText);
  }
});