const puppeteer = require('puppeteer');

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function testMyFilesPage() {
    let browser;
    try {
        console.log('🔍 Starting My Files page diagnostic...');
        
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        const page = await browser.newPage();
        
        // Capture all console messages
        page.on('console', msg => {
            const type = msg.type();
            console.log(`[BROWSER-${type.toUpperCase()}]`, msg.text());
        });
        
        // Capture errors
        page.on('pageerror', error => {
            console.error('[PAGE-ERROR]', error.message);
        });
        
        // Capture failed requests with details
        page.on('requestfailed', request => {
            console.error('[REQUEST-FAILED]', {
                url: request.url(),
                error: request.failure().errorText,
                method: request.method()
            });
        });
        
        // Capture all requests for debugging
        page.on('request', request => {
            if (request.url().includes('localhost:8357')) {
                console.log('[REQUEST]', request.method(), request.url());
            }
        });
        
        // Capture response status codes
        page.on('response', response => {
            if (response.url().includes('localhost:8357')) {
                console.log('[RESPONSE]', response.status(), response.url());
            }
        });
        
        // Navigate to My Files page
        console.log('📄 Loading My Files page...');
        const response = await page.goto('http://localhost:8357/pages/my-files.html', {
            waitUntil: 'networkidle0',
            timeout: 30000
        });
        
        console.log('📄 Initial response status:', response.status());
        
        // Check if page loaded
        const title = await page.title();
        const url = page.url();
        console.log('📑 Page title:', title);
        console.log('📍 Current URL:', url);
        
        // Wait a bit for JavaScript to initialize
        await sleep(3000);
        
        console.log('✅ Diagnostic complete');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

testMyFilesPage();