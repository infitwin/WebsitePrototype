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
    console.log('Email verification page detected, looking for bypass button...');
    
    // Look for the red bypass button
    const bypassSelectors = [
      'button:has-text("Skip Email Verification")',
      'button:has-text("Skip Verification")', 
      'button:has-text("Continue Without Verification")',
      '.skip-verification',
      '.bypass-verification',
      'button[style*="red"]',
      'button[class*="danger"]',
      'button[class*="skip"]'
    ];
    
    let bypassed = false;
    for (const selector of bypassSelectors) {
      try {
        const button = page.locator(selector);
        if (await button.count() > 0) {
          console.log(`Found bypass button: ${selector}`);
          await button.click();
          bypassed = true;
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }
    
    if (!bypassed) {
      console.log('No bypass button found, taking screenshot...');
      await page.screenshot({ path: 'email-verification-page.png' });
    }
    
    // Wait for redirect after bypass (could be alpha-welcome or dashboard)
    await page.waitForURL(['**/dashboard.html', '**/alpha-welcome.html'], { timeout: 5000 });
  } catch (e) {
    // Might have gone directly to dashboard, check current URL
    const currentURL = page.url();
    console.log('Current URL after login:', currentURL);
  }
  
  // Check final URL and navigate to dashboard if needed
  const finalURL = page.url();
  if (finalURL.includes('alpha-welcome.html')) {
    console.log('On alpha-welcome page, navigating to dashboard...');
    // Look for dashboard navigation button or link
    const dashboardSelectors = [
      'button:has-text("Continue to Dashboard")',
      'button:has-text("Get Started")',
      'a[href*="dashboard"]',
      'button:has-text("Enter")',
      '.continue-btn',
      '.get-started'
    ];
    
    let navigated = false;
    for (const selector of dashboardSelectors) {
      try {
        const button = page.locator(selector);
        if (await button.count() > 0) {
          console.log(`Found dashboard navigation: ${selector}`);
          await button.click();
          await page.waitForURL('**/dashboard.html', { timeout: 5000 });
          navigated = true;
          break;
        }
      } catch (e) {
        // Continue to next selector
      }
    }
    
    if (!navigated) {
      console.log('No dashboard navigation found, directly going to dashboard...');
      await page.goto('http://localhost:8357/pages/dashboard.html');
    }
  }
}

test.describe('Authentication Debug', () => {
  test('should authenticate and access My Files page', async ({ page }) => {
    // Login first
    await loginUser(page);
    
    // Take screenshot of dashboard
    await page.screenshot({ path: 'auth-debug-dashboard.png', fullPage: true });
    
    // Navigate to My Files page
    console.log('Navigating to My Files page...');
    await page.goto('http://localhost:8357/pages/my-files.html');
    await page.waitForLoadState('networkidle');
    
    // Wait a bit for any redirects or loading
    await page.waitForTimeout(3000);
    
    // Check where we ended up
    const currentURL = page.url();
    console.log('My Files page URL:', currentURL);
    
    // Take screenshot of My Files page
    await page.screenshot({ path: 'auth-debug-my-files.png', fullPage: true });
    
    // Check if we're actually on My Files page
    const onMyFilesPage = currentURL.includes('my-files.html');
    console.log('Successfully on My Files page:', onMyFilesPage);
    
    if (!onMyFilesPage) {
      console.log('Not on My Files page - checking for auth issues...');
      // Check if we got redirected back to auth
      if (currentURL.includes('auth.html')) {
        console.log('Redirected back to auth page - authentication failed');
      }
    }
    
    expect(onMyFilesPage).toBeTruthy();
  });
});