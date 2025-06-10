const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    console.log('🎯 Final Navigation Visual Comparison Test\n');
    
    // Set bypass auth
    await page.goto('http://localhost:8357/pages/auth.html');
    await page.evaluate(() => {
      localStorage.setItem('bypass_auth', 'true');
      localStorage.setItem('isAuthenticated', 'true');
    });
    
    // Dashboard navigation
    await page.goto('http://localhost:8357/pages/dashboard.html');
    await page.waitForTimeout(3000);
    
    console.log('📸 Taking dashboard screenshot...');
    await page.screenshot({ path: '/home/tim/docs/Build v2/webpage/final-dashboard-nav.png' });
    
    const dashboardNav = await page.evaluate(() => {
      const nav = document.querySelector('.sidebar-nav');
      if (!nav) return { error: 'No navigation found' };
      
      const styles = window.getComputedStyle(nav);
      return {
        backgroundColor: styles.backgroundColor,
        width: styles.width,
        position: styles.position,
        display: styles.display,
        itemCount: document.querySelectorAll('.sidebar-nav-item').length
      };
    });
    
    // Interview navigation
    await page.goto('http://localhost:8357/pages/interview.html');
    await page.waitForTimeout(3000);
    
    console.log('📸 Taking interview screenshot...');
    await page.screenshot({ path: '/home/tim/docs/Build v2/webpage/final-interview-nav.png' });
    
    const interviewNav = await page.evaluate(() => {
      const nav = document.querySelector('.sidebar-nav');
      if (!nav) return { error: 'No navigation found' };
      
      const styles = window.getComputedStyle(nav);
      return {
        backgroundColor: styles.backgroundColor,
        width: styles.width,
        position: styles.position,
        display: styles.display,
        itemCount: document.querySelectorAll('.sidebar-nav-item').length
      };
    });
    
    console.log('\n=== VISUAL COMPARISON RESULTS ===');
    console.log('Dashboard:', dashboardNav);
    console.log('Interview:', interviewNav);
    
    const allMatch = 
      dashboardNav.backgroundColor === interviewNav.backgroundColor &&
      dashboardNav.width === interviewNav.width &&
      dashboardNav.position === interviewNav.position &&
      dashboardNav.itemCount === interviewNav.itemCount;
    
    console.log('\n✅ NAVIGATION AESTHETICS MATCH:', allMatch ? 'YES ✅' : 'NO ❌');
    
    if (!allMatch) {
      console.log('\nMismatches:');
      if (dashboardNav.backgroundColor !== interviewNav.backgroundColor) {
        console.log('- Background Color:', dashboardNav.backgroundColor, 'vs', interviewNav.backgroundColor);
      }
      if (dashboardNav.width !== interviewNav.width) {
        console.log('- Width:', dashboardNav.width, 'vs', interviewNav.width);
      }
      if (dashboardNav.position !== interviewNav.position) {
        console.log('- Position:', dashboardNav.position, 'vs', interviewNav.position);
      }
    }
    
    console.log('\n📸 Screenshots saved:');
    console.log('- /home/tim/docs/Build v2/webpage/final-dashboard-nav.png');
    console.log('- /home/tim/docs/Build v2/webpage/final-interview-nav.png');
    console.log('\n⚠️  PLEASE VISUALLY INSPECT THE SCREENSHOTS TO CONFIRM!');
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await browser.close();
  }
})();