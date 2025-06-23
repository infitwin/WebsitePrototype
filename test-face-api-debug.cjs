const { chromium } = require('playwright');

async function debugFaceAPI() {
    console.log('🚀 Starting face API debug test...');
    
    const browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Capture console and network
    page.on('console', msg => console.log(`Browser: ${msg.text()}`));
    
    const apiResponses = [];
    page.on('response', async response => {
        if (response.url().includes('process-webhook')) {
            try {
                const body = await response.json();
                apiResponses.push({
                    url: response.url(),
                    status: response.status(),
                    body: body
                });
                console.log('\n📥 API Response captured:', JSON.stringify(body, null, 2));
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
        
        // 3. Find a file without faces yet
        console.log('\n📌 Step 3: Finding files to test...');
        const fileStates = await page.evaluate(() => {
            const cards = document.querySelectorAll('.file-card');
            return Array.from(cards).map(card => ({
                id: card.dataset.fileId,
                name: card.querySelector('.file-name')?.textContent,
                hasVectorizationBadge: !!card.querySelector('.vectorization-badge'),
                hasFaceIndicator: !!card.querySelector('.face-indicator'),
                faceCount: card.querySelector('.face-indicator')?.textContent?.trim()
            }));
        });
        
        console.log('Current file states:', fileStates);
        
        // Find test-image4.jpg which shows 0 faces
        const testImage = fileStates.find(f => f.name === 'test-image4.jpg');
        if (!testImage) {
            throw new Error('test-image4.jpg not found');
        }
        
        console.log('\n📌 Step 4: Testing vectorization on test-image4.jpg...');
        
        // Click the file
        await page.click(`[data-file-id="${testImage.id}"]`);
        await page.waitForTimeout(500);
        
        // Inject debug logging
        await page.evaluate(() => {
            // Override updateFileVectorizationStatus to log what it receives
            const originalUpdate = window.updateFileVectorizationStatus;
            window.updateFileVectorizationStatus = async function(fileId, result) {
                console.log('🔍 updateFileVectorizationStatus called with:');
                console.log('  fileId:', fileId);
                console.log('  result structure:', {
                    hasVectorizationResults: !!result.vectorizationResults,
                    hasFaces: !!result.faces,
                    vectorizationResultsFaces: result.vectorizationResults?.faces?.length || 0,
                    directFaces: result.faces?.length || 0,
                    fullResult: JSON.stringify(result, null, 2)
                });
                return originalUpdate.call(this, fileId, result);
            };
            
            // Also override UI update
            const originalUIUpdate = window.updateFileVectorizationUI;
            window.updateFileVectorizationUI = function(fileId, result) {
                console.log('🎨 updateFileVectorizationUI called with:');
                console.log('  fileId:', fileId);
                console.log('  faces to display:', result.vectorizationResults?.faces || result.faces || []);
                return originalUIUpdate.call(this, fileId, result);
            };
        });
        
        // Click vectorize
        await page.click('button:has-text("Vectorize Selected")');
        console.log('✅ Clicked vectorize button');
        
        // Wait for processing
        console.log('\n📌 Step 5: Waiting for processing...');
        await page.waitForTimeout(10000); // Wait 10 seconds for processing
        
        // Check the API responses
        console.log('\n📊 API Response Summary:');
        console.log(`Total API responses captured: ${apiResponses.length}`);
        
        if (apiResponses.length > 0) {
            const lastResponse = apiResponses[apiResponses.length - 1];
            console.log('\nLast API response:');
            console.log('Status:', lastResponse.status);
            console.log('Response structure:', {
                hasVectorizationResults: !!lastResponse.body.vectorizationResults,
                faceCount: lastResponse.body.vectorizationResults?.faceCount || 0,
                facesLength: lastResponse.body.vectorizationResults?.faces?.length || 0,
                firstFace: lastResponse.body.vectorizationResults?.faces?.[0] ? 'Has face data' : 'No face data'
            });
        }
        
        // Check updated UI
        console.log('\n📌 Step 6: Checking updated UI...');
        await page.waitForTimeout(2000); // Wait for UI update
        
        const updatedState = await page.evaluate((fileId) => {
            const card = document.querySelector(`[data-file-id="${fileId}"]`);
            return {
                hasVectorizationBadge: !!card?.querySelector('.vectorization-badge'),
                hasFaceIndicator: !!card?.querySelector('.face-indicator'),
                faceCount: card?.querySelector('.face-indicator')?.textContent?.trim(),
                faceIndicatorHTML: card?.querySelector('.face-indicator')?.innerHTML
            };
        }, testImage.id);
        
        console.log('\nUpdated file state:', updatedState);
        
        // Take screenshots
        await page.screenshot({ path: 'debug-face-api-test.png', fullPage: true });
        
        // Get the specific file card
        const fileCard = await page.$(`[data-file-id="${testImage.id}"]`);
        if (fileCard) {
            await fileCard.screenshot({ path: 'debug-test-image4-card.png' });
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        await page.screenshot({ path: 'debug-face-api-error.png', fullPage: true });
    } finally {
        await browser.close();
        console.log('\n✅ Test completed');
    }
}

debugFaceAPI().catch(console.error);