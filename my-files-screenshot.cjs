const { chromium } = require('playwright');

async function takeMyFilesScreenshot() {
    console.log('Starting My Files screenshot capture...');
    
    const browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 }
    });
    
    const page = await context.newPage();
    
    // Collect console errors
    const consoleErrors = [];
    page.on('console', msg => {
        if (msg.type() === 'error') {
            consoleErrors.push(msg.text());
            console.log('Console error:', msg.text());
        }
    });
    
    // Collect network errors
    const networkErrors = [];
    page.on('response', response => {
        if (response.status() >= 400) {
            networkErrors.push(`${response.status()} ${response.url()}`);
            console.log('Network error:', response.status(), response.url());
        }
    });
    
    try {
        console.log('Navigating to auth page...');
        await page.goto('http://localhost:8357/pages/auth.html', { 
            waitUntil: 'networkidle',
            timeout: 30000 
        });
        
        console.log('Clicking login tab...');
        await page.click('[data-tab="login"]');
        
        console.log('Filling login credentials...');
        await page.fill('.login-email', 'weezer@yev.com');
        await page.fill('.login-password', '123456');
        
        console.log('Clicking login button...');
        await page.click('button:has-text("Access Your Memories")');
        
        console.log('Waiting for dashboard redirect...');
        await page.waitForURL('**/dashboard.html', { timeout: 30000 });
        
        console.log('Navigating to My Files page...');
        await page.goto('http://localhost:8357/pages/my-files.html', { 
            waitUntil: 'networkidle',
            timeout: 30000 
        });
        
        console.log('Waiting for page content to load...');
        // Wait for the main content elements to be visible
        await page.waitForSelector('.my-files-container', { timeout: 10000 });
        
        // Wait for storage overview section specifically
        console.log('Waiting for storage overview section...');
        try {
            await page.waitForSelector('.storage-overview', { timeout: 5000 });
        } catch (e) {
            console.log('Storage overview section not found, taking screenshot anyway');
        }
        
        // Wait for any charts or dynamic content to render
        console.log('Waiting for dynamic content to render...');
        await page.waitForTimeout(3000);
        
        console.log('Taking full page screenshot...');
        await page.screenshot({ 
            path: 'my-files-storage-verification.png', 
            fullPage: true 
        });
        
        console.log('Screenshot saved as: my-files-storage-verification.png');
        
        // Check for specific storage-related elements and errors
        const storageElements = await page.$$eval('*', elements => {
            return elements.map(el => {
                const text = el.textContent?.toLowerCase() || '';
                const classes = el.className || '';
                if (text.includes('storage') || text.includes('gb') || text.includes('mb') || 
                    classes.includes('storage') || classes.includes('chart')) {
                    return {
                        tag: el.tagName,
                        classes: el.className,
                        text: el.textContent?.trim().substring(0, 100)
                    };
                }
            }).filter(Boolean);
        });
        
        console.log('\nStorage-related elements found:');
        storageElements.forEach((el, i) => {
            console.log(`${i + 1}. ${el.tag}.${el.classes}: "${el.text}"`);
        });
        
        if (consoleErrors.length > 0) {
            console.log('\nConsole errors detected:');
            consoleErrors.forEach((error, i) => {
                console.log(`${i + 1}. ${error}`);
            });
        }
        
        if (networkErrors.length > 0) {
            console.log('\nNetwork errors detected:');
            networkErrors.forEach((error, i) => {
                console.log(`${i + 1}. ${error}`);
            });
        }
        
        if (consoleErrors.length === 0 && networkErrors.length === 0) {
            console.log('\nNo console or network errors detected.');
        }
        
    } catch (error) {
        console.error('Error during screenshot capture:', error);
        
        // Take a screenshot even if there's an error to see current state
        try {
            await page.screenshot({ 
                path: 'my-files-error-state.png', 
                fullPage: true 
            });
            console.log('Error state screenshot saved as: my-files-error-state.png');
        } catch (screenshotError) {
            console.error('Failed to take error screenshot:', screenshotError);
        }
    } finally {
        await browser.close();
    }
}

takeMyFilesScreenshot().then(() => {
    console.log('Screenshot process completed');
}).catch(error => {
    console.error('Failed to take screenshot:', error);
    process.exit(1);
});