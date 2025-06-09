const { test, expect } = require('@playwright/test');

test('Debug Firebase authentication issue', async ({ page }) => {
  console.log('\n=== DEBUGGING FIREBASE AUTH ===');
  
  // Set up console log capture
  const consoleLogs = [];
  page.on('console', msg => {
    consoleLogs.push({
      type: msg.type(),
      text: msg.text()
    });
  });
  
  // Go to debug page
  await page.goto('http://localhost:8357/debug-auth-issue.html');
  await page.waitForTimeout(2000);
  
  // Click test login button
  await page.click('button:has-text("Test Direct Firebase Login")');
  
  // Wait for result
  await page.waitForTimeout(5000);
  
  // Get all logs from the page
  const logs = await page.locator('.log').allTextContents();
  
  console.log('\n--- Page Logs ---');
  logs.forEach(log => console.log(log));
  
  console.log('\n--- Console Logs ---');
  consoleLogs.forEach(log => {
    if (log.type === 'error') {
      console.log(`ERROR: ${log.text}`);
    } else {
      console.log(`${log.type.toUpperCase()}: ${log.text}`);
    }
  });
  
  // Check if login was successful
  const successLog = logs.find(log => log.includes('LOGIN SUCCESSFUL'));
  const errorLog = logs.find(log => log.includes('Login failed'));
  
  if (successLog) {
    console.log('\n✅ Firebase authentication is working!');
    console.log('The user weezer@yev.com exists and password 12345 is correct');
    
    // Now we need to fix the auth.html page
    console.log('\nThe issue is with the auth.html implementation, not Firebase');
  } else if (errorLog) {
    console.log('\n❌ Firebase authentication failed');
    console.log('Error details:', errorLog);
    
    // Try with password 123456
    await page.evaluate(() => {
      window.testDirectLogin = async function() {
        const { getAuth, signInWithEmailAndPassword } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
        const auth = getAuth();
        
        try {
          const result = await signInWithEmailAndPassword(auth, 'weezer@yev.com', '123456');
          console.log('SUCCESS with password 123456');
          return true;
        } catch (e) {
          console.log('FAILED with password 123456:', e.message);
          return false;
        }
      }
    });
  }
});