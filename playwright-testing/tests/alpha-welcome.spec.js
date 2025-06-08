const { test, expect } = require('@playwright/test');

test.describe('Alpha Welcome Page Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8357/pages/alpha-welcome.html');
  });

  test('should display personalized welcome message', async ({ page }) => {
    // Check default state
    await expect(page.locator('.welcome-title')).toContainText('Welcome to Infitwin Alpha');
    await expect(page.locator('#userName')).toContainText('User');
    await expect(page.locator('#userAvatar')).toContainText('U');
    
    // Test with URL parameters
    await page.goto('http://localhost:8357/pages/alpha-welcome.html?name=John%20Doe&email=john@example.com');
    await expect(page.locator('#userName')).toContainText('John Doe');
    await expect(page.locator('#userAvatar')).toContainText('J');
  });

  test('should display alpha badge in navigation', async ({ page }) => {
    const alphaBadge = page.locator('.alpha-badge');
    await expect(alphaBadge).toBeVisible();
    await expect(alphaBadge).toContainText('ALPHA');
    
    // Check badge styling
    const backgroundColor = await alphaBadge.evaluate(el => 
      window.getComputedStyle(el).background
    );
    expect(backgroundColor).toContain('gradient');
  });

  test('should have floating animation elements', async ({ page }) => {
    const floatingElements = page.locator('.floating-element');
    await expect(floatingElements).toHaveCount(3);
    
    // Check each floating element
    await expect(floatingElements.nth(0)).toContainText('🌟');
    await expect(floatingElements.nth(1)).toContainText('✨');
    await expect(floatingElements.nth(2)).toContainText('💫');
    
    // Verify animation is applied
    const firstElement = floatingElements.first();
    const animation = await firstElement.evaluate(el => 
      window.getComputedStyle(el).animation
    );
    expect(animation).toContain('float');
  });

  test('should display value proposition cards', async ({ page }) => {
    const valueCards = page.locator('.value-card');
    await expect(valueCards).toHaveCount(3);
    
    // Check Build card
    const buildCard = valueCards.filter({ hasText: 'Build' });
    await expect(buildCard).toBeVisible();
    await expect(buildCard.locator('.value-icon')).toContainText('🎙️');
    await expect(buildCard.locator('.value-description')).toContainText('Interview with Winston');
    
    // Check Explore card
    const exploreCard = valueCards.filter({ hasText: 'Explore' });
    await expect(exploreCard).toBeVisible();
    await expect(exploreCard.locator('.value-icon')).toContainText('🔍');
    
    // Check Share card
    const shareCard = valueCards.filter({ hasText: 'Share' });
    await expect(shareCard).toBeVisible();
    await expect(shareCard.locator('.value-icon')).toContainText('❤️');
  });

  test('should handle video player interactions', async ({ page }) => {
    const videoPlayer = page.locator('#videoPlayer');
    const playButton = page.locator('button:has-text("Watch Introduction")');
    const skipButton = page.locator('button:has-text("Skip Video")');
    
    // Initial state
    await expect(videoPlayer).toBeVisible();
    await expect(videoPlayer).toContainText('🎬');
    
    // Test play button
    await playButton.click();
    await page.waitForTimeout(500);
    
    // Video player should update content
    const updatedContent = await videoPlayer.textContent();
    expect(updatedContent).toContain('Video would play here');
    
    // Test skip button - should scroll to sample twin section
    await page.reload(); // Reset state
    await skipButton.click();
    
    // Check if sample twin section is in view
    const sampleTwinSection = page.locator('.sample-twin');
    await expect(sampleTwinSection).toBeInViewport();
  });

  test('should display Einstein sample twin section', async ({ page }) => {
    const einsteinSection = page.locator('.sample-twin-card');
    await expect(einsteinSection).toBeVisible();
    
    // Check Einstein avatar and info
    await expect(page.locator('.einstein-avatar')).toContainText('🧬');
    await expect(page.locator('.einstein-name')).toContainText("Albert Einstein's Digital Twin");
    await expect(page.locator('.einstein-description')).toContainText('Experience how a complete memory archive works');
    
    // Check action buttons
    const exploreButton = page.locator('a:has-text("Explore Einstein\'s Memories")');
    const chatButton = page.locator('a:has-text("Chat with Einstein")');
    
    await expect(exploreButton).toBeVisible();
    await expect(chatButton).toBeVisible();
  });

  test('should handle sample twin interactions', async ({ page }) => {
    // Set up dialog handler for alerts
    page.on('dialog', async dialog => {
      expect(dialog.type()).toBe('alert');
      expect(dialog.message()).toContain('Einstein');
      await dialog.accept();
    });
    
    // Test explore button
    const exploreButton = page.locator('a:has-text("Explore Einstein\'s Memories")');
    await exploreButton.click();
    
    // Test chat button
    const chatButton = page.locator('a:has-text("Chat with Einstein")');
    await chatButton.click();
  });

  test('should have functional CTA buttons', async ({ page }) => {
    const ctaSection = page.locator('.cta-section');
    await expect(ctaSection).toBeVisible();
    
    // Check main CTA button
    const startBuildingBtn = page.locator('a:has-text("Start Building My Twin")');
    await expect(startBuildingBtn).toBeVisible();
    await expect(startBuildingBtn).toHaveAttribute('href', 'dashboard.html');
    
    // Check secondary CTA button
    const beginInterviewBtn = page.locator('a:has-text("Begin First Interview")');
    await expect(beginInterviewBtn).toBeVisible();
    await expect(beginInterviewBtn).toHaveAttribute('href', 'interview.html');
    
    // Test hover effects
    await startBuildingBtn.hover();
    const transform = await startBuildingBtn.evaluate(el => 
      window.getComputedStyle(el).transform
    );
    expect(transform).not.toBe('none');
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check navigation adapts
    const nav = page.locator('.welcome-nav');
    await expect(nav).toBeVisible();
    
    // Check value cards stack vertically (single column)
    const valueCard1 = page.locator('.value-card').first();
    const valueCard2 = page.locator('.value-card').nth(1);
    
    // Get positions of first two cards
    const card1Box = await valueCard1.boundingBox();
    const card2Box = await valueCard2.boundingBox();
    
    // Cards should be stacked vertically (card2 below card1)
    expect(card2Box.y).toBeGreaterThan(card1Box.y);
    expect(card1Box.x).toBeCloseTo(card2Box.x, 1); // Same x position (within 1px)
    
    // Check Einstein preview stacks
    const einsteinPreview = page.locator('.einstein-preview');
    const flexDirection = await einsteinPreview.evaluate(el => 
      window.getComputedStyle(el).flexDirection
    );
    expect(flexDirection).toBe('column');
    
    // Check CTA buttons adapt
    const ctaButtons = page.locator('.cta-buttons');
    const ctaFlexDirection = await ctaButtons.evaluate(el => 
      window.getComputedStyle(el).flexDirection
    );
    expect(ctaFlexDirection).toBe('column');
  });

  test('should preserve user data in localStorage', async ({ page }) => {
    // Navigate with user data
    await page.goto('http://localhost:8357/pages/alpha-welcome.html?name=Jane%20Smith&email=jane@example.com');
    
    // Check localStorage was set
    const userName = await page.evaluate(() => localStorage.getItem('userName'));
    const userEmail = await page.evaluate(() => localStorage.getItem('userEmail'));
    
    expect(userName).toBe('Jane Smith');
    expect(userEmail).toBe('jane@example.com');
    
    // Reload page without params and check persistence
    await page.goto('http://localhost:8357/pages/alpha-welcome.html');
    await expect(page.locator('#userName')).toContainText('Jane Smith');
    await expect(page.locator('#userAvatar')).toContainText('J');
  });

  test('should have proper console logging for interactions', async ({ page }) => {
    const consoleLogs = [];
    page.on('console', msg => {
      if (msg.type() === 'log') {
        consoleLogs.push(msg.text());
      }
    });
    
    // Click play video
    await page.locator('button:has-text("Watch Introduction")').click();
    expect(consoleLogs).toContain('Playing intro video');
    
    // Click skip video
    await page.locator('button:has-text("Skip Video")').click();
    expect(consoleLogs).toContain('Video skipped');
    
    // Click explore sample twin
    await page.locator('a:has-text("Explore Einstein\'s Memories")').click();
    expect(consoleLogs).toContain('Exploring Einstein sample twin');
  });
});