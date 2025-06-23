const { chromium } = require('playwright');

(async () => {
  console.log('🧪 Checking face data storage and display...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000 
  });
  const page = await browser.newPage();

  // Monitor console logs
  page.on('console', msg => {
    console.log(`[BROWSER]: ${msg.text()}`);
  });

  try {
    // Login
    console.log('\n🔐 Logging in...');
    await page.goto('http://localhost:8357/pages/auth.html');
    await page.click('[data-tab="login"]');
    await page.fill('.login-email', 'weezer@yev.com');
    await page.fill('.login-password', '123456');
    await page.click('button:has-text("Access Your Memories")');
    await page.waitForURL('**/dashboard.html');

    // Go to My Files
    console.log('\n📁 Navigating to My Files...');
    await page.goto('http://localhost:8357/pages/my-files.html');
    await page.waitForTimeout(5000);

    // Check Firebase data for face information
    console.log('\n🔍 Checking Firebase data for faces...');
    const faceData = await page.evaluate(async () => {
      try {
        // Import Firebase services
        const { db } = await import('./js/firebase-config.js');
        const { getDoc, doc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        
        const user = window.currentUser;
        if (!user) {
          return { error: 'No user found' };
        }
        
        // Check specific files that were processed
        const filesToCheck = [
          'file_1750545264148_o9tqlz8ly', // test-image5.jpg
          'file_1750545229317_zmjiyv0es', // Previously processed file
          'file_1750545218906_ggq5c3dzv'  // test-image1.jpg (just processed)
        ];
        
        const results = [];
        
        for (const fileId of filesToCheck) {
          try {
            const docRef = doc(db, 'users', user.uid, 'files', fileId);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
              const data = docSnap.data();
              results.push({
                fileId,
                fileName: data.fileName,
                hasExtractedFaces: !!data.extractedFaces,
                faceCount: data.extractedFaces ? data.extractedFaces.length : 0,
                extractedFaces: data.extractedFaces || [],
                vectorizationStatus: data.vectorizationStatus,
                processed: data.processed,
                artifactProcessorVersion: data.artifactProcessorVersion
              });
            } else {
              results.push({
                fileId,
                error: 'Document not found'
              });
            }
          } catch (error) {
            results.push({
              fileId,
              error: error.message
            });
          }
        }
        
        return { 
          success: true, 
          results,
          currentFiles: window.currentFiles?.map(f => ({
            id: f.id,
            fileName: f.fileName,
            faceCount: f.faceCount,
            extractedFaces: f.extractedFaces?.length || 0
          })) || []
        };
        
      } catch (error) {
        return { error: error.message };
      }
    });
    
    console.log('\n📊 Face data check results:');
    console.log(JSON.stringify(faceData, null, 2));
    
    // Check UI rendering of face overlays
    console.log('\n🎨 Checking UI face overlay rendering...');
    const uiData = await page.evaluate(() => {
      // Look for face overlay elements
      const faceOverlays = document.querySelectorAll('.face-overlay, [data-face], .face-box, .bounding-box');
      const faceCards = document.querySelectorAll('[data-face-count], .face-count');
      const fileCards = document.querySelectorAll('.file-card, .file-item');
      
      return {
        faceOverlays: faceOverlays.length,
        faceCards: faceCards.length,
        totalFileCards: fileCards.length,
        overlayElements: Array.from(faceOverlays).map(el => ({
          className: el.className,
          innerHTML: el.innerHTML.substring(0, 100)
        })),
        faceCountElements: Array.from(faceCards).map(el => ({
          className: el.className,
          textContent: el.textContent
        }))
      };
    });
    
    console.log('\n🎨 UI overlay check:');
    console.log(JSON.stringify(uiData, null, 2));

  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    console.log('\n🏁 Face data storage check complete');
    await browser.close();
  }
})();