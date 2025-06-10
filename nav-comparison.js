const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // First login
    await page.goto('http://localhost:8357/pages/auth.html');
    await page.click('[data-tab="login"]');
    await page.fill('.login-email', 'weezer@yev.com');
    await page.fill('.login-password', '123456');
    await page.click('button:has-text("Access Your Memories")');
    await page.waitForURL('**/dashboard.html');
    await page.waitForTimeout(2000);
    
    // Take dashboard screenshot
    await page.screenshot({ path: '/home/tim/docs/Build v2/webpage/dashboard-nav-analysis.png' });
    
    // Get dashboard nav properties
    const dashboardNav = await page.evaluate(() => {
      const nav = document.querySelector('.sidebar-nav');
      if (!nav) return { error: 'No navigation found' };
      
      const styles = window.getComputedStyle(nav);
      return {
        backgroundColor: styles.backgroundColor,
        width: styles.width,
        position: styles.position,
        itemCount: document.querySelectorAll('.sidebar-nav-item').length
      };
    });
    
    console.log('Dashboard Navigation:', dashboardNav);
    
    // Now go to interview page
    await page.goto('http://localhost:8357/pages/interview.html');
    await page.waitForTimeout(2000);
    
    // Take interview screenshot  
    await page.screenshot({ path: '/home/tim/docs/Build v2/webpage/interview-nav-analysis.png' });
    
    // Get interview nav properties
    const interviewNav = await page.evaluate(() => {
      const nav = document.querySelector('.sidebar-nav');
      if (!nav) return { error: 'No navigation found' };
      
      const styles = window.getComputedStyle(nav);
      return {
        backgroundColor: styles.backgroundColor,
        width: styles.width,
        position: styles.position,
        itemCount: document.querySelectorAll('.sidebar-nav-item').length
      };
    });
    
    console.log('Interview Navigation:', interviewNav);
    
    // Compare
    console.log('\n=== VISUAL COMPARISON RESULTS ===');
    console.log('Background colors match:', dashboardNav.backgroundColor === interviewNav.backgroundColor);
    console.log('Widths match:', dashboardNav.width === interviewNav.width);
    console.log('Positions match:', dashboardNav.position === interviewNav.position);
    console.log('Item counts match:', dashboardNav.itemCount === interviewNav.itemCount);
    console.log('================================\n');
    
    console.log('Screenshots saved to:');
    console.log('- /home/tim/docs/Build v2/webpage/dashboard-nav-analysis.png');
    console.log('- /home/tim/docs/Build v2/webpage/interview-nav-analysis.png');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
})();