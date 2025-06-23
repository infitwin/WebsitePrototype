const { chromium } = require('playwright');

async function checkFaceData() {
    console.log('🚀 Checking face data in Firestore...');
    
    const browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const context = await browser.newContext();
    const page = await context.newPage();
    
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
        
        // 2. Go to My Files
        console.log('\n📌 Step 2: Navigating to My Files...');
        await page.goto('http://localhost:8357/pages/my-files.html');
        await page.waitForSelector('.file-card', { timeout: 10000 });
        await page.waitForTimeout(3000);
        
        // 3. Check the actual Firestore data for test-image5.jpg
        console.log('\n📌 Step 3: Checking Firestore data...');
        const fileData = await page.evaluate(async () => {
            // Get test-image5.jpg data
            const testImage5 = window.currentFiles?.find(f => f.fileName === 'test-image5.jpg');
            if (!testImage5) return null;
            
            // Also check raw Firestore data
            const { auth, db } = await import('../js/firebase-config.js');
            const { doc, getDoc } = await import('firebase/firestore');
            
            const user = auth.currentUser;
            if (!user) return null;
            
            const fileRef = doc(db, 'users', user.uid, 'files', testImage5.id);
            const docSnap = await getDoc(fileRef);
            
            if (docSnap.exists()) {
                const data = docSnap.data();
                return {
                    fromWindow: {
                        extractedFaces: testImage5.extractedFaces,
                        faceCount: testImage5.faceCount,
                        vectorizationStatus: testImage5.vectorizationStatus
                    },
                    fromFirestore: {
                        extractedFaces: data.extractedFaces,
                        faceCount: data.faceCount,
                        vectorizationStatus: data.vectorizationStatus
                    }
                };
            }
            return null;
        });
        
        console.log('\n📊 File Data Comparison:');
        console.log('From window.currentFiles:', JSON.stringify(fileData?.fromWindow, null, 2));
        console.log('\nFrom Firestore direct:', JSON.stringify(fileData?.fromFirestore, null, 2));
        
        // 4. Try clicking face indicator if it exists
        console.log('\n📌 Step 4: Testing face indicator click...');
        const hasFaceIndicator = await page.$('.face-indicator');
        if (hasFaceIndicator) {
            console.log('Found face indicator, clicking...');
            await hasFaceIndicator.click();
            await page.waitForTimeout(2000);
            
            // Check if modal opened
            const modalVisible = await page.$eval('#faceModal', el => el.classList.contains('active'));
            console.log('Face modal visible:', modalVisible);
            
            // Check modal content
            if (modalVisible) {
                const modalContent = await page.evaluate(() => {
                    const grid = document.getElementById('facesModalGrid');
                    return {
                        innerHTML: grid?.innerHTML,
                        childCount: grid?.children.length,
                        hasLoadingMessage: grid?.textContent?.includes('Loading'),
                        hasErrorMessage: grid?.textContent?.includes('Error'),
                        hasNoFacesMessage: grid?.textContent?.includes('No faces')
                    };
                });
                console.log('Modal content:', modalContent);
            }
            
            await page.screenshot({ path: 'debug-face-modal-test.png', fullPage: true });
        } else {
            console.log('No face indicator found to click');
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        await browser.close();
        console.log('\n✅ Test completed');
    }
}

checkFaceData().catch(console.error);