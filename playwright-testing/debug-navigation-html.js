const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Set bypass auth
    await page.goto('http://localhost:8357/pages/auth.html');
    await page.evaluate(() => {
      localStorage.setItem('bypass_auth', 'true');
      localStorage.setItem('isAuthenticated', 'true');
    });
    
    // Check interview page navigation HTML
    await page.goto('http://localhost:8357/pages/interview.html');
    await page.waitForTimeout(3000);
    
    const navHTML = await page.evaluate(() => {
      const container = document.querySelector('.sidebar-nav-container');
      const nav = document.querySelector('.sidebar-nav');
      
      return {
        containerHTML: container ? container.outerHTML.substring(0, 500) : 'No container found',
        navHTML: nav ? nav.outerHTML.substring(0, 500) : 'No nav found',
        containerStyles: container ? window.getComputedStyle(container).cssText : 'No styles',
        navStyles: nav ? window.getComputedStyle(nav).cssText : 'No styles'
      };
    });
    
    console.log('=== INTERVIEW PAGE NAVIGATION HTML ===');
    console.log('Container HTML:', navHTML.containerHTML);
    console.log('\nNav HTML:', navHTML.navHTML);
    console.log('\nContainer Styles:', navHTML.containerStyles.substring(0, 200));
    console.log('\nNav Styles:', navHTML.navStyles.substring(0, 200));
    
    // Check dashboard for comparison
    await page.goto('http://localhost:8357/pages/dashboard.html');
    await page.waitForTimeout(3000);
    
    const dashNavHTML = await page.evaluate(() => {
      const container = document.querySelector('.sidebar-nav-container');
      const nav = document.querySelector('.sidebar-nav');
      
      return {
        containerHTML: container ? container.outerHTML.substring(0, 500) : 'No container found',
        navStyles: nav ? window.getComputedStyle(nav).cssText.substring(0, 200) : 'No styles'
      };
    });
    
    console.log('\n=== DASHBOARD PAGE NAVIGATION HTML ===');
    console.log('Container HTML:', dashNavHTML.containerHTML);
    console.log('\nNav Styles:', dashNavHTML.navStyles);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
})();