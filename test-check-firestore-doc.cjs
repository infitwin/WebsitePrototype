const { chromium } = require('playwright');

async function checkFirestoreDoc() {
    console.log('🚀 Checking specific Firestore document...');
    
    const browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const context = await browser.newContext();
    const page = await context.newPage();
    
    try {
        // Navigate to the check page
        console.log('\n📌 Loading Firestore check page...');
        await page.goto('http://localhost:8357/check-specific-firestore-doc.html');
        await page.waitForTimeout(5000); // Wait for Firestore operations
        
        // Get the output
        const output = await page.$eval('#output', el => el.textContent);
        console.log('\n📊 Firestore Document Data:');
        console.log(output);
        
        // Take screenshot
        await page.screenshot({ path: 'firestore-doc-check.png', fullPage: true });
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await browser.close();
        console.log('\n✅ Test completed');
    }
}

checkFirestoreDoc().catch(console.error);