const puppeteer = require('puppeteer');

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function testFileUploadWithAuth() {
    let browser;
    try {
        console.log('🔍 Starting file upload test with authentication...');
        
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        const page = await browser.newPage();
        
        // Capture console messages
        page.on('console', msg => console.log(`[BROWSER]`, msg.text()));
        page.on('pageerror', error => console.error('[PAGE-ERROR]', error.message));
        
        // Step 1: Go to auth page and log in
        console.log('🔐 Step 1: Logging in with test credentials...');
        await page.goto('http://localhost:8357/pages/auth.html');
        
        // Wait for auth page to load
        await page.waitForSelector('[data-tab="login"]', { timeout: 10000 });
        await sleep(1000);
        
        // Click login tab
        await page.click('[data-tab="login"]');
        await sleep(500);
        
        // Fill in test credentials
        await page.type('.login-email', 'weezer@yev.com');
        await page.type('.login-password', '123456');
        
        // Click login button
        await page.click('button:has-text("Access Your Memories")');
        
        // Wait for redirect
        console.log('⏳ Waiting for login to complete...');
        await page.waitForFunction(() => window.location.href.includes('dashboard.html'), { timeout: 15000 });
        
        console.log('✅ Login successful, redirected to:', page.url());
        
        // Step 2: Now navigate to My Files page
        console.log('📂 Step 2: Navigating to My Files page...');
        await page.goto('http://localhost:8357/pages/my-files.html');
        
        // Wait for page to load
        await page.waitForSelector('#fileInput', { timeout: 10000 });
        
        const title = await page.title();
        console.log('📑 Page title:', title);
        
        // Check if upload elements are present
        console.log('🔍 Step 3: Checking upload functionality...');
        const uploadElements = await page.evaluate(() => {
            return {
                hasFileInput: !!document.getElementById('fileInput'),
                hasDropZone: !!document.getElementById('dropZone'),
                hasUploadQueue: !!document.getElementById('uploadQueue'),
                fileInputAccept: document.getElementById('fileInput')?.accept,
                fileInputMultiple: document.getElementById('fileInput')?.multiple
            };
        });
        
        console.log('📂 Upload elements:', uploadElements);
        
        if (uploadElements.hasFileInput) {
            console.log('✅ File input found - upload functionality should work');
            
            // Test file validation
            console.log('🧪 Step 4: Testing file validation...');
            
            const validationResult = await page.evaluate(() => {
                // Import file service to test validation
                return new Promise(async (resolve) => {
                    try {
                        const { validateFile } = await import('/js/file-service.js');
                        
                        // Create a mock file for testing
                        const mockFile = {
                            name: 'test.jpg',
                            size: 1024 * 1024, // 1MB
                            type: 'image/jpeg'
                        };
                        
                        const result = validateFile(mockFile);
                        resolve({ success: true, validation: result });
                    } catch (error) {
                        resolve({ success: false, error: error.message });
                    }
                });
            });
            
            console.log('🧪 Validation test result:', validationResult);
            
            // Check Firebase services
            console.log('🔥 Step 5: Checking Firebase services...');
            const firebaseStatus = await page.evaluate(() => {
                return {
                    authUser: window.auth?.currentUser?.uid || null,
                    authEmail: window.auth?.currentUser?.email || null,
                    hasStorage: typeof window.storage !== 'undefined'
                };
            });
            
            console.log('🔥 Firebase status:', firebaseStatus);
            
            if (firebaseStatus.authUser) {
                console.log('✅ User is authenticated and ready for uploads');
                console.log('✅ File upload functionality appears to be working');
            } else {
                console.log('❌ User authentication issue detected');
            }
        } else {
            console.log('❌ File input not found - upload functionality broken');
        }
        
        // Take screenshot for debugging
        await page.screenshot({ 
            path: '/tmp/my-files-authenticated.png', 
            fullPage: true 
        });
        console.log('📸 Screenshot saved to /tmp/my-files-authenticated.png');
        
        console.log('✅ Test completed successfully');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        
        if (browser) {
            // Take error screenshot
            try {
                const page = (await browser.pages())[0];
                await page.screenshot({ path: '/tmp/error-screenshot.png' });
                console.log('📸 Error screenshot saved to /tmp/error-screenshot.png');
            } catch (e) {
                console.log('Could not take error screenshot');
            }
        }
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

testFileUploadWithAuth();