const { chromium } = require('playwright');

async function testFirestoreFaceData() {
    console.log('🚀 Testing Firestore face data for test-image5.jpg...');
    
    const browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Capture all console logs
    page.on('console', msg => console.log(`Browser: ${msg.text()}`));
    
    try {
        // 1. Login
        console.log('\n📌 Step 1: Logging in...');
        await page.goto('http://localhost:8357/pages/auth.html');
        await page.click('[data-tab="login"]');
        await page.fill('.login-email', 'weezer@yev.com');
        await page.fill('.login-password', '123456');
        await page.click('button:has-text("Access Your Memories")');
        await page.waitForURL('**/dashboard.html', { timeout: 10000 });
        
        // 2. Navigate to Firestore debug page
        console.log('\n📌 Step 2: Going to Firestore debug page...');
        await page.goto('http://localhost:8357/debug-firestore-faces.html');
        await page.waitForTimeout(5000); // Wait for Firestore query
        
        // 3. Check what the debug page shows
        const debugData = await page.evaluate(() => {
            const output = document.getElementById('output');
            return output?.textContent || 'No output';
        });
        
        console.log('\n📊 Firestore Debug Output:');
        console.log(debugData);
        
        // 4. Take screenshot
        await page.screenshot({ path: 'test-firestore-data.png', fullPage: true });
        
        // 5. Now go to My Files and inject debugging
        console.log('\n📌 Step 3: Going to My Files page...');
        await page.goto('http://localhost:8357/pages/my-files.html');
        await page.waitForSelector('.file-card', { timeout: 10000 });
        await page.waitForTimeout(3000);
        
        // 6. Debug the specific file loading
        const fileDebugData = await page.evaluate(() => {
            console.log('🔍 Debugging file loading...');
            
            // Find test-image5.jpg in the files
            const testImage5 = window.currentFiles?.find(f => f.fileName === 'test-image5.jpg');
            
            if (!testImage5) {
                return { error: 'test-image5.jpg not found in window.currentFiles' };
            }
            
            // Check the raw query result
            console.log('Raw file data:', testImage5);
            
            // Check if it's an issue with the data structure
            const debugInfo = {
                fileName: testImage5.fileName,
                id: testImage5.id,
                hasExtractedFaces: 'extractedFaces' in testImage5,
                extractedFacesType: typeof testImage5.extractedFaces,
                extractedFacesIsArray: Array.isArray(testImage5.extractedFaces),
                extractedFacesLength: testImage5.extractedFaces?.length,
                extractedFacesContent: testImage5.extractedFaces,
                faceCount: testImage5.faceCount,
                vectorizationStatus: testImage5.vectorizationStatus,
                allKeys: Object.keys(testImage5)
            };
            
            // Check if faces are in a different property
            for (const key of Object.keys(testImage5)) {
                if (key.toLowerCase().includes('face') && key !== 'extractedFaces' && key !== 'faceCount') {
                    debugInfo[`found_${key}`] = testImage5[key];
                }
            }
            
            return debugInfo;
        });
        
        console.log('\n📊 File Debug Data:');
        console.log(JSON.stringify(fileDebugData, null, 2));
        
        // 7. Check the actual renderFile output
        const renderOutput = await page.evaluate(() => {
            const testImage5 = window.currentFiles?.find(f => f.fileName === 'test-image5.jpg');
            if (!testImage5 || !window.renderFile) return null;
            
            // Get the rendered HTML
            const html = window.renderFile(testImage5);
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = html;
            
            return {
                hasFaceIndicator: tempDiv.querySelector('.face-indicator') !== null,
                faceIndicatorHTML: tempDiv.querySelector('.face-indicator')?.outerHTML,
                fullHTML: html.substring(0, 500) + '...' // First 500 chars
            };
        });
        
        console.log('\n📊 Render Output:');
        console.log(JSON.stringify(renderOutput, null, 2));
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        await page.screenshot({ path: 'test-firestore-error.png', fullPage: true });
    } finally {
        await browser.close();
        console.log('\n✅ Test completed');
    }
}

testFirestoreFaceData().catch(console.error);