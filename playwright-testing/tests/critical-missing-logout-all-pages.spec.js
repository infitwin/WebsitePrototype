const { test, expect } = require('@playwright/test');

test.describe('Critical: Logout Functionality Missing Across Site', () => {
  // List of all main pages that should have logout functionality
  const pagesToTest = [
    { name: 'Dashboard', url: '/pages/dashboard.html' },
    { name: 'Twin Management', url: '/pages/twin-management.html' },
    { name: 'Explore', url: '/pages/explore.html' },
    { name: 'Interview', url: '/pages/interview.html' },
    { name: 'Curator', url: '/pages/curator.html' },
    { name: 'Transcripts', url: '/pages/interview-transcripts.html' },
    { name: 'Talk to Twin', url: '/pages/talk-to-twin.html' },
    { name: 'My Files', url: '/pages/my-files.html' },
    { name: 'Settings', url: '/pages/settings.html' }
  ];

  const logoutSelectors = [
    'text=Logout',
    'text=Sign out',
    'text=Sign Out',
    'button:has-text("Logout")',
    'button:has-text("Sign out")',
    'button:has-text("Sign Out")',
    '[aria-label="Logout"]',
    '[aria-label="Sign out"]',
    '.logout-button',
    '.sign-out-button',
    '#logoutBtn',
    '.user-menu >> text=Logout',
    '.user-menu >> text=Sign out'
  ];

  pagesToTest.forEach(({ name, url }) => {
    test(`${name} page should have logout functionality`, async ({ page }) => {
      // Navigate to the page
      await page.goto(`http://localhost:8357${url}`);
      await page.waitForLoadState('networkidle');
      
      // Check for any logout option
      let logoutFound = false;
      for (const selector of logoutSelectors) {
        try {
          const count = await page.locator(selector).count();
          if (count > 0) {
            logoutFound = true;
            break;
          }
        } catch (e) {
          // Continue checking other selectors
        }
      }
      
      // If no logout found, take screenshot for evidence
      if (!logoutFound) {
        await page.screenshot({ 
          path: `playwright-testing/screenshots/no-logout-${name.toLowerCase().replace(/\s+/g, '-')}.png`,
          fullPage: true 
        });
      }
      
      // Report result
      if (!logoutFound) {
        console.log(`❌ ${name}: NO LOGOUT FUNCTIONALITY FOUND`);
      } else {
        console.log(`✅ ${name}: Logout functionality present`);
      }
      
      expect(logoutFound).toBeTruthy();
    });
  });

  test('summary: count pages with missing logout', async ({ page }) => {
    const results = [];
    let missingCount = 0;
    
    for (const { name, url } of pagesToTest) {
      await page.goto(`http://localhost:8357${url}`);
      await page.waitForLoadState('networkidle');
      
      let logoutFound = false;
      for (const selector of logoutSelectors) {
        try {
          const count = await page.locator(selector).count();
          if (count > 0) {
            logoutFound = true;
            break;
          }
        } catch (e) {
          // Continue
        }
      }
      
      results.push({ page: name, hasLogout: logoutFound });
      if (!logoutFound) missingCount++;
    }
    
    // Generate summary report
    console.log('\n=== LOGOUT FUNCTIONALITY AUDIT SUMMARY ===');
    console.log(`Total pages tested: ${pagesToTest.length}`);
    console.log(`Pages WITH logout: ${pagesToTest.length - missingCount}`);
    console.log(`Pages WITHOUT logout: ${missingCount}`);
    console.log('\nDetailed Results:');
    results.forEach(({ page, hasLogout }) => {
      console.log(`  ${hasLogout ? '✅' : '❌'} ${page}`);
    });
    console.log('\nCRITICAL: This is a security issue - users cannot end their sessions!');
    console.log('==========================================\n');
    
    // This test passes to show the summary, but logs the critical issue
    expect(true).toBeTruthy();
  });
});