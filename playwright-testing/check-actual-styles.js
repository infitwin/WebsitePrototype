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
    
    // Check dashboard
    await page.goto('http://localhost:8357/pages/dashboard.html');
    await page.waitForTimeout(3000);
    
    console.log('=== DASHBOARD STYLE SOURCE CHECK ===');
    
    // Check all stylesheets
    const dashboardStyles = await page.evaluate(() => {
      const results = {
        linkedCSS: [],
        inlineStyles: [],
        computedNavStyles: null
      };
      
      // Get all linked stylesheets
      const links = document.querySelectorAll('link[rel="stylesheet"]');
      links.forEach(link => {
        results.linkedCSS.push(link.href);
      });
      
      // Check for inline styles
      const styles = document.querySelectorAll('style');
      styles.forEach((style, index) => {
        if (style.textContent.includes('sidebar-nav')) {
          results.inlineStyles.push({
            index,
            content: style.textContent.substring(0, 500)
          });
        }
      });
      
      // Get computed styles of sidebar-nav
      const nav = document.querySelector('.sidebar-nav');
      if (nav) {
        const computedStyle = window.getComputedStyle(nav);
        results.computedNavStyles = {
          backgroundColor: computedStyle.backgroundColor,
          width: computedStyle.width,
          position: computedStyle.position
        };
      }
      
      return results;
    });
    
    console.log('Linked CSS files:', dashboardStyles.linkedCSS);
    console.log('Inline styles with sidebar-nav:', dashboardStyles.inlineStyles);
    console.log('Computed nav styles:', dashboardStyles.computedNavStyles);
    
    // Now check interview page
    await page.goto('http://localhost:8357/pages/interview.html');
    await page.waitForTimeout(3000);
    
    console.log('\n=== INTERVIEW STYLE SOURCE CHECK ===');
    
    const interviewStyles = await page.evaluate(() => {
      const results = {
        linkedCSS: [],
        inlineStyles: [],
        computedNavStyles: null
      };
      
      // Get all linked stylesheets
      const links = document.querySelectorAll('link[rel="stylesheet"]');
      links.forEach(link => {
        results.linkedCSS.push(link.href);
      });
      
      // Check for inline styles
      const styles = document.querySelectorAll('style');
      styles.forEach((style, index) => {
        if (style.textContent.includes('sidebar-nav')) {
          results.inlineStyles.push({
            index,
            content: style.textContent.substring(0, 500)
          });
        }
      });
      
      // Get computed styles of sidebar-nav
      const nav = document.querySelector('.sidebar-nav');
      if (nav) {
        const computedStyle = window.getComputedStyle(nav);
        results.computedNavStyles = {
          backgroundColor: computedStyle.backgroundColor,
          width: computedStyle.width,
          position: computedStyle.position
        };
      }
      
      return results;
    });
    
    console.log('Linked CSS files:', interviewStyles.linkedCSS);
    console.log('Inline styles with sidebar-nav:', interviewStyles.inlineStyles);
    console.log('Computed nav styles:', interviewStyles.computedNavStyles);
    
    // Check if navigation.css is being loaded
    console.log('\n=== NAVIGATION CSS CHECK ===');
    console.log('Dashboard has navigation.css:', dashboardStyles.linkedCSS.some(css => css.includes('navigation.css')));
    console.log('Interview has navigation.css:', interviewStyles.linkedCSS.some(css => css.includes('navigation.css')));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
})();