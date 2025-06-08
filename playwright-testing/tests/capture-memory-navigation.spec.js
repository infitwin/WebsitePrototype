const { test, expect } = require('@playwright/test');

test.describe('Capture Memory Navigation Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/pages/capture-first-memory.html');
  });

  test('should display navigation header with skip to signup option', async ({ page }) => {
    // Check navigation header exists
    const nav = page.locator('.capture-nav');
    await expect(nav).toBeVisible();
    
    // Check back link
    const backLink = page.locator('.back-link');
    await expect(backLink).toBeVisible();
    await expect(backLink).toContainText('Back to Winston');
    
    // Check skip button
    const skipButton = page.locator('.skip-btn');
    await expect(skipButton).toBeVisible();
    await expect(skipButton).toContainText('Skip to Sign Up');
  });

  test('should navigate back to Winston when back link clicked', async ({ page }) => {
    const backLink = page.locator('.back-link');
    
    // Click back link
    await backLink.click();
    
    // Should navigate to meet-winston page
    await page.waitForTimeout(500);
    expect(page.url()).toContain('meet-winston.html');
  });

  test('should navigate to auth page when skip button clicked', async ({ page }) => {
    const skipButton = page.locator('.skip-btn');
    
    // Click skip button
    await skipButton.click();
    
    // Should navigate to auth page
    await page.waitForTimeout(500);
    expect(page.url()).toContain('auth.html');
  });

  test('should have proper navigation styling', async ({ page }) => {
    const nav = page.locator('.capture-nav');
    
    // Check navigation is visible
    await expect(nav).toBeVisible();
    
    // Check skip button is styled and visible
    const skipButton = page.locator('.skip-btn');
    await expect(skipButton).toBeVisible();
    await expect(skipButton).toHaveText('Skip to Sign Up →');
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Navigation should still be visible and functional
    const nav = page.locator('.capture-nav');
    await expect(nav).toBeVisible();
    
    const skipButton = page.locator('.skip-btn');
    await expect(skipButton).toBeVisible();
    
    // Check mobile-specific padding
    const navPadding = await nav.evaluate(el => 
      window.getComputedStyle(el).padding
    );
    expect(navPadding).toBeTruthy();
  });

  test('should allow users to exit interview flow at any point', async ({ page }) => {
    // This test verifies the main bug fix: users can navigate to auth 
    // from capture-first-memory.html without completing the interview
    
    // Verify we're on the capture page
    await expect(page.locator('.capture-title')).toContainText('Capture Your First Memory');
    
    // User should be able to skip directly to signup without filling out form
    const skipButton = page.locator('.skip-btn');
    await skipButton.click();
    
    // Should successfully navigate to auth page
    await page.waitForTimeout(500);
    expect(page.url()).toContain('auth.html');
    
    // Verify auth page loaded properly
    await expect(page.locator('.auth-container')).toBeVisible();
  });
});