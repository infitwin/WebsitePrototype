const { chromium } = require('playwright');

async function captureAPIResponse() {
    console.log('🚀 Capturing vectorization API response...');
    
    const browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const context = await browser.newContext();
    const page = await context.newPage();
    
    let capturedResponse = null;
    
    // Intercept the API response
    page.on('response', async response => {
        if (response.url().includes('process-webhook')) {
            console.log(`\n📥 Intercepted API response: ${response.status()}`);
            try {
                const body = await response.json();
                capturedResponse = body;
                console.log('Full API Response:', JSON.stringify(body, null, 2));
            } catch (e) {
                console.log('Could not parse response body');
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
        await page.waitForURL('**/dashboard.html', { timeout: 10000 });
        
        // 2. Go to My Files
        console.log('\n📌 Step 2: Navigating to My Files...');
        await page.goto('http://localhost:8357/pages/my-files.html');
        await page.waitForSelector('.file-card', { timeout: 10000 });
        await page.waitForTimeout(2000);
        
        // 3. Inject debugging into updateFileVectorizationStatus
        await page.evaluate(() => {
            const originalUpdate = window.updateFileVectorizationStatus;
            window.updateFileVectorizationStatus = async function(fileId, result) {
                console.log('🎯 updateFileVectorizationStatus called:');
                console.log('- fileId:', fileId);
                console.log('- Full result:', JSON.stringify(result, null, 2));
                console.log('- result.vectorizationResults:', result.vectorizationResults);
                console.log('- result.faces:', result.faces);
                console.log('- Faces to save:', result.vectorizationResults?.faces || result.faces || []);
                
                // Call original
                return originalUpdate.call(this, fileId, result);
            };
        });
        
        // 4. Select test-image4.jpg
        console.log('\n📌 Step 3: Selecting test-image4.jpg...');
        const testImage4 = await page.$('[data-file-id="file_1750464474294_dpw713n6s"]');
        if (!testImage4) {
            throw new Error('test-image4.jpg not found');
        }
        
        // Click the checkbox
        await page.click('[data-file-id="file_1750464474294_dpw713n6s"] input[type="checkbox"]');
        await page.waitForTimeout(500);
        
        // 5. Click vectorize
        console.log('\n📌 Step 4: Clicking vectorize...');
        await page.click('button:has-text("Vectorize Selected")', { force: true });
        console.log('✅ Clicked vectorize button, waiting for response...');
        
        // 6. Wait for the API response
        await page.waitForTimeout(10000);
        
        // 7. Check what was saved
        console.log('\n📌 Step 5: Checking what was saved...');
        const savedData = await page.evaluate(async () => {
            const { auth, db } = await import('../js/firebase-config.js');
            const { doc, getDoc } = await import('firebase/firestore');
            
            const user = auth.currentUser;
            if (!user) return null;
            
            // Get the updated document
            const fileRef = doc(db, 'users', user.uid, 'files', 'file_1750464474294_dpw713n6s');
            const docSnap = await getDoc(fileRef);
            
            if (docSnap.exists()) {
                const data = docSnap.data();
                return {
                    extractedFaces: data.extractedFaces,
                    faceCount: data.faceCount,
                    vectorizationStatus: data.vectorizationStatus
                };
            }
            return null;
        });
        
        console.log('\n📊 Data saved to Firestore:', JSON.stringify(savedData, null, 2));
        
        // 8. Analysis
        console.log('\n🔍 Analysis:');
        if (capturedResponse) {
            console.log('API returned vectorizationResults.faces:', capturedResponse.vectorizationResults?.faces?.length || 0);
            console.log('API returned faces:', capturedResponse.faces?.length || 0);
            
            if (capturedResponse.vectorizationResults?.faces?.length > 0) {
                console.log('First face from API:', JSON.stringify(capturedResponse.vectorizationResults.faces[0], null, 2));
            }
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        await browser.close();
        console.log('\n✅ Test completed');
    }
}

captureAPIResponse().catch(console.error);