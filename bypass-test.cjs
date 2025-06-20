const { chromium } = require('playwright');

async function loginAndBypass() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('🔐 Logging in and bypassing email verification...');
    await page.goto('http://localhost:8357/pages/my-files.html');
    await page.waitForTimeout(2000);
    
    // Login
    const loginTab = await page.locator('[data-tab="login"]').count();
    if (loginTab > 0) {
      console.log('📋 Logging in...');
      await page.click('[data-tab="login"]');
      await page.fill('.login-email', 'weezer@yev.com');
      await page.fill('.login-password', '123456');
      await page.click('button:has-text("Access Your Memories")');
      await page.waitForTimeout(3000);
    }
    
    // Take screenshot to see current state
    await page.screenshot({ path: 'before-bypass.png', fullPage: true });
    console.log('📸 Before bypass: before-bypass.png');
    
    // Look for bypass button - check all buttons on page
    console.log('🔍 Looking for all buttons...');
    const allButtons = await page.locator('button').all();
    
    for (let i = 0; i < allButtons.length; i++) {
      const button = allButtons[i];
      const text = await button.textContent();
      const className = await button.getAttribute('class');
      const style = await button.getAttribute('style');
      const isVisible = await button.isVisible();
      
      console.log(`Button ${i}: "${text}" - class: ${className} - style: ${style} - visible: ${isVisible}`);
      
      // Click if it looks like a bypass button
      if (text && (
        text.toLowerCase().includes('bypass') ||
        text.toLowerCase().includes('skip') ||
        text.toLowerCase().includes('continue') ||
        text.toLowerCase().includes('dev') ||
        text.toLowerCase().includes('demo')
      )) {
        console.log(`🚫 Clicking bypass button: "${text}"`);
        await button.click();
        await page.waitForTimeout(2000);
        break;
      }
    }
    
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'after-bypass.png', fullPage: true });
    console.log('📸 After bypass: after-bypass.png');
    
    // Check final state
    const finalState = await page.evaluate(() => {
      return {
        url: window.location.href,
        title: document.title,
        hasMyFilesElements: {
          searchInput: !!document.getElementById('searchInput'),
          storageIndicator: !!document.querySelector('.storage-indicator'),
          filesContainer: !!document.getElementById('filesContainer'),
          uploadZone: !!document.getElementById('uploadZone'),
          filterChips: document.querySelectorAll('.filter-chip').length
        },
        bodyMargin: window.getComputedStyle(document.body).marginLeft,
        pageText: document.body.innerText.substring(0, 300)
      };
    });
    
    console.log('\n🎯 FINAL STATE AFTER BYPASS:');
    console.log('URL:', finalState.url);
    console.log('Title:', finalState.title);
    console.log('Search Input:', finalState.hasMyFilesElements.searchInput);
    console.log('Storage Indicator:', finalState.hasMyFilesElements.storageIndicator);
    console.log('Files Container:', finalState.hasMyFilesElements.filesContainer);
    console.log('Upload Zone:', finalState.hasMyFilesElements.uploadZone);
    console.log('Filter Chips:', finalState.hasMyFilesElements.filterChips);
    console.log('Body Margin:', finalState.bodyMargin);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await page.screenshot({ path: 'bypass-error.png' });
  } finally {
    await page.waitForTimeout(3000);
    await browser.close();
  }
}

loginAndBypass().catch(console.error);