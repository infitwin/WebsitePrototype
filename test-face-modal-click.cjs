const { chromium } = require('playwright');

(async () => {
  console.log('🧪 Testing face modal by clicking face indicator...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000 
  });
  const page = await browser.newPage();

  // Monitor console logs
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('showFaces') || text.includes('extractedFaces') || text.includes('face')) {
      console.log(`[BROWSER]: ${text}`);
    }
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

    // Look for face indicators and click one
    console.log('\n👁️ Looking for face indicators...');
    const faceIndicators = await page.locator('.face-indicator').count();
    console.log(`Found ${faceIndicators} face indicators`);

    if (faceIndicators > 0) {
      console.log('\n🖱️ Clicking first face indicator...');
      await page.locator('.face-indicator').first().click();
      await page.waitForTimeout(2000);

      // Check if face modal opened
      const modal = await page.locator('#faceModal').count();
      const modalVisible = await page.locator('#faceModal.active').count();
      
      console.log(`Face modal exists: ${modal > 0}`);
      console.log(`Face modal visible: ${modalVisible > 0}`);

      if (modalVisible > 0) {
        // Check modal content
        const modalContent = await page.locator('#facesModalGrid').textContent();
        console.log(`Modal content: ${modalContent}`);
        
        // Check for face thumbnails
        const faceThumbnails = await page.locator('#facesModalGrid .face-item').count();
        console.log(`Face thumbnails in modal: ${faceThumbnails}`);
      }
    } else {
      console.log('❌ No face indicators found. Checking for files with faces...');
      
      // Check which files have face data
      const fileData = await page.evaluate(() => {
        const files = window.currentFiles || [];
        return files.map(f => ({
          id: f.id,
          fileName: f.fileName,
          faceCount: f.faceCount,
          extractedFaces: f.extractedFaces?.length || 0,
          hasExtractedFaces: !!f.extractedFaces
        }));
      });
      
      console.log('📊 File face data:');
      fileData.forEach(f => {
        if (f.faceCount > 0 || f.extractedFaces > 0) {
          console.log(`  - ${f.fileName}: faceCount=${f.faceCount}, extractedFaces=${f.extractedFaces}`);
        }
      });
    }

  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    console.log('\n🏁 Face modal test complete');
    await browser.close();
  }
})();