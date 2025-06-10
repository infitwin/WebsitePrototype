import { test, expect } from '@playwright/test';

// Helper function for login
async function loginUser(page) {
  await page.goto('http://localhost:8357/pages/auth.html');
  await page.click('[data-tab="login"]');
  await page.fill('.login-email', 'weezer@yev.com');
  await page.fill('.login-password', '123456');
  await page.click('button:has-text("Access Your Memories")');
  await page.waitForURL('**/dashboard.html');
}

test.describe('Navigation Active State Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await loginUser(page);
  });

  const pageTests = [
    { url: '/pages/dashboard.html', expectedActive: 'dashboard', pageName: 'Dashboard' },
    { url: '/pages/twin-management.html', expectedActive: 'twin', pageName: 'Twin Management' },
    { url: '/pages/interview.html', expectedActive: 'interview', pageName: 'Interview' },
    { url: '/pages/curator.html', expectedActive: 'curator', pageName: 'Curator' },
    { url: '/pages/interview-transcripts.html', expectedActive: 'transcripts', pageName: 'Transcripts' },
    { url: '/pages/talk-to-twin.html', expectedActive: 'talk', pageName: 'Talk to Twin' },
    { url: '/pages/my-files.html', expectedActive: 'files', pageName: 'My Files' },
    { url: '/pages/settings.html', expectedActive: 'settings', pageName: 'Settings' }
  ];

  pageTests.forEach(({ url, expectedActive, pageName }) => {
    test(`should highlight ${pageName} navigation item when on ${pageName} page`, async ({ page }) => {
      // Navigate to the page
      await page.goto(`http://localhost:8357${url}`);
      
      // Wait for navigation to load
      await page.waitForSelector('.sidebar-nav', { timeout: 5000 });
      
      // Check that the correct item is active
      const activeItem = await page.locator('.sidebar-nav-item.active');
      const activeCount = await activeItem.count();
      
      if (activeCount === 0) {
        // Take screenshot if no active item found
        await page.screenshot({ 
          path: `navigation-no-active-${pageName.toLowerCase().replace(/\s+/g, '-')}.png`,
          fullPage: true 
        });
      }
      
      // Verify exactly one active item exists
      expect(activeCount).toBe(1);
      
      // Verify it's the correct item
      const activeDataPage = await activeItem.getAttribute('data-page');
      expect(activeDataPage).toBe(expectedActive);
      
      // Verify no other items are active
      const allNavItems = await page.locator('.sidebar-nav-item').all();
      for (const item of allNavItems) {
        const dataPage = await item.getAttribute('data-page');
        const hasActiveClass = await item.evaluate(el => el.classList.contains('active'));
        
        if (dataPage === expectedActive) {
          expect(hasActiveClass).toBe(true);
        } else {
          expect(hasActiveClass).toBe(false);
        }
      }
    });
  });

  test('should NOT highlight Explore navigation item (page missing)', async ({ page }) => {
    // Check if explore.html exists
    const response = await page.goto('http://localhost:8357/pages/explore.html', { waitUntil: 'domcontentloaded' });
    
    if (response && response.status() === 404) {
      // This is expected - explore.html doesn't exist
      console.log('✅ Confirmed: explore.html does not exist (404)');
      
      // Go back to dashboard to check the navigation still renders correctly
      await page.goto('http://localhost:8357/pages/dashboard.html');
      await page.waitForSelector('.sidebar-nav');
      
      // Verify the Explore link exists in navigation even though page is missing
      const exploreLink = await page.locator('[data-page="explore"]');
      const exploreExists = await exploreLink.count() > 0;
      expect(exploreExists).toBe(true);
      
      // Take screenshot showing the broken link
      await page.screenshot({ 
        path: 'navigation-missing-explore-page.png',
        fullPage: true 
      });
    }
  });

  test('should handle pages not in pageMap correctly', async ({ page }) => {
    // Test pages that exist but aren't in the pageMap
    const unmappedPages = [
      { url: '/pages/alpha-welcome.html', pageName: 'Alpha Welcome' },
      { url: '/pages/capture-first-memory.html', pageName: 'Capture First Memory' },
      { url: '/pages/meet-winston.html', pageName: 'Meet Winston' },
      { url: '/pages/shared-view.html', pageName: 'Shared View' },
      { url: '/pages/email-verification.html', pageName: 'Email Verification' },
      { url: '/pages/error.html', pageName: 'Error' }
    ];

    for (const { url, pageName } of unmappedPages) {
      await page.goto(`http://localhost:8357${url}`);
      
      // Check if navigation loads
      const navExists = await page.locator('.sidebar-nav').count() > 0;
      
      if (navExists) {
        // If navigation exists, check what's active (should default to dashboard)
        const activeItem = await page.locator('.sidebar-nav-item.active');
        const activeCount = await activeItem.count();
        
        if (activeCount > 0) {
          const activeDataPage = await activeItem.getAttribute('data-page');
          // According to the code, unmapped pages should default to 'dashboard'
          expect(activeDataPage).toBe('dashboard');
        }
        
        await page.screenshot({ 
          path: `navigation-unmapped-${pageName.toLowerCase().replace(/\s+/g, '-')}.png`,
          fullPage: true 
        });
      }
    }
  });
});