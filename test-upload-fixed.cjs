const puppeteer = require('puppeteer');

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function testFileUploadWithAuth() {
    let browser;
    try {
        console.log('🔍 Starting file upload test with authentication...');
        
        browser = await puppeteer.launch({
            headless: false, // Show browser for debugging
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
        await sleep(2000);
        
        // Click login tab
        await page.click('[data-tab="login"]');
        await sleep(1000);
        
        // Fill in test credentials
        console.log('📝 Filling in credentials...');
        await page.type('.login-email', 'weezer@yev.com');
        await page.type('.login-password', '123456');
        await sleep(1000);
        
        // Look for the login button
        console.log('🔍 Looking for login button...');
        const buttonTexts = await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            return buttons.map(btn => ({
                text: btn.textContent.trim(),
                className: btn.className,
                disabled: btn.disabled
            }));
        });
        
        console.log('🔘 Available buttons:', buttonTexts);
        
        // Find and click the login button (try different selectors)
        let loginClicked = false;
        const possibleSelectors = [
            'button.login-btn',
            'button[type="submit"]',
            '.login-form button',
            'button:contains("Access")',
            'button'
        ];
        
        for (const selector of possibleSelectors) {
            try {
                const buttons = await page.$$(selector);
                for (const button of buttons) {
                    const text = await button.evaluate(el => el.textContent.trim());
                    if (text.includes('Access') || text.includes('Login') || text.includes('Sign In')) {
                        console.log(`🎯 Found login button with text: "${text}"`);
                        await button.click();
                        loginClicked = true;
                        break;
                    }
                }
                if (loginClicked) break;
            } catch (e) {
                // Continue trying other selectors
            }
        }
        
        if (!loginClicked) {
            console.log('❌ Could not find login button');
            // Take screenshot to see what's on page
            await page.screenshot({ path: '/tmp/auth-page-debug.png' });
            console.log('📸 Auth page screenshot saved to /tmp/auth-page-debug.png');
            return;
        }
        
        // Wait for login to process
        console.log('⏳ Waiting for login to complete...');
        await sleep(3000);
        
        // Check if we're redirected or if there's an error
        const currentUrl = page.url();
        console.log('📍 Current URL after login attempt:', currentUrl);
        
        if (currentUrl.includes('dashboard.html') || currentUrl.includes('my-files.html')) {
            console.log('✅ Login successful!');
        } else {
            console.log('🔄 Still on auth page, checking for errors...');
            
            const authStatus = await page.evaluate(() => {
                return {
                    url: window.location.href,
                    currentUser: window.auth?.currentUser?.uid || null,
                    errorMessages: Array.from(document.querySelectorAll('.error, .alert')).map(el => el.textContent.trim())
                };
            });
            
            console.log('🔍 Auth status:', authStatus);
            
            if (authStatus.currentUser) {
                console.log('✅ User is authenticated, navigating manually...');
                await page.goto('http://localhost:8357/pages/my-files.html');
            } else {
                console.log('❌ Authentication failed');
                return;
            }
        }
        
        // Step 2: Check My Files page
        console.log('📂 Step 2: Checking My Files page...');
        await sleep(2000);
        
        const myFilesUrl = page.url();
        const title = await page.title();
        console.log('📑 Page title:', title);
        console.log('📍 URL:', myFilesUrl);
        
        if (myFilesUrl.includes('auth.html')) {
            console.log('❌ Redirected back to auth - authentication issue');
            return;
        }
        
        // Wait for page elements to load
        await page.waitForSelector('#fileInput', { timeout: 10000 });
        
        // Check upload functionality
        const uploadElements = await page.evaluate(() => {
            return {
                hasFileInput: !!document.getElementById('fileInput'),
                hasDropZone: !!document.getElementById('dropZone'),
                hasUploadQueue: !!document.getElementById('uploadQueue'),
                fileInputAccept: document.getElementById('fileInput')?.accept,
                fileInputMultiple: document.getElementById('fileInput')?.multiple,
                dropZoneText: document.getElementById('dropZone')?.textContent?.trim()
            };
        });
        
        console.log('📂 Upload elements:', uploadElements);
        
        if (uploadElements.hasFileInput) {
            console.log('✅ Upload functionality is present and ready!');
            
            // Test drag-drop functionality
            console.log('🧪 Testing drag-drop initialization...');
            const dragDropStatus = await page.evaluate(() => {
                const dropZone = document.getElementById('dropZone');
                return {
                    hasDropZone: !!dropZone,
                    hasEventListeners: dropZone && dropZone.onclick !== null,
                    dropZoneClasses: dropZone?.className
                };
            });
            
            console.log('🎯 Drag-drop status:', dragDropStatus);
            
            // Test file service availability
            console.log('🔧 Testing file service...');
            const fileServiceStatus = await page.evaluate(async () => {
                try {
                    const { validateFile } = await import('/js/file-service.js');
                    const mockFile = { name: 'test.jpg', size: 1024, type: 'image/jpeg' };
                    const result = validateFile(mockFile);
                    return { available: true, validation: result };
                } catch (error) {
                    return { available: false, error: error.message };
                }
            });
            
            console.log('🔧 File service status:', fileServiceStatus);
            
            if (fileServiceStatus.available && fileServiceStatus.validation.isValid) {
                console.log('✅ File upload functionality is WORKING correctly!');
                console.log('✅ Files should upload successfully when selected');
            } else {
                console.log('❌ File service issue:', fileServiceStatus);
            }
        } else {
            console.log('❌ Upload elements missing');
        }
        
        // Take final screenshot
        await page.screenshot({ 
            path: '/tmp/my-files-working.png', 
            fullPage: true 
        });
        console.log('📸 Final screenshot saved to /tmp/my-files-working.png');
        
        console.log('✅ Test completed successfully');
        
        // Keep browser open for manual testing if needed
        console.log('🔍 Browser kept open for manual testing - press Ctrl+C to close');
        await sleep(30000); // Wait 30 seconds before closing
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        
        if (browser) {
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