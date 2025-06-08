const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:8357/pages/auth.html');
  
  // Wait for page to load
  await page.waitForLoadState('networkidle');
  
  // Check if password inputs exist
  const passwordInputs = await page.$$('input[type="password"]');
  console.log(`Found ${passwordInputs.length} password inputs`);
  
  // Check if password-wrapper divs exist
  const passwordWrappers = await page.$$('.password-wrapper');
  console.log(`Found ${passwordWrappers.length} password wrappers`);
  
  // Check if toggle buttons exist
  const toggleButtons = await page.$$('.password-toggle');
  console.log(`Found ${toggleButtons.length} toggle buttons`);
  
  // Check visibility of toggle buttons
  for (let i = 0; i < toggleButtons.length; i++) {
    const isVisible = await toggleButtons[i].isVisible();
    const boundingBox = await toggleButtons[i].boundingBox();
    console.log(`Toggle button ${i + 1} visible: ${isVisible}`);
    console.log(`Toggle button ${i + 1} bounding box:`, boundingBox);
  }
  
  // Check computed styles
  if (toggleButtons.length > 0) {
    const styles = await page.evaluate(() => {
      const button = document.querySelector('.password-toggle');
      if (button) {
        const computed = window.getComputedStyle(button);
        return {
          display: computed.display,
          visibility: computed.visibility,
          opacity: computed.opacity,
          position: computed.position,
          zIndex: computed.zIndex,
          width: computed.width,
          height: computed.height
        };
      }
      return null;
    });
    console.log('Toggle button styles:', styles);
  }
  
  // Keep browser open for manual inspection
  console.log('\nBrowser will stay open. Press Ctrl+C to close.');
})();