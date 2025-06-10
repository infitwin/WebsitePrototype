# Test info

- Name: Authentication Guard Protection >> All protected pages should redirect to auth when not logged in
- Location: /home/tim/WebsitePrototype/playwright-testing/tests/auth-guard-protection.spec.js:15:3

# Error details

```
Error: Timed out 5000ms waiting for expect(locator).toHaveURL(expected)

Locator: locator(':root')
Expected pattern: /auth\.html/
Received string:  "http://localhost:8357/pages/twin-management.html"
Call log:
  - expect.toHaveURL with timeout 5000ms
  - waiting for locator(':root')
    9 × locator resolved to <html lang="en">…</html>
      - unexpected value "http://localhost:8357/pages/twin-management.html"

    at /home/tim/WebsitePrototype/playwright-testing/tests/auth-guard-protection.spec.js:28:26
```

# Page snapshot

```yaml
- navigation:
  - link "🏠 Dashboard":
    - /url: dashboard.html
  - link "👥 Twin Management":
    - /url: twin-management.html
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
- heading "Twin Management" [level=1]
- main:
  - button "My Twin"
  - button "Shared with Me"
  - text: 🧠
  - heading "John's Digital Twin" [level=2]
  - button "✏️ Edit"
  - text: Created January 15, 2024 • Last updated 2 days ago
  - button "📤 Share Twin"
  - button "👁️ Preview Twin"
  - text: 📖 47
  - paragraph: Memories
  - text: 👥 23
  - paragraph: People
  - text: 📍 15
  - paragraph: Places
  - text: 🔗 89
  - paragraph: Connections
```

# Test source

```ts
   1 | const { test, expect } = require('@playwright/test');
   2 |
   3 | test.describe('Authentication Guard Protection', () => {
   4 |   const protectedPages = [
   5 |     'dashboard.html',
   6 |     'twin-management.html',
   7 |     'curator.html', 
   8 |     'interview.html',
   9 |     'talk-to-twin.html',
  10 |     'settings.html',
  11 |     'my-files.html',
  12 |     'interview-transcripts.html'
  13 |   ];
  14 |
  15 |   test('All protected pages should redirect to auth when not logged in', async ({ page }) => {
  16 |     // Clear any existing auth state
  17 |     await page.goto('http://localhost:8357/pages/auth.html');
  18 |     await page.evaluate(() => {
  19 |       localStorage.clear();
  20 |       sessionStorage.clear();
  21 |     });
  22 |     
  23 |     for (const pageName of protectedPages) {
  24 |       // Try to access protected page without authentication
  25 |       await page.goto(`http://localhost:8357/pages/${pageName}`);
  26 |       
  27 |       // Should be redirected to auth page
> 28 |       await expect(page).toHaveURL(/auth\.html/, { 
     |                          ^ Error: Timed out 5000ms waiting for expect(locator).toHaveURL(expected)
  29 |         timeout: 5000,
  30 |         message: `${pageName} should redirect to auth.html when not authenticated` 
  31 |       });
  32 |     }
  33 |   });
  34 |   
  35 |   test('Protected pages should include auth-guard.js', async ({ page }) => {
  36 |     for (const pageName of protectedPages) {
  37 |       const response = await page.goto(`http://localhost:8357/pages/${pageName}`);
  38 |       const html = await response.text();
  39 |       
  40 |       // Check that auth-guard.js is imported
  41 |       const hasAuthGuard = html.includes("import { guardPage } from '../js/auth-guard.js'") ||
  42 |                           html.includes('auth-guard.js');
  43 |       
  44 |       expect(hasAuthGuard).toBeTruthy();
  45 |     }
  46 |   });
  47 | });
```