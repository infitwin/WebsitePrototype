const { chromium } = require('playwright');

async function testRevectorization() {
    console.log('🚀 Starting re-vectorization test...');
    
    const browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Capture API responses
    const apiResponses = [];
    page.on('response', async response => {
        if (response.url().includes('process-webhook')) {
            try {
                const body = await response.json();
                apiResponses.push(body);
                console.log('\n📥 API Response:', JSON.stringify(body, null, 2));
            } catch (e) {}
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
        await page.waitForURL('**/dashboard.html', { timeout: 10000 });
        
        // 2. Go to My Files
        console.log('\n📌 Step 2: Navigating to My Files...');
        await page.goto('http://localhost:8357/pages/my-files.html');
        await page.waitForSelector('.file-card', { timeout: 10000 });
        await page.waitForTimeout(2000); // Let everything load
        
        // 3. Close any open modals first
        const modalCloseButton = await page.$('.modal-close, [aria-label="Close modal"]');
        if (modalCloseButton) {
            await modalCloseButton.click();
            await page.waitForTimeout(500);
        }
        
        // 4. Check current state
        console.log('\n📌 Step 3: Checking current file states...');
        const beforeState = await page.evaluate(() => {
            const cards = document.querySelectorAll('.file-card');
            return Array.from(cards).map(card => {
                const fileData = window.currentFiles?.find(f => f.id === card.dataset.fileId);
                return {
                    id: card.dataset.fileId,
                    name: card.querySelector('.file-name')?.textContent,
                    hasVectorizationBadge: !!card.querySelector('.vectorization-badge'),
                    hasFaceIndicator: !!card.querySelector('.face-indicator'),
                    faceCount: card.querySelector('.face-indicator')?.textContent?.trim(),
                    extractedFacesFromData: fileData?.extractedFaces?.length || 0,
                    faceCountFromData: fileData?.faceCount || 0
                };
            });
        });
        
        console.log('File states before:', beforeState);
        
        // 5. Select test-image4.jpg by clicking its checkbox
        console.log('\n📌 Step 4: Selecting test-image4.jpg...');
        const testImage = beforeState.find(f => f.name === 'test-image4.jpg');
        if (!testImage) {
            throw new Error('test-image4.jpg not found');
        }
        
        // Click the checkbox directly
        await page.click(`[data-file-id="${testImage.id}"] input[type="checkbox"]`);
        await page.waitForTimeout(500);
        
        // Check if vectorize button is now visible
        const vectorizeBtn = await page.$('button:has-text("Vectorize Selected")');
        const isVisible = await vectorizeBtn?.isVisible();
        console.log('Vectorize button visible:', isVisible);
        
        if (!isVisible) {
            // Try clicking the selection area
            await page.click(`[data-file-id="${testImage.id}"] .file-selection`);
            await page.waitForTimeout(500);
        }
        
        // 6. Click vectorize
        console.log('\n📌 Step 5: Clicking vectorize...');
        await page.click('button:has-text("Vectorize Selected")', { force: true });
        console.log('✅ Clicked vectorize button');
        
        // 7. Wait for processing
        console.log('\n📌 Step 6: Waiting for processing...');
        await page.waitForTimeout(8000); // Wait 8 seconds
        
        // 8. Check results
        console.log('\n📌 Step 7: Checking results...');
        
        // Check API response
        if (apiResponses.length > 0) {
            const response = apiResponses[apiResponses.length - 1];
            console.log('\nAPI Response Summary:');
            console.log('- Status:', response.status);
            console.log('- Face count:', response.vectorizationResults?.faceCount || 0);
            console.log('- Faces detected:', response.vectorizationResults?.faces?.length || 0);
            
            if (response.vectorizationResults?.faces?.length > 0) {
                console.log('- First face confidence:', response.vectorizationResults.faces[0].confidence);
            }
        }
        
        // Refresh to see updated data
        await page.reload();
        await page.waitForSelector('.file-card', { timeout: 10000 });
        await page.waitForTimeout(2000);
        
        // Check updated state
        const afterState = await page.evaluate(() => {
            const cards = document.querySelectorAll('.file-card');
            return Array.from(cards).map(card => {
                const fileData = window.currentFiles?.find(f => f.id === card.dataset.fileId);
                return {
                    id: card.dataset.fileId,
                    name: card.querySelector('.file-name')?.textContent,
                    hasVectorizationBadge: !!card.querySelector('.vectorization-badge'),
                    hasFaceIndicator: !!card.querySelector('.face-indicator'),
                    faceCount: card.querySelector('.face-indicator')?.textContent?.trim(),
                    extractedFacesFromData: fileData?.extractedFaces?.length || 0,
                    faceCountFromData: fileData?.faceCount || 0,
                    vectorizationStatus: fileData?.vectorizationStatus
                };
            });
        });
        
        console.log('\nFile states after:', afterState);
        
        // Compare before and after for test-image4.jpg
        const testImageAfter = afterState.find(f => f.name === 'test-image4.jpg');
        console.log('\n📊 test-image4.jpg comparison:');
        console.log('Before:', beforeState.find(f => f.name === 'test-image4.jpg'));
        console.log('After:', testImageAfter);
        
        // Take final screenshot
        await page.screenshot({ path: 'debug-revectorization-final.png', fullPage: true });
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        await page.screenshot({ path: 'debug-revectorization-error.png', fullPage: true });
    } finally {
        await browser.close();
        console.log('\n✅ Test completed');
    }
}

testRevectorization().catch(console.error);