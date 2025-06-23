import { test, expect } from '@playwright/test';

test('Debug batch vectorization with injection', async ({ page }) => {
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
    
    // Inject debugging
    await page.evaluate(() => {
        // Override updateFileVectorizationStatus to log what's happening
        const originalUpdate = window.updateFileVectorizationStatus;
        window.updateFileVectorizationStatus = async function(fileId, result) {
            const fileName = window.currentFiles?.find(f => f.id === fileId)?.fileName || 'unknown';
            console.log(`🔍 UPDATE STATUS for ${fileName}:`, {
                fileId,
                hasResult: !!result,
                hasResultData: !!result?.result?.data,
                hasAnalysis: !!result?.result?.data?.analysis,
                faces: result?.result?.data?.analysis?.faces || result?.faces || [],
                fullResult: JSON.stringify(result)
            });
            return originalUpdate.call(this, fileId, result);
        };
        
        // Override updateFileVectorizationUI to log
        const originalUI = window.updateFileVectorizationUI;
        window.updateFileVectorizationUI = function(fileId, result) {
            const fileName = window.currentFiles?.find(f => f.id === fileId)?.fileName || 'unknown';
            console.log(`🎨 UPDATE UI for ${fileName}:`, {
                fileId,
                faces: result?.result?.data?.analysis?.faces || result?.faces || [],
                faceCount: (result?.result?.data?.analysis?.faces || result?.faces || []).length
            });
            return originalUI.call(this, fileId, result);
        };
        
        // Also log API responses
        const originalFetch = window.fetch;
        window.fetch = async function(...args) {
            const response = await originalFetch.apply(this, args);
            if (args[0].includes('process-artifact')) {
                const clone = response.clone();
                const data = await clone.json();
                console.log('📡 API Response:', {
                    url: args[0],
                    status: response.status,
                    data: JSON.stringify(data)
                });
            }
            return response;
        };
    });
    
    // Find test-image3.jpg
    const file1 = await page.$('.file-card:has(.file-name:has-text("test-image5.jpg"))');
    const file2 = await page.$('.file-card:has(.file-name:has-text("test-image3.jpg"))');
    
    if (!file1 || !file2) {
        console.log('Could not find both test files');
        return;
    }
    
    // Select both files
    const checkbox1 = await file1.$('.file-checkbox');
    await checkbox1.click();
    const checkbox2 = await file2.$('.file-checkbox');
    await checkbox2.click();
    
    // Wait for batch actions
    await page.waitForSelector('#batchActions', { state: 'visible' });
    
    // Set up console logging
    page.on('console', msg => console.log('[Browser]:', msg.text()));
    
    // Click vectorize
    console.log('\n=== Starting vectorization ===');
    await page.click('#vectorizeBtn');
    
    // Wait for completion
    await page.waitForFunction(() => {
        return document.querySelectorAll('.vectorization-loading-overlay').length === 0;
    }, { timeout: 60000 });
    
    // Check results
    await page.waitForTimeout(3000);
    
    // Check File 2 specifically
    const file2Result = await page.evaluate(() => {
        // Find file card that contains test-image3.jpg
        const allCards = document.querySelectorAll('.file-card');
        let file2Card = null;
        for (const card of allCards) {
            const fileName = card.querySelector('.file-name')?.textContent;
            if (fileName && fileName.includes('test-image3.jpg')) {
                file2Card = card;
                break;
            }
        }
        
        const faceIndicator = file2Card?.querySelector('.face-indicator');
        const currentFiles = window.currentFiles || [];
        const file2Data = currentFiles.find(f => f.fileName?.includes('test-image3.jpg'));
        
        return {
            hasFaceIndicator: !!faceIndicator,
            faceText: faceIndicator?.textContent || 'no indicator',
            fileData: file2Data ? {
                id: file2Data.id,
                fileName: file2Data.fileName,
                faceCount: file2Data.faceCount,
                extractedFaces: file2Data.extractedFaces?.length || 0
            } : null
        };
    });
    
    console.log('\n=== File 2 (test-image3.jpg) Results ===');
    console.log(JSON.stringify(file2Result, null, 2));
});