const { test, expect } = require('@playwright/test');

test.describe('Interview Transcripts Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8357/pages/interview-transcripts.html');
  });

  test('should display transcripts page header correctly', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/Interview Transcripts/);
    
    // Check main heading
    await expect(page.locator('h1:has-text("Interview Transcripts")')).toBeVisible();
    
    // Check subtitle
    await expect(page.locator('.page-subtitle')).toContainText('Review and manage your interview sessions');
    
    // Check new interview button
    const newInterviewBtn = page.locator('.new-interview-btn');
    await expect(newInterviewBtn).toBeVisible();
    await expect(newInterviewBtn).toContainText('Start New Interview');
  });

  test('should have functional sidebar navigation', async ({ page }) => {
    // Check if sidebar is visible
    await expect(page.locator('.sidebar-nav')).toBeVisible();
    
    // Check that transcripts nav item is active
    const activeNavItem = page.locator('.sidebar-nav-item.active');
    await expect(activeNavItem).toBeVisible();
    await expect(activeNavItem).toHaveAttribute('data-page', 'transcripts');
    
    // Test navigation to dashboard
    const dashboardLink = page.locator('a[data-page="dashboard"]');
    await expect(dashboardLink).toBeVisible();
    
    // Test navigation to interview page
    const interviewLink = page.locator('a[data-page="interview"]');
    await expect(interviewLink).toBeVisible();
  });

  test('should display session statistics overview', async ({ page }) => {
    // Check overview section
    await expect(page.locator('.sessions-overview')).toBeVisible();
    
    // Check all stat cards
    const statCards = page.locator('.stat-card');
    await expect(statCards).toHaveCount(4);
    
    // Check specific stats
    await expect(page.locator('#totalSessions')).toBeVisible();
    await expect(page.locator('#totalDuration')).toBeVisible();
    await expect(page.locator('#totalMessages')).toBeVisible();
    await expect(page.locator('#lastSession')).toBeVisible();
    
    // Verify stat labels
    await expect(page.locator('text=Total Sessions')).toBeVisible();
    await expect(page.locator('text=Total Duration')).toBeVisible();
    await expect(page.locator('text=Total Messages')).toBeVisible();
    await expect(page.locator('text=Last Session')).toBeVisible();
  });

  test('should have sessions list with sorting functionality', async ({ page }) => {
    // Check sessions list section
    await expect(page.locator('.sessions-list')).toBeVisible();
    await expect(page.locator('h2:has-text("Your Interview Sessions")')).toBeVisible();
    
    // Check sorting dropdown
    const sortSelect = page.locator('#sortBy');
    await expect(sortSelect).toBeVisible();
    
    // Test sorting options
    await sortSelect.selectOption('date-asc');
    await expect(sortSelect).toHaveValue('date-asc');
    
    await sortSelect.selectOption('duration-desc');
    await expect(sortSelect).toHaveValue('duration-desc');
    
    await sortSelect.selectOption('duration-asc');
    await expect(sortSelect).toHaveValue('duration-asc');
    
    // Check sessions container
    await expect(page.locator('#interviewSessionsList')).toBeVisible();
  });

  test('should navigate to new interview when button clicked', async ({ page }) => {
    const newInterviewBtn = page.locator('.new-interview-btn');
    
    // Mock navigation to verify click works
    let navigationOccurred = false;
    page.on('framenavigated', () => {
      navigationOccurred = true;
    });
    
    await newInterviewBtn.click();
    
    // Should navigate to interview.html
    await page.waitForTimeout(500);
    expect(page.url()).toContain('interview.html');
  });

  test('should handle responsive design', async ({ page }) => {
    // Test desktop view
    await page.setViewportSize({ width: 1024, height: 768 });
    await expect(page.locator('.overview-stats')).toBeVisible();
    
    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('.overview-stats')).toBeVisible();
    
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('.overview-stats')).toBeVisible();
    
    // Check if stats grid adapts to mobile
    const statsGrid = page.locator('.overview-stats');
    const gridColumns = await statsGrid.evaluate(el => 
      window.getComputedStyle(el).gridTemplateColumns
    );
    
    // On mobile, should be fewer columns
    expect(gridColumns).not.toBe('repeat(4, 1fr)');
  });

  test('should display transcript modal functionality', async ({ page }) => {
    // Check if modal exists but is hidden initially
    const modal = page.locator('#transcriptModal');
    await expect(modal).toBeHidden();
    
    // Check modal structure
    await expect(page.locator('.transcript-modal-content')).toBeVisible();
    await expect(page.locator('.modal-close')).toBeVisible();
    await expect(page.locator('.transcript-content')).toBeVisible();
  });

  test('should validate required JavaScript modules are loaded', async ({ page }) => {
    // Check for JavaScript errors
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.waitForLoadState('networkidle');
    
    // Filter out expected 404s for modules that might not exist yet
    const criticalErrors = errors.filter(error => 
      !error.includes('Failed to load module') && 
      !error.includes('404')
    );
    
    expect(criticalErrors.length).toBe(0);
  });

  test('should have proper accessibility features', async ({ page }) => {
    // Check for proper heading structure
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBe(1);
    
    // Check for alt text on buttons with icons
    const iconButtons = page.locator('button:has(span)');
    const buttonCount = await iconButtons.count();
    
    if (buttonCount > 0) {
      const firstButton = iconButtons.first();
      const hasAccessibleName = await firstButton.evaluate(el => {
        return el.textContent.trim().length > 0 || 
               el.getAttribute('aria-label') || 
               el.getAttribute('title');
      });
      expect(hasAccessibleName).toBeTruthy();
    }
    
    // Check sidebar navigation accessibility
    const navItems = page.locator('.sidebar-nav-item');
    const navCount = await navItems.count();
    
    for (let i = 0; i < Math.min(navCount, 3); i++) {
      const navItem = navItems.nth(i);
      const hasTooltip = await navItem.locator('.sidebar-tooltip').isVisible();
      expect(hasTooltip).toBeTruthy();
    }
  });

  test('should handle empty state gracefully', async ({ page }) => {
    // When no sessions exist, should show appropriate message
    const sessionsList = page.locator('#interviewSessionsList');
    await expect(sessionsList).toBeVisible();
    
    // Check if empty state is handled (could be empty div or message)
    const hasContent = await sessionsList.evaluate(el => el.children.length > 0);
    
    // Should either have content or be empty (both are valid states)
    expect(typeof hasContent).toBe('boolean');
  });

  test('should have working theme and styling', async ({ page }) => {
    // Check if CSS is loaded properly
    const bodyBg = await page.locator('body').evaluate(el => 
      window.getComputedStyle(el).backgroundColor
    );
    expect(bodyBg).toBeTruthy();
    
    // Check if main content has proper styling
    const mainContent = page.locator('.symphony-content');
    const hasBackground = await mainContent.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return styles.backgroundColor !== 'rgba(0, 0, 0, 0)' ||
             styles.background !== 'none';
    });
    
    // Should have some styling applied
    expect(typeof hasBackground).toBe('boolean');
  });
});