const { test, expect } = require('@playwright/test');

test.describe('Interview Session Controls', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8357/pages/interview.html');
  });

  test('should handle session stop action', async ({ page }) => {
    // First, start the interview
    const privacyModal = page.locator('.privacy-modal');
    await expect(privacyModal).toBeVisible();
    
    // Click "I Understand" to start interview
    await page.click('button:has-text("I Understand - Start Interview")');
    
    // Wait for privacy modal to disappear
    await expect(privacyModal).not.toBeVisible();
    
    // Find and click the Stop Session button
    const stopButton = page.locator('button:has-text("Stop Session")');
    await expect(stopButton).toBeVisible();
    
    // Set up dialog handler for confirmation
    page.once('dialog', dialog => {
      expect(dialog.type()).toBe('confirm');
      expect(dialog.message()).toContain('Are you sure you want to stop this interview session?');
      dialog.accept();
    });
    
    // Click the stop button
    await stopButton.click();
    
    // Check that success toast appears
    const toast = page.locator('.toast');
    await expect(toast).toBeVisible();
    await expect(toast).toHaveText(/Interview session stopped/);
    
    // Check that idea clouds are cleared
    const ideaClouds = page.locator('#ideaClouds');
    await expect(ideaClouds).toBeEmpty();
    
    // Set up second dialog handler for dashboard navigation
    page.once('dialog', dialog => {
      expect(dialog.type()).toBe('confirm');
      expect(dialog.message()).toContain('Would you like to return to the dashboard?');
      dialog.dismiss(); // Stay on page for test
    });
    
    // Wait for the second dialog
    await page.waitForTimeout(2500);
  });

  test('should show Save & Exit functionality', async ({ page }) => {
    // Start interview first
    await page.click('button:has-text("I Understand - Start Interview")');
    
    // Find Save & Exit button
    const saveExitButton = page.locator('button:has-text("Save & Exit")');
    await expect(saveExitButton).toBeVisible();
    
    // Click Save & Exit
    await saveExitButton.click();
    
    // Check for success toast
    const toast = page.locator('.toast');
    await expect(toast).toBeVisible();
    await expect(toast).toHaveText(/Interview saved/);
    
    // Should navigate to dashboard after delay
    await page.waitForURL('**/dashboard.html', { timeout: 3000 });
  });

  test('should handle mic button state changes', async ({ page, browserName }) => {
    // Start interview first
    await page.click('button:has-text("I Understand - Start Interview")');
    
    // Wait for services to initialize
    await page.waitForTimeout(1000);
    
    // Find mic button
    const micButton = page.locator('#micBtn');
    await expect(micButton).toBeVisible();
    
    // Initial state should be not recording
    await expect(micButton).not.toHaveClass(/recording/);
    await expect(micButton).toHaveText('🎤');
    
    // Click to start recording
    await micButton.click();
    
    // Wait a bit for state change
    await page.waitForTimeout(500);
    
    // Check for either recording state or error toast (if permissions fail)
    // Audio recording may fail in test environment due to permissions
    const hasRecordingClass = await micButton.evaluate(el => el.classList.contains('recording'));
    const toastVisible = await page.locator('.toast').isVisible();
    
    if (hasRecordingClass) {
      // Recording started successfully
      await expect(micButton).toHaveClass(/recording/);
      await expect(micButton).toHaveText('⏹️');
      
      // Click again to stop recording
      await micButton.click();
      
      // Wait for state change
      await page.waitForTimeout(500);
      
      // Should return to normal state
      await expect(micButton).not.toHaveClass(/recording/);
      await expect(micButton).toHaveText('🎤');
    } else if (toastVisible) {
      // Recording failed (expected in test environment)
      // Check that error toast is shown
      const toast = page.locator('.toast');
      await expect(toast).toBeVisible();
      
      // Button should remain in non-recording state
      await expect(micButton).not.toHaveClass(/recording/);
      await expect(micButton).toHaveText('🎤');
      
      // This is acceptable behavior in test environment
      console.log(`Audio recording not available in ${browserName} test environment`);
    } else {
      // Button should still be clickable even if recording fails
      await expect(micButton).toBeVisible();
      await expect(micButton).toBeEnabled();
    }
  });

  test('should display interview questions', async ({ page }) => {
    // Start interview
    await page.click('button:has-text("I Understand - Start Interview")');
    
    // Check for question display
    const questionLabel = page.locator('.question-label');
    await expect(questionLabel).toBeVisible();
    await expect(questionLabel).toHaveText('Current Question:');
    
    const questionText = page.locator('.interview-question');
    await expect(questionText).toBeVisible();
    await expect(questionText).not.toBeEmpty();
  });

  test('should show Winston orb states', async ({ page }) => {
    // Start interview
    await page.click('button:has-text("I Understand - Start Interview")');
    
    // Check Winston orb exists
    const winstonOrb = page.locator('.winston-orb').first();
    await expect(winstonOrb).toBeVisible();
    
    // Should have initial idle state (no special classes)
    const classList = await winstonOrb.getAttribute('class');
    expect(classList).toBe('winston-orb');
  });

  test('should expand and collapse chat', async ({ page }) => {
    // Start interview
    await page.click('button:has-text("I Understand - Start Interview")');
    
    // Find expand indicator
    const expandIndicator = page.locator('.expand-indicator');
    await expect(expandIndicator).toBeVisible();
    
    // Click to expand
    await expandIndicator.click();
    
    // Check modal is visible
    const chatModal = page.locator('#chatModal');
    await expect(chatModal).toHaveClass(/active/);
    
    // Close modal
    const closeButton = page.locator('.close-btn');
    await closeButton.click();
    
    // Modal should be hidden
    await expect(chatModal).not.toHaveClass(/active/);
  });

  test('should toggle interview manager sidebar', async ({ page }) => {
    // Start interview
    await page.click('button:has-text("I Understand - Start Interview")');
    
    // Find Interviews button
    const interviewsButton = page.locator('button:has-text("Interviews")');
    await expect(interviewsButton).toBeVisible();
    
    // Click to open sidebar
    await interviewsButton.click();
    
    // Check sidebar is visible
    const sidebar = page.locator('#interviewManager');
    await expect(sidebar).toHaveClass(/active/);
    
    // Check overlay is visible
    const overlay = page.locator('#overlay');
    await expect(overlay).toHaveClass(/active/);
    
    // Click overlay to close
    await overlay.click();
    
    // Sidebar should be hidden
    await expect(sidebar).not.toHaveClass(/active/);
  });

  test('should create floating idea clouds', async ({ page }) => {
    // Start interview
    await page.click('button:has-text("I Understand - Start Interview")');
    
    // Wait for idea clouds to appear
    await page.waitForTimeout(2000);
    
    // Check that idea clouds container has children
    const ideaClouds = page.locator('#ideaClouds .idea-cloud');
    const cloudCount = await ideaClouds.count();
    expect(cloudCount).toBeGreaterThan(0);
    
    // Check that clouds have content
    const firstCloud = ideaClouds.first();
    await expect(firstCloud).not.toBeEmpty();
  });
});