const { test, expect } = require('@playwright/test');

test.describe('Auth Tab Navigation', () => {
  test('Login link should show login tab by default', async ({ page }) => {
    // Navigate to homepage
    await page.goto('http://localhost:8357/index.html');
    
    // Click the Login link
    await page.click('a.nav-login');
    
    // Wait for navigation to auth page
    await page.waitForURL('**/auth.html');
    
    // Check that login tab is active
    const loginTabButton = page.locator('[data-tab="login"]');
    await expect(loginTabButton).toHaveClass(/active/);
    
    // Check that login form is visible
    const loginForm = page.locator('#login-form');
    await expect(loginForm).toBeVisible();
    
    // Check that signup form is hidden
    const signupForm = page.locator('#signup-form');
    await expect(signupForm).toHaveClass(/hidden/);
  });
  
  test('Sign Up link should show signup tab', async ({ page }) => {
    // Navigate to homepage
    await page.goto('http://localhost:8357/index.html');
    
    // Click the Sign Up link
    await page.click('a.nav-signup');
    
    // Wait for navigation to auth page with tab parameter
    await page.waitForURL('**/auth.html?tab=signup');
    
    // Check that signup tab is active
    const signupTabButton = page.locator('[data-tab="signup"]');
    await expect(signupTabButton).toHaveClass(/active/);
    
    // Check that signup form is visible
    const signupForm = page.locator('#signup-form');
    await expect(signupForm).toBeVisible();
    
    // Check that login form is hidden
    const loginForm = page.locator('#login-form');
    await expect(loginForm).toHaveClass(/hidden/);
  });
  
  test('Direct navigation to auth.html shows login tab by default', async ({ page }) => {
    // Navigate directly to auth page without parameters
    await page.goto('http://localhost:8357/pages/auth.html');
    
    // Check that login tab is active
    const loginTabButton = page.locator('[data-tab="login"]');
    await expect(loginTabButton).toHaveClass(/active/);
    
    // Check that login form is visible
    const loginForm = page.locator('#login-form');
    await expect(loginForm).toBeVisible();
  });
  
  test('Tab switching works after page load', async ({ page }) => {
    // Navigate to auth page
    await page.goto('http://localhost:8357/pages/auth.html');
    
    // Click signup tab
    await page.click('[data-tab="signup"]');
    
    // Check that signup tab is now active
    const signupTabButton = page.locator('[data-tab="signup"]');
    await expect(signupTabButton).toHaveClass(/active/);
    
    // Check that signup form is visible
    const signupForm = page.locator('#signup-form');
    await expect(signupForm).toBeVisible();
    
    // Click login tab
    await page.click('[data-tab="login"]');
    
    // Check that login tab is now active
    const loginTabButton = page.locator('[data-tab="login"]');
    await expect(loginTabButton).toHaveClass(/active/);
    
    // Check that login form is visible
    const loginForm = page.locator('#login-form');
    await expect(loginForm).toBeVisible();
  });
});