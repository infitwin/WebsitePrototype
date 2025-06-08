const { test, expect } = require('@playwright/test');

test.describe('Twin Features', () => {
  test.beforeEach(async ({ page }) => {
    // Start from a random page - AI Twin chat interface
    await page.goto('http://localhost:8357/pages/talk-to-twin.html');
  });

  test('should display twin chat interface', async ({ page }) => {
    // Check main components
    await expect(page.locator('.chat-container, .symphony-content').first()).toBeVisible();
    
    // Check for chat header
    const header = page.locator('.twin-header, h1:has-text("Talk to"), h2:has-text("Twin")').first();
    await expect(header).toBeVisible();
    
    // Check for message area
    const messageArea = page.locator('.chat-messages, #chatMessages').first();
    await expect(messageArea).toBeVisible();
    
    // Check for input area
    const inputArea = page.locator('.chat-input, #chatInput').first();
    await expect(inputArea).toBeVisible();
    
    // Check for send button
    const sendButton = page.locator('.send-btn, #sendBtn').first();
    await expect(sendButton).toBeVisible();
  });

  test('should handle message sending', async ({ page }) => {
    // Find input field
    const input = page.locator('#chatInput').first();
    await input.fill('Hello, Twin!');
    
    // Send message
    const sendButton = page.locator('#sendBtn').first();
    await sendButton.click();
    
    // Wait for potential response
    await page.waitForTimeout(1000);
    
    // Check if message appears in chat
    const messages = page.locator('.message');
    const messageCount = await messages.count();
    expect(messageCount).toBeGreaterThan(0);
  });

  test('should navigate to Meet Winston page', async ({ page }) => {
    await page.goto('http://localhost:8357/pages/meet-winston.html');
    
    // Check Winston introduction elements
    const winstonIntro = page.locator('h1:has-text("Winston"), h2:has-text("Winston"), .winston-intro').first();
    await expect(winstonIntro).toBeVisible();
    
    // Check for description or welcome text
    const description = page.locator('p, .description, .intro-text').first();
    await expect(description).toBeVisible();
    
    // Check for CTA buttons
    const ctaButtons = page.locator('button, a.button, .cta');
    const buttonCount = await ctaButtons.count();
    expect(buttonCount).toBeGreaterThan(0);
  });

  test('should display twin management interface', async ({ page }) => {
    await page.goto('http://localhost:8357/pages/twin-management.html');
    
    // Check page header
    const header = page.locator('h1, h2, .page-header').first();
    await expect(header).toBeVisible();
    
    // Check for configuration sections
    const configSections = page.locator('.config-section, .settings-section, .management-section, section');
    const sectionCount = await configSections.count();
    expect(sectionCount).toBeGreaterThan(0);
    
    // Check for form elements
    const formElements = page.locator('input, select, textarea, button');
    const elementCount = await formElements.count();
    expect(elementCount).toBeGreaterThan(0);
  });

  test('should have twin avatar or representation', async ({ page }) => {
    await page.goto('http://localhost:8357/pages/talk-to-twin.html');
    
    // Check for avatar/image
    const avatar = page.locator('img[alt*="twin"], img[alt*="avatar"], .twin-avatar, .avatar').first();
    const hasAvatar = await avatar.isVisible().catch(() => false);
    
    // Check for visual representation (could be icon or placeholder)
    const visualRep = page.locator('.twin-icon, .avatar-placeholder, [class*="avatar"]').first();
    const hasVisualRep = await visualRep.isVisible().catch(() => false);
    
    expect(hasAvatar || hasVisualRep).toBeTruthy();
  });

  test('should have twin avatar and mode switcher', async ({ page }) => {
    await page.goto('http://localhost:8357/pages/talk-to-twin.html');
    
    // Check for twin avatar
    const avatar = page.locator('.twin-avatar').first();
    await expect(avatar).toBeVisible();
    
    // Check for mode switcher
    const modeSwitcher = page.locator('.mode-switcher, .mode-btn').first();
    await expect(modeSwitcher).toBeVisible();
  });
});