const { test, expect } = require('@playwright/test');

test('hunt for missing settings functionality', async ({ page }) => {
  await page.goto('http://localhost:8357/pages/settings.html');
  await page.waitForLoadState('networkidle');
  
  console.log('\n🔍 HUNTING FOR MISSING SETTINGS FUNCTIONALITY 🔍');
  
  // Take full page screenshot
  await page.screenshot({ path: 'hunt-settings-missing.png', fullPage: true });
  console.log('📸 Screenshot saved: hunt-settings-missing.png');
  
  // Hunt for commonly missing elements
  const missingElements = [
    { name: 'Preferences Section', selector: 'text=Preferences' },
    { name: 'Theme/Dark Mode Toggle', selector: 'text=Dark Mode' },
    { name: 'Language Settings', selector: 'text=Language' },
    { name: 'Data Export', selector: 'text=Export' },
    { name: 'Password Change', selector: 'input[name*="password"]' },
    { name: 'Profile Picture Upload', selector: 'input[type="file"]' },
    { name: 'Two-Factor Auth', selector: 'text=Two-Factor' },
    { name: 'API Keys', selector: 'text=API' },
    { name: 'Backup Settings', selector: 'text=Backup' },
    { name: 'Help/Support', selector: 'text=Help' }
  ];
  
  console.log('\n=== MISSING ELEMENTS HUNT ===');
  let foundMissing = [];
  
  for (const element of missingElements) {
    const found = await page.locator(element.selector).count() > 0;
    if (!found) {
      foundMissing.push(element.name);
      console.log(`❌ MISSING: ${element.name}`);
    } else {
      console.log(`✅ FOUND: ${element.name}`);
    }
  }
  
  // Hunt for UI/UX issues
  console.log('\n=== UI/UX ISSUES HUNT ===');
  
  const sections = await page.locator('.settings-section, [class*="section"]').count();
  console.log(`📋 Settings sections found: ${sections}`);
  
  const toggles = await page.locator('.toggle-switch').count();
  console.log(`🔄 Toggle switches found: ${toggles}`);
  
  const saveButtons = await page.locator('button:has-text("Save")').count();
  console.log(`💾 Save buttons found: ${saveButtons}`);
  
  // Check for navigation issues
  const navLinks = await page.locator('a[href], .nav-link').count();
  console.log(`🧭 Navigation links found: ${navLinks}`);
  
  // Look for form validation
  const requiredFields = await page.locator('[required], .required').count();
  console.log(`⚠️ Required fields found: ${requiredFields}`);
  
  console.log('\n=== SUMMARY ===');
  console.log(`Found ${foundMissing.length} missing elements:`);
  foundMissing.forEach(item => console.log(`  - ${item}`));
  
  if (foundMissing.length > 0) {
    console.log('\n🚨 Issues found that may make the page "look wrong"');
  } else {
    console.log('\n✅ All common elements found');
  }
  
  console.log('\n🔍 END HUNT 🔍\n');
});