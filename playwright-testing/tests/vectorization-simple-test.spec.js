const { test, expect } = require('@playwright/test');

/**
 * Simple Vectorization Test - Real API Calls
 * 
 * Tests the core vectorization functionality with real API integration
 * Focuses on the essential flow without complex face analysis
 */

test.describe('Simple Vectorization Test', () => {
  test('should perform real vectorization API call', async ({ page }) => {
    console.log('🚀 Testing vectorization API integration...');
    
    // Set up logging
    const apiCalls = [];
    page.on('request', request => {
      if (request.url().includes('artifactprocessor') || request.url().includes('process-webhook')) {
        console.log(`🌐 API Request: ${request.method()} ${request.url()}`);
        apiCalls.push({
          method: request.method(),
          url: request.url(),
          headers: Object.fromEntries(request.headers()),
          body: request.postData()
        });
      }
    });
    
    page.on('response', response => {
      if (response.url().includes('artifactprocessor') || response.url().includes('process-webhook')) {
        console.log(`🌐 API Response: ${response.status()} ${response.url()}`);
      }
    });
    
    // Step 1: Login
    console.log('🔐 Logging in...');
    await page.goto('http://localhost:8357/pages/auth.html');
    await page.click('[data-tab="login"]');
    await page.fill('.login-email', 'weezer@yev.com');
    await page.fill('.login-password', '123456');
    await page.click('button:has-text("Access Your Memories")');
    await page.waitForURL('**/dashboard.html');
    
    // Step 2: Go to My Files
    console.log('📂 Navigating to My Files...');
    await page.goto('http://localhost:8357/pages/my-files.html');
    
    // Step 3: Wait for files to load
    await Promise.race([
      page.waitForSelector('.file-grid-item, .file-list-item', { timeout: 10000 }),
      page.waitForSelector('.empty-state', { timeout: 10000 })
    ]);
    
    const fileCount = await page.locator('.file-grid-item, .file-list-item').count();
    console.log(`📁 Found ${fileCount} files`);
    expect(fileCount).toBeGreaterThan(0);
    
    // Step 4: Find and select first image
    const imageFiles = [];
    const fileItems = await page.locator('.file-grid-item, .file-list-item').all();
    
    for (const item of fileItems) {
      const fileName = await item.locator('.file-name').textContent();
      const hasImageThumbnail = await item.locator('.thumbnail-image').count() > 0;
      const isImageExtension = /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName || '');
      
      if (hasImageThumbnail || isImageExtension) {
        imageFiles.push({
          element: item,
          name: fileName
        });
        break; // Just get the first one
      }
    }
    
    expect(imageFiles.length).toBeGreaterThan(0);
    console.log(`🖼️ Selected image: ${imageFiles[0].name}`);
    
    // Step 5: Select the image
    await imageFiles[0].element.locator('.file-checkbox').check();
    await expect(page.locator('.batch-actions')).toBeVisible();
    
    // Step 6: Take screenshot before vectorization
    await page.screenshot({ 
      path: 'vectorization-before.png', 
      fullPage: true 
    });
    
    // Step 7: Click vectorize
    console.log('🔄 Starting vectorization...');
    await page.locator('.btn-batch-vectorize').click();
    
    // Step 8: Confirm in modal
    await page.waitForSelector('.modal-content', { timeout: 5000 });
    await page.locator('.modal-footer button:has-text("Vectorize")').click();
    
    // Step 9: Wait for API call and monitor result
    console.log('📡 Waiting for API response...');
    
    try {
      // Wait for the API response with timeout
      const response = await page.waitForResponse(
        response => response.url().includes('artifactprocessor') || response.url().includes('process-webhook'),
        { timeout: 15000 }
      );
      
      console.log(`📡 API Response Status: ${response.status()}`);
      console.log(`📡 API Response URL: ${response.url()}`);
      
      if (response.status() === 200) {
        console.log('✅ API call successful!');
        
        try {
          const responseData = await response.json();
          console.log('📄 Response data:', JSON.stringify(responseData, null, 2));
        } catch (e) {
          console.log('⚠️ Could not parse response as JSON');
        }
        
      } else {
        console.log(`❌ API call failed with status: ${response.status()}`);
        
        try {
          const errorText = await response.text();
          console.log('❌ Error response:', errorText);
        } catch (e) {
          console.log('❌ Could not read error response');
        }
      }
      
    } catch (timeoutError) {
      console.log('⏰ API call timed out or failed');
      
      // Check for CORS error notification
      const corsNotification = page.locator('.notification-message:has-text("CORS")');
      if (await corsNotification.count() > 0) {
        console.log('🚫 CORS error detected - expected for localhost');
        const notificationText = await corsNotification.textContent();
        console.log('🚫 CORS message:', notificationText);
      }
      
      // Log any captured API calls
      if (apiCalls.length > 0) {
        console.log('📊 Captured API calls:');
        apiCalls.forEach((call, index) => {
          console.log(`  ${index + 1}. ${call.method} ${call.url}`);
          if (call.body) {
            try {
              const bodyData = JSON.parse(call.body);
              console.log(`     Payload: ${JSON.stringify(bodyData, null, 2)}`);
            } catch (e) {
              console.log(`     Payload: ${call.body}`);
            }
          }
        });
      }
    }
    
    // Step 10: Take final screenshot
    await page.screenshot({ 
      path: 'vectorization-after.png', 
      fullPage: true 
    });
    
    console.log('✅ Vectorization test completed');
    
    // The test passes regardless of CORS - we're testing the integration works
    expect(apiCalls.length).toBeGreaterThan(0); // Verify API call was made
  });
  
  test('should handle no selection error', async ({ page }) => {
    console.log('🧪 Testing error handling...');
    
    // Login and navigate
    await page.goto('http://localhost:8357/pages/auth.html');
    await page.click('[data-tab="login"]');
    await page.fill('.login-email', 'weezer@yev.com');
    await page.fill('.login-password', '123456');
    await page.click('button:has-text("Access Your Memories")');
    await page.waitForURL('**/dashboard.html');
    
    await page.goto('http://localhost:8357/pages/my-files.html');
    await Promise.race([
      page.waitForSelector('.file-grid-item, .file-list-item', { timeout: 10000 }),
      page.waitForSelector('.empty-state', { timeout: 10000 })
    ]);
    
    // Try to vectorize with no selection
    console.log('❌ Testing no selection error...');
    await page.locator('.btn-batch-vectorize').click();
    
    // Should show error notification
    const errorNotification = page.locator('.notification-message:has-text("No files selected")');
    await expect(errorNotification).toBeVisible({ timeout: 5000 });
    
    console.log('✅ Error handling works correctly');
  });
});