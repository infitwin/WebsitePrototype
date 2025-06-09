const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Set viewport to ensure we capture the full page
  await page.setViewportSize({ width: 1280, height: 720 });
  
  try {
    await page.goto('http://localhost:8357/index.html', { waitUntil: 'networkidle' });
    
    // Take full page screenshot
    await page.screenshot({ 
      path: '../audit-index.png', 
      fullPage: true 
    });
    
    console.log('Screenshot saved as audit-index.png');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
})();