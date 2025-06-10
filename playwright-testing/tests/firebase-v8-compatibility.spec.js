const { test, expect } = require('@playwright/test');

test.describe('Firebase v8 Compatibility Tests', () => {
  test('should not throw "firebase.auth is not a function" error', async ({ page }) => {
    console.log('\n=== FIREBASE V8 COMPATIBILITY TEST ===');
    
    // Track console errors
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
        console.log('❌ Console Error:', msg.text());
      }
    });
    
    // Track page errors
    const pageErrors = [];
    page.on('pageerror', error => {
      pageErrors.push(error.message);
      console.log('❌ Page Error:', error.message);
    });
    
    // Go to auth page
    await page.goto('http://localhost:8357/pages/auth.html');
    console.log('✅ Navigated to auth page');
    
    // Wait for Firebase to load
    await page.waitForTimeout(2000);
    
    // Check for Firebase v8 initialization
    const firebaseInitialized = await page.evaluate(() => {
      return window.firebase && typeof window.firebase.auth === 'function';
    });
    
    console.log('Firebase v8 available:', firebaseInitialized);
    expect(firebaseInitialized).toBeTruthy();
    
    // Switch to login tab
    await page.click('[data-tab="login"]');
    console.log('✅ Switched to login tab');
    
    // Wait for button component to load
    await page.waitForTimeout(1000);
    
    // Check that Button component is available globally
    const buttonAvailable = await page.evaluate(() => {
      return typeof window.Button !== 'undefined';
    });
    
    console.log('Button component available globally:', buttonAvailable);
    expect(buttonAvailable).toBeTruthy();
    
    // Check that login button exists
    const loginButton = await page.locator('button:has-text("Access Your Memories")');
    await expect(loginButton).toBeVisible();
    console.log('✅ Login button is visible');
    
    // Verify no "firebase.auth is not a function" errors
    const firebaseAuthErrors = errors.filter(error => 
      error.includes('firebase.auth is not a function') ||
      error.includes('TypeError: firebase.auth is not a function')
    );
    
    const firebasePageErrors = pageErrors.filter(error => 
      error.includes('firebase.auth is not a function') ||
      error.includes('TypeError: firebase.auth is not a function')
    );
    
    console.log('Firebase auth errors found:', firebaseAuthErrors.length);
    console.log('Firebase page errors found:', firebasePageErrors.length);
    
    expect(firebaseAuthErrors).toHaveLength(0);
    expect(firebasePageErrors).toHaveLength(0);
    
    // Test that Firebase auth object is properly initialized
    const authInitialized = await page.evaluate(() => {
      try {
        const auth = firebase.auth();
        return auth !== null && typeof auth.signInWithEmailAndPassword === 'function';
      } catch (error) {
        console.error('Auth initialization error:', error);
        return false;
      }
    });
    
    console.log('Firebase auth properly initialized:', authInitialized);
    expect(authInitialized).toBeTruthy();
    
    console.log('\n✅ All Firebase v8 compatibility checks passed');
  });
  
  test('should successfully create login button using centralized Button component', async ({ page }) => {
    console.log('\n=== CENTRALIZED BUTTON COMPONENT TEST ===');
    
    await page.goto('http://localhost:8357/pages/auth.html');
    
    // Wait for components to load
    await page.waitForTimeout(3000);
    
    // Switch to login tab
    await page.click('[data-tab="login"]');
    
    // Check that the button was created by the centralized component
    const buttonCreatedCorrectly = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const loginButton = buttons.find(btn => btn.textContent.includes('Access Your Memories'));
      if (!loginButton) return false;
      
      // Check if button has the correct classes from centralized component
      return loginButton.classList.contains('infitwin-button') &&
             loginButton.classList.contains('infitwin-button--primary');
    });
    
    console.log('Button created with centralized component classes:', buttonCreatedCorrectly);
    expect(buttonCreatedCorrectly).toBeTruthy();
    
    // Verify button functionality
    const loginButton = await page.locator('button:has-text("Access Your Memories")');
    await expect(loginButton).toBeVisible();
    await expect(loginButton).toBeEnabled();
    
    console.log('✅ Centralized Button component working correctly');
  });
});