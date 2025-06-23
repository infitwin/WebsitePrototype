const { chromium } = require('playwright');

async function captureAPIResponse() {
  console.log('🚀 Testing vectorization with any available image...');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Log everything
  page.on('console', msg => console.log(`BROWSER: ${msg.text()}`));
  page.on('request', req => {
    if (req.url().includes('localhost:8080')) {
      console.log(`🌐 REQUEST TO LOCAL: ${req.method()} ${req.url()}`);
    }
  });
  page.on('response', res => {
    if (res.url().includes('localhost:8080')) {
      console.log(`🌐 RESPONSE FROM LOCAL: ${res.status()}`);
    }
  });

  try {
    console.log('📌 Step 1: Logging in...');
    await page.goto('http://localhost:8357/pages/auth.html');
    await page.click('[data-tab="login"]');
    await page.fill('.login-email', 'weezer@yev.com');
    await page.fill('.login-password', '123456');
    await page.click('button:has-text("Access Your Memories")');
    await page.waitForURL('**/my-files.html');

    console.log('📌 Step 2: Finding available images...');
    await page.waitForSelector('.file-grid');
    await page.waitForTimeout(3000);

    // Find any image file
    const allFiles = await page.locator('.file-item').all();
    console.log(`Found ${allFiles.length} total files`);
    
    let imageSelected = false;
    for (let i = 0; i < allFiles.length; i++) {
      const file = allFiles[i];
      const fileName = await file.locator('.file-name').textContent();
      console.log(`Checking file: ${fileName}`);
      
      if (fileName.match(/\.(jpg|jpeg|png|gif)$/i)) {
        console.log(`📌 Step 3: Selecting image: ${fileName}...`);
        await file.click();
        imageSelected = true;
        break;
      }
    }

    if (!imageSelected) {
      throw new Error('No image files found');
    }

    console.log('📌 Step 4: Clicking vectorize...');
    await page.waitForSelector('#vectorizeBtn');
    await page.click('#vectorizeBtn');
    
    console.log('⏳ Waiting for response...');
    await page.waitForTimeout(10000);

    console.log('✅ Test completed');

  } catch (error) {
    console.log('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

captureAPIResponse().catch(console.error);