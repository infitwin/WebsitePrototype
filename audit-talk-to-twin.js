const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Set viewport for consistent screenshot
  await page.setViewportSize({ width: 1920, height: 1080 });
  
  // Navigate to the page
  await page.goto('http://localhost:8357/pages/talk-to-twin.html', {
    waitUntil: 'networkidle'
  });
  
  // Wait for the page to fully load
  await page.waitForTimeout(2000);
  
  // Take full page screenshot
  await page.screenshot({ 
    path: 'audit-talk-to-twin.png', 
    fullPage: true 
  });
  
  // Also check for hidden elements
  const hiddenAuthElements = await page.$$eval('*', elements => {
    const authKeywords = ['logout', 'sign out', 'profile', 'user', 'account', 'settings'];
    const hidden = [];
    
    elements.forEach(el => {
      const text = el.textContent?.toLowerCase() || '';
      const hasAuthKeyword = authKeywords.some(keyword => text.includes(keyword));
      
      if (hasAuthKeyword) {
        const styles = window.getComputedStyle(el);
        const isHidden = styles.display === 'none' || 
                        styles.visibility === 'hidden' || 
                        styles.opacity === '0';
        
        if (isHidden) {
          hidden.push({
            text: el.textContent?.trim().substring(0, 50),
            tag: el.tagName,
            class: el.className,
            id: el.id
          });
        }
      }
    });
    
    return hidden;
  });
  
  console.log('Hidden auth elements found:', hiddenAuthElements);
  
  // Check navigation items
  const navItems = await page.$$eval('.nav-links a, .sidebar-nav a, nav a', elements => 
    elements.map(el => ({
      text: el.textContent?.trim(),
      href: el.href,
      visible: window.getComputedStyle(el).display !== 'none'
    }))
  );
  
  console.log('Navigation items found:', navItems);
  
  // Check for user auth UI elements
  const authElements = await page.$$eval('*', elements => {
    const selectors = [
      'button:has-text("Logout")',
      'button:has-text("Sign out")', 
      'a:has-text("Logout")',
      'a:has-text("Sign out")',
      '.user-menu',
      '.user-profile',
      '.user-avatar',
      '[data-testid="user-menu"]',
      '[aria-label="User menu"]',
      '[aria-label="Logout"]'
    ];
    
    const found = [];
    elements.forEach(el => {
      const text = el.textContent?.toLowerCase() || '';
      if (text.includes('logout') || text.includes('sign out') || 
          el.className?.includes('user') || el.className?.includes('profile')) {
        found.push({
          tag: el.tagName,
          text: el.textContent?.trim().substring(0, 50),
          class: el.className,
          id: el.id
        });
      }
    });
    
    return found;
  });
  
  console.log('Auth elements found:', authElements);
  
  await browser.close();
  console.log('Screenshot saved as audit-talk-to-twin.png');
})();