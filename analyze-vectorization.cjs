const { chromium } = require('playwright');

async function analyzeVectorization() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log('🔍 Analyzing vectorization implementation...');
  
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
  
  // Analyze vectorization data
  const vectorizationData = await page.evaluate(async () => {
    // Get files with vectorization data
    const { getUserFiles } = await import('./js/file-service.js');
    const result = await getUserFiles();
    const files = result?.files || [];
    
    // Find files with vectorization info
    const vectorizedFiles = files.filter(f => f.vectorizationStatus || f.extractedFaces);
    
    return {
      totalFiles: files.length,
      filesWithVectorization: vectorizedFiles.length,
      examples: vectorizedFiles.slice(0, 3).map(f => ({
        id: f.id,
        fileName: f.fileName || f.name,
        vectorizationStatus: f.vectorizationStatus,
        extractedFaces: f.extractedFaces,
        vectorizationCompletedAt: f.vectorizationCompletedAt
      })),
      // Check for vectorization UI elements
      hasVectorizeButton: !!document.querySelector('.btn-batch-vectorize'),
      hasFaceIndicators: document.querySelectorAll('.face-indicator').length > 0
    };
  });
  
  console.log('📊 Vectorization Analysis:');
  console.log(JSON.stringify(vectorizationData, null, 2));
  
  // Check for artifact processor configuration
  const endpoints = await page.evaluate(() => {
    return {
      artifactProcessor: window.ORCHESTRATION_ENDPOINTS?.ARTIFACT_PROCESSOR,
      devArtifactProcessor: window.ORCHESTRATION_ENDPOINTS?.DEV?.ARTIFACT_PROCESSOR
    };
  });
  
  console.log('🌐 Artifact Processor Endpoints:');
  console.log(JSON.stringify(endpoints, null, 2));
  
  await browser.close();
}

analyzeVectorization().catch(console.error);