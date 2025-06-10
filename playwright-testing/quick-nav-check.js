const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false }); // Show browser
  const page = await browser.newPage();
  
  try {
    // Login
    await page.goto('http://localhost:8357/pages/auth.html');
    await page.click('[data-tab="login"]');
    await page.fill('.login-email', 'weezer@yev.com');
    await page.fill('.login-password', '123456');
    await page.click('button:has-text("Access Your Memories")');
    
    // Wait for dashboard
    await page.waitForURL('**/dashboard.html', { timeout: 10000 });
    console.log('Reached dashboard');
    
    // Wait a bit for navigation to load
    await page.waitForTimeout(5000);
    
    // Check what navigation elements exist
    const navCheck = await page.evaluate(() => {
      return {
        hasSidebarContainer: !!document.querySelector('.sidebar-nav-container'),
        hasSidebarNav: !!document.querySelector('.sidebar-nav'),
        sidebarContainerHTML: document.querySelector('.sidebar-nav-container')?.innerHTML?.substring(0, 200),
        navItemCount: document.querySelectorAll('.sidebar-nav-item').length,
        bodyClasses: document.body.className
      };
    });
    
    console.log('Dashboard navigation check:', navCheck);
    
    // Take screenshot
    await page.screenshot({ path: '/home/tim/docs/Build v2/webpage/dashboard-full-check.png' });
    
    // Now check interview page
    await page.goto('http://localhost:8357/pages/interview.html');
    await page.waitForTimeout(5000);
    
    const interviewCheck = await page.evaluate(() => {
      return {
        hasSidebarContainer: !!document.querySelector('.sidebar-nav-container'),
        hasSidebarNav: !!document.querySelector('.sidebar-nav'),
        sidebarContainerHTML: document.querySelector('.sidebar-nav-container')?.innerHTML?.substring(0, 200),
        navItemCount: document.querySelectorAll('.sidebar-nav-item').length,
        bodyClasses: document.body.className
      };
    });
    
    console.log('\nInterview navigation check:', interviewCheck);
    
    // Take screenshot
    await page.screenshot({ path: '/home/tim/docs/Build v2/webpage/interview-full-check.png' });
    
    // Keep browser open for 10 seconds to see
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
})();