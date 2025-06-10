
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    console.log('Navigating to interview page...');
    await page.goto('http://localhost:8357/pages/interview.html');
    await page.waitForTimeout(2000);
    
    // Check if there are continue buttons visible
    const continueButtons = await page.locator('text=Continue').count();
    console.log('Found', continueButtons, 'continue buttons');
    
    if (continueButtons > 0) {
      console.log('Clicking first continue button...');
      await page.locator('text=Continue').first().click();
      await page.waitForTimeout(3000);
    }
    
    console.log('Taking screenshot...');
    await page.screenshot({ path:  + filename + , fullPage: true });
    console.log('Screenshot saved to:',  + filename + );
  } catch (error) {
    console.log('Error:', error.message);
  } finally {
    await browser.close();
  }
})();
