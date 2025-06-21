const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture ALL console output
  page.on('console', msg => console.log('CONSOLE:', msg.text()));
  
  // Capture API calls  
  page.on('request', req => {
    if (req.url().includes('artifact-processor')) {
      console.log('API REQUEST:', req.postData());
    }
  });
  
  page.on('response', async res => {
    if (res.url().includes('artifact-processor')) {
      console.log('API RESPONSE:', res.status(), await res.text());
    }
  });

  await page.goto('http://localhost:8357/pages/auth.html');
  await page.click('[data-tab="login"]');
  await page.fill('.login-email', 'weezer@yev.com');  
  await page.fill('.login-password', '123456');
  await page.click('button:has-text("Access Your Memories")');
  await page.waitForNavigation();
  
  await page.goto('http://localhost:8357/pages/my-files.html');
  await page.waitForSelector('.file-card');
  await page.waitForTimeout(2000);

  // Select and vectorize quickly
  await page.locator('.file-card').filter({hasText: 'jpg'}).first().locator('input').check();
  await page.locator('#vectorizeBtn').click();
  
  // Wait and see what happens
  await page.waitForTimeout(10000);
  await browser.close();
})();