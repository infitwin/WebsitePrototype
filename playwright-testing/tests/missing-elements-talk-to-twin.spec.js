const { test, expect } = require('@playwright/test');

test.describe('Required Elements - Talk to Twin Page', () => {
  const requiredAuthElements = [
    { name: 'Logout Button', selectors: [
      'text=Logout', 
      'text=Sign out', 
      'text=Sign Out', 
      '[aria-label="Logout"]', 
      'button:has-text("Logout")',
      '.logout-button'
    ]},
    { name: 'User Menu', selectors: [
      '.user-menu', 
      '[data-testid="user-menu"]', 
      '.user-dropdown',
      '.user-profile',
      '.user-avatar'
    ]}
  ];

  const requiredNavigationElements = [
    { name: 'Explore Link', selectors: [
      'text=Explore', 
      'a[href*="explore"]', 
      '[data-page="explore"]',
      '.sidebar-nav-item >> text=Explore'
    ]}
  ];

  const requiredChatElements = [
    { name: 'Send Button', selectors: [
      'button:has-text("Send")',
      'button[type="submit"]',
      '.send-button',
      '[aria-label="Send message"]',
      '.message-submit'
    ]},
    { name: 'Twin Selector', selectors: [
      'select#twinSelector',
      '.twin-selector',
      '.twin-dropdown',
      '[data-testid="twin-selector"]'
    ]}
  ];

  test.beforeEach(async ({ page }) => {
    // Navigate to talk to twin page
    await page.goto('http://localhost:8357/pages/talk-to-twin.html');
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
  });

  test.describe('Authentication UI', () => {
    requiredAuthElements.forEach(({ name, selectors }) => {
      test(`should have ${name}`, async ({ page }) => {
        let found = false;
        for (const selector of selectors) {
          const count = await page.locator(selector).count();
          if (count > 0) {
            found = true;
            break;
          }
        }
        
        if (!found) {
          const filename = `missing-${name.toLowerCase().replace(/\s+/g, '-')}-talk-to-twin.png`;
          await page.screenshot({ 
            path: `playwright-testing/screenshots/${filename}`, 
            fullPage: true 
          });
        }
        
        expect(found).toBeTruthy();
      });
    });
  });

  test.describe('Navigation Completeness', () => {
    requiredNavigationElements.forEach(({ name, selectors }) => {
      test(`should have ${name}`, async ({ page }) => {
        let found = false;
        for (const selector of selectors) {
          const count = await page.locator(selector).count();
          if (count > 0) {
            found = true;
            break;
          }
        }
        
        if (!found) {
          const filename = `missing-${name.toLowerCase().replace(/\s+/g, '-')}-talk-to-twin.png`;
          await page.screenshot({ 
            path: `playwright-testing/screenshots/${filename}`, 
            fullPage: true 
          });
        }
        
        expect(found).toBeTruthy();
      });
    });
  });

  test.describe('Chat Interface Elements', () => {
    requiredChatElements.forEach(({ name, selectors }) => {
      test(`should have ${name}`, async ({ page }) => {
        let found = false;
        for (const selector of selectors) {
          const count = await page.locator(selector).count();
          if (count > 0) {
            found = true;
            break;
          }
        }
        
        if (!found) {
          const filename = `missing-${name.toLowerCase().replace(/\s+/g, '-')}-talk-to-twin.png`;
          await page.screenshot({ 
            path: `playwright-testing/screenshots/${filename}`, 
            fullPage: true 
          });
        }
        
        expect(found).toBeTruthy();
      });
    });
  });

  test('should have complete navigation sidebar', async ({ page }) => {
    const requiredNavItems = [
      'Dashboard',
      'Twin Management',
      'Explore', // Currently missing
      'Interview',
      'Curator',
      'Transcripts',
      'Talk to Twin',
      'My Files',
      'Settings'
    ];

    for (const item of requiredNavItems) {
      const tooltip = await page.locator(`.sidebar-tooltip >> text=${item}`).count();
      const visible = await page.locator(`.sidebar-nav-item >> text=${item}`).count();
      
      const found = tooltip > 0 || visible > 0;
      if (!found) {
        console.log(`Missing navigation item: ${item}`);
      }
      expect(found).toBeTruthy();
    }
  });

  test('chat interface should be functional', async ({ page }) => {
    // Check if message input exists
    const messageInput = await page.locator('#messageInput, .message-input, textarea[placeholder*="message"]').count();
    expect(messageInput).toBeGreaterThan(0);
    
    // Check if chat display area exists
    const chatDisplay = await page.locator('.chat-messages, .message-list, #chatDisplay').count();
    expect(chatDisplay).toBeGreaterThan(0);
  });
});