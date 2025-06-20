const { test } = require('@playwright/test');

test('check existing faces', async ({ page }) => {
  // Inject monitoring
  await page.addInitScript(() => {
    window.FaceMonitor = [];
    
    // Override console to capture face-related logs
    const originalLog = console.log;
    console.log = function(...args) {
      if (args[0] && (args[0].includes('face') || args[0].includes('Face') || args[0].includes('👤'))) {
        window.FaceMonitor.push({
          type: 'log',
          args: args,
          time: new Date().toISOString()
        });
      }
      originalLog.apply(console, args);
    };
  });

  // Login as the user who has files
  await page.goto('http://localhost:8357/pages/auth.html');
  await page.click('[data-tab="login"]');
  await page.fill('.login-email', 'weezer@yev.com');
  await page.fill('.login-password', '123456');
  await page.click('button:has-text("Access Your Memories")');
  await page.waitForURL('**/dashboard.html');

  // Go to My Files
  await page.goto('http://localhost:8357/pages/my-files.html');
  await page.waitForSelector('#filesContainer:visible, #emptyState:visible');
  await page.waitForTimeout(3000); // Let everything load

  // Check if we need to switch users or if files are already there
  const pageState = await page.evaluate(async () => {
    // Get current user
    const userElement = document.querySelector('.viewing-as');
    const currentUser = userElement ? userElement.textContent : 'Unknown';
    
    // Get file count
    const filesContainer = document.getElementById('filesContainer');
    const fileCount = filesContainer ? filesContainer.children.length : 0;
    
    // Look for faces filter
    const facesFilter = document.querySelector('[data-filter="faces"]');
    const facesFilterText = facesFilter ? facesFilter.textContent : 'No faces filter';
    
    // Check if files have extracted faces by querying Firestore directly
    let firestoreCheck = 'Unable to check';
    try {
      const { getUserFiles } = await import('/js/file-service.js');
      const result = await getUserFiles();
      const filesWithFaces = result.files.filter(f => f.extractedFaces && f.extractedFaces.length > 0);
      firestoreCheck = {
        totalFiles: result.files.length,
        filesWithFaces: filesWithFaces.length,
        totalFaces: filesWithFaces.reduce((sum, f) => sum + f.extractedFaces.length, 0),
        fileDetails: result.files.map(f => ({
          name: f.fileName || f.name,
          hasExtractedFaces: !!(f.extractedFaces && f.extractedFaces.length > 0),
          faceCount: f.extractedFaces ? f.extractedFaces.length : 0,
          vectorizationStatus: f.vectorizationStatus
        }))
      };
    } catch (e) {
      firestoreCheck = 'Error: ' + e.message;
    }
    
    return {
      currentUser,
      fileCount,
      facesFilterText,
      firestoreCheck
    };
  });

  console.log('\n=== PAGE STATE ===');
  console.log(JSON.stringify(pageState, null, 2));

  // If there are files with faces, click the faces filter
  if (pageState.firestoreCheck && pageState.firestoreCheck.filesWithFaces > 0) {
    console.log('\n=== CLICKING FACES FILTER ===');
    await page.click('[data-filter="faces"]');
    await page.waitForTimeout(3000);
    
    // Check what happened
    const facesView = await page.evaluate(() => {
      const facesContainer = document.getElementById('facesContainer');
      const faceItems = facesContainer ? facesContainer.querySelectorAll('.face-item') : [];
      
      return {
        visible: facesContainer && facesContainer.style.display !== 'none',
        faceItemCount: faceItems.length,
        firstFaceHTML: faceItems[0] ? faceItems[0].outerHTML.substring(0, 300) : null,
        emptyState: facesContainer ? facesContainer.querySelector('.empty-state')?.textContent : null,
        containerHTML: facesContainer ? facesContainer.innerHTML.substring(0, 500) : null
      };
    });
    
    console.log('\n=== FACES VIEW ===');
    console.log(JSON.stringify(facesView, null, 2));
    
    // Get face monitoring logs
    const faceLogs = await page.evaluate(() => window.FaceMonitor);
    console.log('\n=== FACE-RELATED LOGS ===');
    faceLogs.forEach(log => {
      console.log(`[${log.type}]`, ...log.args);
    });
    
    // Try to manually trigger face loading
    console.log('\n=== MANUAL FACE LOAD ATTEMPT ===');
    const manualLoad = await page.evaluate(async () => {
      // Try to call loadExtractedFaces directly
      if (window.loadExtractedFaces) {
        try {
          console.log('Calling loadExtractedFaces...');
          await window.loadExtractedFaces();
          return 'Success';
        } catch (e) {
          return 'Error: ' + e.message;
        }
      }
      
      // Try to find and call it from the module
      try {
        const myFilesModule = await import('/js/pages/my-files.js');
        if (myFilesModule.loadExtractedFaces) {
          await myFilesModule.loadExtractedFaces();
          return 'Success via module';
        }
      } catch (e) {}
      
      return 'Function not found';
    });
    
    console.log('Manual load result:', manualLoad);
    
    // Check again after manual load
    await page.waitForTimeout(2000);
    const afterManual = await page.evaluate(() => {
      const facesContainer = document.getElementById('facesContainer');
      const faceItems = facesContainer ? facesContainer.querySelectorAll('.face-item') : [];
      return {
        faceItemCount: faceItems.length,
        hasImages: Array.from(faceItems).map(item => !!item.querySelector('img')).filter(Boolean).length
      };
    });
    
    console.log('\n=== AFTER MANUAL LOAD ===');
    console.log(JSON.stringify(afterManual, null, 2));
  }

  // Take screenshot
  await page.screenshot({ path: 'existing-faces-check.png', fullPage: true });
});