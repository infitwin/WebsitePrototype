# Test info

- Name: Dashboard Sidebar Logout Button >> should navigate to correct pages when clicking sidebar items
- Location: /home/tim/WebsitePrototype/playwright-testing/tests/dashboard-logout-sidebar.spec.js:89:3

# Error details

```
Error: expect(received).toContain(expected) // indexOf

Expected substring: "file-browser.html"
Received string:    "my-files.html"
    at /home/tim/WebsitePrototype/playwright-testing/tests/dashboard-logout-sidebar.spec.js:108:22
```

# Page snapshot

```yaml
- navigation:
  - link "🏠 Dashboard":
    - /url: dashboard.html
  - link "👥 Twin Management":
    - /url: twin-management.html
  - link "🔍 Explore":
    - /url: explore.html
  - link "🎤 Interview":
    - /url: interview.html
  - link "🎨 Curator":
    - /url: curator.html
  - link "📝 Transcripts":
    - /url: interview-transcripts.html
  - link "💬 Talk to Twin":
    - /url: talk-to-twin.html
  - link "📁 My Files":
    - /url: my-files.html
  - link "⚙️ Settings":
    - /url: settings.html
  - link "🚪 Logout":
    - /url: auth.html
- banner:
  - text: T
  - heading "Test User" [level=1]
  - paragraph: test@example.com
  - button "Notifications": 🔔
- main:
  - textbox "Search nodes..."
  - text: "Filters:"
  - button "👤 Person"
  - button "📅 Event"
  - button "📍 Place"
  - button "📷 Memory"
  - button "Clear All"
  - img: Y 📅 📷 📍 🏢
  - text: ACTIVE QUEUE No active operations DATA OPERATIONS
  - button "🗑️ Delete Selected" [disabled]
  - button "📥 Export Data"
  - button "🧹 Clear All"
  - text: HISTORY
  - button "Clear"
  - text: "Nodes: 5 • Edges: 5 Drag to pan • Scroll to zoom • Click to select 0 📷"
  - heading "Recent Memories" [level=3]
  - paragraph: Last 7 days
  - text: 0 ✨
  - heading "Key Moments" [level=3]
  - paragraph: Life highlights
  - text: 0 👥
  - heading "People" [level=3]
  - paragraph: Connections
  - text: 0 📍
  - heading "Places" [level=3]
  - paragraph: Locations visited
  - text: 0 🚀
  - heading "Projects" [level=3]
  - paragraph: Achievements
  - text: 0 💡
  - heading "Insights" [level=3]
  - paragraph: Patterns & themes
- button "Add new memory": +
```

# Test source

