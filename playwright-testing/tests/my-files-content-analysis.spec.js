const { test, expect } = require('@playwright/test');

// Helper function for login with email verification bypass
async function loginUser(page) {
  await page.goto('http://localhost:8357/pages/auth.html');
  await page.click('[data-tab="login"]');
  await page.fill('.login-email', 'weezer@yev.com');
  await page.fill('.login-password', '123456');
  await page.click('button:has-text("Access Your Memories")');
  
  try {
    await page.waitForURL('**/email-verification.html', { timeout: 3000 });
    const bypassButton = page.locator('button[class*="skip"]');
    if (await bypassButton.count() > 0) {
      await bypassButton.click();
    }
    await page.waitForURL(['**/dashboard.html', '**/alpha-welcome.html'], { timeout: 5000 });
  } catch (e) {
    // Might have gone directly
  }
  
  const finalURL = page.url();
  if (finalURL.includes('alpha-welcome.html')) {
    await page.goto('http://localhost:8357/pages/dashboard.html');
  }
}

test.describe('My Files Content Analysis', () => {
  test('should analyze actual file content and storage data', async ({ page }) => {
    // Login and navigate
    await loginUser(page);
    await page.goto('http://localhost:8357/pages/my-files.html');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(8000); // Give more time for data to load
    
    console.log('=== ANALYZING FILE CONTENT ===');
    
    // Check file grid items
    const fileItems = await page.locator('.file-grid-item').count();
    console.log(`Total file items found: ${fileItems}`);
    
    // Analyze first few files
    for (let i = 0; i < Math.min(5, fileItems); i++) {
      const fileItem = page.locator('.file-grid-item').nth(i);
      const fileName = await fileItem.locator('.file-grid-name').textContent();
      const fileSize = await fileItem.locator('.file-grid-size').textContent();
      
      console.log(`File ${i + 1}:`);
      console.log(`  Name: "${fileName}"`);
      console.log(`  Size: "${fileSize}"`);
      
      if (fileName.includes('undefined') || fileSize.includes('undefined') || fileSize.includes('NaN')) {
        console.log(`  ❌ PROBLEM: File ${i + 1} has undefined/NaN values`);
      }
    }
    
    console.log('\n=== ANALYZING STORAGE STATS ===');
    
    // Check storage stats
    const totalUsed = await page.locator('#totalUsed').textContent();
    const totalFiles = await page.locator('#totalFiles').textContent();
    const largestFile = await page.locator('#largestFile').textContent();
    const avgFileSize = await page.locator('#avgFileSize').textContent();
    
    console.log(`Total Used: "${totalUsed}"`);
    console.log(`Total Files: "${totalFiles}"`);
    console.log(`Largest File: "${largestFile}"`);
    console.log(`Average Size: "${avgFileSize}"`);
    
    // Check for problems in stats
    const statsHaveProblems = [totalUsed, totalFiles, largestFile, avgFileSize].some(stat => 
      stat.includes('undefined') || stat.includes('NaN') || stat === '0' || stat === '0 Bytes'
    );
    
    if (statsHaveProblems) {
      console.log('❌ PROBLEM: Storage stats contain invalid values');
    }
    
    console.log('\n=== ANALYZING STORAGE CHART ===');
    
    // Check if chart has data
    const chartElements = await page.locator('#storageDonutChart *').count();
    console.log(`Chart elements found: ${chartElements}`);
    
    // Look for chart legend/data
    const chartText = await page.locator('#storageDonutChart').textContent();
    console.log(`Chart content: "${chartText}"`);
    
    if (chartText.includes('0%') && totalFiles !== '0') {
      console.log('❌ PROBLEM: Chart shows 0% but files exist');
    }
    
    console.log('\n=== CONSOLE ERRORS ===');
    
    // Capture console errors
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // Wait for any delayed errors
    await page.waitForTimeout(3000);
    
    if (errors.length > 0) {
      console.log('JavaScript errors found:');
      errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    } else {
      console.log('No JavaScript errors detected');
    }
    
    // Take detailed screenshots
    await page.screenshot({ path: 'file-content-analysis.png', fullPage: true });
    
    // Screenshot just the file grid
    const fileGrid = page.locator('#filesContainer');
    if (await fileGrid.count() > 0) {
      await fileGrid.screenshot({ path: 'file-grid-detail.png' });
    }
    
    // Screenshot just the storage overview
    const storageOverview = page.locator('.storage-overview-section');
    if (await storageOverview.count() > 0) {
      await storageOverview.screenshot({ path: 'storage-overview-detail.png' });
    }
    
    console.log('\n=== ANALYSIS COMPLETE ===');
    console.log('Screenshots saved: file-content-analysis.png, file-grid-detail.png, storage-overview-detail.png');
  });
});