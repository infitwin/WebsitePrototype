const { test, expect } = require('@playwright/test');

test.describe('Error Handling', () => {
  test('should display error page correctly', async ({ page }) => {
    await page.goto('http://localhost:8357/pages/error.html');
    
    // Check error header
    const errorHeader = page.locator('h1:has-text("Error"), h1:has-text("Oops"), h2:has-text("wrong")').first();
    await expect(errorHeader).toBeVisible();
    
    // Check error message
    const errorMessage = page.locator('p, .error-message, .error-description').first();
    await expect(errorMessage).toBeVisible();
    
    // Check for back/home button
    const backButton = page.locator('button:has-text("Back"), a:has-text("Home"), button:has-text("Go Home")').first();
    await expect(backButton).toBeVisible();
  });

  test('should have error code or illustration', async ({ page }) => {
    await page.goto('http://localhost:8357/pages/error.html');
    
    // Check for error code
    const errorCode = page.locator('.error-code, h1:has-text("404"), h2:has-text("500")').first();
    const hasErrorCode = await errorCode.isVisible().catch(() => false);
    
    // Check for error illustration
    const errorImage = page.locator('img[alt*="error"], .error-illustration, svg').first();
    const hasErrorImage = await errorImage.isVisible().catch(() => false);
    
    expect(hasErrorCode || hasErrorImage).toBeTruthy();
  });

  test('should navigate back from error page', async ({ page }) => {
    await page.goto('http://localhost:8357/pages/error.html');
    
    // Find navigation button
    const navButton = page.locator('button:has-text("Back"), a:has-text("Home"), button:has-text("Go Home")').first();
    
    // Check if it has proper href or onclick
    const isLink = await navButton.evaluate(el => el.tagName === 'A');
    if (isLink) {
      const href = await navButton.getAttribute('href');
      expect(href).toBeTruthy();
    } else {
      // It's a button, should have click handler
      await navButton.click();
      await page.waitForTimeout(500);
      // Check if navigation occurred
      const url = page.url();
      expect(url).not.toContain('error.html');
    }
  });

  test('should display error demo page', async ({ page }) => {
    await page.goto('http://localhost:8357/pages/error-demo.html');
    
    // Check if page loads
    await expect(page).toHaveURL(/error-demo\.html/);
    
    // Check for demo content
    const content = page.locator('body');
    await expect(content).toBeVisible();
    
    // Check for any demo buttons or triggers
    const demoButtons = page.locator('button, .demo-trigger');
    const buttonCount = await demoButtons.count();
    
    if (buttonCount > 0) {
      // Click first demo button to trigger error
      await demoButtons.first().click();
      await page.waitForTimeout(500);
    }
  });

  test('should handle 404 errors gracefully', async ({ page }) => {
    // Try to access non-existent page
    const response = await page.goto('http://localhost:8357/pages/non-existent-page.html');
    
    // Check response status
    if (response) {
      const status = response.status();
      expect(status).toBe(404);
    }
    
    // Server might redirect to error page or show 404
    const errorIndicator = page.locator('h1:has-text("404"), h1:has-text("Not Found"), .error-404').first();
    const hasErrorIndicator = await errorIndicator.isVisible().catch(() => false);
    
    // Either 404 status or error page is acceptable
    expect(response?.status() === 404 || hasErrorIndicator).toBeTruthy();
  });

  test('should have user-friendly error messages', async ({ page }) => {
    await page.goto('http://localhost:8357/pages/error.html');
    
    // Check for user-friendly language
    const friendlyMessages = page.locator('text=/sorry|oops|went wrong|try again/i');
    const messageCount = await friendlyMessages.count();
    expect(messageCount).toBeGreaterThan(0);
    
    // Check for helpful actions
    const helpfulActions = page.locator('text=/go home|go back|try again|contact support/i');
    const actionCount = await helpfulActions.count();
    expect(actionCount).toBeGreaterThan(0);
  });

  test('should maintain consistent styling on error pages', async ({ page }) => {
    await page.goto('http://localhost:8357/pages/error.html');
    
    // Check for consistent header/navigation
    const header = page.locator('header, nav, .navigation').first();
    const hasHeader = await header.isVisible().catch(() => false);
    
    // Check for consistent footer
    const footer = page.locator('footer, .footer').first();
    const hasFooter = await footer.isVisible().catch(() => false);
    
    // Check for styled error content (not raw HTML)
    const styledContent = page.locator('[class*="error"], [id*="error"]').first();
    const hasStyledContent = await styledContent.isVisible().catch(() => false);
    
    expect(hasHeader || hasFooter || hasStyledContent).toBeTruthy();
  });
});