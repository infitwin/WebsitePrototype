const { test, expect } = require('@playwright/test');

test.describe('My Files Vectorization Debug', () => {
  test('debug face extraction and display', async ({ page }) => {
    // Enable console logging
    page.on('console', msg => console.log(`[Browser ${msg.type()}]:`, msg.text()));
    page.on('pageerror', err => console.log('[Page Error]:', err));

    // Start at auth page to ensure clean login
    console.log('1. Navigating to auth page for login...');
    await page.goto('http://localhost:8357/pages/auth.html');
    
    // Wait for auth page to load
    await page.waitForSelector('[data-tab="login"]', { timeout: 5000 });
    
    // Login
    console.log('2. Logging in...');
    await page.click('[data-tab="login"]');
    await page.fill('.login-email', 'weezer@yev.com');
    await page.fill('.login-password', '123456');
    await page.click('button:has-text("Access Your Memories")');
    
    // Wait for dashboard redirect
    await page.waitForURL('**/dashboard.html', { timeout: 10000 });
    console.log('3. Login successful, navigating to My Files...');
    
    // Navigate to My Files
    await page.goto('http://localhost:8357/pages/my-files.html');
    
    // Wait for page to load - check for visible container or empty state
    await page.waitForSelector('#filesContainer:visible, #emptyState:visible', { timeout: 10000 });
    console.log('3. My Files page loaded');

    // Inject debugging script to monitor face extraction
    await page.evaluate(() => {
      console.log('=== INJECTED DEBUG SCRIPT ACTIVE ===');
      
      // Monitor existing files and faces
      window.debugFaces = async () => {
        console.log('--- Checking current state ---');
        
        // Check files container
        const filesContainer = document.getElementById('filesContainer');
        const fileCount = filesContainer ? filesContainer.children.length : 0;
        console.log(`Files in container: ${fileCount}`);
        
        // Check faces tab and container
        const facesTab = document.querySelector('[data-filter="faces"]');
        const facesContainer = document.getElementById('facesContainer');
        const faceCount = facesContainer ? facesContainer.children.length : 0;
        console.log(`Faces in container: ${faceCount}`);
        
        // Check if faces tab is visible
        if (facesTab) {
          console.log('Faces tab text:', facesTab.textContent);
        }
        
        // Look for face elements in DOM
        const faceElements = document.querySelectorAll('.face-item');
        console.log(`Face elements found: ${faceElements.length}`);
        
        // Check for any images with face data
        const images = document.querySelectorAll('img[alt*="face"], img[src*="face"]');
        console.log(`Face images found: ${images.length}`);
        
        return { fileCount, faceCount, faceElements: faceElements.length };
      };
      
      // Run initial check
      window.debugFaces();
    });

    // Take initial screenshot
    await page.screenshot({ path: 'my-files-initial.png', fullPage: true });

    // Check current state
    const currentState = await page.evaluate(() => window.debugFaces());
    console.log('4. Current state:', currentState);

    // If there are existing files with faces, click on faces tab
    if (currentState.fileCount > 0) {
      console.log('5. Files exist, checking faces tab...');
      
      // Click faces filter
      const facesTab = page.locator('[data-filter="faces"]');
      if (await facesTab.count() > 0) {
        await facesTab.click();
        await page.waitForTimeout(1000);
        
        // Check faces after clicking tab
        const facesState = await page.evaluate(() => window.debugFaces());
        console.log('6. After clicking faces tab:', facesState);
        
        // Take screenshot of faces view
        await page.screenshot({ path: 'my-files-faces-view.png', fullPage: true });
        
        // Check for face thumbnails
        const faceThumbnails = await page.evaluate(() => {
          const faces = [];
          document.querySelectorAll('.face-item').forEach((face, i) => {
            const img = face.querySelector('img');
            faces.push({
              index: i,
              hasImage: !!img,
              imageSrc: img ? img.src.substring(0, 100) + '...' : null,
              altText: img ? img.alt : null,
              innerHTML: face.innerHTML.substring(0, 200) + '...'
            });
          });
          return faces;
        });
        
        console.log('7. Face thumbnails analysis:', JSON.stringify(faceThumbnails, null, 2));
      }
    }

    // If no files exist, we need to upload one
    if (currentState.fileCount === 0) {
      console.log('5. No files found, need to upload a test image...');
      console.log('   Please manually upload an image and re-run the test');
    }

    // Final debug info
    const debugInfo = await page.evaluate(() => {
      return {
        localStorage: Object.keys(localStorage).filter(k => k.includes('file') || k.includes('face')),
        bodyClasses: document.body.className,
        errorElements: document.querySelectorAll('.error').length,
        consoleErrors: window.errors || []
      };
    });
    
    console.log('8. Final debug info:', JSON.stringify(debugInfo, null, 2));
  });
});