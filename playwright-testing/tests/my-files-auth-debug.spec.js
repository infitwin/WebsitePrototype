const { test, expect } = require('@playwright/test');

test.describe('My Files Auth Debug', () => {
  
  test('capture email confirmation modal', async ({ page }) => {
    // Go to auth page
    await page.goto('http://localhost:8357/pages/auth.html');
    
    // Click on login tab
    await page.click('[data-tab="login"]');
    
    // Fill in login credentials
    await page.fill('.login-email', 'weezer@yev.com');
    await page.fill('.login-password', '123456');
    
    // Click login button
    await page.click('button:has-text("Access Your Memories")');
    
    // Wait for any modal/popup to appear
    await page.waitForTimeout(2000);
    
    // Take screenshot to see what appears
    await page.screenshot({ path: 'login-after-click.png', fullPage: true });
    
    // Try to find any visible modal
    const visibleModals = await page.locator('.modal, [role="dialog"], .popup, .overlay, .email-confirmation').all();
    console.log(`Found ${visibleModals.length} potential modals`);
    
    // Also check for any element with z-index > 100 (likely a modal)
    const highZIndexElements = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      const highZ = [];
      elements.forEach(el => {
        const style = window.getComputedStyle(el);
        const zIndex = parseInt(style.zIndex);
        if (zIndex > 100) {
          highZ.push({
            tag: el.tagName,
            class: el.className,
            id: el.id,
            text: el.textContent?.substring(0, 50),
            zIndex: zIndex
          });
        }
      });
      return highZ;
    });
    
    console.log('High z-index elements:', highZIndexElements);
    
    // Wait a bit more and take another screenshot
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'login-after-wait.png', fullPage: true });
  });
});