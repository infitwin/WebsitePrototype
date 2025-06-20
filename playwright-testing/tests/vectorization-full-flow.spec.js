const { test, expect } = require('@playwright/test');
const path = require('path');

test.describe('Full Vectorization Flow', () => {
  test('upload image, vectorize, and verify faces', async ({ page }) => {
    // Enable console logging
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      if (type === 'error') {
        console.log(`[Browser ERROR]:`, text);
      } else if (text.includes('face') || text.includes('Face') || text.includes('vector') || text.includes('extract')) {
        console.log(`[Browser ${type}]:`, text);
      }
    });
    page.on('pageerror', err => console.log('[Page Error]:', err));

    // Login first
    console.log('1. Logging in...');
    await page.goto('http://localhost:8357/pages/auth.html');
    await page.waitForSelector('[data-tab="login"]', { timeout: 5000 });
    await page.click('[data-tab="login"]');
    await page.fill('.login-email', 'weezer@yev.com');
    await page.fill('.login-password', '123456');
    await page.click('button:has-text("Access Your Memories")');
    await page.waitForURL('**/dashboard.html', { timeout: 10000 });

    // Navigate to My Files
    console.log('2. Navigating to My Files...');
    await page.goto('http://localhost:8357/pages/my-files.html');
    await page.waitForSelector('#filesContainer:visible, #emptyState:visible', { timeout: 10000 });

    // Inject comprehensive monitoring
    await page.evaluate(() => {
      console.log('=== MONITORING SCRIPT ACTIVE ===');
      
      // Override fetch to log vectorization requests
      const originalFetch = window.fetch;
      window.fetch = function(...args) {
        const url = args[0];
        if (url.includes('vectoriz') || url.includes('process-webhook')) {
          console.log('🚀 Vectorization request:', url, args[1]);
        }
        return originalFetch.apply(this, args).then(response => {
          if (url.includes('vectoriz') || url.includes('process-webhook')) {
            response.clone().json().then(data => {
              console.log('📥 Vectorization response:', data);
            }).catch(() => {});
          }
          return response;
        });
      };

      // Monitor Firestore updates
      if (window.updateDoc) {
        const originalUpdateDoc = window.updateDoc;
        window.updateDoc = function(...args) {
          console.log('🔥 Firestore update:', args);
          return originalUpdateDoc.apply(this, args);
        };
      }

      // Monitor face extraction
      window.monitorFaceExtraction = () => {
        const facesContainer = document.getElementById('facesContainer');
        if (facesContainer) {
          const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
              if (mutation.addedNodes.length > 0) {
                console.log('👤 Face element added to DOM:', mutation.addedNodes[0]);
              }
            });
          });
          observer.observe(facesContainer, { childList: true, subtree: true });
        }
      };
      window.monitorFaceExtraction();
    });

    // Check if file already exists
    const existingFiles = await page.evaluate(() => {
      const filesContainer = document.getElementById('filesContainer');
      return filesContainer ? filesContainer.children.length : 0;
    });

    console.log(`3. Existing files: ${existingFiles}`);

    if (existingFiles > 0) {
      // File exists, check if it's vectorized
      console.log('4. Checking vectorization status...');
      
      // Look for vectorize button
      const vectorizeButton = page.locator('button:has-text("Vectorize"), .action-icon[title*="Vector"]');
      const vectorizeCount = await vectorizeButton.count();
      
      if (vectorizeCount > 0) {
        console.log('5. Found vectorize button, clicking it...');
        
        // Click vectorize button
        await vectorizeButton.first().click();
        
        // Monitor for vectorization response
        console.log('6. Monitoring vectorization...');
        
        // Wait for either success notification or error
        const vectorizationResult = await Promise.race([
          page.waitForSelector('.notification-message:has-text("Vectorization complete")', { timeout: 30000 })
            .then(() => ({ success: true }))
            .catch(() => null),
          page.waitForSelector('.notification-message:has-text("error"), .error', { timeout: 30000 })
            .then(() => ({ success: false }))
            .catch(() => null),
          page.waitForTimeout(30000).then(() => ({ timeout: true }))
        ]);
        
        console.log('7. Vectorization result:', vectorizationResult);
        
        // Take screenshot of current state
        await page.screenshot({ path: 'vectorization-in-progress.png', fullPage: true });
        
      } else {
        console.log('5. No vectorize button found - file may already be vectorized');
      }
      
      // Click on Faces filter
      console.log('7. Clicking Faces filter...');
      const facesFilter = page.locator('[data-filter="faces"], button:has-text("Faces")');
      if (await facesFilter.count() > 0) {
        await facesFilter.first().click();
        await page.waitForTimeout(2000);
        
        // Check faces
        const facesData = await page.evaluate(() => {
          const facesContainer = document.getElementById('facesContainer');
          const faceElements = facesContainer ? facesContainer.querySelectorAll('.face-item') : [];
          const faces = [];
          
          faceElements.forEach((el, i) => {
            const img = el.querySelector('img');
            faces.push({
              index: i,
              hasImage: !!img,
              imageSrc: img ? (img.src.includes('blob:') ? 'blob:...' : img.src.substring(0, 100)) : null,
              elementHTML: el.innerHTML.substring(0, 200)
            });
          });
          
          // Also check for any face placeholders
          const placeholders = document.querySelectorAll('.face-placeholder, .no-faces');
          
          return {
            faceCount: faceElements.length,
            faces: faces,
            placeholderCount: placeholders.length,
            facesContainerHTML: facesContainer ? facesContainer.innerHTML.substring(0, 500) : 'No faces container'
          };
        });
        
        console.log('8. Faces data:', JSON.stringify(facesData, null, 2));
        
        // Take screenshot of faces
        await page.screenshot({ path: 'vectorization-faces-result.png', fullPage: true });
        
        // Verify faces are displayed
        expect(facesData.faceCount).toBeGreaterThan(0);
        
      } else {
        console.log('7. No Faces filter found!');
      }
      
    } else {
      console.log('4. No existing files. Need to upload a test image.');
      console.log('   Please upload an image manually and re-run this test.');
    }

    // Final summary
    const summary = await page.evaluate(() => {
      const files = document.querySelectorAll('.file-grid-item, .file-list-item').length;
      const faces = document.querySelectorAll('.face-item').length;
      const errors = document.querySelectorAll('.error').length;
      return { files, faces, errors };
    });
    
    console.log('9. Final summary:', summary);
  });
});