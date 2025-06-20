const { chromium } = require('playwright');

async function checkVectorization() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Capture console logs
  page.on('console', msg => {
    if (msg.text().includes('vectorization') || msg.text().includes('extractedFaces')) {
      console.log('BROWSER:', msg.text());
    }
  });
  
  console.log('🔍 Checking vectorization structure...');
  
  // Login
  await page.goto('http://localhost:8357/pages/my-files.html');
  await page.waitForTimeout(2000);
  await page.click('[data-tab="login"]');
  await page.fill('.login-email', 'weezer@yev.com');
  await page.fill('.login-password', '123456');
  await page.click('button:has-text("Access Your Memories")');
  await page.waitForTimeout(3000);
  
  const skipBtn = await page.locator('button:has-text("Skip")').count();
  if (skipBtn > 0) {
    await page.click('button:has-text("Skip")');
    await page.waitForTimeout(2000);
  }
  
  await page.goto('http://localhost:8357/pages/my-files.html');
  await page.waitForTimeout(8000);
  
  // Check for face indicators and vectorization UI
  const uiElements = await page.evaluate(() => {
    // Check face indicators
    const faceIndicators = document.querySelectorAll('.face-indicator');
    const faceData = Array.from(faceIndicators).map(indicator => ({
      text: indicator.textContent.trim(),
      onclick: indicator.onclick ? 'has onclick handler' : 'no handler'
    }));
    
    // Check if currentFiles has vectorization data
    const firstFileWithFaces = window.currentFiles?.find(f => 
      f.extractedFaces?.length > 0 || f.faceCount > 0
    );
    
    return {
      faceIndicatorsCount: faceIndicators.length,
      faceIndicatorData: faceData.slice(0, 3),
      hasCurrentFiles: !!window.currentFiles,
      currentFilesLength: window.currentFiles?.length || 0,
      firstFileWithFaces: firstFileWithFaces ? {
        fileName: firstFileWithFaces.fileName || firstFileWithFaces.name,
        extractedFacesCount: firstFileWithFaces.extractedFaces?.length || 0,
        faceCount: firstFileWithFaces.faceCount || 0,
        vectorizationStatus: firstFileWithFaces.vectorizationStatus
      } : null
    };
  });
  
  console.log('📊 UI Elements and Data:');
  console.log(JSON.stringify(uiElements, null, 2));
  
  // Check artifact processor URL
  const endpoints = await page.evaluate(() => {
    return {
      artifactProcessor: window.ORCHESTRATION_ENDPOINTS?.ARTIFACT_PROCESSOR || 'Not found',
      isLocalhost: window.location.hostname === 'localhost'
    };
  });
  
  console.log('🌐 Endpoints:', endpoints);
  
  await browser.close();
}

checkVectorization().catch(console.error);