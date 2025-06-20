const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

test('vectorization with heavy injection monitoring', async ({ page }) => {
  // Inject monitoring script BEFORE navigation
  await page.addInitScript(() => {
    console.log('🚀 INJECTION SCRIPT LOADED');
    
    // Create global monitoring object
    window.VectorMonitor = {
      logs: [],
      requests: [],
      responses: [],
      firestoreOps: [],
      domChanges: [],
      errors: []
    };
    
    // Override console methods to capture everything
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    
    console.log = function(...args) {
      window.VectorMonitor.logs.push({
        type: 'log',
        time: new Date().toISOString(),
        args: args
      });
      originalLog.apply(console, args);
    };
    
    console.error = function(...args) {
      window.VectorMonitor.errors.push({
        type: 'error',
        time: new Date().toISOString(),
        args: args
      });
      originalError.apply(console, args);
    };
    
    console.warn = function(...args) {
      window.VectorMonitor.logs.push({
        type: 'warn',
        time: new Date().toISOString(),
        args: args
      });
      originalWarn.apply(console, args);
    };
    
    // Override fetch to monitor API calls
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
      const url = args[0];
      const options = args[1] || {};
      
      window.VectorMonitor.requests.push({
        url: url,
        method: options.method || 'GET',
        time: new Date().toISOString()
      });
      
      return originalFetch.apply(this, args).then(response => {
        // Clone response to read it
        const clonedResponse = response.clone();
        
        if (url.includes('process-webhook') || url.includes('vectoriz')) {
          clonedResponse.json().then(data => {
            window.VectorMonitor.responses.push({
              url: url,
              status: response.status,
              data: data,
              time: new Date().toISOString()
            });
          }).catch(() => {
            clonedResponse.text().then(text => {
              window.VectorMonitor.responses.push({
                url: url,
                status: response.status,
                text: text,
                time: new Date().toISOString()
              });
            });
          });
        }
        
        return response;
      }).catch(error => {
        window.VectorMonitor.errors.push({
          type: 'fetch-error',
          url: url,
          error: error.message,
          time: new Date().toISOString()
        });
        throw error;
      });
    };
    
    // Monitor DOM changes
    window.VectorMonitor.startDOMMonitoring = () => {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList') {
            mutation.addedNodes.forEach(node => {
              if (node.nodeType === 1) { // Element node
                const info = {
                  type: 'added',
                  tagName: node.tagName,
                  className: node.className,
                  id: node.id,
                  time: new Date().toISOString()
                };
                
                // Special monitoring for face-related elements
                if (node.className && (node.className.includes('face') || node.className.includes('Face'))) {
                  info.special = 'FACE_ELEMENT';
                  info.innerHTML = node.innerHTML.substring(0, 200);
                }
                
                window.VectorMonitor.domChanges.push(info);
              }
            });
          }
        });
      });
      
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    };
  });
  
  // Also capture console from outside
  page.on('console', msg => {
    console.log(`[Browser ${msg.type()}]:`, msg.text());
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
  await page.waitForSelector('#filesContainer:visible, #emptyState:visible');
  
  // Start DOM monitoring
  await page.evaluate(() => {
    window.VectorMonitor.startDOMMonitoring();
    console.log('📹 DOM monitoring started');
  });

  // Check current state
  const initialState = await page.evaluate(() => {
    const filesContainer = document.getElementById('filesContainer');
    const files = filesContainer ? filesContainer.querySelectorAll('.file-grid-item, .file-list-item') : [];
    return {
      fileCount: files.length,
      hasEmptyState: !!document.getElementById('emptyState')
    };
  });
  
  console.log('\n=== INITIAL STATE ===');
  console.log('Files:', initialState.fileCount);
  console.log('Empty state:', initialState.hasEmptyState);

  if (initialState.fileCount === 0) {
    console.log('\n=== UPLOADING TEST IMAGE ===');
    
    // Create a test image
    const testImagePath = path.join(__dirname, 'test-face-image.jpg');
    
    // Use a simple base64 image with a face (1x1 red pixel for testing)
    const base64Image = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
    const buffer = Buffer.from(base64Image, 'base64');
    fs.writeFileSync(testImagePath, buffer);
    
    // Upload the file - be specific about which input
    const fileInput = await page.locator('#fileInput');
    await fileInput.setInputFiles(testImagePath);
    
    // Wait for upload
    await page.waitForTimeout(5000);
    
    // Clean up test file
    fs.unlinkSync(testImagePath);
    
    console.log('Test image uploaded');
  }

  // Look for vectorize button
  await page.waitForTimeout(2000);
  const vectorizeButton = await page.locator('.action-icon[title*="Vector"], button:has-text("Vectorize")').first();
  
  if (await vectorizeButton.count() > 0) {
    console.log('\n=== CLICKING VECTORIZE ===');
    
    // Clear monitor logs before vectorization
    await page.evaluate(() => {
      window.VectorMonitor.logs = [];
      window.VectorMonitor.requests = [];
      window.VectorMonitor.responses = [];
      console.log('🧹 Monitor cleared for vectorization');
    });
    
    // Click vectorize
    await vectorizeButton.click();
    
    // Wait for vectorization
    console.log('Waiting for vectorization...');
    await page.waitForTimeout(10000);
    
    // Get all monitoring data
    const monitorData = await page.evaluate(() => window.VectorMonitor);
    
    console.log('\n=== VECTORIZATION LOGS ===');
    monitorData.logs.forEach(log => {
      if (log.args[0] && (log.args[0].includes('vector') || log.args[0].includes('face'))) {
        console.log(`[${log.type}]`, ...log.args);
      }
    });
    
    console.log('\n=== API REQUESTS ===');
    monitorData.requests.forEach(req => {
      if (req.url.includes('process-webhook') || req.url.includes('vector')) {
        console.log(`${req.method} ${req.url}`);
      }
    });
    
    console.log('\n=== API RESPONSES ===');
    monitorData.responses.forEach(resp => {
      console.log(`Response from ${resp.url}:`);
      console.log(`Status: ${resp.status}`);
      console.log(`Data:`, JSON.stringify(resp.data || resp.text, null, 2));
    });
    
    console.log('\n=== ERRORS ===');
    if (monitorData.errors.length > 0) {
      monitorData.errors.forEach(err => {
        console.log(`[${err.type}]`, err);
      });
    } else {
      console.log('No errors detected');
    }
    
    console.log('\n=== DOM CHANGES (Face-related) ===');
    const faceChanges = monitorData.domChanges.filter(change => 
      change.special === 'FACE_ELEMENT' || 
      (change.className && change.className.includes('face'))
    );
    faceChanges.forEach(change => {
      console.log(`${change.type}: ${change.tagName}.${change.className}`);
    });
  }

  // Click faces tab
  console.log('\n=== CHECKING FACES TAB ===');
  
  // Inject function to manually check faces
  const facesData = await page.evaluate(async () => {
    // Look for faces filter button
    const facesFilter = document.querySelector('[data-filter="faces"]');
    if (!facesFilter) {
      return { error: 'No faces filter found' };
    }
    
    // Click it
    facesFilter.click();
    
    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check faces container
    const facesContainer = document.getElementById('facesContainer');
    if (!facesContainer) {
      return { error: 'No faces container' };
    }
    
    // Get current content
    const faceItems = facesContainer.querySelectorAll('.face-item');
    const emptyState = facesContainer.querySelector('.empty-state');
    
    // Also manually call loadExtractedFaces if available
    let manualLoadResult = 'Function not available';
    if (window.loadExtractedFaces) {
      try {
        await window.loadExtractedFaces();
        manualLoadResult = 'Called successfully';
      } catch (e) {
        manualLoadResult = 'Error: ' + e.message;
      }
    }
    
    return {
      containerVisible: facesContainer.style.display !== 'none',
      faceCount: faceItems.length,
      hasEmptyState: !!emptyState,
      emptyStateText: emptyState ? emptyState.textContent : null,
      containerHTML: facesContainer.innerHTML.substring(0, 500),
      manualLoadResult: manualLoadResult
    };
  });
  
  console.log('\n=== FACES RESULT ===');
  console.log(JSON.stringify(facesData, null, 2));
  
  // Take final screenshot
  await page.screenshot({ path: 'vectorization-injection-result.png', fullPage: true });
  
  // Get final monitor summary
  const finalSummary = await page.evaluate(() => {
    return {
      totalLogs: window.VectorMonitor.logs.length,
      totalRequests: window.VectorMonitor.requests.length,
      totalResponses: window.VectorMonitor.responses.length,
      totalErrors: window.VectorMonitor.errors.length,
      totalDOMChanges: window.VectorMonitor.domChanges.length,
      faceRelatedLogs: window.VectorMonitor.logs.filter(l => 
        l.args[0] && (l.args[0].includes('face') || l.args[0].includes('Face'))
      ).length
    };
  });
  
  console.log('\n=== MONITOR SUMMARY ===');
  console.log(JSON.stringify(finalSummary, null, 2));
});