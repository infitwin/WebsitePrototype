import { test, expect } from '@playwright/test';

test.describe('Debug Batch Vectorization - Second File Issue', () => {
    test('should properly vectorize second file in batch', async ({ page }) => {
        // Login first
        await page.goto('http://localhost:8357/pages/auth.html');
        await page.click('[data-tab="login"]');
        await page.fill('.login-email', 'weezer@yev.com');
        await page.fill('.login-password', '123456');
        await page.click('button:has-text("Access Your Memories")');
        await page.waitForURL('**/dashboard.html');
        
        // Navigate to My Files
        await page.goto('http://localhost:8357/pages/my-files.html');
        await page.waitForTimeout(2000);
        
        // Wait for files to load
        await page.waitForSelector('.file-card', { timeout: 10000 });
        
        // Get all file cards
        const fileCards = await page.$$('.file-card');
        console.log(`Found ${fileCards.length} files`);
        
        // Find files without faces (no face indicator)
        const filesWithoutFaces = [];
        const filesWithFaces = [];
        
        for (const card of fileCards) {
            const fileName = await card.$eval('.file-name', el => el.textContent);
            const hasFaceIndicator = await card.$('.face-indicator');
            
            if (hasFaceIndicator) {
                filesWithFaces.push({ card, fileName });
            } else {
                filesWithoutFaces.push({ card, fileName });
            }
        }
        
        console.log(`Files with faces: ${filesWithFaces.length}`);
        console.log(`Files without faces: ${filesWithoutFaces.length}`);
        
        // We need at least 1 file with faces and 1 without to test the issue
        if (filesWithFaces.length < 1 || filesWithoutFaces.length < 1) {
            console.log('Need at least 1 file with faces and 1 without faces');
            return;
        }
        
        // Select one file with faces (first) and test-image3.jpg (second)
        const file1 = filesWithFaces[0];  // File with faces
        const file2 = filesWithoutFaces.find(f => f.fileName.includes('test-image3.jpg')) || filesWithoutFaces[0];  // test-image3.jpg
        
        console.log(`Selecting files for vectorization:`);
        console.log(`File 1: ${file1.fileName}`);
        console.log(`File 2: ${file2.fileName}`);
        
        // Click checkboxes to select files
        const checkbox1 = await file1.card.$('.file-checkbox');
        await checkbox1.click();
        
        const checkbox2 = await file2.card.$('.file-checkbox');
        await checkbox2.click();
        
        // Wait for batch actions to appear
        await page.waitForSelector('#batchActions', { state: 'visible' });
        
        // Inject console log interceptor
        page.on('console', msg => {
            const text = msg.text();
            console.log(`[Browser Console]: ${text}`);
        });
        
        // Click vectorize button
        console.log('Clicking Vectorize Selected button...');
        await page.click('#vectorizeBtn');
        
        // Wait for vectorization to complete (loading overlay should disappear)
        console.log('Waiting for vectorization to complete...');
        await page.waitForFunction(() => {
            const overlays = document.querySelectorAll('.vectorization-loading-overlay');
            return overlays.length === 0;
        }, { timeout: 60000 });
        
        // Give it a moment for UI to update
        await page.waitForTimeout(3000);
        
        // Check results for both files
        console.log('\n=== CHECKING RESULTS ===');
        
        // Re-find the file cards by file name
        const file1CardAfter = await page.$(`[data-file-id]:has(.file-name:has-text("${file1.fileName}"))`);
        const file2CardAfter = await page.$(`[data-file-id]:has(.file-name:has-text("${file2.fileName}"))`);
        
        // Check if File 1 has faces
        const file1FaceIndicator = await file1CardAfter.$('.face-indicator');
        if (file1FaceIndicator) {
            const file1FaceCount = await file1FaceIndicator.textContent();
            console.log(`✅ File 1 (${file1.fileName}): ${file1FaceCount}`);
        } else {
            console.log(`❌ File 1 (${file1.fileName}): No face indicator found`);
        }
        
        // Check if File 2 has faces
        const file2FaceIndicator = await file2CardAfter.$('.face-indicator');
        if (file2FaceIndicator) {
            const file2FaceCount = await file2FaceIndicator.textContent();
            console.log(`✅ File 2 (${file2.fileName}): ${file2FaceCount}`);
        } else {
            console.log(`❌ File 2 (${file2.fileName}): No face indicator found`);
        }
        
        // Click on File 2 to see if it opens and check for faces
        console.log(`\nClicking on File 2 to check face data...`);
        const file2Thumbnail = await file2CardAfter.$('.file-thumbnail');
        if (file2Thumbnail) {
            await file2Thumbnail.click();
        }
        
        // Wait a moment
        await page.waitForTimeout(1000);
        
        // Check if face modal button exists in image viewer
        const faceDetailsBtn = await page.$('.face-details-btn');
        if (faceDetailsBtn) {
            const btnText = await faceDetailsBtn.textContent();
            console.log(`Face Details button found: ${btnText}`);
        } else {
            console.log('No Face Details button in image viewer');
        }
        
        // Take screenshot for debugging
        await page.screenshot({ 
            path: 'playwright-testing/debug-batch-second-file.png',
            fullPage: true 
        });
        
        console.log('\nScreenshot saved to: playwright-testing/debug-batch-second-file.png');
    });
});