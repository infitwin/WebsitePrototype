const { test, expect } = require('@playwright/test');

test('Diagnose authentication issue comprehensively', async ({ page }) => {
  console.log('\n=== COMPREHENSIVE AUTH DIAGNOSIS ===');
  
  // Go to test page
  await page.goto('http://localhost:8357/test-firebase-create-user.html');
  
  // Test 1: Try login with provided credentials
  console.log('\n1. Testing login with weezer@yev.com / 12345');
  await page.click('button:has-text("Test Login")');
  await page.waitForTimeout(3000);
  
  // Test 2: Try creating a new user
  console.log('\n2. Testing if we can create new users');
  await page.click('button:has-text("Create New Test User")');
  await page.waitForTimeout(3000);
  
  // Test 3: Try password reset
  console.log('\n3. Testing password reset for weezer@yev.com');
  await page.click('button:has-text("Send Password Reset")');
  await page.waitForTimeout(3000);
  
  // Get all results
  const results = await page.locator('#result p').allTextContents();
  console.log('\n--- All Results ---');
  results.forEach(result => console.log(result));
  
  // Analyze results
  console.log('\n--- ANALYSIS ---');
  
  const loginFailed = results.some(r => r.includes('Login failed'));
  const createUserWorked = results.some(r => r.includes('User created successfully'));
  const passwordResetResult = results.find(r => r.includes('Password reset'));
  
  if (loginFailed && createUserWorked) {
    console.log('✅ Firebase authentication is working (can create users)');
    console.log('❌ But login with weezer@yev.com / 12345 is failing');
    console.log('   Possible reasons:');
    console.log('   - The password might be different');
    console.log('   - The user might not exist in this Firebase project');
    console.log('   - The user might exist in a different Firebase project');
  }
  
  if (passwordResetResult) {
    if (passwordResetResult.includes('sent')) {
      console.log('✅ Password reset email sent - user exists!');
      console.log('   The password might just be different from 12345');
    } else if (passwordResetResult.includes('user-not-found')) {
      console.log('❌ User weezer@yev.com does NOT exist in this Firebase project');
    }
  }
  
  // Check if this might be a different Firebase project
  console.log('\n--- Firebase Project Check ---');
  console.log('Project ID: infitwin');
  console.log('Auth Domain: infitwin.firebaseapp.com');
  console.log('\nIf the user exists in ui-studio but not here, you might be:');
  console.log('1. Using a different Firebase project');
  console.log('2. Using different environment (prod vs dev)');
  console.log('3. The user needs to be created in this project');
});