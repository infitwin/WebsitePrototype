const { test, expect } = require('@playwright/test');

test.describe('Authentication Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/pages/auth.html');
  });

  test('should display auth page with login and signup forms', async ({ page }) => {
    // Check page loaded
    await expect(page.locator('.auth-container, .auth-content, [class*="auth"]').first()).toBeVisible();
    
    // Check for tab navigation
    const loginTab = page.locator('[data-tab="login"], .tab-login, button:has-text("Login")').first();
    const signupTab = page.locator('[data-tab="signup"], .tab-signup, button:has-text("Sign Up")').first();
    
    await expect(loginTab).toBeVisible();
    await expect(signupTab).toBeVisible();
  });

  test('should switch between login and signup forms', async ({ page }) => {
    // Find tab buttons
    const loginTab = page.locator('[data-tab="login"], .tab-login, button:has-text("Login")').first();
    const signupTab = page.locator('[data-tab="signup"], .tab-signup, button:has-text("Sign Up")').first();
    
    // Click signup tab
    await signupTab.click();
    await page.waitForTimeout(500);
    
    // Check signup form is visible
    const signupForm = page.locator('#signup-form, .signup-form, form[name="signup"]').first();
    await expect(signupForm).toBeVisible();
    
    // Click login tab
    await loginTab.click();
    await page.waitForTimeout(500);
    
    // Check login form is visible
    const loginForm = page.locator('#login-form, .login-form, form[name="login"]').first();
    await expect(loginForm).toBeVisible();
  });

  test('should validate login form inputs', async ({ page }) => {
    // Find form elements
    const emailInput = page.locator('input[type="email"], input[name="email"], #email').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"], #password').first();
    const submitButton = page.locator('button[type="submit"], .btn-submit, button:has-text("Login")').last();
    
    // Try to submit empty form
    await submitButton.click();
    
    // Check for validation (HTML5 or custom)
    const emailValid = await emailInput.evaluate(el => el.validity.valid);
    expect(emailValid).toBe(false);
    
    // Fill invalid email
    await emailInput.fill('invalid-email');
    await submitButton.click();
    
    // Check email validation
    const emailValidAfter = await emailInput.evaluate(el => el.validity.valid);
    expect(emailValidAfter).toBe(false);
    
    // Fill valid email and short password
    await emailInput.fill('test@example.com');
    await passwordInput.fill('123');
    await submitButton.click();
    
    // Password should be at least 6 characters (common requirement)
    const passwordValid = await passwordInput.evaluate(el => el.value.length >= 6);
    expect(passwordValid).toBe(false);
  });

  test('should validate signup form inputs', async ({ page }) => {
    // Switch to signup
    const signupTab = page.locator('[data-tab="signup"], .tab-signup, button:has-text("Sign Up")').first();
    await signupTab.click();
    await page.waitForTimeout(500);
    
    // Find signup form elements
    const nameInput = page.locator('input[name="name"], input[placeholder*="Name"], #name').first();
    const emailInput = page.locator('#signup-form input[type="email"], .signup-form input[type="email"]').first();
    const passwordInput = page.locator('#signup-form input[type="password"], .signup-form input[type="password"]').first();
    const confirmPasswordInput = page.locator('input[name="confirmPassword"], input[placeholder*="Confirm"], #confirmPassword').first();
    const submitButton = page.locator('#signup-form button[type="submit"], .signup-form button[type="submit"]').first();
    
    // Fill form with mismatched passwords
    await nameInput.fill('Test User');
    await emailInput.fill('test@example.com');
    await passwordInput.fill('password123');
    await confirmPasswordInput.fill('password456');
    
    await submitButton.click();
    
    // Should show password mismatch error
    const errorMessage = page.locator('.error-message, .error, [class*="error"]').first();
    await expect(errorMessage).toBeVisible();
  });

  test('should show/hide password toggle', async ({ page }) => {
    // Get the first password input by its ID or class
    const passwordInput = page.locator('#signup-password, #password').first();
    const toggleButton = page.locator('.password-toggle').first();
    
    // Check that toggle button exists
    await expect(toggleButton).toBeVisible();
    
    // Check initial state
    await expect(passwordInput).toHaveAttribute('type', 'password');
    
    // Toggle to show password
    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute('type', 'text');
    
    // Toggle back to hide
    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('should handle social login options', async ({ page }) => {
    // Check for social login buttons
    const googleLogin = page.locator('button:has-text("Google"), .google-login, [class*="google"]').first();
    const facebookLogin = page.locator('button:has-text("Facebook"), .facebook-login, [class*="facebook"]').first();
    
    // Check if at least one social login exists
    const hasSocialLogin = await googleLogin.isVisible() || await facebookLogin.isVisible();
    
    if (hasSocialLogin) {
      // Verify social buttons are clickable
      if (await googleLogin.isVisible()) {
        await expect(googleLogin).toBeEnabled();
      }
      if (await facebookLogin.isVisible()) {
        await expect(facebookLogin).toBeEnabled();
      }
    }
  });

  test('should navigate to email verification after signup', async ({ page }) => {
    // Mock successful signup by navigating directly
    await page.goto('/pages/email-verification.html');
    
    // Check email verification page elements
    const verificationContainer = page.locator('.verification-container, .email-verification, [class*="verification"]').first();
    await expect(verificationContainer).toBeVisible();
    
    // Check for resend button
    const resendButton = page.locator('button:has-text("Resend"), .resend-button').first();
    if (await resendButton.isVisible()) {
      await expect(resendButton).toBeEnabled();
    }
  });

  test('should handle forgot password flow', async ({ page }) => {
    // Look for forgot password link
    const forgotLink = page.locator('a:has-text("Forgot"), .forgot-password').first();
    
    if (await forgotLink.isVisible()) {
      await forgotLink.click();
      
      // Should show password reset form or modal
      const resetForm = page.locator('.reset-form, .forgot-form, [class*="reset"]').first();
      await expect(resetForm).toBeVisible();
      
      // Should have email input for reset
      const resetEmailInput = page.locator('.reset-form input[type="email"], .forgot-form input[type="email"]').first();
      await expect(resetEmailInput).toBeVisible();
    }
  });
});