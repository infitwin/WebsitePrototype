const { test, expect } = require('@playwright/test');

test.describe('Dashboard Sidebar Logout Button', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.addInitScript(() => {
      localStorage.setItem('userEmail', 'test@example.com');
      localStorage.setItem('userName', 'Test User');
      localStorage.setItem('isAuthenticated', 'true');
    });
    
    await page.goto('http://localhost:8357/pages/dashboard.html');
    await page.waitForLoadState('networkidle');
  });

  test('should have logout button at bottom of sidebar', async ({ page }) => {
    // Check for logout button in various possible locations
    const possibleSelectors = [
      // Bottom of sidebar
      '.sidebar-nav a:last-child:has-text("Logout")',
      '.sidebar-nav a:last-child:has-text("Sign out")',
      '.sidebar-nav button:has-text("Logout")',
      '.sidebar-nav button:has-text("Sign out")',
      '.sidebar-nav .logout-button',
      '.sidebar-nav [data-page="logout"]',
      '.sidebar-nav-item:has-text("Logout")',
      '.sidebar-nav-item:has-text("Sign out")',
      // With icon
      '.sidebar-nav a:last-child span:has-text("🚪")',
      '.sidebar-nav a:last-child span:has-text("↩")',
      '.sidebar-nav a:last-child span:has-text("⎋")',
      '.sidebar-nav a:last-child span:has-text("🔚")',
      // Aria labels
      '[aria-label="Logout"]',
      '[aria-label="Sign out"]',
      '[aria-label="Log out"]'
    ];

    let logoutFound = false;
    let foundElement = null;
    
    for (const selector of possibleSelectors) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        logoutFound = true;
        foundElement = selector;
        break;
      }
    }

    if (!logoutFound) {
      // Take screenshot showing missing logout
      await page.screenshot({ 
        path: 'playwright-testing/screenshots/missing-logout-sidebar-dashboard.png',
        fullPage: true 
      });
      
      // Also check what IS at the bottom of the sidebar
      const lastNavItem = await page.locator('.sidebar-nav a:last-child').textContent();
      console.log('Last navigation item found:', lastNavItem);
      
      // Count total nav items
      const navItemCount = await page.locator('.sidebar-nav a').count();
      console.log('Total navigation items:', navItemCount);
    }

    expect(logoutFound).toBeTruthy();
  });

  test('logout button should be visually distinct at bottom', async ({ page }) => {
    // First check if logout exists
    const logoutButton = page.locator('.sidebar-nav a:has-text("Logout"), .sidebar-nav a:has-text("Sign out")').first();
    const exists = await logoutButton.count() > 0;
    
    if (!exists) {
      test.skip('Logout button does not exist');
      return;
    }

    // Check it's at the bottom with spacing
    const boundingBox = await logoutButton.boundingBox();
    const settingsButton = page.locator('.sidebar-nav a:has-text("Settings")').first();
    const settingsBox = await settingsButton.boundingBox();
    
    // Should have some spacing between settings and logout
    expect(boundingBox.y).toBeGreaterThan(settingsBox.y + settingsBox.height + 10);
  });

  test('should navigate to correct pages when clicking sidebar items', async ({ page }) => {
    // This test verifies all current navigation works
    const navItems = [
      { icon: '🏠', page: 'dashboard', expectedUrl: 'dashboard.html' },
      { icon: '👥', page: 'twin', expectedUrl: 'twin-management.html' },
      { icon: '🎤', page: 'interview', expectedUrl: 'interview.html' },
      { icon: '🎨', page: 'curator', expectedUrl: 'curator.html' },
      { icon: '📝', page: 'transcripts', expectedUrl: 'interview-transcripts.html' },
      { icon: '💬', page: 'talk', expectedUrl: 'talk-to-twin.html' },
      { icon: '📁', page: 'files', expectedUrl: 'file-browser.html' },
      { icon: '⚙️', page: 'settings', expectedUrl: 'settings.html' }
    ];

    for (const item of navItems) {
      const navLink = page.locator(`[data-page="${item.page}"]`);
      const exists = await navLink.count() > 0;
      
      if (exists) {
        const href = await navLink.getAttribute('href');
        expect(href).toContain(item.expectedUrl);
      } else {
        console.log(`Missing navigation item: ${item.page}`);
      }
    }
  });

  test('sidebar should show all required navigation items', async ({ page }) => {
    const requiredItems = [
      'Dashboard',
      'Twin Management', 
      'Explore',
      'Interview',
      'Curator',
      'Transcripts',
      'Talk to Twin',
      'My Files',
      'Settings',
      'Logout' // Should be at the bottom
    ];

    const missingItems = [];
    
    for (const item of requiredItems) {
      const found = await page.locator(`.sidebar-nav`).getByText(item, { exact: false }).count() > 0;
      if (!found) {
        missingItems.push(item);
      }
    }

    if (missingItems.length > 0) {
      console.log('Missing navigation items:', missingItems);
      await page.screenshot({ 
        path: `playwright-testing/screenshots/sidebar-missing-${missingItems.join('-').toLowerCase()}.png`,
        fullPage: true 
      });
    }

    expect(missingItems).toHaveLength(0);
  });
});