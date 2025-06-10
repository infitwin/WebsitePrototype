const { test, expect } = require('@playwright/test');

test.describe('Settings Persistence - Exact User Flow Reproduction', () => {
  test('Reproduce the exact steps from user description', async ({ page }) => {
    console.log('\n=== REPRODUCING EXACT USER FLOW ===\n');

    // Enable console logging
    page.on('console', msg => {
      console.log(`🟦 CONSOLE [${msg.type()}]: ${msg.text()}`);
    });

    console.log('1. Navigate to auth.html and login...');
    await page.goto('http://localhost:8357/pages/auth.html');
    await page.click('[data-tab="login"]');
    await page.fill('.login-email', 'weezer@yev.com');
    await page.fill('.login-password', '123456');
    await page.click('button:has-text("Access Your Memories")');
    await page.waitForTimeout(2000);

    console.log('2. Navigate to settings.html...');
    await page.goto('http://localhost:8357/pages/settings.html');
    await page.waitForLoadState('networkidle');

    console.log('3. Check console BEFORE making changes...');
    const beforeChanges = await page.evaluate(() => {
      console.log('Current userSettings:', userSettings);
      console.log('localStorage userSettings:', localStorage.getItem('userSettings'));
      return {
        userSettings: userSettings,
        localStorage: localStorage.getItem('userSettings')
      };
    });
    
    console.log('BEFORE CHANGES:');
    console.log('  userSettings:', beforeChanges.userSettings);
    console.log('  localStorage:', beforeChanges.localStorage);

    console.log('4. Change display name to "Test User Changed"...');
    await page.fill('#displayName', 'Test User Changed');
    
    console.log('5. Click Save Changes...');
    await page.click('#saveAccountBtn');
    await page.waitForTimeout(2000); // Wait for the 1.5s timeout in handleAccountFormSubmit

    console.log('6. Check console AFTER saving...');
    const afterSave = await page.evaluate(() => {
      console.log('After save userSettings:', userSettings);
      console.log('After save localStorage:', localStorage.getItem('userSettings'));
      return {
        userSettings: userSettings,
        localStorage: localStorage.getItem('userSettings'),
        fieldValue: document.getElementById('displayName').value
      };
    });
    
    console.log('AFTER SAVE:');
    console.log('  userSettings:', afterSave.userSettings);
    console.log('  localStorage:', afterSave.localStorage);
    console.log('  Field value:', afterSave.fieldValue);

    console.log('7. Change field to "Original Name" WITHOUT saving...');
    await page.fill('#displayName', 'Original Name');
    
    const afterTyping = await page.evaluate(() => {
      return {
        userSettings: userSettings,
        localStorage: localStorage.getItem('userSettings'),
        fieldValue: document.getElementById('displayName').value
      };
    });
    
    console.log('AFTER TYPING (no save):');
    console.log('  userSettings:', afterTyping.userSettings);
    console.log('  localStorage:', afterTyping.localStorage);
    console.log('  Field value:', afterTyping.fieldValue);

    console.log('8. Refresh the page (F5)...');
    await page.reload();
    await page.waitForLoadState('networkidle');

    console.log('9. Check console AFTER page refresh...');
    const afterRefresh = await page.evaluate(() => {
      console.log('After refresh userSettings:', userSettings);
      console.log('After refresh localStorage:', localStorage.getItem('userSettings'));
      return {
        userSettings: userSettings,
        localStorage: localStorage.getItem('userSettings'),
        fieldValue: document.getElementById('displayName').value
      };
    });
    
    console.log('AFTER REFRESH:');
    console.log('  userSettings:', afterRefresh.userSettings);
    console.log('  localStorage:', afterRefresh.localStorage);
    console.log('  Field value:', afterRefresh.fieldValue);

    console.log('\n=== FINAL ANALYSIS ===');
    
    // Parse the localStorage to check the actual saved value
    let savedDisplayName = null;
    if (afterRefresh.localStorage) {
      try {
        const parsed = JSON.parse(afterRefresh.localStorage);
        savedDisplayName = parsed.displayName;
      } catch (e) {
        console.log('Error parsing localStorage:', e.message);
      }
    }
    
    console.log('Expected field value after refresh: "Test User Changed"');
    console.log('Actual field value after refresh:', afterRefresh.fieldValue);
    console.log('Saved in localStorage:', savedDisplayName);
    
    if (afterRefresh.fieldValue === 'Test User Changed') {
      console.log('✅ SUCCESS: Settings persistence is working correctly!');
      console.log('✅ The saved value "Test User Changed" was properly restored after refresh.');
    } else {
      console.log('❌ ISSUE FOUND: Settings persistence is broken!');
      console.log(`❌ Expected "Test User Changed", but field shows "${afterRefresh.fieldValue}"`);
      
      if (savedDisplayName === 'Test User Changed') {
        console.log('💡 localStorage has correct value, but form field was not populated correctly');
        console.log('💡 This suggests an issue in populateFormFields() or initializeSettings()');
      } else {
        console.log('💡 localStorage does not have correct value');
        console.log('💡 This suggests an issue in saveSettings() or handleAccountFormSubmit()');
      }
    }

    // Verify the actual issue
    expect(afterRefresh.fieldValue).toBe('Test User Changed');
  });
});