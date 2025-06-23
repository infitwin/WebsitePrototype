const { chromium } = require('playwright');

async function debugFaceDataLoading() {
    console.log('🚀 Starting face data loading debug test...');
    
    const browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Enable console logging
    page.on('console', msg => {
        if (msg.text().includes('File data:') || msg.text().includes('face')) {
            console.log(`Browser: ${msg.text()}`);
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
        await page.waitForTimeout(3000); // Let everything load
        
        // 3. Inject detailed debugging for file loading
        console.log('\n📌 Step 3: Injecting debug code...');
        await page.evaluate(() => {
            console.log('🔍 Debugging file data loading...');
            
            // Check window.currentFiles
            if (window.currentFiles) {
                console.log('📁 window.currentFiles contains:', window.currentFiles.length, 'files');
                
                // Find test-image5.jpg
                const testImage5 = window.currentFiles.find(f => f.fileName === 'test-image5.jpg');
                if (testImage5) {
                    console.log('\n🎯 Found test-image5.jpg data:');
                    console.log('Full object:', JSON.stringify(testImage5, null, 2));
                    console.log('Key fields:');
                    console.log('- id:', testImage5.id);
                    console.log('- extractedFaces:', testImage5.extractedFaces);
                    console.log('- faceCount:', testImage5.faceCount);
                    console.log('- vectorizationStatus:', testImage5.vectorizationStatus);
                    console.log('- vectorizationCompletedAt:', testImage5.vectorizationCompletedAt);
                    
                    // Check the card element
                    const card = document.querySelector(`[data-file-id="${testImage5.id}"]`);
                    if (card) {
                        console.log('\n🎯 Card element found');
                        console.log('- Has vectorization badge:', !!card.querySelector('.vectorization-badge'));
                        console.log('- Has face indicator:', !!card.querySelector('.face-indicator'));
                        console.log('- Face indicator HTML:', card.querySelector('.face-indicator')?.innerHTML);
                        
                        // Check why face indicator might not be showing
                        if (!card.querySelector('.face-indicator') && testImage5.extractedFaces?.length > 0) {
                            console.log('❌ Face indicator missing but faces exist in data!');
                            console.log('extractedFaces length:', testImage5.extractedFaces.length);
                            console.log('extractedFaces data:', testImage5.extractedFaces);
                        }
                    }
                }
                
                // Check all files with faces
                console.log('\n📊 Files with face data:');
                window.currentFiles.forEach(file => {
                    if (file.extractedFaces?.length > 0 || file.faceCount > 0) {
                        console.log(`- ${file.fileName}:`, {
                            extractedFaces: file.extractedFaces?.length || 0,
                            faceCount: file.faceCount || 0,
                            hasCard: !!document.querySelector(`[data-file-id="${file.id}"]`),
                            hasFaceIndicator: !!document.querySelector(`[data-file-id="${file.id}"] .face-indicator`)
                        });
                    }
                });
            }
        });
        
        // 4. Check the renderFile function
        console.log('\n📌 Step 4: Checking renderFile function...');
        await page.evaluate(() => {
            // Find the renderFile function
            if (window.renderFile) {
                console.log('🔍 renderFile function exists');
                
                // Test rendering test-image5.jpg
                const testImage5 = window.currentFiles?.find(f => f.fileName === 'test-image5.jpg');
                if (testImage5) {
                    console.log('Testing renderFile with test-image5.jpg...');
                    
                    // Create a test container
                    const testDiv = document.createElement('div');
                    testDiv.innerHTML = window.renderFile(testImage5);
                    
                    // Check what was rendered
                    const hasFaceIndicator = testDiv.querySelector('.face-indicator');
                    console.log('Rendered HTML contains face indicator:', !!hasFaceIndicator);
                    if (!hasFaceIndicator && testImage5.extractedFaces?.length > 0) {
                        console.log('❌ renderFile did not create face indicator for file with faces!');
                    }
                }
            }
        });
        
        // 5. Check the specific UI update logic
        console.log('\n📌 Step 5: Checking UI update logic...');
        await page.evaluate(() => {
            const testImage5 = window.currentFiles?.find(f => f.fileName === 'test-image5.jpg');
            if (testImage5 && window.updateFileVectorizationUI) {
                console.log('🔍 Testing updateFileVectorizationUI...');
                
                // Create a mock result based on the file data
                const mockResult = {
                    vectorizationResults: {
                        faces: testImage5.extractedFaces || [],
                        faceCount: testImage5.faceCount || 0
                    },
                    faces: testImage5.extractedFaces || []
                };
                
                console.log('Mock result:', mockResult);
                
                // Call the UI update function
                window.updateFileVectorizationUI(testImage5.id, mockResult);
                
                // Check if it worked
                const card = document.querySelector(`[data-file-id="${testImage5.id}"]`);
                console.log('After UI update:');
                console.log('- Has face indicator:', !!card?.querySelector('.face-indicator'));
                console.log('- Face count text:', card?.querySelector('.face-indicator')?.textContent);
            }
        });
        
        // 6. Take screenshots
        console.log('\n📌 Step 6: Taking screenshots...');
        await page.screenshot({ path: 'debug-face-loading-full.png', fullPage: true });
        
        // Focus on test-image5.jpg
        const testImage5Card = await page.$('[data-file-id*="test-image5"]');
        if (testImage5Card) {
            await testImage5Card.screenshot({ path: 'debug-test-image5-card.png' });
        }
        
        // 7. Get final summary
        const summary = await page.evaluate(() => {
            const files = window.currentFiles || [];
            return files.map(f => ({
                name: f.fileName,
                id: f.id,
                extractedFaces: f.extractedFaces?.length || 0,
                faceCount: f.faceCount || 0,
                hasUIFaceIndicator: !!document.querySelector(`[data-file-id="${f.id}"] .face-indicator`),
                faceIndicatorText: document.querySelector(`[data-file-id="${f.id}"] .face-indicator`)?.textContent?.trim()
            }));
        });
        
        console.log('\n📊 Final Summary:');
        console.table(summary);
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        await page.screenshot({ path: 'debug-face-loading-error.png', fullPage: true });
    } finally {
        await browser.close();
        console.log('\n✅ Test completed');
    }
}

debugFaceDataLoading().catch(console.error);