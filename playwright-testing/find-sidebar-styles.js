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
    
    // Go to dashboard and extract all styles
    await page.goto('http://localhost:8357/pages/dashboard.html');
    await page.waitForTimeout(3000);
    
    // Extract all styles related to sidebar
    const styles = await page.evaluate(() => {
      const styleSheets = Array.from(document.styleSheets);
      const sidebarStyles = [];
      
      // Check all stylesheets
      styleSheets.forEach(sheet => {
        try {
          const rules = Array.from(sheet.cssRules || sheet.rules || []);
          rules.forEach(rule => {
            if (rule.selectorText && rule.selectorText.includes('sidebar')) {
              sidebarStyles.push({
                selector: rule.selectorText,
                styles: rule.cssText
              });
            }
          });
        } catch (e) {
          // Cross-origin stylesheets might throw
        }
      });
      
      // Also check inline styles
      const allStyles = Array.from(document.querySelectorAll('style'));
      allStyles.forEach(styleEl => {
        if (styleEl.textContent.includes('sidebar')) {
          sidebarStyles.push({
            type: 'inline',
            content: styleEl.textContent.substring(0, 500)
          });
        }
      });
      
      return sidebarStyles;
    });
    
    console.log('=== SIDEBAR STYLES IN DASHBOARD ===');
    console.log(JSON.stringify(styles, null, 2));
    
    // Also get computed styles of actual sidebar
    const computedStyles = await page.evaluate(() => {
      const nav = document.querySelector('.sidebar-nav');
      if (!nav) return null;
      
      const styles = window.getComputedStyle(nav);
      return {
        backgroundColor: styles.backgroundColor,
        width: styles.width,
        height: styles.height,
        position: styles.position,
        left: styles.left,
        top: styles.top,
        bottom: styles.bottom,
        display: styles.display,
        flexDirection: styles.flexDirection,
        alignItems: styles.alignItems,
        padding: styles.padding,
        zIndex: styles.zIndex
      };
    });
    
    console.log('\n=== COMPUTED SIDEBAR-NAV STYLES ===');
    console.log(JSON.stringify(computedStyles, null, 2));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
})();