const { test } = require('@playwright/test');

test('Audit Talk to Twin page', async ({ page }) => {
  // Navigate to the page
  await page.goto('http://localhost:8357/pages/talk-to-twin.html');
  
  // Wait for page to load
  await page.waitForLoadState('networkidle');
  
  // Take full page screenshot
  await page.screenshot({ 
    path: 'audit-talk-to-twin.png', 
    fullPage: true 
  });
  
  // Check for auth elements
  const authSelectors = [
    'text=Logout',
    'text=Sign out',
    'text=Sign Out',
    'text=Log out',
    'text=Log Out',
    '.user-menu',
    '.user-profile',
    '.user-avatar',
    '[data-testid="user-menu"]',
    '[aria-label="User menu"]',
    '[aria-label="Logout"]',
    'button:has-text("Logout")',
    'a:has-text("Logout")'
  ];
  
  console.log('\n=== AUTH ELEMENTS CHECK ===');
  for (const selector of authSelectors) {
    const count = await page.locator(selector).count();
    if (count > 0) {
      console.log(`✓ Found: ${selector} (${count} instances)`);
    } else {
      console.log(`✗ Missing: ${selector}`);
    }
  }
  
  // Check navigation items
  console.log('\n=== NAVIGATION CHECK ===');
  const expectedNavItems = [
    'Dashboard',
    'Twin Management', 
    'Explore',
    'Interview',
    'Curator',
    'Transcripts',
    'Talk to Twin',
    'My Files',
    'Settings'
  ];
  
  for (const item of expectedNavItems) {
    const found = await page.locator(`a:has-text("${item}"), button:has-text("${item}")`).count() > 0;
    if (found) {
      console.log(`✓ Nav item found: ${item}`);
    } else {
      console.log(`✗ Nav item missing: ${item}`);
    }
  }
  
  // Check for user profile/settings access
  console.log('\n=== USER PROFILE/SETTINGS ACCESS ===');
  const profileSelectors = [
    'a[href*="profile"]',
    'a[href*="settings"]',
    'button:has-text("Profile")',
    'button:has-text("Settings")',
    '.profile-link',
    '.settings-link'
  ];
  
  for (const selector of profileSelectors) {
    const count = await page.locator(selector).count();
    if (count > 0) {
      console.log(`✓ Found: ${selector}`);
    } else {
      console.log(`✗ Missing: ${selector}`);
    }
  }
  
  // Check for critical features specific to Talk to Twin
  console.log('\n=== TALK TO TWIN FEATURES ===');
  const twinFeatures = [
    '.chat-input, .message-input, textarea[placeholder*="message"], textarea[placeholder*="ask"]',
    '.send-button, button:has-text("Send")',
    '.chat-messages, .conversation-area, .messages-container',
    '.twin-selector, .twin-dropdown, select'
  ];
  
  for (const feature of twinFeatures) {
    const count = await page.locator(feature).count();
    if (count > 0) {
      console.log(`✓ Feature found: ${feature}`);
    } else {
      console.log(`✗ Feature missing: ${feature}`);
    }
  }
  
  // Check for hidden elements
  console.log('\n=== HIDDEN ELEMENTS CHECK ===');
  const hiddenAuth = await page.$$eval('*', elements => {
    const authKeywords = ['logout', 'sign out', 'profile', 'user menu', 'account'];
    const hidden = [];
    
    elements.forEach(el => {
      const text = (el.textContent || '').toLowerCase();
      const hasAuthKeyword = authKeywords.some(keyword => text.includes(keyword));
      
      if (hasAuthKeyword) {
        const styles = window.getComputedStyle(el);
        if (styles.display === 'none' || styles.visibility === 'hidden') {
          hidden.push({
            text: el.textContent?.trim().substring(0, 50),
            tag: el.tagName,
            display: styles.display,
            visibility: styles.visibility
          });
        }
      }
    });
    
    return hidden;
  });
  
  if (hiddenAuth.length > 0) {
    console.log('Hidden auth-related elements found:');
    hiddenAuth.forEach(el => {
      console.log(`  - ${el.tag}: "${el.text}" (display: ${el.display}, visibility: ${el.visibility})`);
    });
  }
  
  console.log('\nScreenshot saved as audit-talk-to-twin.png');
});