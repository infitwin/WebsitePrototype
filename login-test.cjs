const { chromium } = require('playwright');

async function testWithLogin() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('🔐 Logging in to access My Files...');
    await page.goto('http://localhost:8357/pages/my-files.html');
    await page.waitForTimeout(3000);
    
    // Check if auth modal is present and log in
    const loginTab = await page.locator('[data-tab="login"]').count();
    if (loginTab > 0) {
      console.log('📋 Auth modal found, logging in...');
      await page.click('[data-tab="login"]');
      await page.fill('.login-email', 'weezer@yev.com');
      await page.fill('.login-password', '123456');
      await page.click('button:has-text("Access Your Memories")');
      await page.waitForTimeout(3000);
      console.log('✅ Login submitted');
    }
    
    // Wait for page to load after login
    await page.waitForTimeout(3000);
    
    // Take screenshot of ACTUAL implementation after login
    await page.screenshot({ path: 'my-files-after-login.png', fullPage: true });
    console.log('📸 Screenshot after login: my-files-after-login.png');
    
    // Check what's actually implemented now
    const actualElements = await page.evaluate(() => {
      return {
        hasSearchInput: document.getElementById('searchInput') !== null,
        hasStorageIndicator: document.querySelector('.storage-indicator') !== null,
        hasFileGrid: document.getElementById('filesContainer') !== null,
        hasFilterChips: document.querySelectorAll('.filter-chip').length,
        hasUploadZone: document.getElementById('uploadZone') !== null,
        fileCardCount: document.querySelectorAll('.file-card').length,
        bodyMarginLeft: window.getComputedStyle(document.body).marginLeft,
        wrapperMarginLeft: document.querySelector('.main-content-wrapper') ? 
          window.getComputedStyle(document.querySelector('.main-content-wrapper')).marginLeft : 'no wrapper',
        pageTitle: document.querySelector('h1') ? document.querySelector('h1').textContent : 'no title found',
        currentURL: window.location.href,
        hasAuthModal: document.querySelector('.auth-modal') !== null
      };
    });
    
    console.log('\n🔍 ACTUAL IMPLEMENTATION AFTER LOGIN:');
    console.log('Current URL:', actualElements.currentURL);
    console.log('Page Title:', actualElements.pageTitle);
    console.log('Auth Modal still present:', actualElements.hasAuthModal);
    console.log('Search Input exists:', actualElements.hasSearchInput);
    console.log('Storage Indicator exists:', actualElements.hasStorageIndicator);
    console.log('File Grid exists:', actualElements.hasFileGrid);
    console.log('Filter Chips count:', actualElements.hasFilterChips);
    console.log('Upload Zone exists:', actualElements.hasUploadZone);
    console.log('File cards displayed:', actualElements.fileCardCount);
    console.log('Body margin-left:', actualElements.bodyMarginLeft);
    console.log('Wrapper margin-left:', actualElements.wrapperMarginLeft);
    
  } catch (error) {
    console.error('❌ Error during login test:', error.message);
    await page.screenshot({ path: 'login-error.png' });
  } finally {
    await page.waitForTimeout(5000);
    await browser.close();
  }
}

testWithLogin().catch(console.error);