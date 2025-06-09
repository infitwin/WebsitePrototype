const { test, expect } = require('@playwright/test');

test.describe('Critical Missing Settings Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8357/pages/settings.html');
    await page.waitForLoadState('networkidle');
  });

  // Critical missing features identified by /w1 hunt
  const criticalMissingFeatures = [
    {
      name: 'Theme/Dark Mode Toggle',
      selectors: [
        'text=Dark Mode',
        'text=Theme',
        'text=Appearance',
        '[data-setting="theme"]',
        '.theme-toggle',
        'input[name="theme"]'
      ],
      impact: 'Users cannot customize interface appearance',
      priority: 'High'
    },
    {
      name: 'Password Change Form',
      selectors: [
        'input[name*="password"]',
        'input[type="password"]',
        'text=Change Password',
        'text=Update Password',
        'button:has-text("Change Password")',
        '[data-section="password"]'
      ],
      impact: 'Users cannot change their password - critical security issue',
      priority: 'Critical'
    },
    {
      name: 'Profile Picture Upload',
      selectors: [
        'input[type="file"]',
        'text=Upload Photo',
        'text=Profile Picture',
        '.avatar-upload',
        '[data-action="upload-avatar"]',
        'button:has-text("Upload")'
      ],
      impact: 'Users cannot customize their profile appearance',
      priority: 'Medium'
    },
    {
      name: 'Two-Factor Authentication',
      selectors: [
        'text=Two-Factor',
        'text=2FA',
        'text=Multi-Factor',
        '[data-feature="2fa"]',
        '.security-2fa',
        'text=Authenticator'
      ],
      impact: 'Missing critical security feature',
      priority: 'High'
    },
    {
      name: 'API Keys Management',
      selectors: [
        'text=API Keys',
        'text=API Tokens',
        'text=Developer',
        '[data-section="api"]',
        '.api-keys',
        'text=Integration'
      ],
      impact: 'Users cannot manage API integrations',
      priority: 'Medium'
    },
    {
      name: 'Backup Settings',
      selectors: [
        'text=Backup',
        'text=Sync',
        'text=Cloud Backup',
        '[data-section="backup"]',
        'button:has-text("Backup")',
        'text=Auto-backup'
      ],
      impact: 'Users cannot configure data backup/sync',
      priority: 'High'
    }
  ];

  criticalMissingFeatures.forEach(({ name, selectors, impact, priority }) => {
    test(`should have ${name}`, async ({ page }) => {
      const found = await page.locator(selectors.join(', ')).count() > 0;
      
      if (!found) {
        // Take screenshot for evidence
        await page.screenshot({ 
          path: `missing-${name.toLowerCase().replace(/[\s\/]/g, '-')}.png`,
          fullPage: true 
        });
        
        console.log(`❌ MISSING: ${name}`);
        console.log(`   Impact: ${impact}`);
        console.log(`   Priority: ${priority}`);
        console.log(`   Screenshot: missing-${name.toLowerCase().replace(/[\s\/]/g, '-')}.png`);
      }
      
      expect(found).toBeTruthy();
    });
  });

  test('settings page completeness audit', async ({ page }) => {
    await page.screenshot({ path: 'settings-completeness-audit.png', fullPage: true });
    
    // Count existing elements
    const sections = await page.locator('.settings-section, [class*="section"]').count();
    const toggles = await page.locator('.toggle-switch').count();
    const inputs = await page.locator('input').count();
    const buttons = await page.locator('button').count();
    
    console.log('\n=== SETTINGS COMPLETENESS AUDIT ===');
    console.log(`Settings sections: ${sections}`);
    console.log(`Toggle switches: ${toggles}`);
    console.log(`Input fields: ${inputs}`);
    console.log(`Buttons: ${buttons}`);
    
    // Check for missing patterns
    const expectedPatterns = [
      { name: 'Password fields', selector: 'input[type="password"]' },
      { name: 'File uploads', selector: 'input[type="file"]' },
      { name: 'Color pickers', selector: 'input[type="color"]' },
      { name: 'Range sliders', selector: 'input[type="range"]' },
      { name: 'Checkboxes', selector: 'input[type="checkbox"]' },
      { name: 'Radio buttons', selector: 'input[type="radio"]' }
    ];
    
    console.log('\n=== INPUT TYPE COVERAGE ===');
    for (const pattern of expectedPatterns) {
      const count = await page.locator(pattern.selector).count();
      console.log(`${pattern.name}: ${count}`);
    }
    
    console.log('\n=== RECOMMENDATIONS ===');
    console.log('Missing critical features that make settings "look wrong":');
    console.log('1. Theme/appearance controls');
    console.log('2. Password change functionality');
    console.log('3. Profile customization options');
    console.log('4. Security settings (2FA)');
    console.log('5. Data management (backup/export)');
    console.log('6. API/integration management');
    console.log('\n📸 Full audit screenshot: settings-completeness-audit.png');
  });
});