const { chromium } = require('playwright');

async function testImageModal() {
  const browser = await chromium.launch({ headless: false, slowMo: 1000 });
  const page = await browser.newPage();
  
  console.log('🧪 Testing image modal functionality...');
  
  // Login
  await page.goto('http://localhost:8357/pages/my-files.html');
  await page.waitForTimeout(2000);
  await page.click('[data-tab="login"]');
  await page.fill('.login-email', 'weezer@yev.com');
  await page.fill('.login-password', '123456');
  await page.click('button:has-text("Access Your Memories")');
  await page.waitForTimeout(3000);
  
  const skipBtn = await page.locator('button:has-text("Skip")').count();
  if (skipBtn > 0) {
    await page.click('button:has-text("Skip")');
    await page.waitForTimeout(2000);
  }
  
  await page.goto('http://localhost:8357/pages/my-files.html');
  await page.waitForTimeout(5000);
  
  console.log('📊 Looking for image files...');
  
  // Find an image thumbnail and click it
  const imageFound = await page.evaluate(() => {
    const thumbnails = document.querySelectorAll('.file-thumbnail');
    for (let thumb of thumbnails) {
      const card = thumb.closest('.file-card');
      if (card) {
        const fileName = card.querySelector('.file-name')?.textContent || '';
        if (fileName.toLowerCase().includes('.jpg') || 
            fileName.toLowerCase().includes('.jpeg') || 
            fileName.toLowerCase().includes('.png')) {
          return {
            found: true,
            fileName,
            hasClickHandler: thumb.style.cursor === 'pointer'
          };
        }
      }
    }
    return { found: false };
  });
  
  console.log('🔍 Image search result:', imageFound);
  
  if (imageFound.found) {
    console.log('🖼️ Clicking on image:', imageFound.fileName);
    
    // Click the first image thumbnail
    await page.click('.file-thumbnail[style*="cursor: pointer"]');
    await page.waitForTimeout(2000);
    
    // Check if modal opened
    const modalVisible = await page.evaluate(() => {
      const modal = document.getElementById('imageModal');
      return {
        exists: !!modal,
        hasActiveClass: modal?.classList.contains('active'),
        imageLoaded: !!document.getElementById('imageModalImg')?.src,
        titleText: document.getElementById('imageModalTitle')?.textContent,
        sizeText: document.getElementById('imageModalSize')?.textContent
      };
    });
    
    console.log('📋 Modal state:', modalVisible);
    
    if (modalVisible.hasActiveClass) {
      console.log('✅ Image modal opened successfully!');
      
      // Take screenshot of modal
      await page.screenshot({ path: 'image-modal-open.png', fullPage: true });
      console.log('📸 Screenshot saved: image-modal-open.png');
      
      // Test comment functionality
      console.log('💬 Testing comment functionality...');
      await page.fill('#newCommentText', 'This is a test comment from Playwright!');
      await page.click('button:has-text("Add Comment")');
      await page.waitForTimeout(1000);
      
      // Check if comment was added
      const commentAdded = await page.evaluate(() => {
        const commentsList = document.getElementById('imageCommentsList');
        return {
          hasComments: !commentsList?.innerHTML.includes('No comments yet'),
          commentText: commentsList?.textContent || ''
        };
      });
      
      console.log('💬 Comment test result:', commentAdded);
      
      // Test closing modal
      console.log('❌ Testing modal close...');
      await page.click('.modal-close');
      await page.waitForTimeout(1000);
      
      const modalClosed = await page.evaluate(() => {
        const modal = document.getElementById('imageModal');
        return !modal?.classList.contains('active');
      });
      
      if (modalClosed) {
        console.log('✅ Modal closed successfully!');
      } else {
        console.log('❌ Modal did not close');
      }
      
    } else {
      console.log('❌ Image modal did not open');
    }
  } else {
    console.log('❌ No image files found to test');
  }
  
  setTimeout(() => browser.close(), 3000);
}

testImageModal().catch(console.error);