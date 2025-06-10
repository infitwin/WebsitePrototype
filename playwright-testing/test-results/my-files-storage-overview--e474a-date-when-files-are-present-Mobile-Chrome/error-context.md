# Test info

- Name: My Files Storage Overview >> Storage Overview Integration >> should update when files are present
- Location: /home/tim/WebsitePrototype/playwright-testing/tests/my-files-storage-overview.spec.js:190:5

# Error details

```
Error: page.goto: Navigation to "http://localhost:8357/pages/my-files.html" is interrupted by another navigation to "http://localhost:8357/pages/email-verification.html"
Call log:
  - navigating to "http://localhost:8357/pages/my-files.html", waiting until "load"

    at /home/tim/WebsitePrototype/playwright-testing/tests/my-files-storage-overview.spec.js:19:16
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
  - text: 👤 User Menu User email@example.com
  - link "⚙️ Settings":
    - /url: settings.html
  - link "📁 My Files":
    - /url: my-files.html
  - link "🚪 Logout":
    - /url: auth.html
  - link "🚪 Logout":
    - /url: auth.html
- main:
  - heading "My Files" [level=1]
  - paragraph: Manage your documents and media files
  - paragraph: "Viewing files for: weezer@yev.com"
  - textbox "Search files..."
  - text: 🔍
  - button "⊞"
  - button "☰"
  - text: "📁 Drag files here or click to browse Supported: Images, Documents, Spreadsheets, Ebooks (Max 10MB per file)"
  - button "📁Choose Files"
  - checkbox "Select All"
  - text: "Select All Type:"
  - combobox "Type:":
    - option "All Files" [selected]
    - option "Images"
    - option "Documents"
    - option "Spreadsheets"
    - option "Ebooks"
  - text: "Sort by:"
  - combobox "Sort by:":
    - option "Newest First" [selected]
    - option "Oldest First"
    - option "Name (A-Z)"
    - option "Name (Z-A)"
    - option "Largest First"
    - option "Smallest First"
  - paragraph: Loading your files...
  - heading "Storage Overview" [level=2]
  - heading "Storage Breakdown" [level=3]
  - img: 0% Used
  - heading "Quick Stats" [level=3]
  - text: 0 GB Total Used 0 Total Files 0 MB Largest File 0 MB Average Size
  - heading "Storage Usage" [level=3]
  - text: 0 MB of 1 GB used 0%
  - heading "Quick Actions" [level=3]
  - button "🔧 Optimize Storage"
  - button "📊 Export Report"
```

# Test source

