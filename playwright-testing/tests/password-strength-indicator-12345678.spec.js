const { test, expect } = require('@playwright/test');

test.describe('Password Strength Indicator - Issue #42', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8357/pages/settings.html');
    await page.waitForLoadState('networkidle');
  });

  test('should update strength indicator based on password complexity', async ({ page }) => {
    const newPasswordField = page.locator('#newPassword');
    const strengthIndicator = page.locator('#passwordStrength, .password-strength, .strength-meter');
    
    // Skip if password field doesn't exist
    if (!await newPasswordField.isVisible()) {
      test.skip('Password field not found on this page');
    }
    
    // Test the specific password mentioned in issue #42
    await newPasswordField.fill('12345678');
    await page.waitForTimeout(500); // Allow strength calculation
    
    // Take screenshot for debugging
    await page.screenshot({ path: 'password-strength-12345678-debug.png', fullPage: true });
    
    // Check if strength indicator is visible
    if (await strengthIndicator.first().isVisible()) {
      // Look for strength text content
      const strengthText = page.locator('.strength-text, .password-strength-text, #passwordStrength .text');
      
      if (await strengthText.first().isVisible()) {
        const text = await strengthText.first().textContent();
        console.log(`Password strength text for '12345678': ${text}`);
        
        // The password '12345678' should be rated as 'weak' or 'poor', not 'fair'
        // This is a simple 8-digit numeric password with no complexity
        expect(text?.toLowerCase()).not.toContain('fair');
        expect(text?.toLowerCase()).not.toContain('good');
        expect(text?.toLowerCase()).not.toContain('strong');
        
        // Should show weak or poor
        const isWeakOrPoor = text?.toLowerCase().includes('weak') || 
                            text?.toLowerCase().includes('poor') || 
                            text?.toLowerCase().includes('very weak');
        expect(isWeakOrPoor).toBeTruthy();
      }
      
      // Also check for CSS classes that indicate strength
      const strengthClasses = [
        '.strength-weak',
        '.weak', 
        '.strength-poor',
        '.poor',
        '.strength-very-weak',
        '[class*="weak"]',
        '[class*="poor"]'
      ];
      
      let weakClassFound = false;
      for (const strengthClass of strengthClasses) {
        if (await page.locator(strengthClass).first().isVisible().catch(() => false)) {
          weakClassFound = true;
          console.log(`Found weak strength class: ${strengthClass}`);
          break;
        }
      }
      
      // Check for fair/good/strong classes that should NOT be present
      const strongClasses = [
        '.strength-fair',
        '.fair',
        '.strength-good', 
        '.good',
        '.strength-strong',
        '.strong',
        '[class*="fair"]',
        '[class*="good"]',
        '[class*="strong"]'
      ];
      
      let strongClassFound = false;
      for (const strengthClass of strongClasses) {
        if (await page.locator(strengthClass).first().isVisible().catch(() => false)) {
          strongClassFound = true;
          console.log(`ISSUE: Found strong strength class for weak password: ${strengthClass}`);
          break;
        }
      }
      
      // The password should be rated as weak, not fair/good/strong
      expect(strongClassFound).toBeFalsy();
      
      // If we have a strength indicator, we should see weak indication
      if (await strengthIndicator.first().isVisible()) {
        expect(weakClassFound).toBeTruthy();
      }
    } else {
      test.skip('Password strength indicator not visible');
    }
  });

  test('should rate other simple numeric passwords as weak', async ({ page }) => {
    const newPasswordField = page.locator('#newPassword');
    const strengthIndicator = page.locator('#passwordStrength, .password-strength, .strength-meter');
    
    if (!await newPasswordField.isVisible()) {
      test.skip('Password field not found on this page');
    }
    
    // Test other simple numeric passwords that should also be weak
    const weakNumericPasswords = [
      '12345678',
      '87654321', 
      '11111111',
      '12121212',
      '123456789',
      '000000000'
    ];
    
    for (const password of weakNumericPasswords) {
      await newPasswordField.fill(password);
      await page.waitForTimeout(300);
      
      if (await strengthIndicator.first().isVisible()) {
        // Get strength text
        const strengthText = page.locator('.strength-text, .password-strength-text, #passwordStrength .text');
        
        if (await strengthText.first().isVisible()) {
          const text = await strengthText.first().textContent();
          console.log(`Password strength for '${password}': ${text}`);
          
          // These numeric passwords should not be rated as fair or better
          expect(text?.toLowerCase()).not.toContain('fair');
          expect(text?.toLowerCase()).not.toContain('good');
          expect(text?.toLowerCase()).not.toContain('strong');
        }
      }
    }
  });

  test('should show progressive strength for different password types', async ({ page }) => {
    const newPasswordField = page.locator('#newPassword');
    const strengthIndicator = page.locator('#passwordStrength, .password-strength, .strength-meter');
    
    if (!await newPasswordField.isVisible()) {
      test.skip('Password field not found on this page');
    }
    
    // Test password progression from weak to strong
    const passwordProgression = [
      {
        password: '12345678',
        expectedNotToContain: ['fair', 'good', 'strong'],
        description: 'Simple numeric - should be weak'
      },
      {
        password: 'password',
        expectedNotToContain: ['good', 'strong'],
        description: 'Simple dictionary word - should be weak/poor'
      },
      {
        password: 'password1',
        expectedNotToContain: ['strong'],
        description: 'Dictionary + number - could be fair but not strong'
      },
      {
        password: 'Password1',
        expectedNotToContain: ['very weak'],
        description: 'Mixed case + number - should be fair/good'
      },
      {
        password: 'Password123!',
        expectedToContain: ['good', 'strong'],
        description: 'Complex password - should be good/strong'
      }
    ];
    
    for (const testCase of passwordProgression) {
      await newPasswordField.fill(testCase.password);
      await page.waitForTimeout(300);
      
      if (await strengthIndicator.first().isVisible()) {
        const strengthText = page.locator('.strength-text, .password-strength-text, #passwordStrength .text');
        
        if (await strengthText.first().isVisible()) {
          const text = await strengthText.first().textContent();
          console.log(`${testCase.description} - '${testCase.password}': ${text}`);
          
          // Check expectedNotToContain
          if (testCase.expectedNotToContain) {
            for (const badRating of testCase.expectedNotToContain) {
              expect(text?.toLowerCase()).not.toContain(badRating);
            }
          }
          
          // Check expectedToContain
          if (testCase.expectedToContain) {
            const hasExpected = testCase.expectedToContain.some(rating => 
              text?.toLowerCase().includes(rating)
            );
            expect(hasExpected).toBeTruthy();
          }
        }
      }
    }
  });

});