const { test, expect } = require('@playwright/test');

test('Find the correct password for weezer@yev.com', async ({ page }) => {
  console.log('\n=== TESTING BOTH PASSWORDS ===');
  
  await page.goto('http://localhost:8357/test-both-passwords.html');
  
  // Click test button
  await page.click('button:has-text("Test Both Passwords")');
  
  // Wait for results
  await page.waitForTimeout(10000);
  
  // Get the result
  const resultText = await page.locator('#result').textContent();
  console.log('\nResult:', resultText);
  
  // Check which password worked
  if (resultText.includes('SUCCESS with password: 12345')) {
    console.log('\n✅ The correct password is: 12345');
  } else if (resultText.includes('SUCCESS with password: 123456')) {
    console.log('\n✅ The correct password is: 123456');
    console.log('   (Firebase requires minimum 6 characters)');
  } else {
    console.log('\n❌ Neither password worked');
    console.log('   The user might not exist or has a different password');
  }
});