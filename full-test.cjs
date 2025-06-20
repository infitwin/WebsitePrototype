const { chromium } = require('playwright');

async function fullMyFilesTest() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('🔐 Full login flow to My Files...');
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
    
    // Click Skip for Testing button
    const skipButton = await page.locator('button:has-text("Skip for Testing")').count();
    if (skipButton > 0) {
      console.log('🚫 Clicking Skip for Testing...');
      await page.click('button:has-text("Skip for Testing")');
      await page.waitForTimeout(2000);
    }
    
    // Navigate to My Files 
    console.log('📁 Trying to access My Files...');
    await page.goto('http://localhost:8357/pages/my-files.html');
    await page.waitForTimeout(3000);
    
    // Take screenshot of the actual My Files page
    await page.screenshot({ path: 'ACTUAL-my-files-page.png', fullPage: true });
    console.log('📸 ACTUAL My Files page: ACTUAL-my-files-page.png');
    
    // VISUAL CONFIRMATION - Check what's actually implemented
    const actualImplementation = await page.evaluate(() => {
      return {
        url: window.location.href,
        title: document.title,
        pageHeading: document.querySelector('h1') ? document.querySelector('h1').textContent : 'No h1 found',
        
        // Check for all the elements we expect
        elements: {
          searchInput: document.getElementById('searchInput') !== null,
          storageIndicator: document.querySelector('.storage-indicator') !== null,
          filesContainer: document.getElementById('filesContainer') !== null,
          uploadZone: document.getElementById('uploadZone') !== null,
          filterChips: document.querySelectorAll('.filter-chip').length,
          fileCards: document.querySelectorAll('.file-card').length,
          fixedHeader: document.querySelector('.fixed-header') !== null,
          stickyControls: document.querySelector('.sticky-controls') !== null
        },
        
        // Check layout - the key improvements we made
        layout: {
          bodyMarginLeft: window.getComputedStyle(document.body).marginLeft,
          wrapperMarginLeft: document.querySelector('.main-content-wrapper') ? 
            window.getComputedStyle(document.querySelector('.main-content-wrapper')).marginLeft : 'no wrapper found'
        },
        
        // Check if storage bar exists and what color it is
        storageBar: {
          exists: document.getElementById('storageBar') !== null,
          width: document.getElementById('storageBar') ? document.getElementById('storageBar').style.width : 'not found',
          backgroundColor: document.getElementById('storageBar') ? document.getElementById('storageBar').style.backgroundColor : 'not found',
          hasProgressiveClasses: document.querySelector('.storage-bar.warning') !== null || document.querySelector('.storage-bar.danger') !== null
        },
        
        // Check CSS classes that indicate our improvements
        improvements: {
          hasDesignSystemCSS: document.querySelector('link[href*="design-system"]') !== null,
          hasMyFilesCSS: document.querySelector('link[href*="my-files"]') !== null,
          hasMainContentWrapper: document.querySelector('.main-content-wrapper') !== null
        }
      };
    });
    
    console.log('\n🎯 ACTUAL MY FILES IMPLEMENTATION VISUAL CONFIRMATION:');
    console.log('URL:', actualImplementation.url);
    console.log('Title:', actualImplementation.title);
    console.log('Page Heading:', actualImplementation.pageHeading);
    
    console.log('\n📋 ELEMENTS CHECK:');
    console.log('✓ Search Input exists:', actualImplementation.elements.searchInput);
    console.log('✓ Storage Indicator exists:', actualImplementation.elements.storageIndicator);
    console.log('✓ Files Container exists:', actualImplementation.elements.filesContainer);
    console.log('✓ Upload Zone exists:', actualImplementation.elements.uploadZone);
    console.log('✓ Filter Chips count:', actualImplementation.elements.filterChips);
    console.log('✓ File Cards displayed:', actualImplementation.elements.fileCards);
    console.log('✓ Fixed Header exists:', actualImplementation.elements.fixedHeader);
    console.log('✓ Sticky Controls exist:', actualImplementation.elements.stickyControls);
    
    console.log('\n📐 LAYOUT CHECK (Purple Sidebar Compatibility):');
    console.log('✓ Body Margin Left:', actualImplementation.layout.bodyMarginLeft);
    console.log('✓ Wrapper Margin Left:', actualImplementation.layout.wrapperMarginLeft);
    
    console.log('\n📊 STORAGE BAR (Progressive Colors):');
    console.log('✓ Storage Bar exists:', actualImplementation.storageBar.exists);
    console.log('✓ Width set:', actualImplementation.storageBar.width);
    console.log('✓ Background Color:', actualImplementation.storageBar.backgroundColor);
    console.log('✓ Has progressive classes:', actualImplementation.storageBar.hasProgressiveClasses);
    
    console.log('\n🎨 DESIGN IMPROVEMENTS:');
    console.log('✓ Design System CSS loaded:', actualImplementation.improvements.hasDesignSystemCSS);
    console.log('✓ My Files CSS loaded:', actualImplementation.improvements.hasMyFilesCSS);
    console.log('✓ Main Content Wrapper:', actualImplementation.improvements.hasMainContentWrapper);
    
    // FINAL VERDICT
    const allElementsExist = actualImplementation.elements.searchInput && 
                           actualImplementation.elements.storageIndicator && 
                           actualImplementation.elements.filesContainer && 
                           actualImplementation.elements.uploadZone;
    
    const layoutFixed = actualImplementation.layout.bodyMarginLeft === '60px' || 
                       actualImplementation.layout.wrapperMarginLeft === '60px';
    
    console.log('\n🏆 FINAL VISUAL CONFIRMATION:');
    console.log('All required elements present:', allElementsExist);
    console.log('Sidebar layout implemented:', layoutFixed);
    console.log('Storage bar implemented:', actualImplementation.storageBar.exists);
    
    if (allElementsExist && layoutFixed && actualImplementation.storageBar.exists) {
      console.log('✅ VERIFIED: My Files improvements are actually implemented!');
    } else {
      console.log('❌ FAILED: Some improvements are missing from actual implementation');
    }
    
  } catch (error) {
    console.error('❌ Error during visual confirmation:', error.message);
    await page.screenshot({ path: 'visual-confirmation-error.png' });
  } finally {
    await page.waitForTimeout(5000);
    await browser.close();
  }
}

fullMyFilesTest().catch(console.error);