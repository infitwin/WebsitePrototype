import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 1000 });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Log console messages and errors
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  try {
    // Navigate to auth page and login
    await page.goto('http://localhost:8357/pages/auth.html');
    
    // Click login tab
    await page.click('[data-tab="login"]');
    
    // Fill credentials
    await page.fill('.login-email', 'weezer@yev.com');
    await page.fill('.login-password', '123456');
    
    // Submit login
    await page.click('button:has-text("Access Your Memories")');
    
    // Wait for redirect
    await page.waitForURL('**/dashboard.html', { timeout: 10000 });
    console.log('✅ Successfully logged in');
    
    // Navigate to My Files
    await page.goto('http://localhost:8357/pages/my-files.html');
    console.log('✅ Navigated to My Files');
    
    // Wait for any redirects
    await page.waitForTimeout(2000);
    console.log('Current URL:', page.url());
    
    // Wait a moment for JavaScript to execute
    await page.waitForTimeout(8000);
    
    // Check loading state
    const loadingVisible = await page.isVisible('#loadingState');
    const emptyVisible = await page.isVisible('#emptyState');
    
    console.log('Checking files container...');
    const containerExists = await page.locator('#filesContainer').count();
    console.log('Files container exists:', containerExists > 0);
    
    // Check what actually exists on the page
    const bodyContent = await page.locator('body').innerHTML();
    console.log('Body content length:', bodyContent.length);
    console.log('Contains my-files elements:', bodyContent.includes('my-files') || bodyContent.includes('filesContainer'));
    
    // Look for any divs with IDs
    const allIds = await page.$$eval('*[id]', elements => elements.map(el => el.id));
    console.log('All element IDs found:', allIds.slice(0, 10)); // First 10 IDs
    
    console.log('Loading state visible:', loadingVisible);
    console.log('Empty state visible:', emptyVisible);
    
    // Take screenshot
    await page.screenshot({ path: 'my-files-test.png', fullPage: true });
    console.log('Screenshot saved to my-files-test.png');
    
  } catch (error) {
    console.error('Error:', error.message);
    await page.screenshot({ path: 'my-files-error.png' });
  } finally {
    await browser.close();
  }
})();