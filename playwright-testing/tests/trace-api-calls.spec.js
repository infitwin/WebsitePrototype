import { test, expect } from '@playwright/test';

test('Trace API calls during batch vectorization', async ({ page }) => {
    // Login
    await page.goto('http://localhost:8357/pages/auth.html');
    await page.click('[data-tab="login"]');
    await page.fill('.login-email', 'weezer@yev.com');
    await page.fill('.login-password', '123456');
    await page.click('button:has-text("Access Your Memories")');
    await page.waitForURL('**/dashboard.html');
    
    // Go to My Files
    await page.goto('http://localhost:8357/pages/my-files.html');
    await page.waitForSelector('.file-card', { timeout: 10000 });
    await page.waitForTimeout(2000);
    
    // Find the files
    const file1 = await page.locator('.file-card').filter({ hasText: 'test-image5.jpg' }).first();
    const file2 = await page.locator('.file-card').filter({ hasText: 'test-image3.jpg' }).first();
    
    if (await file1.count() === 0 || await file2.count() === 0) {
        console.log('Could not find both test files');
        return;
    }
    
    // Select both files
    await file1.locator('.file-checkbox').click();
    await file2.locator('.file-checkbox').click();
    await page.waitForSelector('#batchActions', { state: 'visible' });
    
    // Set up request/response interception
    const apiCalls = [];
    const apiResponses = [];
    
    page.on('request', request => {
        if (request.url().includes('process-artifact')) {
            const postData = request.postData();
            const payload = postData ? JSON.parse(postData) : null;
            console.log(`\n📤 API REQUEST to ${request.url()}`);
            console.log(`   File: ${payload?.metadata?.fileName}`);
            console.log(`   File ID: ${payload?.artifact_id}`);
            console.log(`   File URL: ${payload?.file_url}`);
            apiCalls.push({ url: request.url(), payload });
        }
    });
    
    page.on('response', async response => {
        if (response.url().includes('process-artifact')) {
            console.log(`\n📥 API RESPONSE from ${response.url()}`);
            console.log(`   Status: ${response.status()}`);
            try {
                const data = await response.json();
                const faces = data?.result?.data?.analysis?.faces || data?.faces || [];
                console.log(`   Faces found: ${faces.length}`);
                if (faces.length > 0) {
                    console.log(`   Face data:`, faces);
                }
                apiResponses.push({ url: response.url(), status: response.status(), data });
            } catch (e) {
                console.log(`   Failed to parse response`);
            }
        }
    });
    
    // Click vectorize
    console.log('\n=== Starting vectorization ===');
    await page.click('#vectorizeBtn');
    
    // Wait for completion
    await page.waitForFunction(() => {
        return document.querySelectorAll('.vectorization-loading-overlay').length === 0;
    }, { timeout: 60000 });
    
    await page.waitForTimeout(3000);
    
    // Check final state
    const finalState = await page.evaluate(() => {
        const file3Data = window.currentFiles?.find(f => f.fileName?.includes('test-image3.jpg'));
        return {
            file3: file3Data ? {
                fileName: file3Data.fileName,
                faceCount: file3Data.faceCount,
                extractedFaces: file3Data.extractedFaces
            } : null
        };
    });
    
    console.log('\n=== FINAL STATE ===');
    console.log('test-image3.jpg data:', finalState.file3);
    
    console.log('\n=== API CALL SUMMARY ===');
    console.log(`Total API calls made: ${apiCalls.length}`);
    console.log(`Total API responses: ${apiResponses.length}`);
});