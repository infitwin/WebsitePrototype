const { test, expect } = require('@playwright/test');

test('Login with weezer@yev.com and password 12345', async ({ page }) => {
  console.log('Starting login test with credentials: weezer@yev.com / 12345');
  
  // Navigate to auth page
  await page.goto('http://localhost:8357/pages/auth.html');
  
  // Click on the Log In tab to show login form
  await page.click('[data-tab="login"]');
  console.log('✅ Switched to login tab');
  
  // Wait for login form to be visible
  await page.waitForSelector('#loginForm', { state: 'visible' });
  
  // Fill in the login form specifically (not the signup form)
  await page.fill('#loginForm input[type="email"]', 'weezer@yev.com');
  await page.fill('#loginForm input[type="password"]', '12345');
  console.log('✅ Filled in credentials: weezer@yev.com / 12345');
  
  // Click the login button (not signup)
  await page.click('#loginForm button[type="submit"]');
  console.log('✅ Clicked login button');
  
  // Wait for either successful redirect or error
  const response = await Promise.race([
    page.waitForURL('**/dashboard.html', { timeout: 10000 }).then(() => 'success'),
    page.waitForSelector('.error-message, .alert, [role="alert"]', { timeout: 10000 }).then(() => 'error'),
    page.waitForTimeout(10000).then(() => 'timeout')
  ]);
  
  if (response === 'success') {
    console.log('✅ LOGIN SUCCESSFUL! Redirected to dashboard');
    console.log('Current URL:', page.url());
    
    // Verify we can see user info
    const userEmail = await page.locator('#userEmail, .user-email').first().textContent().catch(() => 'Not found');
    console.log('User email on dashboard:', userEmail);
    
    // Test is successful
    expect(page.url()).toContain('dashboard.html');
  } else if (response === 'error') {
    const errorText = await page.locator('.error-message, .alert, [role="alert"]').first().textContent();
    console.log('❌ LOGIN FAILED with error:', errorText);
    throw new Error(`Login failed: ${errorText}`);
  } else {
    console.log('❌ LOGIN TIMEOUT - no redirect occurred');
    console.log('Current URL:', page.url());
    throw new Error('Login timed out - no redirect to dashboard');
  }
});