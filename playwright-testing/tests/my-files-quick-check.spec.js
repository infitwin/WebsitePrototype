const { test, expect } = require('@playwright/test');

// Helper function for login with email verification bypass
async function loginUser(page) {
  await page.goto('http://localhost:8357/pages/auth.html');
  await page.click('[data-tab="login"]');
  await page.fill('.login-email', 'weezer@yev.com');
  await page.fill('.login-password', '123456');
  await page.click('button:has-text("Access Your Memories")');
  
  // Check if we're redirected to email verification page
  try {
    await page.waitForURL('**/email-verification.html', { timeout: 3000 });
    
    // Look for the red bypass button
    const bypassButton = page.locator('button[class*="skip"]');
    if (await bypassButton.count() > 0) {
      await bypassButton.click();
    }
    
    // Wait for redirect after bypass
    await page.waitForURL(['**/dashboard.html', '**/alpha-welcome.html'], { timeout: 5000 });
  } catch (e) {
    // Might have gone directly to dashboard
  }
  
  // Navigate to dashboard if needed
  const finalURL = page.url();
  if (finalURL.includes('alpha-welcome.html')) {
    await page.goto('http://localhost:8357/pages/dashboard.html');
  }
}

test.describe('My Files Storage Overview Check', () => {
  test('should show My Files page with storage overview', async ({ page }) => {
    // Login first
    await loginUser(page);
    
    // Navigate to My Files page
    await page.goto('http://localhost:8357/pages/my-files.html');
    
    // Don't wait for networkidle, just wait for DOM content
    await page.waitForLoadState('domcontentloaded');
    
    // Wait a reasonable time for content to load
    await page.waitForTimeout(5000);
    
    // Take screenshot to see current state
    await page.screenshot({ path: 'my-files-current-state.png', fullPage: true });
    
    // Check if we're on the My Files page
    const url = page.url();
    const onMyFilesPage = url.includes('my-files.html');
    console.log('On My Files page:', onMyFilesPage);
    console.log('Current URL:', url);
    
    // Check for storage overview section
    const storageOverview = await page.locator('.storage-overview-section').count();
    console.log('Storage overview section found:', storageOverview > 0);
    
    // Check for specific storage components
    const storageBreakdown = await page.locator('#storageDonutChart').count();
    const quickStats = await page.locator('.stats-card').count();
    const storageMeter = await page.locator('.storage-meter').count();
    
    console.log('Storage breakdown chart:', storageBreakdown > 0);
    console.log('Quick stats card:', quickStats > 0);
    console.log('Storage meter:', storageMeter > 0);
    
    // Check for any JavaScript errors in console
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // Wait a bit more to catch any delayed errors
    await page.waitForTimeout(2000);
    
    if (errors.length > 0) {
      console.log('JavaScript errors found:');
      errors.forEach(error => console.log('ERROR:', error));
    }
    
    expect(onMyFilesPage).toBeTruthy();
  });
});