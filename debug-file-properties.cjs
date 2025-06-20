const { chromium } = require('playwright');

async function debugFileProperties() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log('🔍 Debugging actual file properties from database...');
  
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
  await page.waitForTimeout(5000);
  
  // Inject code to call getUserFiles directly and see the raw data
  const fileData = await page.evaluate(async () => {
    // Import and call getUserFiles
    try {
      const { getUserFiles } = await import('./js/file-service.js');
      const result = await getUserFiles();
      
      return {
        success: true,
        resultType: typeof result,
        resultKeys: result ? Object.keys(result) : [],
        filesArray: result?.files || [],
        firstFileKeys: result?.files?.[0] ? Object.keys(result.files[0]) : [],
        firstFileData: result?.files?.[0] || null,
        hasMore: result?.hasMore,
        totalFiles: result?.files?.length || 0
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        stack: error.stack
      };
    }
  });
  
  console.log('📊 Raw file data from getUserFiles():');
  console.log(JSON.stringify(fileData, null, 2));
  
  await browser.close();
}

debugFileProperties().catch(console.error);