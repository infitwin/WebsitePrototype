const { chromium } = require('playwright');

async function testFaceDetection() {
  console.log('🚀 Testing face detection with real content_router...');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Capture all logs and network activity
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('🐛') || text.includes('🔧') || text.includes('📤') || text.includes('📡')) {
      console.log(`DEBUG: ${text}`);
    } else if (text.includes('FETCH') || text.includes('REQUEST')) {
      console.log(`HTTP: ${text}`);
    } else if (msg.type() === 'error') {
      console.log(`ERROR: ${text}`);
    }
  });

  page.on('request', req => {
    if (req.url().includes('localhost:8080')) {
      console.log(`🌐 REQ TO LOCAL: ${req.method()} ${req.url()}`);
      console.log(`🌐 REQ BODY: ${req.postData()}`);
    }
  });

  page.on('response', res => {
    if (res.url().includes('localhost:8080')) {
      console.log(`🌐 RES FROM LOCAL: ${res.status()} ${res.statusText()}`);
    }
  });

  try {
    // Login
    console.log('🔑 Logging in...');
    await page.goto('http://localhost:8357/pages/auth.html');
    await page.click('[data-tab="login"]');
    await page.fill('.login-email', 'weezer@yev.com');
    await page.fill('.login-password', '123456');
    await page.click('button:has-text("Access Your Memories")');
    
    // Wait and check where we are
    await page.waitForTimeout(3000);
    const currentURL = page.url();
    console.log(`Current URL: ${currentURL}`);
    
    // Navigate directly to My Files if not there
    if (!currentURL.includes('my-files.html')) {
      console.log('🔄 Navigating directly to My Files...');
      await page.goto('http://localhost:8357/pages/my-files.html');
    }

    // Wait for files to load
    await page.waitForSelector('.file-grid', { timeout: 10000 });
    await page.waitForTimeout(3000);
    console.log('📁 My Files page loaded');

    // Get all files and find images
    const allFiles = await page.locator('.file-item').all();
    console.log(`Found ${allFiles.length} total files`);
    
    if (allFiles.length === 0) {
      throw new Error('No files found to test with');
    }

    // Select first file (should be an image based on what user said)
    console.log('📷 Selecting first file...');
    await allFiles[0].click();

    // Check if vectorize button appears
    await page.waitForSelector('#vectorizeBtn', { timeout: 5000 });
    console.log('🎯 Vectorize button found');

    // Add debugging before clicking
    await page.evaluate(() => {
      console.log('🔧 DEBUGGING: About to click vectorize...');
      console.log('🔧 Current endpoint will be: http://localhost:8080/process-artifact');
    });

    // Click vectorize
    console.log('🚀 Clicking vectorize button...');
    await page.click('#vectorizeBtn');
    
    // Wait for processing
    console.log('⏳ Waiting for processing...');
    await page.waitForTimeout(15000);

    // Check what happened
    console.log('🔍 Checking results...');
    
    // Check for any success/error messages
    const notifications = await page.locator('.notification, .alert, .message').all();
    for (const notification of notifications) {
      const text = await notification.textContent();
      console.log(`NOTIFICATION: ${text}`);
    }

    console.log('✅ Face detection test completed');

  } catch (error) {
    console.log('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testFaceDetection().catch(console.error);