const { test, expect } = require('@playwright/test');

test('check vectorization status', async ({ page }) => {
  // Quick test to check current status
  
  // Login
  await page.goto('http://localhost:8357/pages/auth.html');
  await page.click('[data-tab="login"]');
  await page.fill('.login-email', 'weezer@yev.com');
  await page.fill('.login-password', '123456');
  await page.click('button:has-text("Access Your Memories")');
  await page.waitForURL('**/dashboard.html');

  // Go to My Files
  await page.goto('http://localhost:8357/pages/my-files.html');
  await page.waitForSelector('#filesContainer:visible, #emptyState:visible');

  // Check file status
  const fileData = await page.evaluate(() => {
    const fileElements = document.querySelectorAll('.file-grid-item, .file-list-item');
    const files = [];
    
    fileElements.forEach((el) => {
      const vectorizeBtn = el.querySelector('button[title*="Vector"], .action-icon[title*="Vector"]');
      const fileName = el.querySelector('.file-grid-name, .file-name')?.textContent;
      files.push({
        fileName: fileName,
        hasVectorizeButton: !!vectorizeBtn,
        vectorizeBtnHTML: vectorizeBtn ? vectorizeBtn.outerHTML : 'No button',
        elementHTML: el.innerHTML.substring(0, 300)
      });
    });
    
    return files;
  });
  
  console.log('Files found:', JSON.stringify(fileData, null, 2));
  
  // Check if faces tab shows count
  const facesTab = await page.locator('[data-filter="faces"]').textContent();
  console.log('Faces tab text:', facesTab);
  
  // Take screenshot
  await page.screenshot({ path: 'current-status.png', fullPage: true });
});