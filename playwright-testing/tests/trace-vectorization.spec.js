const { test, expect } = require('@playwright/test');

test('trace vectorization process', async ({ page, context }) => {
  // Start tracing
  await context.tracing.start({ screenshots: true, snapshots: true });
  
  // Capture ALL console messages
  const consoleLogs = [];
  page.on('console', msg => {
    const text = msg.text();
    consoleLogs.push(`[${msg.type()}] ${text}`);
    console.log(`[${msg.type()}] ${text}`);
  });
  
  // Capture network requests
  const networkLogs = [];
  page.on('request', request => {
    const url = request.url();
    if (url.includes('process-webhook') || url.includes('vectoriz')) {
      networkLogs.push(`[REQUEST] ${request.method()} ${url}`);
      console.log(`[REQUEST] ${request.method()} ${url}`);
    }
  });
  
  page.on('response', response => {
    const url = response.url();
    if (url.includes('process-webhook') || url.includes('vectoriz')) {
      networkLogs.push(`[RESPONSE] ${response.status()} ${url}`);
      console.log(`[RESPONSE] ${response.status()} ${url}`);
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
  await page.waitForSelector('#filesContainer:visible, #emptyState:visible');

  // Clear console logs from login
  consoleLogs.length = 0;
  networkLogs.length = 0;

  // Look for vectorize action
  const vectorizeBtn = await page.locator('.action-icon[title*="Vector"], button:has-text("Vectorize")').first();
  
  if (await vectorizeBtn.count() > 0) {
    console.log('\n=== STARTING VECTORIZATION ===\n');
    
    // Click vectorize
    await vectorizeBtn.click();
    
    // Wait for some activity
    await page.waitForTimeout(10000);
    
    console.log('\n=== CONSOLE LOGS ===');
    consoleLogs.forEach(log => console.log(log));
    
    console.log('\n=== NETWORK LOGS ===');
    networkLogs.forEach(log => console.log(log));
    
    // Check current state
    const state = await page.evaluate(() => {
      const filesWithFaces = Array.from(document.querySelectorAll('.file-grid-item, .file-list-item')).map(el => {
        const fileName = el.querySelector('.file-grid-name, .file-name')?.textContent;
        const hasVectorizeBtn = !!el.querySelector('[title*="Vector"]');
        return { fileName, hasVectorizeBtn };
      });
      
      const notifications = Array.from(document.querySelectorAll('.notification-message')).map(n => n.textContent);
      const errors = Array.from(document.querySelectorAll('.error')).map(e => e.textContent);
      
      return { filesWithFaces, notifications, errors };
    });
    
    console.log('\n=== FINAL STATE ===');
    console.log(JSON.stringify(state, null, 2));
    
  } else {
    // Check if already vectorized
    const fileState = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.file-grid-item')).map(el => ({
        fileName: el.querySelector('.file-grid-name')?.textContent,
        innerHTML: el.innerHTML.substring(0, 200)
      }));
    });
    
    console.log('Files (no vectorize button found):', fileState);
    
    // Click on faces filter
    await page.click('[data-filter="faces"]');
    await page.waitForTimeout(2000);
    
    const facesState = await page.evaluate(() => {
      const container = document.getElementById('facesContainer');
      return {
        innerHTML: container ? container.innerHTML.substring(0, 500) : 'No container',
        childCount: container ? container.children.length : 0
      };
    });
    
    console.log('Faces container:', facesState);
  }
  
  // Save trace
  await context.tracing.stop({ path: 'vectorization-trace.zip' });
});