import { test, expect } from '@playwright/test';

test.describe('Navigation Visual Comparison', () => {
  test('Compare Dashboard and Interview navigation aesthetics', async ({ page }) => {
    // First capture and analyze dashboard navigation
    await page.goto('http://localhost:8357/pages/dashboard.html');
    await page.waitForTimeout(3000); // Wait for full load
    
    // Take dashboard screenshots
    await page.screenshot({ 
      path: 'playwright-testing/screenshots/dashboard-full.png',
      fullPage: false 
    });
    
    const dashboardNavbar = await page.locator('.sidebar-nav-container');
    await dashboardNavbar.screenshot({ 
      path: 'playwright-testing/screenshots/dashboard-nav-only.png' 
    });
    
    // Analyze dashboard navigation properties
    const dashboardAnalysis = await page.evaluate(() => {
      const nav = document.querySelector('.sidebar-nav');
      const container = document.querySelector('.sidebar-nav-container');
      const items = document.querySelectorAll('.sidebar-nav-item');
      
      if (!nav || !container) return { error: 'Navigation not found' };
      
      const navStyles = window.getComputedStyle(nav);
      const containerStyles = window.getComputedStyle(container);
      
      // Get detailed style information
      return {
        container: {
          width: containerStyles.width,
          height: containerStyles.height,
          position: containerStyles.position,
          display: containerStyles.display,
          backgroundColor: containerStyles.backgroundColor
        },
        navigation: {
          width: navStyles.width,
          height: navStyles.height,
          backgroundColor: navStyles.backgroundColor,
          position: navStyles.position,
          left: navStyles.left,
          top: navStyles.top,
          bottom: navStyles.bottom,
          display: navStyles.display,
          flexDirection: navStyles.flexDirection,
          alignItems: navStyles.alignItems,
          padding: navStyles.padding,
          zIndex: navStyles.zIndex,
          boxShadow: navStyles.boxShadow
        },
        itemCount: items.length,
        items: Array.from(items).map((item, index) => {
          const styles = window.getComputedStyle(item);
          return {
            text: item.textContent.trim(),
            width: styles.width,
            height: styles.height,
            backgroundColor: styles.backgroundColor,
            color: styles.color,
            margin: styles.margin,
            padding: styles.padding,
            borderRadius: styles.borderRadius,
            isActive: item.classList.contains('active')
          };
        }),
        logo: {
          exists: !!document.querySelector('.sidebar-logo'),
          styles: document.querySelector('.sidebar-logo') ? 
            window.getComputedStyle(document.querySelector('.sidebar-logo')) : null
        }
      };
    });
    
    console.log('Dashboard Navigation Analysis:', JSON.stringify(dashboardAnalysis, null, 2));
    
    // Now analyze interview page
    await page.goto('http://localhost:8357/pages/interview.html');
    await page.waitForTimeout(3000); // Wait for full load
    
    // Take interview screenshots
    await page.screenshot({ 
      path: 'playwright-testing/screenshots/interview-full.png',
      fullPage: false 
    });
    
    const interviewNavbar = await page.locator('.sidebar-nav-container');
    await interviewNavbar.screenshot({ 
      path: 'playwright-testing/screenshots/interview-nav-only.png' 
    });
    
    // Analyze interview navigation properties
    const interviewAnalysis = await page.evaluate(() => {
      const nav = document.querySelector('.sidebar-nav');
      const container = document.querySelector('.sidebar-nav-container');
      const items = document.querySelectorAll('.sidebar-nav-item');
      
      if (!nav || !container) return { error: 'Navigation not found' };
      
      const navStyles = window.getComputedStyle(nav);
      const containerStyles = window.getComputedStyle(container);
      
      return {
        container: {
          width: containerStyles.width,
          height: containerStyles.height,
          position: containerStyles.position,
          display: containerStyles.display,
          backgroundColor: containerStyles.backgroundColor
        },
        navigation: {
          width: navStyles.width,
          height: navStyles.height,
          backgroundColor: navStyles.backgroundColor,
          position: navStyles.position,
          left: navStyles.left,
          top: navStyles.top,
          bottom: navStyles.bottom,
          display: navStyles.display,
          flexDirection: navStyles.flexDirection,
          alignItems: navStyles.alignItems,
          padding: navStyles.padding,
          zIndex: navStyles.zIndex,
          boxShadow: navStyles.boxShadow
        },
        itemCount: items.length,
        items: Array.from(items).map((item, index) => {
          const styles = window.getComputedStyle(item);
          return {
            text: item.textContent.trim(),
            width: styles.width,
            height: styles.height,
            backgroundColor: styles.backgroundColor,
            color: styles.color,
            margin: styles.margin,
            padding: styles.padding,
            borderRadius: styles.borderRadius,
            isActive: item.classList.contains('active')
          };
        }),
        logo: {
          exists: !!document.querySelector('.sidebar-logo'),
          styles: document.querySelector('.sidebar-logo') ? 
            window.getComputedStyle(document.querySelector('.sidebar-logo')) : null
        }
      };
    });
    
    console.log('Interview Navigation Analysis:', JSON.stringify(interviewAnalysis, null, 2));
    
    // Compare critical visual properties
    expect(interviewAnalysis.navigation.backgroundColor).toBe(dashboardAnalysis.navigation.backgroundColor);
    expect(interviewAnalysis.navigation.width).toBe(dashboardAnalysis.navigation.width);
    expect(interviewAnalysis.navigation.position).toBe(dashboardAnalysis.navigation.position);
    expect(interviewAnalysis.itemCount).toBe(dashboardAnalysis.itemCount);
    
    // Save comparison results
    const comparisonResults = {
      dashboard: dashboardAnalysis,
      interview: interviewAnalysis,
      matches: {
        backgroundColor: dashboardAnalysis.navigation.backgroundColor === interviewAnalysis.navigation.backgroundColor,
        width: dashboardAnalysis.navigation.width === interviewAnalysis.navigation.width,
        itemCount: dashboardAnalysis.itemCount === interviewAnalysis.itemCount,
        position: dashboardAnalysis.navigation.position === interviewAnalysis.navigation.position
      }
    };
    
    console.log('\n=== VISUAL COMPARISON RESULTS ===');
    console.log('Background Color Match:', comparisonResults.matches.backgroundColor);
    console.log('Width Match:', comparisonResults.matches.width);
    console.log('Item Count Match:', comparisonResults.matches.itemCount);
    console.log('Position Match:', comparisonResults.matches.position);
    console.log('================================\n');
  });
});