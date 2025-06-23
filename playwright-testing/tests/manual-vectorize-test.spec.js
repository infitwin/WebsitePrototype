import { test, expect } from '@playwright/test';

test('Manual vectorization test with detailed logging', async ({ page }) => {
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
    
    // Manually trigger vectorization for test-image3.jpg
    const result = await page.evaluate(async () => {
        const logs = [];
        
        // Find test-image3.jpg in currentFiles
        const file3 = window.currentFiles?.find(f => f.fileName?.includes('test-image3.jpg'));
        if (!file3) {
            return { error: 'test-image3.jpg not found in currentFiles' };
        }
        
        logs.push(`Found file: ${file3.fileName} (ID: ${file3.id})`);
        logs.push(`Current face count: ${file3.faceCount || 0}`);
        logs.push(`Download URL: ${file3.downloadURL}`);
        
        // Get auth token
        const { auth } = await import('../firebase-config.js');
        const user = auth.currentUser;
        if (!user) {
            return { error: 'User not authenticated' };
        }
        
        const authToken = await user.getIdToken();
        logs.push(`Got auth token (length: ${authToken.length})`);
        
        // Prepare payload
        const payload = {
            artifact_id: file3.id,
            file_url: file3.downloadURL,
            mime_type: file3.fileType || 'image/jpeg',
            user_id: user.uid,
            options: {},
            metadata: {
                fileName: file3.fileName,
                twinId: localStorage.getItem('selectedTwinId') || 'default',
                uploadedAt: file3.uploadedAt
            }
        };
        
        logs.push('Payload prepared:', JSON.stringify(payload));
        
        // Make API call
        const apiEndpoint = 'http://localhost:8080/process-artifact';
        logs.push(`Calling API: ${apiEndpoint}`);
        
        try {
            const response = await fetch(apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`,
                    'Origin': window.location.origin
                },
                mode: 'cors',
                body: JSON.stringify(payload)
            });
            
            logs.push(`Response status: ${response.status}`);
            
            if (!response.ok) {
                const errorText = await response.text();
                logs.push(`Error response: ${errorText}`);
                return { logs, error: `API error: ${response.status}` };
            }
            
            const apiResult = await response.json();
            logs.push('API Result:', JSON.stringify(apiResult));
            
            // Extract faces
            const faces = apiResult.result?.data?.analysis?.faces || 
                         apiResult.vectorizationResults?.faces || 
                         apiResult.faces || [];
            
            logs.push(`Faces found: ${faces.length}`);
            
            return {
                logs,
                success: true,
                faceCount: faces.length,
                faces: faces,
                apiResult: apiResult
            };
            
        } catch (error) {
            logs.push(`Fetch error: ${error.message}`);
            return { logs, error: error.message };
        }
    });
    
    console.log('\n=== MANUAL VECTORIZATION TEST RESULTS ===');
    result.logs?.forEach(log => console.log(log));
    
    if (result.success) {
        console.log(`\n✅ SUCCESS: Found ${result.faceCount} faces`);
        if (result.faces && result.faces.length > 0) {
            console.log('Face data:', JSON.stringify(result.faces, null, 2));
        }
    } else {
        console.log(`\n❌ ERROR: ${result.error}`);
    }
});