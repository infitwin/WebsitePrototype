const { test } = require('@playwright/test');

test('simple face check', async ({ page }) => {
  // Login
  await page.goto('http://localhost:8357/pages/auth.html');
  await page.click('[data-tab="login"]');
  await page.fill('.login-email', 'weezer@yev.com');
  await page.fill('.login-password', '123456');
  await page.click('button:has-text("Access Your Memories")');
  await page.waitForURL('**/dashboard.html');

  // Go to My Files
  await page.goto('http://localhost:8357/pages/my-files.html');
  await page.waitForSelector('#filesContainer:visible');
  
  // Wait for files to load
  await page.waitForTimeout(2000);

  // Check file status
  const fileInfo = await page.evaluate(() => {
    const fileEl = document.querySelector('.file-grid-item');
    if (!fileEl) return { error: 'No file found' };
    
    const fileName = fileEl.querySelector('.file-grid-name')?.textContent;
    const hasVectorizeBtn = !!fileEl.querySelector('[title*="Vector"]');
    const actionButtons = Array.from(fileEl.querySelectorAll('.action-icon')).map(a => a.title);
    
    return {
      fileName,
      hasVectorizeBtn,
      actionButtons
    };
  });
  
  console.log('File info:', fileInfo);
  
  // If file needs vectorization
  if (fileInfo.hasVectorizeBtn) {
    console.log('File needs vectorization, clicking button...');
    await page.click('.action-icon[title*="Vector"]');
    
    // Wait and check for notifications
    await page.waitForTimeout(5000);
    
    const notification = await page.evaluate(() => {
      const notif = document.querySelector('.notification-message');
      return notif ? notif.textContent : 'No notification';
    });
    
    console.log('Notification:', notification);
  } else {
    console.log('File already vectorized (no vectorize button)');
  }
  
  // Click faces tab
  console.log('Clicking faces tab...');
  await page.click('[data-filter="faces"]');
  await page.waitForTimeout(2000);
  
  // Check faces container
  const facesInfo = await page.evaluate(() => {
    const container = document.getElementById('facesContainer');
    if (!container) return { error: 'No faces container' };
    
    const emptyState = container.querySelector('.empty-state');
    if (emptyState) {
      return {
        empty: true,
        message: emptyState.textContent
      };
    }
    
    const faceItems = container.querySelectorAll('.face-item');
    const faces = Array.from(faceItems).map((face, i) => {
      const img = face.querySelector('img');
      return {
        index: i,
        hasImage: !!img,
        imgSrc: img ? (img.src.includes('blob:') ? 'blob:...' : img.src.substring(0, 50) + '...') : null
      };
    });
    
    return {
      empty: false,
      faceCount: faces.length,
      faces: faces
    };
  });
  
  console.log('Faces info:', JSON.stringify(facesInfo, null, 2));
  
  // Take screenshot
  await page.screenshot({ path: 'simple-face-check.png', fullPage: true });
});