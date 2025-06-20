const { chromium } = require('playwright');

async function testDeleteWithBypass() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Monitor console logs
  page.on('console', msg => {
    if (msg.text().includes('delete') || msg.text().includes('Delete') || msg.text().includes('🗑️')) {
      console.log('BROWSER:', msg.text());
    }
  });
  
  console.log('🔐 Logging in with bypass...');
  
  // Go to My Files (will redirect to auth)
  await page.goto('http://localhost:8357/pages/my-files.html');
  await page.waitForTimeout(2000);
  
  // Login
  await page.click('[data-tab="login"]');
  await page.waitForTimeout(500);
  
  // Fill login form (login tab should be active now)
  await page.fill('.login-email', 'weezer@yev.com');
  await page.fill('.login-password', '123456');
  await page.click('button:has-text("Access Your Memories")');
  await page.waitForTimeout(3000);
  
  // Look for red bypass button
  console.log('🔴 Looking for red bypass button...');
  
  // Try different variations of bypass button text
  const bypassSelectors = [
    'button:has-text("Skip")',
    'button:has-text("Bypass")', 
    'button:has-text("Skip for Testing")',
    'button:has-text("Testing")',
    '.btn-red',
    '.bypass-btn'
  ];
  
  let foundBypass = false;
  for (const selector of bypassSelectors) {
    const count = await page.locator(selector).count();
    if (count > 0) {
      console.log('🔴 Found bypass button with selector:', selector);
      await page.click(selector);
      foundBypass = true;
      break;
    }
  }
  
  if (!foundBypass) {
    console.log('🔴 No bypass button found, continuing anyway...');
  } else {
    await page.waitForTimeout(2000);
  }
  
  // Navigate to My Files
  await page.goto('http://localhost:8357/pages/my-files.html');
  await page.waitForTimeout(5000);
  
  // Take snapshot
  await page.screenshot({ path: 'my-files-with-bypass.png', fullPage: true });
  console.log('📸 My Files with bypass screenshot saved');
  
  // Check for files and test delete
  const fileCount = await page.evaluate(() => document.querySelectorAll('.file-card').length);
  console.log('📊 File count:', fileCount);
  
  if (fileCount > 0) {
    console.log('🧪 Testing delete functionality...');
    
    // Click delete button
    await page.click('.delete-btn');
    await page.waitForTimeout(1000);
    
    // Take modal screenshot
    await page.screenshot({ path: 'delete-modal-with-bypass.png', fullPage: true });
    console.log('📸 Delete modal screenshot saved');
    
    // Click confirm
    await page.click('.modal-confirm');
    await page.waitForTimeout(4000);
    
    // Check result
    const afterCount = await page.evaluate(() => document.querySelectorAll('.file-card').length);
    console.log('📊 Files after delete:', afterCount);
    
    if (afterCount < fileCount) {
      console.log('✅ DELETE IS WORKING!');
      await page.screenshot({ path: 'delete-success.png', fullPage: true });
    } else {
      console.log('❌ Delete not working');
      await page.screenshot({ path: 'delete-failed.png', fullPage: true });
    }
  } else {
    console.log('❌ No files found to test delete');
  }
  
  await browser.close();
}

testDeleteWithBypass().catch(console.error);