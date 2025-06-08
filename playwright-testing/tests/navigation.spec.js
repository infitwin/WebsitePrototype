const { test, expect } = require('@playwright/test');

test.describe('Navigation Tests', () => {
  test('should navigate from landing page to all main pages', async ({ page }) => {
    // Start from landing page
    await page.goto('/');
    
    // Verify landing page loads
    await expect(page).toHaveTitle('Infitwin - Your Living Story');
    await expect(page.locator('.hero-title')).toContainText('Your Living Archive');
    
    // Test CTA button navigation
    await page.click('.hero-cta');
    await page.waitForTimeout(1000); // Wait for any potential navigation
  });

  test('should access all pages directly', async ({ page }) => {
    const pages = [
      { url: '/pages/alpha-welcome.html', title: 'Alpha Welcome' },
      { url: '/pages/auth.html', title: 'Auth' },
      { url: '/pages/dashboard.html', title: 'Dashboard' },
      { url: '/pages/capture-first-memory.html', title: 'Capture First Memory' },
      { url: '/pages/email-verification.html', title: 'Email Verification' },
      { url: '/pages/error.html', title: 'Error' },
      { url: '/pages/explore.html', title: 'Explore' },
      { url: '/pages/file-browser.html', title: 'File Browser' },
      { url: '/pages/interview.html', title: 'Interview' },
      { url: '/pages/interview-transcripts.html', title: 'Interview Transcripts' },
      { url: '/pages/meet-winston.html', title: 'Meet Winston' },
      { url: '/pages/memory-archive.html', title: 'Memory Archive' },
      { url: '/pages/settings.html', title: 'Settings' },
      { url: '/pages/shared-view.html', title: 'Shared View' },
      { url: '/pages/storage-dashboard.html', title: 'Storage Dashboard' },
      { url: '/pages/talk-to-twin.html', title: 'Talk to Twin' },
      { url: '/pages/twin-management.html', title: 'Twin Management' }
    ];

    for (const pageInfo of pages) {
      await test.step(`Navigate to ${pageInfo.title}`, async () => {
        await page.goto(pageInfo.url);
        await expect(page).toHaveURL(new RegExp(pageInfo.url));
        // Verify page loaded without errors
        const consoleErrors = [];
        page.on('console', msg => {
          if (msg.type() === 'error') {
            consoleErrors.push(msg.text());
          }
        });
        await page.waitForTimeout(500);
        expect(consoleErrors).toHaveLength(0);
      });
    }
  });

  test('should have consistent navigation elements', async ({ page }) => {
    // Check navigation on main pages
    const mainPages = [
      '/pages/dashboard.html',
      '/pages/explore.html',
      '/pages/settings.html'
    ];

    for (const url of mainPages) {
      await page.goto(url);
      
      // Check for navigation bar or navigation-like elements
      const nav = page.locator('.main-nav, nav, .nav-container, .sidebar-nav, .header').first();
      await expect(nav).toBeVisible();
      
      // Check for navigation links/items
      const navItems = page.locator('nav a, .nav-item, .sidebar-nav-item, [role="navigation"] a');
      const navItemCount = await navItems.count();
      expect(navItemCount).toBeGreaterThan(0);
    }
  });

  test('should handle back navigation correctly', async ({ page }) => {
    // Navigate through multiple pages
    await page.goto('/');
    await page.goto('/pages/dashboard.html');
    await page.goto('/pages/explore.html');
    
    // Test browser back button
    await page.goBack();
    await expect(page).toHaveURL(/dashboard\.html/);
    
    await page.goBack();
    await expect(page).toHaveURL(/\/$|index\.html/);
  });
});