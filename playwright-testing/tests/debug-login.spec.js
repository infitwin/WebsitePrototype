const { test, expect } = require('@playwright/test');

test('debug login form', async ({ page }) => {
  // Navigate to auth page
  await page.goto('http://localhost:8357/pages/auth.html');
  
  // Wait for page to load
  await page.waitForLoadState('networkidle');
  
  // Debug: Log all form elements
  console.log('\n=== DEBUGGING LOGIN FORM ===');
  
  // Check if we need to click login tab
  const loginTab = await page.locator('[data-tab="login"]').count();
  console.log(`Login tab found: ${loginTab > 0}`);
  
  if (loginTab > 0) {
    await page.click('[data-tab="login"]');
    console.log('Clicked login tab');
  }
  
  // Find all email inputs
  const emailInputs = await page.locator('input[type="email"]').count();
  console.log(`Email inputs found: ${emailInputs}`);
  
  // Find all password inputs
  const passwordInputs = await page.locator('input[type="password"]').count();
  console.log(`Password inputs found: ${passwordInputs}`);
  
  // Find all submit buttons
  const submitButtons = await page.locator('button[type="submit"]').count();
  console.log(`Submit buttons found: ${submitButtons}`);
  
  // Log all button texts
  const allButtons = await page.locator('button').all();
  console.log('\nAll buttons on page:');
  for (const button of allButtons) {
    const text = await button.textContent();
    console.log(`  - "${text.trim()}"`);
  }
  
  // Try to find the specific login form
  const loginForm = await page.locator('form').filter({ has: page.locator('input[type="email"]') }).count();
  console.log(`\nLogin forms found: ${loginForm}`);
  
  // Check current URL
  console.log(`Current URL: ${page.url()}`);
  
  // Take a screenshot for manual inspection
  await page.screenshot({ path: 'screenshots/debug-auth-page.png', fullPage: true });
  console.log('\nScreenshot saved to: screenshots/debug-auth-page.png');
  
  // Try to fill in credentials anyway
  try {
    await page.fill('input[type="email"]', 'weezer@yev.com');
    await page.fill('input[type="password"]', '12345');
    console.log('\n✅ Successfully filled in credentials');
    
    // Find the login button more flexibly
    const loginButton = page.locator('button').filter({ hasText: /log\s*in/i }).first();
    const buttonText = await loginButton.textContent();
    console.log(`Found login button with text: "${buttonText.trim()}"`);
    
    // Click it
    await loginButton.click();
    console.log('Clicked login button');
    
    // Wait a bit to see what happens
    await page.waitForTimeout(3000);
    console.log(`\nAfter login attempt, URL is: ${page.url()}`);
    
  } catch (error) {
    console.log('\n❌ Error during login attempt:', error.message);
  }
});