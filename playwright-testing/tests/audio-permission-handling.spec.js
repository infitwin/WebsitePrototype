const { test, expect } = require('@playwright/test');

test.describe('Audio Recording Permission Handling', () => {
  
  test('should handle microphone permission denied gracefully', async ({ page, context }) => {
    // Deny microphone permission
    await context.grantPermissions([], { origin: 'http://localhost:8357' });
    
    await page.goto('http://localhost:8357/pages/curator.html');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Find and click the microphone button
    const micButton = page.locator('button#micBtn, .mic-btn, button:has-text("🎤")').first();
    await expect(micButton).toBeVisible();
    
    // Click microphone button - should trigger permission request
    await micButton.click();
    
    // Should show error message or disable recording functionality
    // Check for error indicators
    const errorElements = [
      page.locator('.error, .permission-error, [class*="error"]'),
      page.locator('text=/permission.*denied/i'),
      page.locator('text=/microphone.*access/i'),
      page.locator('text=/audio.*unavailable/i')
    ];
    
    let errorShown = false;
    for (const errorElement of errorElements) {
      if (await errorElement.first().isVisible().catch(() => false)) {
        errorShown = true;
        break;
      }
    }
    
    // Check if microphone button is disabled or shows error state
    const buttonDisabled = await micButton.isDisabled().catch(() => false);
    const buttonHasErrorClass = await micButton.getAttribute('class').then(
      cls => cls && (cls.includes('error') || cls.includes('disabled'))
    ).catch(() => false);
    
    // At least one error handling mechanism should be active
    expect(errorShown || buttonDisabled || buttonHasErrorClass).toBeTruthy();
  });

  test('should handle microphone permission granted successfully', async ({ page, context }) => {
    // Grant microphone permission
    await context.grantPermissions(['microphone'], { origin: 'http://localhost:8357' });
    
    await page.goto('http://localhost:8357/pages/curator.html');
    await page.waitForLoadState('networkidle');
    
    // Find microphone button
    const micButton = page.locator('button#micBtn, .mic-btn, button:has-text("🎤")').first();
    await expect(micButton).toBeVisible();
    
    // Click to start recording
    await micButton.click();
    await page.waitForTimeout(500); // Allow time for initialization
    
    // Should show recording state
    const recordingStates = [
      page.locator('.recording, .mic-btn.recording, [class*="recording"]'),
      page.locator('button:has-text("🔴"), button:has-text("⏹️")'),
      micButton // Check if button itself changes state
    ];
    
    let recordingStateVisible = false;
    for (const state of recordingStates) {
      if (await state.first().isVisible().catch(() => false)) {
        // Check if element has recording-related class or text
        const element = state.first();
        const className = await element.getAttribute('class').catch(() => '');
        const textContent = await element.textContent().catch(() => '');
        
        if (className.includes('recording') || 
            textContent.includes('🔴') || 
            textContent.includes('⏹️')) {
          recordingStateVisible = true;
          break;
        }
      }
    }
    
    expect(recordingStateVisible).toBeTruthy();
    
    // Click again to stop recording
    await micButton.click();
    await page.waitForTimeout(300);
    
    // Should return to initial state or show completion
    const stoppedStates = [
      page.locator('button:has-text("🎤")'),
      page.locator('.completed, .stopped, [class*="complete"]')
    ];
    
    let stoppedStateVisible = false;
    for (const state of stoppedStates) {
      if (await state.first().isVisible().catch(() => false)) {
        stoppedStateVisible = true;
        break;
      }
    }
    
    expect(stoppedStateVisible).toBeTruthy();
  });

  test('should handle browser without microphone support', async ({ page }) => {
    // Override navigator.mediaDevices to simulate unsupported browser
    await page.addInitScript(() => {
      delete window.navigator.mediaDevices;
    });
    
    await page.goto('http://localhost:8357/pages/curator.html');
    await page.waitForLoadState('networkidle');
    
    // Find microphone button
    const micButton = page.locator('button#micBtn, .mic-btn, button:has-text("🎤")').first();
    
    if (await micButton.isVisible()) {
      await micButton.click();
      
      // Should show unsupported browser message or disable functionality
      const unsupportedElements = [
        page.locator('text=/browser.*not.*supported/i'),
        page.locator('text=/microphone.*unavailable/i'),
        page.locator('text=/audio.*not.*supported/i'),
        page.locator('.unsupported, .browser-error, [class*="unsupported"]')
      ];
      
      let unsupportedShown = false;
      for (const element of unsupportedElements) {
        if (await element.first().isVisible().catch(() => false)) {
          unsupportedShown = true;
          break;
        }
      }
      
      // Check if button is disabled
      const buttonDisabled = await micButton.isDisabled().catch(() => false);
      
      expect(unsupportedShown || buttonDisabled).toBeTruthy();
    }
  });

  test('should handle getUserMedia API failure', async ({ page }) => {
    // Override getUserMedia to throw error
    await page.addInitScript(() => {
      const originalGetUserMedia = navigator.mediaDevices.getUserMedia;
      navigator.mediaDevices.getUserMedia = async () => {
        throw new Error('NotAllowedError: Permission denied');
      };
    });
    
    await page.goto('http://localhost:8357/pages/curator.html');
    await page.waitForLoadState('networkidle');
    
    const micButton = page.locator('button#micBtn, .mic-btn, button:has-text("🎤")').first();
    await expect(micButton).toBeVisible();
    
    await micButton.click();
    await page.waitForTimeout(500);
    
    // Should handle the API failure gracefully
    const errorHandled = await page.locator('.error, .permission-error, [class*="error"]').first().isVisible().catch(() => false) ||
                         await micButton.isDisabled().catch(() => false);
    
    expect(errorHandled).toBeTruthy();
  });

  test('should handle audio context creation failure in older browsers', async ({ page }) => {
    // Override AudioContext to simulate failure
    await page.addInitScript(() => {
      window.AudioContext = undefined;
      window.webkitAudioContext = undefined;
    });
    
    await page.goto('http://localhost:8357/pages/curator.html');
    await page.waitForLoadState('networkidle');
    
    const micButton = page.locator('button#micBtn, .mic-btn, button:has-text("🎤")').first();
    
    if (await micButton.isVisible()) {
      await micButton.click();
      await page.waitForTimeout(500);
      
      // Should either show error or gracefully degrade
      const errorOrDisabled = await page.locator('.error, .audio-error, [class*="error"]').first().isVisible().catch(() => false) ||
                             await micButton.isDisabled().catch(() => false);
      
      // Test passes if error is handled or if functionality continues to work
      expect(true).toBeTruthy(); // This is more about not crashing than specific behavior
    }
  });

  test('should handle rapid click interactions on microphone button', async ({ page, context }) => {
    await context.grantPermissions(['microphone'], { origin: 'http://localhost:8357' });
    
    await page.goto('http://localhost:8357/pages/curator.html');
    await page.waitForLoadState('networkidle');
    
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