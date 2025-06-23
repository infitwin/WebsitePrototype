const { chromium } = require('playwright');
const fs = require('fs');

async function debugFaceVectorization() {
    console.log('🚀 Starting face vectorization debug test...');
    
    const browser = await chromium.launch({
        headless: true, // Run in headless mode
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const context = await browser.newContext({
        viewport: { width: 1280, height: 720 }
    });
    
    const page = await context.newPage();
    
    // Enable console logging
    page.on('console', msg => {
        if (msg.type() === 'log' || msg.type() === 'error') {
            console.log(`Browser ${msg.type()}: ${msg.text()}`);
        }
    });
    
    // Monitor network requests
    page.on('request', request => {
        if (request.url().includes('process-webhook')) {
            console.log(`📤 API Request to: ${request.url()}`);
            console.log(`   Method: ${request.method()}`);
            console.log(`   Headers:`, request.headers());
        }
    });
    
    page.on('response', async response => {
        if (response.url().includes('process-webhook')) {
            console.log(`📥 API Response from: ${response.url()}`);
            console.log(`   Status: ${response.status()}`);
            try {
                const body = await response.json();
                console.log(`   Response body:`, JSON.stringify(body, null, 2));
            } catch (e) {
                console.log(`   Could not parse response body`);
            }
        }
    });
    
    try {
        // 1. Login
        console.log('\n📌 Step 1: Logging in...');
        await page.goto('http://localhost:8357/pages/auth.html');
        await page.click('[data-tab="login"]');
        await page.fill('.login-email', 'weezer@yev.com');
        await page.fill('.login-password', '123456');
        await page.click('button:has-text("Access Your Memories")');
        await page.waitForURL('**/dashboard.html');
        console.log('✅ Login successful');
        
        // 2. Navigate to My Files
        console.log('\n📌 Step 2: Navigating to My Files...');
        await page.goto('http://localhost:8357/pages/my-files.html');
        await page.waitForSelector('.file-card', { timeout: 10000 });
        console.log('✅ My Files page loaded');
        
        // 3. Count files and find test image
        const fileCards = await page.$$('.file-card');
        console.log(`📁 Found ${fileCards.length} files`);
        
        // Look for test-image5.jpg
        const testImageCard = await page.$('[data-file-id*="test-image5"]');
        if (!testImageCard) {
            console.log('❌ Could not find test-image5.jpg. Looking for any image...');
            // Find any image file by checking the file list
            const imageFiles = await page.evaluate(() => {
                return window.currentFiles?.filter(f => f.fileType?.includes('image')) || [];
            });
            console.log(`Found ${imageFiles.length} image files:`, imageFiles.map(f => f.fileName));
            
            if (imageFiles.length === 0) {
                throw new Error('No image files found in currentFiles');
            }
        }
        
        // 4. Get current state before vectorization
        console.log('\n📌 Step 3: Checking current vectorization state...');
        const fileData = await page.evaluate(() => {
            const cards = document.querySelectorAll('.file-card');
            return Array.from(cards).map(card => ({
                id: card.dataset.fileId,
                name: card.querySelector('.file-name')?.textContent,
                hasVectorizationBadge: !!card.querySelector('.vectorization-badge'),
                badgeText: card.querySelector('.vectorization-badge')?.textContent,
                hasFaceIndicator: !!card.querySelector('.face-indicator'),
                faceCount: card.querySelector('.face-indicator')?.textContent
            }));
        });
        console.log('Current file states:', fileData);
        
        // 5. Select first image and vectorize
        console.log('\n📌 Step 4: Selecting and vectorizing image...');
        // Click the first file card (they're all images based on the logs)
        const firstImageCard = await page.$('.file-card');
        if (!firstImageCard) {
            throw new Error('No file cards found to click');
        }
        await firstImageCard.click();
        
        // Wait for selection
        await page.waitForTimeout(500);
        
        // Click vectorize button
        await page.click('button:has-text("Vectorize Selected")');
        console.log('✅ Clicked vectorize button');
        
        // 6. Wait for processing and capture API response
        console.log('\n📌 Step 5: Waiting for vectorization to complete...');
        
        // Inject script to capture API results
        await page.evaluate(() => {
            window.capturedApiResults = [];
            const originalFetch = window.fetch;
            window.fetch = async (...args) => {
                const response = await originalFetch(...args);
                if (args[0].includes('process-webhook')) {
                    const clone = response.clone();
                    const data = await clone.json();
                    window.capturedApiResults.push(data);
                }
                return response;
            };
        });
        
        // Wait for notification or UI update
        await page.waitForSelector('.notification-success', { timeout: 30000 }).catch(() => {
            console.log('⚠️ No success notification found');
        });
        
        // 7. Check the results
        console.log('\n📌 Step 6: Checking results...');
        
        // Get captured API results
        const apiResults = await page.evaluate(() => window.capturedApiResults);
        console.log('Captured API results:', JSON.stringify(apiResults, null, 2));
        
        // Check Firestore update
        await page.waitForTimeout(2000); // Wait for Firestore update
        
        // Get updated file data
        const updatedFileData = await page.evaluate(() => {
            const cards = document.querySelectorAll('.file-card');
            return Array.from(cards).map(card => ({
                id: card.dataset.fileId,
                name: card.querySelector('.file-name')?.textContent,
                hasVectorizationBadge: !!card.querySelector('.vectorization-badge'),
                badgeText: card.querySelector('.vectorization-badge')?.textContent,
                hasFaceIndicator: !!card.querySelector('.face-indicator'),
                faceCount: card.querySelector('.face-indicator')?.textContent,
                faceIndicatorHTML: card.querySelector('.face-indicator')?.innerHTML
            }));
        });
        console.log('\nUpdated file states:', updatedFileData);
        
        // 8. Take screenshots for analysis
        console.log('\n📌 Step 7: Taking screenshots...');
        await page.screenshot({ path: 'debug-after-vectorization.png', fullPage: true });
        
        // Focus on the first vectorized file
        const vectorizedCard = await page.$('.file-card .vectorization-badge');
        if (vectorizedCard) {
            const cardElement = await vectorizedCard.$('xpath=ancestor::div[@class="file-card"]');
            await cardElement.screenshot({ path: 'debug-vectorized-card.png' });
        }
        
        // 9. Check console for errors
        const errors = await page.evaluate(() => {
            const logs = [];
            // Check if there were any console errors
            return logs;
        });
        
        console.log('\n📊 Summary:');
        const vectorizedFiles = updatedFileData.filter(f => f.hasVectorizationBadge);
        const filesWithFaces = updatedFileData.filter(f => f.hasFaceIndicator);
        console.log(`- Vectorized files: ${vectorizedFiles.length}`);
        console.log(`- Files with faces: ${filesWithFaces.length}`);
        
        if (filesWithFaces.length === 0) {
            console.log('\n❌ No faces were displayed in the UI');
            console.log('Checking what updateFileVectorizationStatus received...');
            
            // Debug the update function
            await page.evaluate(() => {
                const originalUpdate = window.updateFileVectorizationStatus;
                window.updateFileVectorizationStatus = async function(fileId, result) {
                    console.log('updateFileVectorizationStatus called with:', {
                        fileId,
                        result: JSON.stringify(result, null, 2),
                        faces: result.vectorizationResults?.faces || result.faces,
                        faceCount: result.vectorizationResults?.faceCount || 0
                    });
                    return originalUpdate.call(this, fileId, result);
                };
            });
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        await page.screenshot({ path: 'debug-error.png', fullPage: true });
    } finally {
        await browser.close();
        console.log('\n✅ Test completed');
    }
}

// Run the test
debugFaceVectorization().catch(console.error);