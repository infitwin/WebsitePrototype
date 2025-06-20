const { test } = require('@playwright/test');

test('final face debug', async ({ page }) => {
  // Capture console logs
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('face') || text.includes('Face') || text.includes('extract')) {
      console.log(`[Console] ${text}`);
    }
  });

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
  await page.waitForTimeout(3000); // Let everything load

  // Click faces tab directly
  console.log('\n=== CLICKING FACES TAB ===');
  await page.click('[data-filter="faces"]');
  await page.waitForTimeout(3000); // Wait for faces to load

  // Get comprehensive state
  const state = await page.evaluate(() => {
    const result = {
      // Files info
      filesVisible: document.getElementById('filesContainer').style.display !== 'none',
      facesVisible: document.getElementById('facesContainer').style.display !== 'none',
      
      // Faces container content
      facesContainer: {
        exists: !!document.getElementById('facesContainer'),
        innerHTML: document.getElementById('facesContainer')?.innerHTML.substring(0, 1000),
        childCount: document.getElementById('facesContainer')?.children.length
      },
      
      // Empty state
      emptyState: {
        exists: !!document.querySelector('#facesContainer .empty-state'),
        text: document.querySelector('#facesContainer .empty-state')?.textContent
      },
      
      // Face items
      faceItems: Array.from(document.querySelectorAll('.face-item')).map(item => ({
        html: item.outerHTML.substring(0, 300)
      })),
      
      // Images in faces container
      faceImages: Array.from(document.querySelectorAll('#facesContainer img')).map(img => ({
        src: img.src.substring(0, 100),
        alt: img.alt,
        width: img.width,
        height: img.height
      }))
    };
    
    return result;
  });

  console.log('\n=== FACES VIEW STATE ===');
  console.log(JSON.stringify(state, null, 2));

  // Take screenshot
  await page.screenshot({ path: 'final-faces-state.png', fullPage: true });

  // Try to manually trigger face loading
  console.log('\n=== MANUALLY TRIGGERING FACE LOAD ===');
  const manualLoad = await page.evaluate(async () => {
    if (window.loadExtractedFaces) {
      await window.loadExtractedFaces();
      return 'loadExtractedFaces called';
    }
    return 'loadExtractedFaces not available';
  });
  
  console.log(manualLoad);
  
  await page.waitForTimeout(2000);
  
  // Check again after manual load
  const afterManual = await page.evaluate(() => {
    return {
      faceCount: document.querySelectorAll('.face-item').length,
      facesHTML: document.getElementById('facesContainer')?.innerHTML.substring(0, 500)
    };
  });
  
  console.log('\n=== AFTER MANUAL LOAD ===');
  console.log(JSON.stringify(afterManual, null, 2));
});