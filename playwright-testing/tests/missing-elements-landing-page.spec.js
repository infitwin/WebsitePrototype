const { test, expect } = require('@playwright/test');

test.describe('Required Elements - Landing Page (index.html)', () => {
  const requiredNavigationElements = [
    { name: 'Mobile Menu Toggle', selectors: [
      '.hamburger',
      '.mobile-menu-toggle',
      '.menu-toggle',
      '[aria-label="Menu"]',
      'button[aria-expanded]',
      '.nav-toggle'
    ]},
    { name: 'Mobile Navigation Menu', selectors: [
      '.mobile-nav',
      '.mobile-menu',
      '.nav-mobile',
      '[role="navigation"].mobile',
      '.nav-links.mobile'
    ]}
  ];

  const requiredAccessibilityElements = [
    { name: 'Skip to Content Link', selectors: [
      'a[href="#main"]',
      'a[href="#content"]',
      '.skip-link',
      '.skip-to-content',
      '[class*="skip"]'
    ]},
    { name: 'Main Content Landmark', selectors: [
      'main',
      '[role="main"]',
      '#main',
      '#content'
    ]}
  ];

  const requiredFooterElements = [
    { name: 'Newsletter Signup', selectors: [
      'input[type="email"]',
      '.newsletter-form',
      '.newsletter-signup',
      'form[action*="newsletter"]',
      '.subscribe-form'
    ]},
    { name: 'Sitemap Link', selectors: [
      'a[href*="sitemap"]',
      'text=Sitemap',
      '.footer-link >> text=Sitemap'
    ]},
    { name: 'Language Selector', selectors: [
      'select[name="language"]',
      '.language-selector',
      '.lang-select',
      '[aria-label*="language"]'
    ]}
  ];

  const requiredTrustElements = [
    { name: 'Testimonials Section', selectors: [
      '.testimonials',
      '#testimonials',
      '.reviews-section',
      '.customer-reviews',
      '[data-testid="testimonials"]'
    ]},
    { name: 'Security Badges', selectors: [
      '.security-badges',
      '.trust-badges',
      '.security-icons',
      'img[alt*="secure"]',
      'img[alt*="SSL"]'
    ]}
  ];

  test.beforeEach(async ({ page }) => {
    // Navigate to landing page
    await page.goto('http://localhost:8357/index.html');
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
  });

  test.describe('Mobile Navigation', () => {
    test.use({ viewport: { width: 375, height: 667 } }); // Mobile viewport
    
    requiredNavigationElements.forEach(({ name, selectors }) => {
      test(`should have ${name} on mobile`, async ({ page }) => {
        let found = false;
        for (const selector of selectors) {
          const count = await page.locator(selector).count();
          if (count > 0) {
            const element = await page.locator(selector).first();
            const isVisible = await element.isVisible();
            if (isVisible) {
              found = true;
              break;
            }
          }
        }
        
        if (!found) {
          const filename = `missing-${name.toLowerCase().replace(/\s+/g, '-')}-landing-mobile.png`;
          await page.screenshot({ 
            path: `playwright-testing/screenshots/${filename}`, 
            fullPage: true 
          });
        }
        
        expect(found).toBeTruthy();
      });
    });
  });

  test.describe('Accessibility Features', () => {
    requiredAccessibilityElements.forEach(({ name, selectors }) => {
      test(`should have ${name}`, async ({ page }) => {
        let found = false;
        for (const selector of selectors) {
          const count = await page.locator(selector).count();
          if (count > 0) {
            found = true;
            break;
          }
        }
        
        if (!found) {
          const filename = `missing-${name.toLowerCase().replace(/\s+/g, '-')}-landing.png`;
          await page.screenshot({ 
            path: `playwright-testing/screenshots/${filename}`, 
            fullPage: true 
          });
        }
        
        expect(found).toBeTruthy();
      });
    });
  });

  test.describe('Footer Elements', () => {
    requiredFooterElements.forEach(({ name, selectors }) => {
      test(`should have ${name}`, async ({ page }) => {
        let found = false;
        for (const selector of selectors) {
          const count = await page.locator(selector).count();
          if (count > 0) {
            found = true;
            break;
          }
        }
        
        if (!found) {
          const filename = `missing-${name.toLowerCase().replace(/\s+/g, '-')}-landing.png`;
          await page.screenshot({ 
            path: `playwright-testing/screenshots/${filename}`, 
            fullPage: true 
          });
        }
        
        expect(found).toBeTruthy();
      });
    });
  });

  test.describe('Trust Elements', () => {
    requiredTrustElements.forEach(({ name, selectors }) => {
      test(`should have ${name}`, async ({ page }) => {
        let found = false;
        for (const selector of selectors) {
          const count = await page.locator(selector).count();
          if (count > 0) {
            found = true;
            break;
          }
        }
        
        if (!found) {
          const filename = `missing-${name.toLowerCase().replace(/\s+/g, '-')}-landing.png`;
          await page.screenshot({ 
            path: `playwright-testing/screenshots/${filename}`, 
            fullPage: true 
          });
        }
        
        expect(found).toBeTruthy();
      });
    });
  });

  test('should have proper ARIA labels on interactive elements', async ({ page }) => {
    // Check main CTA button
    const ctaButton = page.locator('.hero-cta');
    const ctaAriaLabel = await ctaButton.getAttribute('aria-label');
    expect(ctaAriaLabel).toBeTruthy();
    
    // Check navigation links
    const navLinks = page.locator('.nav-link');
    const navCount = await navLinks.count();
    for (let i = 0; i < navCount; i++) {
      const link = navLinks.nth(i);
      const hasAriaLabel = await link.getAttribute('aria-label');
      const hasDescriptiveText = await link.textContent();
      expect(hasAriaLabel || hasDescriptiveText).toBeTruthy();
    }
  });

  test('should have functional mobile menu on small screens', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check if nav links are visible or if mobile menu exists
    const navLinksVisible = await page.locator('.nav-links').isVisible();
    const mobileMenuExists = await page.locator('.hamburger, .mobile-menu-toggle, .menu-toggle').count() > 0;
    
    // Either nav links should be visible or mobile menu should exist
    expect(navLinksVisible || mobileMenuExists).toBeTruthy();
  });

  test('CTA button should have proper functionality', async ({ page }) => {
    const ctaButton = page.locator('.hero-cta');
    
    // Check if button exists
    await expect(ctaButton).toBeVisible();
    
    // Check if button has proper href or onclick
    const hasHref = await ctaButton.evaluate(el => {
      return el.tagName === 'A' && el.href !== '';
    });
    const hasOnclick = await ctaButton.evaluate(el => {
      return el.onclick !== null || el.hasAttribute('onclick');
    });
    
    expect(hasHref || hasOnclick).toBeTruthy();
  });

  test('curator orb should have implemented functionality', async ({ page }) => {
    const curatorOrb = page.locator('.curator-orb');
    
    if (await curatorOrb.count() > 0) {
      // Check if click handler is properly implemented
      const pageContent = await page.content();
      const hasTodoComment = pageContent.includes('// TODO: Add curator orb click');
      
      if (hasTodoComment) {
        await page.screenshot({ 
          path: 'playwright-testing/screenshots/unimplemented-curator-orb.png', 
          fullPage: true 
        });
      }
      
      expect(hasTodoComment).toBeFalsy();
    }
  });
});