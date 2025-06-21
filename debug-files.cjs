const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Add console logging
  page.on('console', msg => {
    if (msg.text().includes('❌') || msg.text().includes('Failed') || msg.text().includes('Error')) {
      console.log('ERROR:', msg.text());
    }
  });

  console.log('🔍 Navigating to My Files page...');
  await page.goto('http://localhost:8357/pages/my-files.html');
  
  // Wait for page to load
  await page.waitForTimeout(2000);
  
  // Take initial screenshot
  await page.screenshot({ path: 'my-files-initial.png', fullPage: true });
  console.log('📸 Initial screenshot taken');

  // Check if we need to login
  const loginButton = await page.locator('text=Go to Login').first();
  if (await loginButton.isVisible()) {
    console.log('🔐 Login required, navigating to auth...');
    await loginButton.click();
    
    // Login
    await page.click('[data-tab="login"]');
    await page.fill('.login-email', 'weezer@yev.com');
    await page.fill('.login-password', '123456');
    await page.click('button:has-text("Access Your Memories")');
    
    // Wait for redirect back to My Files
    await page.waitForURL('**/my-files.html', { timeout: 10000 });
    console.log('✅ Logged in and redirected');
    
    // Wait for files to load
    await page.waitForTimeout(3000);
    
    // Take screenshot after login
    await page.screenshot({ path: 'my-files-after-login.png', fullPage: true });
    console.log('📸 After login screenshot taken');
  }

  // Check for files
  const filesContainer = await page.locator('#filesContainer');
  const fileCards = await filesContainer.locator('.file-card').count();
  console.log(`📁 Found ${fileCards} file cards`);

  // Check for error states
  const emptyState = await page.locator('#emptyState');
  if (await emptyState.isVisible()) {
    const emptyText = await emptyState.textContent();
    console.log('📭 Empty state visible:', emptyText);
  }

  // Check loading state
  const loadingState = await page.locator('#loadingState');
  if (await loadingState.isVisible()) {
    console.log('⏳ Loading state is visible');
  }

  // Get console errors
  const errors = await page.evaluate(() => {
    const logs = [];
    // Check if there were any console errors
    if (window.consoleErrors) {
      logs.push(...window.consoleErrors);
    }
    return logs;
  });

  if (errors.length > 0) {
    console.log('🔴 Console errors found:', errors);
  }

  console.log('\n✅ Debug complete. Check screenshots: my-files-initial.png and my-files-after-login.png');
  
  await browser.close();
})();