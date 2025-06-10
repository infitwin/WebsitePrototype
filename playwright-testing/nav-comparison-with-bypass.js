const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    console.log('Starting navigation visual comparison test with bypass...\n');
    
    // Set bypass auth in localStorage
    await page.goto('http://localhost:8357/pages/auth.html');
    await page.evaluate(() => {
      localStorage.setItem('bypass_auth', 'true');
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('userEmail', 'weezer@yev.com');
    });
    console.log('Set bypass auth in localStorage');
    
    // Now go directly to dashboard
    await page.goto('http://localhost:8357/pages/dashboard.html');
    await page.waitForTimeout(3000); // Let navigation fully load
    
    // Capture dashboard navigation
    console.log('\n=== DASHBOARD NAVIGATION ANALYSIS ===');
    await page.screenshot({ path: '/home/tim/docs/Build v2/webpage/dashboard-with-nav.png', fullPage: false });
    
    const dashboardAnalysis = await page.evaluate(() => {
      const nav = document.querySelector('.sidebar-nav');
      const container = document.querySelector('.sidebar-nav-container');
      
      return {
        hasContainer: !!container,
        hasNav: !!nav,
        navProperties: nav ? {
          backgroundColor: window.getComputedStyle(nav).backgroundColor,
          width: window.getComputedStyle(nav).width,
          height: window.getComputedStyle(nav).height,
          position: window.getComputedStyle(nav).position,
          itemCount: document.querySelectorAll('.sidebar-nav-item').length
        } : null
      };
    });
    
    console.log('Dashboard analysis:', JSON.stringify(dashboardAnalysis, null, 2));
    
    // Now check interview page
    await page.goto('http://localhost:8357/pages/interview.html');
    await page.waitForTimeout(3000); // Let navigation fully load
    
    console.log('\n=== INTERVIEW NAVIGATION ANALYSIS ===');
    await page.screenshot({ path: '/home/tim/docs/Build v2/webpage/interview-with-nav.png', fullPage: false });
    
    const interviewAnalysis = await page.evaluate(() => {
      const nav = document.querySelector('.sidebar-nav');
      const container = document.querySelector('.sidebar-nav-container');
      
      return {
        hasContainer: !!container,
        hasNav: !!nav,
        navProperties: nav ? {
          backgroundColor: window.getComputedStyle(nav).backgroundColor,
          width: window.getComputedStyle(nav).width,
          height: window.getComputedStyle(nav).height,
          position: window.getComputedStyle(nav).position,
          itemCount: document.querySelectorAll('.sidebar-nav-item').length
        } : null
      };
    });
    
    console.log('Interview analysis:', JSON.stringify(interviewAnalysis, null, 2));
    
    // Compare
    console.log('\n=== COMPARISON RESULTS ===');
    if (dashboardAnalysis.navProperties && interviewAnalysis.navProperties) {
      console.log('Background Color Match:', 
        dashboardAnalysis.navProperties.backgroundColor === interviewAnalysis.navProperties.backgroundColor);
      console.log('Width Match:', 
        dashboardAnalysis.navProperties.width === interviewAnalysis.navProperties.width);
      console.log('Position Match:', 
        dashboardAnalysis.navProperties.position === interviewAnalysis.navProperties.position);
      console.log('Item Count Match:', 
        dashboardAnalysis.navProperties.itemCount === interviewAnalysis.navProperties.itemCount);
    } else {
      console.log('⚠️  One or both pages missing navigation!');
      console.log('Dashboard has nav:', !!dashboardAnalysis.navProperties);
      console.log('Interview has nav:', !!interviewAnalysis.navProperties);
    }
    
    console.log('\n📸 Screenshots saved - PLEASE VISUALLY INSPECT:');
    console.log('- /home/tim/docs/Build v2/webpage/dashboard-with-nav.png');
    console.log('- /home/tim/docs/Build v2/webpage/interview-with-nav.png');
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await browser.close();
  }
})();