```ts
   1 | const { test, expect } = require('@playwright/test');
   2 |
   3 | test.describe('My Files Storage Overview', () => {
   4 |   
   5 |   // Helper function for login (from conversation context)
   6 |   async function loginUser(page) {
   7 |     await page.goto('http://localhost:8357/pages/auth.html');
   8 |     await page.click('[data-tab="login"]');
   9 |     await page.fill('.login-email', 'weezer@yev.com');
   10 |     await page.fill('.login-password', '123456');
   11 |     await page.click('button:has-text("Access Your Memories")');
   12 |     await page.waitForURL('**/dashboard.html');
   13 |   }
   14 |
   15 |   test.beforeEach(async ({ page }) => {
   16 |     // Login with test credentials 
   17 |     await loginUser(page);
   18 |     // Navigate to My Files page
>  19 |     await page.goto('http://localhost:8357/pages/my-files.html');
      |                ^ Error: page.goto: Navigation to "http://localhost:8357/pages/my-files.html" is interrupted by another navigation to "http://localhost:8357/pages/email-verification.html"
   20 |     await page.waitForLoadState('networkidle');
   21 |   });
   22 |
   23 |   test.describe('Storage Breakdown Chart', () => {
   24 |     test('should display storage breakdown section', async ({ page }) => {
   25 |       // Check for storage overview section
   26 |       await expect(page.locator('.storage-overview-section')).toBeVisible();
   27 |       await expect(page.locator('h2:has-text("Storage Overview")')).toBeVisible();
   28 |     });
   29 |
   30 |     test('should have storage breakdown chart', async ({ page }) => {
   31 |       // Check for chart container
   32 |       const chartCard = page.locator('.chart-card');
   33 |       await expect(chartCard).toBeVisible();
   34 |       await expect(chartCard.locator('h3:has-text("Storage Breakdown")')).toBeVisible();
   35 |       
   36 |       // Check for chart element
   37 |       const chartContainer = page.locator('#storageDonutChart');
   38 |       await expect(chartContainer).toBeVisible();
   39 |       
   40 |       // Take screenshot of chart area
   41 |       await chartCard.screenshot({ path: 'storage-breakdown-chart.png' });
   42 |     });
   43 |
   44 |     test('should load chart data without errors', async ({ page }) => {
   45 |       const errors = [];
   46 |       page.on('console', msg => {
   47 |         if (msg.type() === 'error') {
   48 |           errors.push(msg.text());
   49 |         }
   50 |       });
   51 |
   52 |       // Wait for chart to potentially load
   53 |       await page.waitForTimeout(3000);
   54 |       
   55 |       // Check for chart-related errors
   56 |       const chartErrors = errors.filter(error => 
   57 |         error.includes('chart') || 
   58 |         error.includes('donut') ||
   59 |         error.includes('storage') ||
   60 |         error.includes('breakdown')
   61 |       );
   62 |       
   63 |       if (chartErrors.length > 0) {
   64 |         await page.screenshot({ path: 'storage-chart-errors.png' });
   65 |         console.log('Chart errors found:', chartErrors);
   66 |       }
   67 |       
   68 |       expect(chartErrors.length).toBe(0);
   69 |     });
   70 |   });
   71 |
   72 |   test.describe('Quick Stats Section', () => {
   73 |     test('should display quick stats card', async ({ page }) => {
   74 |       const statsCard = page.locator('.stats-card');
   75 |       await expect(statsCard).toBeVisible();
   76 |       await expect(statsCard.locator('h3:has-text("Quick Stats")')).toBeVisible();
   77 |     });
   78 |
   79 |     test('should show all required stats', async ({ page }) => {
   80 |       const requiredStats = [
   81 |         { id: 'totalUsed', label: 'Total Used' },
   82 |         { id: 'totalFiles', label: 'Total Files' },
   83 |         { id: 'largestFile', label: 'Largest File' },
   84 |         { id: 'avgFileSize', label: 'Average Size' }
   85 |       ];
   86 |
   87 |       for (const stat of requiredStats) {
   88 |         const statValue = page.locator(`#${stat.id}`);
   89 |         const statLabel = page.locator(`.stat-label:has-text("${stat.label}")`);
   90 |         
   91 |         await expect(statValue).toBeVisible();
   92 |         await expect(statLabel).toBeVisible();
   93 |         
   94 |         // Check that stat value has content
   95 |         const valueText = await statValue.textContent();
   96 |         expect(valueText.length).toBeGreaterThan(0);
   97 |       }
   98 |     });
   99 |
  100 |     test('should display meaningful stat values', async ({ page }) => {
  101 |       // Check that stats show actual values, not just "0"
  102 |       const totalUsed = await page.locator('#totalUsed').textContent();
  103 |       const totalFiles = await page.locator('#totalFiles').textContent();
  104 |       
  105 |       // Values should contain units or numbers
  106 |       expect(totalUsed).toMatch(/\d+\s*(GB|MB|KB|Bytes)/);
  107 |       expect(totalFiles).toMatch(/\d+/);
  108 |       
  109 |       // Take screenshot of stats section
  110 |       await page.locator('.stats-card').screenshot({ path: 'storage-quick-stats.png' });
  111 |     });
  112 |   });
  113 |
  114 |   test.describe('Storage Usage Meter', () => {
  115 |     test('should display storage usage meter', async ({ page }) => {
  116 |       const storageCard = page.locator('.storage-card');
  117 |       await expect(storageCard).toBeVisible();
  118 |       await expect(storageCard.locator('h3:has-text("Storage Usage")')).toBeVisible();
  119 |     });
```