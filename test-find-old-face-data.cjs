const { chromium } = require('playwright');

async function findOldFaceData() {
    console.log('🚀 Looking for old face data...');
    
    const browser = await chromium.launch({
        headless: false, // Run with UI to see what's happening
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
        
        // 3. Check what's actually displayed on the page
        console.log('\n📌 Step 3: Checking what\'s displayed...');
        const displayedData = await page.evaluate(() => {
            const results = [];
            
            // Check all file cards
            document.querySelectorAll('.file-card').forEach(card => {
                const fileName = card.querySelector('.file-name')?.textContent;
                const faceIndicator = card.querySelector('.face-indicator');
                const hasFaceIndicator = !!faceIndicator;
                const faceText = faceIndicator?.textContent?.trim();
                
                results.push({
                    fileName,
                    hasFaceIndicator,
                    faceText,
                    fileId: card.dataset.fileId
                });
            });
            
            return results;
        });
        
        console.log('\n📊 Files displayed with face indicators:');
        displayedData.forEach(file => {
            if (file.hasFaceIndicator) {
                console.log(`- ${file.fileName}: ${file.faceText}`);
            }
        });
        
        // 4. Check test-image5.jpg specifically
        const testImage5Display = displayedData.find(f => f.fileName === 'test-image5.jpg');
        console.log('\n🎯 test-image5.jpg display status:');
        console.log(testImage5Display);
        
        // 5. If test-image5.jpg has a face indicator, investigate why
        if (testImage5Display?.hasFaceIndicator) {
            console.log('\n❗ test-image5.jpg HAS a face indicator! Investigating...');
            
            const investigation = await page.evaluate(() => {
                const testImage5 = window.currentFiles?.find(f => f.fileName === 'test-image5.jpg');
                const card = document.querySelector(`[data-file-id="${testImage5?.id}"]`);
                
                return {
                    fileData: {
                        extractedFaces: testImage5?.extractedFaces,
                        faceCount: testImage5?.faceCount,
                        id: testImage5?.id
                    },
                    cardHTML: card?.innerHTML?.substring(0, 1000),
                    faceIndicatorHTML: card?.querySelector('.face-indicator')?.outerHTML
                };
            });
            
            console.log('\nInvestigation results:', JSON.stringify(investigation, null, 2));
        }
        
        // 6. Take screenshot
        await page.screenshot({ path: 'test-current-display.png', fullPage: true });
        
        // 7. Try to re-vectorize test-image5.jpg to see what happens
        console.log('\n📌 Step 4: Attempting to re-vectorize test-image5.jpg...');
        
        // Select the file
        await page.click(`[data-file-id="${testImage5Display?.fileId}"] input[type="checkbox"]`);
        await page.waitForTimeout(500);
        
        // Click vectorize
        const vectorizeBtn = await page.$('button:has-text("Vectorize Selected")');
        if (vectorizeBtn && await vectorizeBtn.isVisible()) {
            console.log('Clicking vectorize button...');
            await page.click('button:has-text("Vectorize Selected")');
            
            // Wait and monitor console
            await page.waitForTimeout(10000);
            
            // Check if anything changed
            const afterVectorization = await page.evaluate(() => {
                const testImage5 = window.currentFiles?.find(f => f.fileName === 'test-image5.jpg');
                return {
                    extractedFaces: testImage5?.extractedFaces,
                    faceCount: testImage5?.faceCount
                };
            });
            
            console.log('\nAfter re-vectorization:', afterVectorization);
        }
        
        // Keep browser open for 30 seconds to inspect
        console.log('\n⏰ Keeping browser open for inspection...');
        await page.waitForTimeout(30000);
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        await page.screenshot({ path: 'test-old-face-error.png', fullPage: true });
    } finally {
        await browser.close();
        console.log('\n✅ Test completed');
    }
}

findOldFaceData().catch(console.error);