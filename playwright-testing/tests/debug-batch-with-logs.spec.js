import { test, expect } from '@playwright/test';

test('Debug batch vectorization with full logging', async ({ page }) => {
    // Collect all console logs
    const consoleLogs = [];
    page.on('console', msg => {
        const text = msg.text();
        consoleLogs.push(text);
        if (text.includes('🚀') || text.includes('📡') || text.includes('🔍') || 
            text.includes('💾') || text.includes('📊') || text.includes('API') ||
            text.includes('faces') || text.includes('test-image')) {
            console.log(`[Console]: ${text}`);
        }
    });

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
    
    // Wait for files to fully load
    await page.waitForTimeout(2000);
    
    // Inject enhanced logging before vectorization
    await page.evaluate(() => {
        console.log('🔧 Injecting enhanced logging...');
        
        // Track API calls
        const originalFetch = window.fetch;
        let apiCallCount = 0;
        window.fetch = async function(...args) {
            if (args[0].includes('process-artifact')) {
                apiCallCount++;
                const payload = args[1]?.body ? JSON.parse(args[1].body) : null;
                console.log(`\n📤 API CALL #${apiCallCount}:`, {
                    url: args[0],
                    fileName: payload?.metadata?.fileName,
                    fileId: payload?.artifact_id,
                    fileUrl: payload?.file_url
                });
            }
            
            const response = await originalFetch.apply(this, args);
            
            if (args[0].includes('process-artifact')) {
                const clone = response.clone();
                try {
                    const data = await clone.json();
                    console.log(`📥 API RESPONSE #${apiCallCount}:`, {
                        status: response.status,
                        hasData: !!data,
                        hasResult: !!data?.result,
                        faces: data?.result?.data?.analysis?.faces || data?.faces || [],
                        faceCount: (data?.result?.data?.analysis?.faces || data?.faces || []).length,
                        error: data?.error
                    });
                } catch (e) {
                    console.log(`📥 API RESPONSE #${apiCallCount}: Failed to parse JSON`);
                }
            }
            
            return response;
        };
    });
    
    // Find and select files using locator
    const file1 = await page.locator('.file-card').filter({ hasText: 'test-image5.jpg' }).first();
    const file2 = await page.locator('.file-card').filter({ hasText: 'test-image3.jpg' }).first();
    
    const file1Count = await file1.count();
    const file2Count = await file2.count();
    
    if (file1Count === 0 || file2Count === 0) {
        console.log('Could not find both test files');
        console.log('test-image5.jpg found:', file1Count > 0);
        console.log('test-image3.jpg found:', file2Count > 0);
        return;
    }
    
    console.log('\n=== Selecting files for vectorization ===');
    
    // Select both files
    await file1.locator('.file-checkbox').click();
    await file2.locator('.file-checkbox').click();
    
    // Wait for batch actions
    await page.waitForSelector('#batchActions', { state: 'visible' });
    
    console.log('=== Starting vectorization ===');
    await page.click('#vectorizeBtn');
    
    // Wait for vectorization to complete
    await page.waitForFunction(() => {
        return document.querySelectorAll('.vectorization-loading-overlay').length === 0;
    }, { timeout: 60000 });
    
    // Additional wait to ensure all updates complete
    await page.waitForTimeout(5000);
    
    // Check final results
    const results = await page.evaluate(() => {
        const results = {
            file1: {},
            file2: {},
            currentFiles: []
        };
        
        // Check test-image5.jpg
        const allCards = document.querySelectorAll('.file-card');
        let file1Card = null;
        let file2Card = null;
        
        for (const card of allCards) {
            const fileName = card.querySelector('.file-name')?.textContent;
            if (fileName && fileName.includes('test-image5.jpg')) {
                file1Card = card;
            }
            if (fileName && fileName.includes('test-image3.jpg')) {
                file2Card = card;
            }
        }
        
        const file1Indicator = file1Card?.querySelector('.face-indicator');
        results.file1 = {
            hasFaceIndicator: !!file1Indicator,
            faceText: file1Indicator?.textContent?.trim() || 'none',
            cardDataset: file1Card?.dataset
        };
        
        const file2Indicator = file2Card?.querySelector('.face-indicator');
        results.file2 = {
            hasFaceIndicator: !!file2Indicator,
            faceText: file2Indicator?.textContent?.trim() || 'none',
            cardDataset: file2Card?.dataset
        };
        
        // Get current files data
        if (window.currentFiles) {
            results.currentFiles = window.currentFiles.map(f => ({
                fileName: f.fileName,
                faceCount: f.faceCount,
                extractedFaces: f.extractedFaces?.length || 0,
                id: f.id
            }));
        }
        
        return results;
    });
    
    console.log('\n=== FINAL RESULTS ===');
    console.log('File 1 (test-image5.jpg):', results.file1);
    console.log('File 2 (test-image3.jpg):', results.file2);
    console.log('\nCurrent Files Data:');
    results.currentFiles.forEach(f => {
        if (f.fileName?.includes('test-image')) {
            console.log(`- ${f.fileName}: ${f.faceCount} faces (${f.extractedFaces} extracted)`);
        }
    });
    
    // Print relevant console logs
    console.log('\n=== Key Console Logs ===');
    const relevantLogs = consoleLogs.filter(log => 
        log.includes('API') || 
        log.includes('faces') || 
        log.includes('test-image3') ||
        log.includes('Firebase') ||
        log.includes('💾')
    ).slice(-20); // Last 20 relevant logs
    
    relevantLogs.forEach(log => console.log(log));
});