```ts
   8 |       localStorage.setItem('userName', 'Test User');
   9 |       localStorage.setItem('isAuthenticated', 'true');
   10 |     });
   11 |     
   12 |     await page.goto('http://localhost:8357/pages/dashboard.html');
   13 |     await page.waitForLoadState('networkidle');
   14 |   });
   15 |
   16 |   test('should have logout button at bottom of sidebar', async ({ page }) => {
   17 |     // Check for logout button in various possible locations
   18 |     const possibleSelectors = [
   19 |       // Bottom of sidebar
   20 |       '.sidebar-nav a:last-child:has-text("Logout")',
   21 |       '.sidebar-nav a:last-child:has-text("Sign out")',
   22 |       '.sidebar-nav button:has-text("Logout")',
   23 |       '.sidebar-nav button:has-text("Sign out")',
   24 |       '.sidebar-nav .logout-button',
   25 |       '.sidebar-nav [data-page="logout"]',
   26 |       '.sidebar-nav-item:has-text("Logout")',
   27 |       '.sidebar-nav-item:has-text("Sign out")',
   28 |       // With icon
   29 |       '.sidebar-nav a:last-child span:has-text("🚪")',
   30 |       '.sidebar-nav a:last-child span:has-text("↩")',
   31 |       '.sidebar-nav a:last-child span:has-text("⎋")',
   32 |       '.sidebar-nav a:last-child span:has-text("🔚")',
   33 |       // Aria labels
   34 |       '[aria-label="Logout"]',
   35 |       '[aria-label="Sign out"]',
   36 |       '[aria-label="Log out"]'
   37 |     ];
   38 |
   39 |     let logoutFound = false;
   40 |     let foundElement = null;
   41 |     
   42 |     for (const selector of possibleSelectors) {
   43 |       const count = await page.locator(selector).count();
   44 |       if (count > 0) {
   45 |         logoutFound = true;
   46 |         foundElement = selector;
   47 |         break;
   48 |       }
   49 |     }
   50 |
   51 |     if (!logoutFound) {
   52 |       // Take screenshot showing missing logout
   53 |       await page.screenshot({ 
   54 |         path: 'playwright-testing/screenshots/missing-logout-sidebar-dashboard.png',
   55 |         fullPage: true 
   56 |       });
   57 |       
   58 |       // Also check what IS at the bottom of the sidebar
   59 |       const lastNavItem = await page.locator('.sidebar-nav a:last-child').textContent();
   60 |       console.log('Last navigation item found:', lastNavItem);
   61 |       
   62 |       // Count total nav items
   63 |       const navItemCount = await page.locator('.sidebar-nav a').count();
   64 |       console.log('Total navigation items:', navItemCount);
   65 |     }
   66 |
   67 |     expect(logoutFound).toBeTruthy();
   68 |   });
   69 |
   70 |   test('logout button should be visually distinct at bottom', async ({ page }) => {
   71 |     // First check if logout exists
   72 |     const logoutButton = page.locator('.sidebar-nav a:has-text("Logout"), .sidebar-nav a:has-text("Sign out")').first();
   73 |     const exists = await logoutButton.count() > 0;
   74 |     
   75 |     if (!exists) {
   76 |       test.skip('Logout button does not exist');
   77 |       return;
   78 |     }
   79 |
   80 |     // Check it's at the bottom with spacing
   81 |     const boundingBox = await logoutButton.boundingBox();
   82 |     const settingsButton = page.locator('.sidebar-nav a:has-text("Settings")').first();
   83 |     const settingsBox = await settingsButton.boundingBox();
   84 |     
   85 |     // Should have some spacing between settings and logout
   86 |     expect(boundingBox.y).toBeGreaterThan(settingsBox.y + settingsBox.height + 10);
   87 |   });
   88 |
   89 |   test('should navigate to correct pages when clicking sidebar items', async ({ page }) => {
   90 |     // This test verifies all current navigation works
   91 |     const navItems = [
   92 |       { icon: '🏠', page: 'dashboard', expectedUrl: 'dashboard.html' },
   93 |       { icon: '👥', page: 'twin', expectedUrl: 'twin-management.html' },
   94 |       { icon: '🎤', page: 'interview', expectedUrl: 'interview.html' },
   95 |       { icon: '🎨', page: 'curator', expectedUrl: 'curator.html' },
   96 |       { icon: '📝', page: 'transcripts', expectedUrl: 'interview-transcripts.html' },
   97 |       { icon: '💬', page: 'talk', expectedUrl: 'talk-to-twin.html' },
   98 |       { icon: '📁', page: 'files', expectedUrl: 'file-browser.html' },
   99 |       { icon: '⚙️', page: 'settings', expectedUrl: 'settings.html' }
  100 |     ];
  101 |
  102 |     for (const item of navItems) {
  103 |       const navLink = page.locator(`[data-page="${item.page}"]`);
  104 |       const exists = await navLink.count() > 0;
  105 |       
  106 |       if (exists) {
  107 |         const href = await navLink.getAttribute('href');
> 108 |         expect(href).toContain(item.expectedUrl);
      |                      ^ Error: expect(received).toContain(expected) // indexOf
  109 |       } else {
  110 |         console.log(`Missing navigation item: ${item.page}`);
  111 |       }
  112 |     }
  113 |   });
  114 |
  115 |   test('sidebar should show all required navigation items', async ({ page }) => {
  116 |     const requiredItems = [
  117 |       'Dashboard',
  118 |       'Twin Management', 
  119 |       'Explore',
  120 |       'Interview',
  121 |       'Curator',
  122 |       'Transcripts',
  123 |       'Talk to Twin',
  124 |       'My Files',
  125 |       'Settings',
  126 |       'Logout' // Should be at the bottom
  127 |     ];
  128 |
  129 |     const missingItems = [];
  130 |     
  131 |     for (const item of requiredItems) {
  132 |       const found = await page.locator(`.sidebar-nav`).getByText(item, { exact: false }).count() > 0;
  133 |       if (!found) {
  134 |         missingItems.push(item);
  135 |       }
  136 |     }
  137 |
  138 |     if (missingItems.length > 0) {
  139 |       console.log('Missing navigation items:', missingItems);
  140 |       await page.screenshot({ 
  141 |         path: `playwright-testing/screenshots/sidebar-missing-${missingItems.join('-').toLowerCase()}.png`,
  142 |         fullPage: true 
  143 |       });
  144 |     }
  145 |
  146 |     expect(missingItems).toHaveLength(0);
  147 |   });
  148 | });
```