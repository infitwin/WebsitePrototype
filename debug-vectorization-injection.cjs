const { chromium } = require('playwright');

async function debugVectorizationInjection() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log('🧪 Debugging vectorization with code injection...');
  
  // Monitor all console logs and errors
  page.on('console', msg => {
    console.log('BROWSER:', msg.type().toUpperCase(), msg.text());
  });
  
  page.on('dialog', async dialog => {
    console.log('🚨 DIALOG:', dialog.message());
    if (dialog.message().includes('Vectorize')) {
      await dialog.accept(); // Accept vectorization confirmation
    } else {
      await dialog.dismiss();
    }
  });
  
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
  await page.waitForTimeout(5000);
  
  // INJECT DEBUG CODE
  await page.evaluate(() => {
    console.log('🔍 DEBUGGING INJECTION STARTED');
    
    // Check if ORCHESTRATION_ENDPOINTS exists
    console.log('🔍 ORCHESTRATION_ENDPOINTS:', typeof window.ORCHESTRATION_ENDPOINTS);
    console.log('🔍 ORCHESTRATION_ENDPOINTS value:', window.ORCHESTRATION_ENDPOINTS);
    
    // If it doesn't exist, create it
    if (!window.ORCHESTRATION_ENDPOINTS) {
      console.log('🔧 Creating ORCHESTRATION_ENDPOINTS...');
      window.ORCHESTRATION_ENDPOINTS = {
        ARTIFACT_PROCESSOR: 'https://artifact-processor-nfnrbhgy5a-uc.a.run.app/process-image'
      };
      console.log('✅ ORCHESTRATION_ENDPOINTS created:', window.ORCHESTRATION_ENDPOINTS);
    }
    
    // Override the performVectorization function to add debug logging
    const originalPerformVectorization = window.performVectorization;
    if (typeof performVectorization !== 'undefined') {
      console.log('🔧 Overriding performVectorization for debugging...');
      window.performVectorization = async function(fileIds) {
        console.log('🚀 performVectorization called with:', fileIds);
        console.log('🔍 ORCHESTRATION_ENDPOINTS.ARTIFACT_PROCESSOR:', window.ORCHESTRATION_ENDPOINTS?.ARTIFACT_PROCESSOR);
        console.log('🔍 window.currentFiles length:', window.currentFiles?.length);
        
        // Process each file
        for (const fileId of fileIds) {
          const file = window.currentFiles?.find(f => f.id === fileId);
          console.log('🔍 Processing file:', fileId);
          console.log('🔍 Found file object:', file);
          
          if (!file) {
            console.log('❌ File not found in currentFiles');
            continue;
          }
          
          try {
            console.log('🔄 Making fetch request to:', window.ORCHESTRATION_ENDPOINTS.ARTIFACT_PROCESSOR);
            
            const requestBody = {
              fileId: file.id,
              fileName: file.fileName || file.name,
              fileUrl: file.downloadURL,
              contentType: file.fileType || 'image/jpeg'
            };
            console.log('🔍 Request body:', requestBody);
            
            const response = await fetch(window.ORCHESTRATION_ENDPOINTS.ARTIFACT_PROCESSOR, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(requestBody)
            });
            
            console.log('📡 Response status:', response.status);
            console.log('📡 Response ok:', response.ok);
            
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            console.log('✅ Vectorization result:', result);
            
          } catch (error) {
            console.log('❌ Vectorization error for file:', fileId, error);
          }
        }
        
        console.log('✅ performVectorization completed');
      };
    }
  });
  
  // Select an image file
  const imageCard = await page.locator('.file-card').filter({
    has: page.locator('img.file-thumbnail')
  }).first();
  
  if (await imageCard.count() > 0) {
    console.log('📌 Selecting image file...');
    await imageCard.hover();
    await page.waitForTimeout(500);
    
    const checkbox = imageCard.locator('.file-checkbox');
    await checkbox.check();
    await page.waitForTimeout(1000);
    
    console.log('🔄 Clicking Vectorize Selected...');
    await page.click('#vectorizeBtn');
    await page.waitForTimeout(5000); // Wait longer for vectorization
    
    // Check for any faces that were extracted
    await page.evaluate(() => {
      console.log('🔍 Checking for extracted faces...');
      const faceIndicators = document.querySelectorAll('.face-indicator');
      console.log('🔍 Face indicators found:', faceIndicators.length);
      
      // Check if any files have face data
      if (window.currentFiles) {
        window.currentFiles.forEach(file => {
          if (file.faceCount > 0 || file.extractedFaces?.length > 0) {
            console.log('👤 File with faces:', file.fileName, 'faces:', file.faceCount || file.extractedFaces?.length);
          }
        });
      }
    });
  }
  
  await page.waitForTimeout(3000);
  await browser.close();
}

debugVectorizationInjection().catch(console.error);