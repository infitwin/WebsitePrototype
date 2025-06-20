const { chromium } = require('playwright');

async function captureConsoleLogs() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log('🔍 Capturing console logs to see file data structure...');
  
  // Capture all console logs
  const logs = [];
  page.on('console', msg => {
    logs.push(`${msg.type()}: ${msg.text()}`);
  });
  
  // Login
  await page.goto('http://localhost:8357/pages/my-files.html');
  await page.waitForTimeout(2000);
  await page.click('[data-tab="login"]');
  await page.fill('.login-email', 'weezer@yev.com');
  await page.fill('.login-password', '123456');
  await page.click('button:has-text("Access Your Memories")');
  await page.waitForTimeout(3000);
  
  const skipBtn = await page.locator('button:has-text("Skip")').count();
  if (skipBtn > 0) {
    await page.click('button:has-text("Skip")');
    await page.waitForTimeout(2000);
  }
  
  await page.goto('http://localhost:8357/pages/my-files.html');
  await page.waitForTimeout(8000); // Wait longer for file loading
  
  console.log('📋 Console logs related to files and data:');
  logs.forEach((log, i) => {
    if (log.includes('getUserFiles') || 
        log.includes('Files:') || 
        log.includes('File data:') ||
        log.includes('files array') ||
        log.includes('Extracted files')) {
      console.log(`${i + 1}. ${log}`);
    }
  });
  
  await browser.close();
}

captureConsoleLogs().catch(console.error);