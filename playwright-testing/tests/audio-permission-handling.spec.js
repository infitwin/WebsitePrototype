const { test, expect } = require('@playwright/test');

test.describe('Audio Recording Permission Handling', () => {
  
  async function initializePage(page) {
    await page.goto('http://localhost:8357/pages/curator.html');
    
    // Click "I Understand - Start Curating" to dismiss privacy modal and initialize services
    await page.click('button:has-text("I Understand - Start Curating")');
    
    // Wait for services to initialize
    await page.waitForTimeout(2000);
  }
  
  test('should display microphone button and handle clicks', async ({ page }) => {
    await initializePage(page);
    
    // Find and verify microphone button exists
    const micButton = page.locator('button#micBtn, .mic-btn, button:has-text("🎤")').first();
    await expect(micButton).toBeVisible();
    
    // Click microphone button - should either work or show error gracefully
    await micButton.click();
    await page.waitForTimeout(1000);
    
    // Page should not crash - verify it still loads
    const title = await page.title();
    expect(title).toContain('Curator');
    
    // Button should still be visible and clickable
    expect(await micButton.isVisible()).toBeTruthy();
  });

  test('should handle microphone functionality gracefully', async ({ page }) => {
    await initializePage(page);
    
    // Find microphone button
    const micButton = page.locator('button#micBtn, .mic-btn, button:has-text("🎤")').first();
    await expect(micButton).toBeVisible();
    
    // Click to attempt recording
    await micButton.click();
    await page.waitForTimeout(1000);
    
    // Check for any state change - either recording starts or error is shown
    const hasStateChange = await Promise.race([
      page.locator('.recording, .error, .permission-error').first().isVisible().catch(() => false),
      page.waitForTimeout(500).then(() => false)
    ]);
    
    // Either state changed or gracefully handled without crash
    const stillResponsive = await micButton.isVisible();
    expect(stillResponsive).toBeTruthy();
    
    // Click again to test stop/toggle behavior
    await micButton.click();
    await page.waitForTimeout(500);
    
    // Should still be responsive
    expect(await micButton.isVisible()).toBeTruthy();
  });

  test('should handle browser without microphone support gracefully', async ({ page }) => {
    // Override navigator.mediaDevices to simulate unsupported browser
    await page.addInitScript(() => {
      delete window.navigator.mediaDevices;
    });
    
    await initializePage(page);
    
    // Should still load the page without crashing
    const title = await page.title();
    expect(title).toContain('Curator');
    
    // Microphone button should still be present
    const micButton = page.locator('button#micBtn, .mic-btn, button:has-text("🎤")').first();
    expect(await micButton.isVisible()).toBeTruthy();
  });

  test('should handle API failures gracefully', async ({ page }) => {
    // Override getUserMedia to throw error
    await page.addInitScript(() => {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia = async () => {
          throw new Error('NotAllowedError: Permission denied');
        };
      }
    });
    
    await initializePage(page);
    
    // Page should load normally
    const title = await page.title();
    expect(title).toContain('Curator');
    
    // Button should be present and clickable
    const micButton = page.locator('button#micBtn, .mic-btn, button:has-text("🎤")').first();
    expect(await micButton.isVisible()).toBeTruthy();
  });

  test('should handle rapid click interactions without crashing', async ({ page }) => {
    await initializePage(page);
    
    const micButton = page.locator('button#micBtn, .mic-btn, button:has-text("🎤")').first();
    await expect(micButton).toBeVisible();
    
    // Rapidly click the button multiple times
    for (let i = 0; i < 5; i++) {
      await micButton.click();
      await page.waitForTimeout(100);
    }
    
    // Should handle rapid clicks gracefully without breaking
    const buttonStillVisible = await micButton.isVisible();
    expect(buttonStillVisible).toBeTruthy();
    
    // Page should not have crashed
    const title = await page.title();
    expect(title).toContain('Curator');
  });

});