const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    console.log('Starting navigation visual comparison test...\n');
    
    // Login with test credentials
    await page.goto('http://localhost:8357/pages/auth.html');
    console.log('Navigated to auth page');
    
    // Click login tab
    await page.click('[data-tab="login"]');
    console.log('Clicked login tab');
    
    // Fill in test credentials
    await page.fill('.login-email', 'weezer@yev.com');
    await page.fill('.login-password', '123456');
    console.log('Filled in test credentials');
    
    // Click login button
    await page.click('button:has-text("Access Your Memories")');
    console.log('Clicked login button');
    
    // Wait for navigation to dashboard
    await page.waitForURL('**/dashboard.html', { timeout: 10000 });
    await page.waitForTimeout(3000); // Let navigation fully load
    
    // Capture dashboard navigation
    console.log('\n=== DASHBOARD NAVIGATION ANALYSIS ===');
    await page.screenshot({ path: '/home/tim/docs/Build v2/webpage/dashboard-nav-analysis.png', fullPage: false });
    
    // Take just the sidebar screenshot
    const dashboardSidebar = await page.locator('.sidebar-nav-container');
    await dashboardSidebar.screenshot({ path: '/home/tim/docs/Build v2/webpage/dashboard-sidebar-only.png' });
    
    const dashboardAnalysis = await page.evaluate(() => {
      const nav = document.querySelector('.sidebar-nav');
      const container = document.querySelector('.sidebar-nav-container');
      
      if (!nav) return { error: 'Navigation (.sidebar-nav) not found' };
      
      const navStyles = window.getComputedStyle(nav);
      const containerStyles = container ? window.getComputedStyle(container) : null;
      const items = document.querySelectorAll('.sidebar-nav-item');
      
      return {
        navigation: {
          backgroundColor: navStyles.backgroundColor,
          width: navStyles.width,
          height: navStyles.height,
          position: navStyles.position,
          left: navStyles.left,
          top: navStyles.top,
          display: navStyles.display,
          zIndex: navStyles.zIndex,
          padding: navStyles.padding
        },
        container: containerStyles ? {
          width: containerStyles.width,
          display: containerStyles.display
        } : null,
        itemCount: items.length,
        itemTexts: Array.from(items).map(item => item.textContent.trim()),
        activeItem: document.querySelector('.sidebar-nav-item.active')?.textContent.trim()
      };
    });
    
    console.log('Dashboard nav properties:', JSON.stringify(dashboardAnalysis, null, 2));
    
    // Now check interview page
    await page.goto('http://localhost:8357/pages/interview.html');
    await page.waitForTimeout(3000); // Let navigation fully load
    
    console.log('\n=== INTERVIEW NAVIGATION ANALYSIS ===');
    await page.screenshot({ path: '/home/tim/docs/Build v2/webpage/interview-nav-analysis.png', fullPage: false });
    
    // Take just the sidebar screenshot
    const interviewSidebar = await page.locator('.sidebar-nav-container');
    await interviewSidebar.screenshot({ path: '/home/tim/docs/Build v2/webpage/interview-sidebar-only.png' });
    
    const interviewAnalysis = await page.evaluate(() => {
      const nav = document.querySelector('.sidebar-nav');
      const container = document.querySelector('.sidebar-nav-container');
      
      if (!nav) return { error: 'Navigation (.sidebar-nav) not found' };
      
      const navStyles = window.getComputedStyle(nav);
      const containerStyles = container ? window.getComputedStyle(container) : null;
      const items = document.querySelectorAll('.sidebar-nav-item');
      
      return {
        navigation: {
          backgroundColor: navStyles.backgroundColor,
          width: navStyles.width,
          height: navStyles.height,
          position: navStyles.position,
          left: navStyles.left,
          top: navStyles.top,
          display: navStyles.display,
          zIndex: navStyles.zIndex,
          padding: navStyles.padding
        },
        container: containerStyles ? {
          width: containerStyles.width,
          display: containerStyles.display
        } : null,
        itemCount: items.length,
        itemTexts: Array.from(items).map(item => item.textContent.trim()),
        activeItem: document.querySelector('.sidebar-nav-item.active')?.textContent.trim()
      };
    });
    
    console.log('Interview nav properties:', JSON.stringify(interviewAnalysis, null, 2));
    
    // Visual comparison
    console.log('\n=== VISUAL COMPARISON RESULTS ===');
    
    const bgColorMatch = dashboardAnalysis.navigation.backgroundColor === interviewAnalysis.navigation.backgroundColor;
    console.log('Background Color Match:', bgColorMatch);
    if (!bgColorMatch) {
      console.log('  Dashboard:', dashboardAnalysis.navigation.backgroundColor);
      console.log('  Interview:', interviewAnalysis.navigation.backgroundColor);
    }
    
    const widthMatch = dashboardAnalysis.navigation.width === interviewAnalysis.navigation.width;
    console.log('\nWidth Match:', widthMatch);
    if (!widthMatch) {
      console.log('  Dashboard:', dashboardAnalysis.navigation.width);
      console.log('  Interview:', interviewAnalysis.navigation.width);
    }
    
    const positionMatch = dashboardAnalysis.navigation.position === interviewAnalysis.navigation.position;
    console.log('\nPosition Match:', positionMatch);
    if (!positionMatch) {
      console.log('  Dashboard:', dashboardAnalysis.navigation.position);
      console.log('  Interview:', interviewAnalysis.navigation.position);
    }
    
    const itemCountMatch = dashboardAnalysis.itemCount === interviewAnalysis.itemCount;
    console.log('\nItem Count Match:', itemCountMatch);
    if (!itemCountMatch) {
      console.log('  Dashboard:', dashboardAnalysis.itemCount, 'items');
      console.log('  Interview:', interviewAnalysis.itemCount, 'items');
    }
    
    const allMatch = bgColorMatch && widthMatch && positionMatch && itemCountMatch;
    console.log('\n🎯 ALL AESTHETICS MATCH:', allMatch ? '✅ YES' : '❌ NO');
    
    console.log('\n================================');
    
    console.log('\nScreenshots saved for visual inspection:');
    console.log('- Dashboard: /home/tim/docs/Build v2/webpage/dashboard-nav-analysis.png');
    console.log('- Interview: /home/tim/docs/Build v2/webpage/interview-nav-analysis.png');
    console.log('- Dashboard Sidebar Only: /home/tim/docs/Build v2/webpage/dashboard-sidebar-only.png');
    console.log('- Interview Sidebar Only: /home/tim/docs/Build v2/webpage/interview-sidebar-only.png');
    
    console.log('\n⚠️  IMPORTANT: Manually inspect the screenshots to confirm visual consistency!');
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await browser.close();
  }
})();