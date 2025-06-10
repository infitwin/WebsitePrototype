const { test, expect } = require('@playwright/test');

test.describe('Authentication Guard Protection', () => {
  const protectedPages = [
    'dashboard.html',
    'twin-management.html',
    'curator.html', 
    'interview.html',
    'talk-to-twin.html',
    'settings.html',
    'my-files.html',
    'interview-transcripts.html'
  ];

  test('All protected pages should redirect to auth when not logged in', async ({ page }) => {
    // Clear any existing auth state
    await page.goto('http://localhost:8357/pages/auth.html');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    for (const pageName of protectedPages) {
      // Try to access protected page without authentication
      await page.goto(`http://localhost:8357/pages/${pageName}`);
      
      // Should be redirected to auth page
      await expect(page).toHaveURL(/auth\.html/, { 
        timeout: 5000,
        message: `${pageName} should redirect to auth.html when not authenticated` 
      });
    }
  });
  
  test('Protected pages should include auth-guard.js', async ({ page }) => {
    // Set bypass flag to prevent redirects during this test
    await page.goto('http://localhost:8357/pages/auth.html');
    await page.evaluate(() => {
      localStorage.setItem('bypass_auth', 'true');
    });
    
    for (const pageName of protectedPages) {
      const response = await page.goto(`http://localhost:8357/pages/${pageName}`);
      const content = await page.content();
      
      // Check that auth-guard.js is imported
      const hasAuthGuard = content.includes("import { guardPage } from '../js/auth-guard.js'") ||
                          content.includes('auth-guard.js');
      
      expect(hasAuthGuard).toBeTruthy();
    }
    
    // Clean up bypass flag
    await page.evaluate(() => {
      localStorage.removeItem('bypass_auth');
    });
  });
});