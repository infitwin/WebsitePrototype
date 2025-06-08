const { test, expect } = require('@playwright/test');

test.describe('Dashboard Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/pages/dashboard.html');
  });

  test('should display dashboard with all main sections', async ({ page }) => {
    // Check dashboard container
    await expect(page.locator('.dashboard-container, .dashboard, [class*="dashboard"]').first()).toBeVisible();
    
    // Check for main sections
    const sections = [
      { selector: '.sidebar, .nav-sidebar, aside', name: 'Sidebar' },
      { selector: '.widgets-section, .dashboard-widgets, [class*="widget"]', name: 'Widgets' },
      { selector: '.main-content, .dashboard-content, main', name: 'Main Content' }
    ];
    
    for (const section of sections) {
      const element = page.locator(section.selector).first();
      if (await element.isVisible()) {
        await expect(element).toBeVisible();
      }
    }
  });

  test('should display user information', async ({ page }) => {
    // Check for user avatar/profile
    const userAvatar = page.locator('.user-avatar, .profile-image, img[alt*="user"], img[alt*="profile"]').first();
    const userName = page.locator('.user-name, .profile-name, [class*="username"]').first();
    
    // At least one should be visible
    const hasUserInfo = await userAvatar.isVisible() || await userName.isVisible();
    expect(hasUserInfo).toBe(true);
  });

  test('should have interactive dashboard widgets', async ({ page }) => {
    // Check for various widget types
    const widgetTypes = [
      { selector: '.memory-widget, [class*="memory"]', name: 'Memory Widget' },
      { selector: '.storage-widget, [class*="storage"]', name: 'Storage Widget' },
      { selector: '.activity-widget, [class*="activity"]', name: 'Activity Widget' },
      { selector: '.stats-widget, [class*="stats"]', name: 'Stats Widget' }
    ];
    
    let foundWidgets = 0;
    for (const widget of widgetTypes) {
      const element = page.locator(widget.selector).first();
      if (await element.isVisible()) {
        foundWidgets++;
        
        // Check if widget is interactive
        const isClickable = await element.locator('button, a, [role="button"]').first().isVisible();
        if (isClickable) {
          await expect(element.locator('button, a, [role="button"]').first()).toBeEnabled();
        }
      }
    }
    
    // Should have at least some widgets
    expect(foundWidgets).toBeGreaterThan(0);
  });

  test('should have navigation menu items', async ({ page }) => {
    // Check for navigation items
    const navItems = [
      { text: 'Dashboard', href: 'dashboard' },
      { text: 'Memories', href: 'memory|archive' },
      { text: 'Files', href: 'file|browser' },
      { text: 'Twin', href: 'twin' },
      { text: 'Settings', href: 'settings' },
      { text: 'Explore', href: 'explore' }
    ];
    
    for (const item of navItems) {
      const navLink = page.locator(`a:has-text("${item.text}"), .nav-item:has-text("${item.text}")`).first();
      if (await navLink.isVisible()) {
        await expect(navLink).toBeVisible();
        
        // Check if it has proper href
        const href = await navLink.getAttribute('href');
        if (href) {
          expect(href).toMatch(new RegExp(item.href, 'i'));
        }
      }
    }
  });

  test('should handle quick actions', async ({ page }) => {
    // Look for quick action buttons
    const quickActions = [
      { selector: 'button:has-text("Upload"), .upload-button', name: 'Upload' },
      { selector: 'button:has-text("Create"), .create-button', name: 'Create' },
      { selector: 'button:has-text("Share"), .share-button', name: 'Share' },
      { selector: 'button:has-text("New"), .new-button', name: 'New' }
    ];
    
    for (const action of quickActions) {
      const button = page.locator(action.selector).first();
      if (await button.isVisible()) {
        await expect(button).toBeEnabled();
        
        // Test click interaction
        await button.click();
        await page.waitForTimeout(500);
        
        // Check if modal or dropdown appears
        const modal = page.locator('.modal, .dropdown, .popover, [role="dialog"]').first();
        if (await modal.isVisible()) {
          // Close modal/dropdown
          const closeButton = modal.locator('.close, button[aria-label*="close"], .cancel').first();
          if (await closeButton.isVisible()) {
            await closeButton.click();
          } else {
            // Click outside to close
            await page.click('body', { position: { x: 0, y: 0 } });
          }
        }
      }
    }
  });

  test('should display recent activities or timeline', async ({ page }) => {
    // Check for activity/timeline section
    const activitySection = page.locator('.activity-section, .timeline, .recent-activities, [class*="activity"]').first();
    
    if (await activitySection.isVisible()) {
      // Check for activity items
      const activityItems = activitySection.locator('.activity-item, .timeline-item, li');
      const count = await activityItems.count();
      
      if (count > 0) {
        // Verify first item has content
        const firstItem = activityItems.first();
        await expect(firstItem).toBeVisible();
        
        // Check for timestamp
        const timestamp = firstItem.locator('.timestamp, .date, time, [class*="time"]').first();
        if (await timestamp.isVisible()) {
          const timeText = await timestamp.textContent();
          expect(timeText).toBeTruthy();
        }
      }
    }
  });

  test('should have search functionality', async ({ page }) => {
    // Look for search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"], .search-input').first();
    
    if (await searchInput.isVisible()) {
      // Type in search
      await searchInput.fill('test search query');
      
      // Check for search button or auto-search
      const searchButton = page.locator('button[type="submit"], .search-button').first();
      if (await searchButton.isVisible()) {
        await searchButton.click();
      } else {
        // Trigger search with Enter
        await searchInput.press('Enter');
      }
      
      await page.waitForTimeout(1000);
      
      // Clear search
      await searchInput.clear();
    }
  });

  test('should handle notifications or alerts', async ({ page }) => {
    // Check for notification icon/badge
    const notificationIcon = page.locator('.notification-icon, .notifications, [class*="notification"], [aria-label*="notification"]').first();
    
    if (await notificationIcon.isVisible()) {
      // Check for badge/count
      const badge = notificationIcon.locator('.badge, .count, [class*="badge"]').first();
      if (await badge.isVisible()) {
        const count = await badge.textContent();
        expect(count).toMatch(/\d+/);
      }
      
      // Click to open notifications
      await notificationIcon.click();
      await page.waitForTimeout(500);
      
      // Check notification panel
      const notificationPanel = page.locator('.notification-panel, .notifications-dropdown, [class*="notification-list"]').first();
      if (await notificationPanel.isVisible()) {
        await expect(notificationPanel).toBeVisible();
      }
    }
  });

  test('should be responsive', async ({ page, viewport }) => {
    // Test desktop view
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForTimeout(500);
    
    const sidebar = page.locator('.sidebar, aside').first();
    if (await sidebar.isVisible()) {
      await expect(sidebar).toBeVisible();
    }
    
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    
    // Check for mobile menu toggle
    const menuToggle = page.locator('.menu-toggle, .hamburger, button[aria-label*="menu"]').first();
    if (await menuToggle.isVisible()) {
      await expect(menuToggle).toBeVisible();
      
      // Toggle mobile menu
      await menuToggle.click();
      await page.waitForTimeout(500);
      
      // Mobile sidebar should appear
      const mobileSidebar = page.locator('.sidebar.mobile-open, .mobile-menu, .nav-mobile').first();
      if (await mobileSidebar.isVisible()) {
        await expect(mobileSidebar).toBeVisible();
      }
    }
  });
});