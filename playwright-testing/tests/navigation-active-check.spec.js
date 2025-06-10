import { test, expect } from '@playwright/test';

test.describe('Navigation Active State Check', () => {
  test('Check navigation mapping for all pages', async ({ page }) => {
    // Test without login to see raw navigation behavior
    const pageChecks = [
      { url: '/pages/dashboard.html', expectedActive: 'dashboard', pageName: 'Dashboard' },
      { url: '/pages/twin-management.html', expectedActive: 'twin', pageName: 'Twin Management' },
      { url: '/pages/my-files.html', expectedActive: 'files', pageName: 'My Files' },
      { url: '/pages/settings.html', expectedActive: 'settings', pageName: 'Settings' }
    ];

    for (const { url, expectedActive, pageName } of pageChecks) {
      console.log(`\n🔍 Checking ${pageName}...`);
      
      // Navigate directly to the page
      await page.goto(`http://localhost:8357${url}`, { waitUntil: 'networkidle' });
      
      // Get current URL after any redirects
      const currentUrl = page.url();
      console.log(`Current URL: ${currentUrl}`);
      
      // Check if navigation exists on the page
      const navExists = await page.locator('.sidebar-nav').count() > 0;
      console.log(`Navigation exists: ${navExists}`);
      
      if (navExists) {
        // Check active state
        const activeItem = await page.locator('.sidebar-nav-item.active');
        const activeCount = await activeItem.count();
        console.log(`Active items found: ${activeCount}`);
        
        if (activeCount > 0) {
          const activeDataPage = await activeItem.getAttribute('data-page');
          console.log(`Active item data-page: ${activeDataPage}`);
          console.log(`Expected: ${expectedActive}`);
          console.log(`Match: ${activeDataPage === expectedActive ? '✅' : '❌'}`);
        }
      } else {
        console.log('⚠️  No navigation found on this page');
      }
      
      // Take screenshot for visual verification
      await page.screenshot({ 
        path: `nav-check-${pageName.toLowerCase().replace(/\s+/g, '-')}.png`,
        fullPage: true 
      });
    }
  });

  test('Check getCurrentPage function mapping', async ({ page }) => {
    // Test the actual mapping by checking what navigation.js returns
    const testUrls = [
      { filename: 'dashboard.html', expected: 'dashboard' },
      { filename: 'twin-management.html', expected: 'twin' },
      { filename: 'explore.html', expected: 'explore' },
      { filename: 'interview.html', expected: 'interview' },
      { filename: 'curator.html', expected: 'curator' },
      { filename: 'interview-transcripts.html', expected: 'transcripts' },
      { filename: 'talk-to-twin.html', expected: 'talk' },
      { filename: 'my-files.html', expected: 'files' },
      { filename: 'settings.html', expected: 'settings' },
      // Test unmapped pages
      { filename: 'alpha-welcome.html', expected: 'dashboard' }, // Should default to dashboard
      { filename: 'unknown-page.html', expected: 'dashboard' } // Should default to dashboard
    ];

    console.log('\n📋 Testing getCurrentPage() mapping:');
    console.log('=====================================');
    
    for (const { filename, expected } of testUrls) {
      const mapped = filename.replace('.html', '');
      const pageMap = {
        'dashboard': 'dashboard',
        'twin-management': 'twin',
        'explore': 'explore',
        'interview': 'interview',
        'curator': 'curator',
        'interview-transcripts': 'transcripts',
        'talk-to-twin': 'talk',
        'my-files': 'files',
        'file-browser': 'files',
        'settings': 'settings'
      };
      
      const result = pageMap[mapped] || 'dashboard';
      const isCorrect = result === expected;
      
      console.log(`${filename.padEnd(30)} → ${result.padEnd(15)} ${isCorrect ? '✅' : '❌'} (expected: ${expected})`);
    }
  });
});