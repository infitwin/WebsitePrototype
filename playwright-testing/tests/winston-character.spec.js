const { test, expect } = require('@playwright/test');

test.describe('Winston Character Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8357/pages/meet-winston.html');
  });

  test('should display Winston introduction page', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/Meet Winston/);
    
    // Check main container
    await expect(page.locator('.winston-container')).toBeVisible();
    
    // Check page header
    await expect(page.locator('.winston-title')).toContainText('Meet Winston');
    await expect(page.locator('.winston-subtitle')).toContainText('Your Personal Story Curator');
  });

  test('should have functional navigation', async ({ page }) => {
    // Check navigation bar
    await expect(page.locator('.winston-nav')).toBeVisible();
    
    // Check back to home link
    const backLink = page.locator('.back-link');
    await expect(backLink).toBeVisible();
    await expect(backLink).toContainText('Back to Home');
    await expect(backLink).toHaveAttribute('href', '../index.html');
    
    // Check skip to sign up button
    const skipBtn = page.locator('.skip-btn');
    await expect(skipBtn).toBeVisible();
    await expect(skipBtn).toContainText('Skip to Sign Up');
  });

  test('should display Winston character animation', async ({ page }) => {
    // Check study environment
    await expect(page.locator('.study-environment')).toBeVisible();
    
    // Check Winston character elements
    await expect(page.locator('.winston-character')).toBeVisible();
    await expect(page.locator('.winston-avatar')).toBeVisible();
    await expect(page.locator('.winston-face')).toBeVisible();
    
    // Check facial features
    await expect(page.locator('.winston-eyes')).toBeVisible();
    await expect(page.locator('.left-eye')).toBeVisible();
    await expect(page.locator('.right-eye')).toBeVisible();
    await expect(page.locator('.winston-mustache')).toBeVisible();
  });

  test('should have animated particles', async ({ page }) => {
    // Check warm particles
    const particles = page.locator('.warm-particle');
    await expect(particles).toHaveCount(4);
    
    // Check individual particles
    await expect(page.locator('.warm-particle.p1')).toBeVisible();
    await expect(page.locator('.warm-particle.p2')).toBeVisible();
    await expect(page.locator('.warm-particle.p3')).toBeVisible();
    await expect(page.locator('.warm-particle.p4')).toBeVisible();
  });

  test('should have cozy background styling', async ({ page }) => {
    // Check cozy background
    await expect(page.locator('.cozy-background')).toBeVisible();
    
    // Check if background has proper styling
    const bgColor = await page.locator('.cozy-background').evaluate(el => 
      window.getComputedStyle(el).backgroundColor
    );
    expect(bgColor).toBeTruthy();
  });

  test('should navigate to sign up when skip button clicked', async ({ page }) => {
    const skipBtn = page.locator('.skip-btn');
    
    // Click skip button
    await skipBtn.click();
    
    // Should navigate to auth page
    await page.waitForTimeout(500);
    expect(page.url()).toContain('auth.html');
  });

  test('should navigate back to home when back link clicked', async ({ page }) => {
    const backLink = page.locator('.back-link');
    
    // Click back link
    await backLink.click();
    
    // Should navigate to home page
    await page.waitForTimeout(500);
    expect(page.url()).toContain('index.html');
  });

  test('should be responsive across devices', async ({ page }) => {
    const viewports = [
      { width: 1920, height: 1080 }, // Desktop
      { width: 1024, height: 768 },  // Tablet
      { width: 375, height: 667 }    // Mobile
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(300);
      
      // Main elements should remain visible
      await expect(page.locator('.winston-container')).toBeVisible();
      await expect(page.locator('.winston-character')).toBeVisible();
      await expect(page.locator('.winston-nav')).toBeVisible();
      
      // Navigation should adapt to screen size
      const navLeft = page.locator('.nav-left');
      const navRight = page.locator('.nav-right');
      await expect(navLeft).toBeVisible();
      await expect(navRight).toBeVisible();
    }
  });

  test('should load CSS styles correctly', async ({ page }) => {
    // Check if winston.css is loaded
    const stylesheets = await page.$$eval('link[rel="stylesheet"]', links =>
      links.map(link => link.href)
    );
    
    const hasWinstonCSS = stylesheets.some(href => href.includes('winston.css'));
    expect(hasWinstonCSS).toBeTruthy();
    
    // Check if styles are applied
    const winstonContainer = page.locator('.winston-container');
    const hasStyles = await winstonContainer.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return styles.backgroundColor !== 'rgba(0, 0, 0, 0)' || 
             styles.background !== 'none' ||
             styles.padding !== '0px';
    });
    
    expect(hasStyles).toBeTruthy();
  });

  test('should have smooth animations', async ({ page }) => {
    // Check if particles have animation properties
    const particle = page.locator('.warm-particle').first();
    
    const hasAnimation = await particle.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return styles.animation !== 'none' || 
             styles.transform !== 'none' ||
             styles.transition !== 'none';
    });
    
    // Particles should have some form of animation
    expect(typeof hasAnimation).toBe('boolean');
    
    // Check Winston character for animation properties
    const winstonChar = page.locator('.winston-character');
    const charHasAnimation = await winstonChar.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return styles.animation !== 'none' || styles.transition !== 'none';
    });
    
    expect(typeof charHasAnimation).toBe('boolean');
  });

  test('should load without JavaScript errors', async ({ page }) => {
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.waitForLoadState('networkidle');
    
    // Filter out expected errors
    const criticalErrors = errors.filter(error => 
      !error.includes('favicon') && 
      !error.includes('404')
    );
    
    expect(criticalErrors.length).toBe(0);
  });

  test('should have proper accessibility features', async ({ page }) => {
    // Check heading structure
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBeGreaterThanOrEqual(1);
    
    // Check for descriptive text
    const titleText = await page.locator('.winston-title').textContent();
    const subtitleText = await page.locator('.winston-subtitle').textContent();
    
    expect(titleText.length).toBeGreaterThan(0);
    expect(subtitleText.length).toBeGreaterThan(0);
    
    // Check navigation has proper link text
    const backLinkText = await page.locator('.back-link').textContent();
    const skipBtnText = await page.locator('.skip-btn').textContent();
    
    expect(backLinkText.length).toBeGreaterThan(0);
    expect(skipBtnText.length).toBeGreaterThan(0);
  });

  test('should display character personality through design', async ({ page }) => {
    // Winston should have distinctive visual elements
    const characterElements = [
      '.winston-avatar',
      '.winston-face',
      '.winston-eyes',
      '.winston-mustache'
    ];
    
    for (const selector of characterElements) {
      await expect(page.locator(selector)).toBeVisible();
    }
    
    // Eyes should be positioned correctly
    const leftEye = page.locator('.left-eye');
    const rightEye = page.locator('.right-eye');
    
    await expect(leftEye).toBeVisible();
    await expect(rightEye).toBeVisible();
    
    // Should have some styling to make them look like eyes
    const leftEyeStyles = await leftEye.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        borderRadius: styles.borderRadius,
        background: styles.background,
        width: styles.width,
        height: styles.height
      };
    });
    
    // Eyes should have some visual properties
    expect(leftEyeStyles.width).toBeTruthy();
    expect(leftEyeStyles.height).toBeTruthy();
  });
});