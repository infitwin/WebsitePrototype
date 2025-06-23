/**
 * Direct test of vectorization with debugging injection
 * Run with: node test-vectorization-direct-injection.js
 */

const { chromium } = require('playwright');

async function testVectorization() {
  console.log('🎯 Starting direct vectorization test with injection...');
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Enable detailed logging
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    
    if (type === 'error') {
      console.log(`🔴 BROWSER ERROR: ${text}`);
    } else if (text.includes('🐛') || text.includes('🔧') || text.includes('🔍')) {
      console.log(`💬 DEBUG: ${text}`);
    } else if (text.includes('📤') || text.includes('📡') || text.includes('🚀')) {
      console.log(`🌐 NETWORK: ${text}`);
    } else if (text.includes('FETCH') || text.includes('REQUEST')) {
      console.log(`🌐 HTTP: ${text}`);
    }
  });

  // Capture network
  page.on('request', request => {
    if (request.url().includes('localhost:8080') || request.url().includes('process-artifact')) {
      console.log(`🌐 REQ: ${request.method()} ${request.url()}`);
    }
  });

  page.on('response', response => {
    if (response.url().includes('localhost:8080') || response.url().includes('process-artifact')) {
      console.log(`🌐 RES: ${response.status()} ${response.url()}`);
    }
  });

  page.on('requestfailed', request => {
    console.log(`🔴 FAILED: ${request.url()} - ${request.failure()?.errorText}`);
  });

  try {
    // Login
    console.log('🔑 Logging in...');
    await page.goto('http://localhost:8357/pages/auth.html');
    await page.click('[data-tab="login"]');
    await page.fill('.login-email', 'weezer@yev.com');
    await page.fill('.login-password', '123456');
    await page.click('button:has-text("Access Your Memories")');
    await page.waitForURL('**/my-files.html', { timeout: 10000 });
    console.log('✅ Logged in successfully');

    // Wait for files to load
    await page.waitForSelector('.file-grid', { timeout: 10000 });
    await page.waitForTimeout(3000);
    console.log('📁 Files loaded');

    // Select first image
    const images = await page.locator('.file-item').all();
    if (images.length === 0) {
      throw new Error('No files found to test');
    }
    
    await images[0].click();
    console.log('📷 Selected first image');

    // Wait for vectorize button
    await page.waitForSelector('#vectorizeBtn', { timeout: 5000 });
    console.log('🎯 Vectorize button found');

    // Inject debugging right before clicking
    await page.evaluate(() => {
      console.log('🔧 INJECTING: Enhanced debugging for vectorization...');
      
      // Store original fetch
      window.originalFetch = window.fetch;
      
      // Override fetch with detailed logging
      window.fetch = async function(url, options) {
        console.log('🌐 FETCH INTERCEPTED:');
        console.log('  URL:', url);
        console.log('  Options:', JSON.stringify(options, null, 2));
        
        try {
          const response = await window.originalFetch(url, options);
          console.log('🌐 FETCH RESPONSE:');
          console.log('  Status:', response.status);
          console.log('  StatusText:', response.statusText);
          console.log('  Headers:', [...response.headers.entries()]);
          
          // Clone for logging
          const responseClone = response.clone();
          const responseText = await responseClone.text();
          console.log('  Body:', responseText);
          
          return response;
        } catch (error) {
          console.log('🔴 FETCH ERROR:', error.message);
          console.log('🔴 FETCH STACK:', error.stack);
          throw error;
        }
      };
      
      console.log('✅ Fetch override installed');
    });

    // Click vectorize
    console.log('🚀 Clicking vectorize...');
    await page.click('#vectorizeBtn');

    // Wait for the action to complete
    console.log('⏳ Waiting for vectorization...');
    await page.waitForTimeout(10000);

    console.log('✅ Vectorization test completed');

  } catch (error) {
    console.log('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testVectorization().catch(console.error);