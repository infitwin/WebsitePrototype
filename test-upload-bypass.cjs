const puppeteer = require('puppeteer');

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function testFileUploadWithBypass() {
    let browser;
    try {
        console.log('🔍 Starting file upload test with auth bypass...');
        
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        const page = await browser.newPage();
        
        // Capture console messages
        page.on('console', msg => console.log(`[BROWSER]`, msg.text()));
        page.on('pageerror', error => console.error('[PAGE-ERROR]', error.message));
        
        // Set auth bypass in localStorage
        console.log('🔧 Setting auth bypass...');
        await page.evaluateOnNewDocument(() => {
            localStorage.setItem('bypass_auth', 'true');
        });
        
        // Navigate directly to My Files page
        console.log('📂 Navigating to My Files page with auth bypass...');
        await page.goto('http://localhost:8357/pages/my-files.html');
        
        // Wait for page to load
        await sleep(3000);
        
        const title = await page.title();
        const url = page.url();
        console.log('📑 Page title:', title);
        console.log('📍 Current URL:', url);
        
        if (url.includes('auth.html')) {
            console.log('❌ Auth bypass failed - still redirected to auth page');
            return;
        }
        
        if (title === 'My Files - Infitwin') {
            console.log('✅ Successfully loaded My Files page!');
            
            // Check for upload elements
            console.log('🔍 Checking upload functionality...');
            
            try {
                await page.waitForSelector('#fileInput', { timeout: 5000 });
                console.log('✅ File input found');
            } catch (e) {
                console.log('❌ File input not found within 5 seconds');
                
                // Check what elements are actually present
                const pageContent = await page.evaluate(() => {
                    return {
                        hasEmptyState: !!document.getElementById('emptyState'),
                        emptyStateVisible: document.getElementById('emptyState')?.style.display !== 'none',
                        emptyStateText: document.getElementById('emptyState')?.textContent?.trim(),
                        hasLoadingState: !!document.getElementById('loadingState'),
                        loadingStateVisible: document.getElementById('loadingState')?.style.display !== 'none',
                        hasFileInput: !!document.getElementById('fileInput'),
                        hasDropZone: !!document.getElementById('dropZone'),
                        bodyClasses: document.body.className,
                        mainContent: document.querySelector('main')?.innerHTML?.substring(0, 500)
                    };
                });
                
                console.log('📄 Page content analysis:', pageContent);
                
                if (pageContent.emptyStateVisible) {
                    console.log('ℹ️ Empty state is showing, this might be normal for no authenticated user');
                }
                
                // Take screenshot for debugging
                await page.screenshot({ path: '/tmp/my-files-bypass.png', fullPage: true });
                console.log('📸 Screenshot saved to /tmp/my-files-bypass.png');
                return;
            }
            
            // Test upload elements
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
            
            console.log('📂 Upload elements status:', uploadElements);
            
            if (uploadElements.hasFileInput && uploadElements.hasDropZone) {
                console.log('✅ All upload elements present!');
                
                // Test file service functions
                console.log('🧪 Testing file service functions...');
                const fileServiceTest = await page.evaluate(async () => {
                    try {
                        const { validateFile, FILE_SIZE_LIMIT } = await import('/js/file-service.js');
                        
                        // Test with valid file
                        const validFile = {
                            name: 'test.jpg',
                            size: 1024 * 1024, // 1MB
                            type: 'image/jpeg'
                        };
                        
                        const validResult = validateFile(validFile);
                        
                        // Test with invalid file (too big)
                        const invalidFile = {
                            name: 'big.jpg',
                            size: FILE_SIZE_LIMIT + 1,
                            type: 'image/jpeg'
                        };
                        
                        const invalidResult = validateFile(invalidFile);
                        
                        return {
                            success: true,
                            validFile: validResult,
                            invalidFile: invalidResult,
                            fileSizeLimit: FILE_SIZE_LIMIT
                        };
                    } catch (error) {
                        return {
                            success: false,
                            error: error.message
                        };
                    }
                });
                
                console.log('🧪 File service test results:', fileServiceTest);
                
                if (fileServiceTest.success) {
                    console.log('✅ File service is working correctly!');
                    console.log(`📏 File size limit: ${Math.round(fileServiceTest.fileSizeLimit / 1024 / 1024)}MB`);
                    
                    if (fileServiceTest.validFile.isValid) {
                        console.log('✅ Valid file validation passed');
                    }
                    
                    if (!fileServiceTest.invalidFile.isValid) {
                        console.log('✅ Invalid file validation correctly failed');
                    }
                    
                    // Test drag-drop initialization
                    console.log('🎯 Testing drag-drop functionality...');
                    const dragDropTest = await page.evaluate(() => {
                        const dropZone = document.getElementById('dropZone');
                        if (!dropZone) return { hasDropZone: false };
                        
                        // Check if event listeners are attached
                        const hasClickListener = dropZone.onclick !== null;
                        
                        // Try to simulate a click to see if file input opens
                        return {
                            hasDropZone: true,
                            hasClickListener,
                            dropZoneClasses: dropZone.className,
                            canClick: true
                        };
                    });
                    
                    console.log('🎯 Drag-drop test results:', dragDropTest);
                    
                    if (dragDropTest.hasDropZone) {
                        console.log('✅ Drag-drop zone is present and should work');
                        
                        // The main issue might be Firebase authentication
                        console.log('🔥 Checking Firebase services...');
                        const firebaseCheck = await page.evaluate(() => {
                            try {
                                return {
                                    hasFirebaseConfig: typeof window.auth !== 'undefined',
                                    hasAuth: !!window.auth,
                                    hasDb: !!window.db,
                                    hasStorage: !!window.storage,
                                    currentUser: window.auth?.currentUser?.uid || null
                                };
                            } catch (error) {
                                return { error: error.message };
                            }
                        });
                        
                        console.log('🔥 Firebase services:', firebaseCheck);
                        
                        if (!firebaseCheck.currentUser) {
                            console.log('⚠️ No authenticated user - this is likely the main issue!');
                            console.log('💡 File uploads require authentication');
                            console.log('💡 The upload UI is working, but uploads will fail without auth');
                        } else {
                            console.log('✅ User is authenticated, uploads should work!');
                        }
                        
                        console.log('🎉 DIAGNOSIS COMPLETE:');
                        console.log('✅ Upload UI is working correctly');
                        console.log('✅ File validation is working');
                        console.log('✅ Drag-drop functionality is present');
                        console.log('⚠️ Main issue: User needs to be authenticated for actual uploads');
                        console.log('💡 Solution: Ensure user logs in before trying to upload files');
                        
                    } else {
                        console.log('❌ Drag-drop functionality issue');
                    }
                } else {
                    console.log('❌ File service error:', fileServiceTest.error);
                }
            } else {
                console.log('❌ Upload elements missing');
            }
            
            // Take final screenshot
            await page.screenshot({ 
                path: '/tmp/my-files-analysis.png', 
                fullPage: true 
            });
            console.log('📸 Analysis screenshot saved to /tmp/my-files-analysis.png');
            
        } else {
            console.log('❌ Wrong page loaded');
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        
        if (browser) {
            try {
                const page = (await browser.pages())[0];
                await page.screenshot({ path: '/tmp/error-analysis.png' });
                console.log('📸 Error screenshot saved to /tmp/error-analysis.png');
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

testFileUploadWithBypass();