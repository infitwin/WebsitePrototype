const { test, expect } = require('@playwright/test');

test('audit settings page visual and functional elements', async ({ page }) => {
  await page.goto('http://localhost:8357/pages/settings.html');
  await page.waitForLoadState('networkidle');
  
  // Take full page screenshot
  await page.screenshot({ path: 'audit-settings.png', fullPage: true });
  
  // Check for expected sections based on existing tests
  const expectedSections = [
    'Profile',
    'Account Settings', 
    'Notifications',
    'Privacy',
    'Security'
  ];
  
  console.log('\n=== SETTINGS PAGE AUDIT ===');
  
  for (const section of expectedSections) {
    const found = await page.locator(`text=${section}`).count() > 0;
    console.log(`${found ? '✅' : '❌'} ${section} section: ${found ? 'FOUND' : 'MISSING'}`);
  }
  
  // Check for navigation elements
  const navigationElements = [
    'Logout',
    'Dashboard',
    'Twin Management',
    'Explore',
    'Interview',
    'Curator',
    'Transcripts',
    'Talk to Twin',
    'My Files'
  ];
  
  console.log('\n=== NAVIGATION AUDIT ===');
  for (const nav of navigationElements) {
    const found = await page.locator(`text=${nav}`).count() > 0;
    console.log(`${found ? '✅' : '❌'} ${nav} link: ${found ? 'FOUND' : 'MISSING'}`);
  }
  
  // Check for form elements and buttons
  const formElements = [
    'input[type="email"]',
    'input[type="text"]', 
    'button:has-text("Save")',
    'button:has-text("Cancel")',
    '.toggle-switch'
  ];
  
  console.log('\n=== FORM ELEMENTS AUDIT ===');
  for (const element of formElements) {
    const count = await page.locator(element).count();
    console.log(`${count > 0 ? '✅' : '❌'} ${element}: ${count} found`);
  }
  
  console.log('\n📸 Full page screenshot saved as audit-settings.png');
  console.log('=== END AUDIT ===\n');
});