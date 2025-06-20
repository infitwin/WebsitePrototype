const { test } = require('@playwright/test');

test('check firestore state', async ({ page }) => {
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

  // Check Firestore data directly
  const firestoreData = await page.evaluate(async () => {
    const { getUserFiles } = await import('./js/file-service.js');
    const result = await getUserFiles();
    
    // Get detailed info about each file
    const detailedFiles = result.files.map(file => ({
      id: file.id,
      fileName: file.fileName || file.name,
      hasExtractedFaces: !!file.extractedFaces,
      facesCount: file.extractedFaces ? file.extractedFaces.length : 0,
      vectorizationStatus: file.vectorizationStatus,
      extractedFaces: file.extractedFaces ? file.extractedFaces.slice(0, 2) : null // First 2 faces
    }));
    
    return detailedFiles;
  });
  
  console.log('\n=== FIRESTORE FILE DATA ===');
  console.log(JSON.stringify(firestoreData, null, 2));
  
  // Check DOM state
  const domState = await page.evaluate(() => {
    // Check file grid items
    const fileItems = Array.from(document.querySelectorAll('.file-grid-item')).map(el => {
      const actions = Array.from(el.querySelectorAll('.action-icon')).map(a => a.title);
      return {
        fileName: el.querySelector('.file-grid-name')?.textContent,
        actions: actions
      };
    });
    
    // Check faces tab
    const facesTab = document.querySelector('[data-filter="faces"]');
    const facesTabText = facesTab ? facesTab.textContent : 'No faces tab';
    
    return {
      fileItems,
      facesTabText
    };
  });
  
  console.log('\n=== DOM STATE ===');
  console.log(JSON.stringify(domState, null, 2));
  
  // Click on faces tab if it exists
  const facesTab = page.locator('[data-filter="faces"]');
  if (await facesTab.count() > 0) {
    await facesTab.click();
    await page.waitForTimeout(2000);
    
    const facesState = await page.evaluate(() => {
      const container = document.getElementById('facesContainer');
      const faceItems = container ? Array.from(container.querySelectorAll('.face-item')) : [];
      
      return {
        containerExists: !!container,
        faceCount: faceItems.length,
        firstFaceHTML: faceItems[0] ? faceItems[0].innerHTML.substring(0, 200) : 'No faces'
      };
    });
    
    console.log('\n=== FACES STATE ===');
    console.log(JSON.stringify(facesState, null, 2));
  }
  
  await page.screenshot({ path: 'firestore-state-check.png', fullPage: true });
});