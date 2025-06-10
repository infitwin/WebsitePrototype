# Test info

- Name: Dashboard Graph Controls >> Graph should be rendered with nodes and edges
- Location: /home/tim/WebsitePrototype/playwright-testing/tests/dashboard-graph-controls.spec.js:63:3

# Error details

```
Error: Timed out 60000ms waiting for expect(locator).toHaveCount(expected)

Locator: locator('#knowledge-graph g.node')
Expected: 7
Received: 0
Call log:
  - expect.toHaveCount with timeout 60000ms
  - waiting for locator('#knowledge-graph g.node')
    63 × locator resolved to 0 elements
       - unexpected value "0"

    at /home/tim/WebsitePrototype/playwright-testing/tests/dashboard-graph-controls.spec.js:69:25
```

# Page snapshot

```yaml
- img
- navigation:
  - link "← Back to Login":
    - /url: auth.html
- text: 📧
- heading "Verify Your Email" [level=1]
- paragraph: Almost there!
- text: We've sent a verification link to weezer@yev.com Please check your email and click the verification link to continue building your memory archive. Didn't receive the email?
- button "Resend Email"
- button "I've Verified My Email"
- button "Skip for Testing"
- button "Bypass All Auth (Testing)"
- text: • Check your spam or junk folder • Make sure user@example.com is correct • The link expires in 24 hours
- link "Wrong email address?":
  - /url: "#"
- link "Back to Login":
  - /url: auth.html
- link "Contact Support":
  - /url: "#"
- text: 🔒 This helps keep your memories safe and private. We'll never share your email address.
```

# Test source

```ts
   1 | const { test, expect } = require('@playwright/test');
   2 |
   3 | // Helper function for login
   4 | async function loginUser(page) {
   5 |   await page.goto('http://localhost:8357/pages/auth.html');
   6 |   await page.click('[data-tab="login"]');
   7 |   await page.fill('.login-email', 'weezer@yev.com');
   8 |   await page.fill('.login-password', '123456');
   9 |   await page.click('button:has-text("Access Your Memories")');
  10 |   await page.waitForURL('**/dashboard.html');
  11 | }
  12 |
  13 | test.describe('Dashboard Graph Controls', () => {
  14 |   test.beforeEach(async ({ page }) => {
  15 |     await loginUser(page);
  16 |   });
  17 |
  18 |   test('Graph control buttons should not cause JavaScript errors', async ({ page }) => {
  19 |     // Set up console error listener
  20 |     const consoleErrors = [];
  21 |     page.on('console', msg => {
  22 |       if (msg.type() === 'error') {
  23 |         consoleErrors.push(msg.text());
  24 |       }
  25 |     });
  26 |     
  27 |     // Wait for graph to be visible
  28 |     await page.waitForSelector('#knowledge-graph', { state: 'visible' });
  29 |     
  30 |     // Click Center button
  31 |     await page.click('button:has-text("Center")');
  32 |     await page.waitForTimeout(600); // Wait for animation
  33 |     
  34 |     // Click Fit button
  35 |     await page.click('button:has-text("Fit")');
  36 |     await page.waitForTimeout(600); // Wait for animation
  37 |     
  38 |     // Click Reset button
  39 |     await page.click('button:has-text("Reset")');
  40 |     await page.waitForTimeout(600); // Wait for animation
  41 |     
  42 |     // Check that no console errors occurred
  43 |     expect(consoleErrors).toHaveLength(0);
  44 |   });
  45 |   
  46 |   test('Graph controls should be visible and clickable', async ({ page }) => {
  47 |     // Check that all control buttons exist
  48 |     const centerBtn = page.locator('button:has-text("Center")');
  49 |     const fitBtn = page.locator('button:has-text("Fit")');
  50 |     const resetBtn = page.locator('button:has-text("Reset")');
  51 |     
  52 |     await expect(centerBtn).toBeVisible();
  53 |     await expect(fitBtn).toBeVisible();
  54 |     await expect(resetBtn).toBeVisible();
  55 |     
  56 |     // Verify they're in the graph controls section
  57 |     const graphControls = page.locator('.graph-controls');
  58 |     await expect(graphControls).toContainText('Center');
  59 |     await expect(graphControls).toContainText('Fit');
  60 |     await expect(graphControls).toContainText('Reset');
  61 |   });
  62 |   
  63 |   test('Graph should be rendered with nodes and edges', async ({ page }) => {
  64 |     // Wait for graph SVG
  65 |     await page.waitForSelector('#knowledge-graph', { state: 'visible' });
  66 |     
  67 |     // Check that nodes are rendered
  68 |     const nodes = page.locator('#knowledge-graph g.node');
> 69 |     await expect(nodes).toHaveCount(7); // Based on the sample data
     |                         ^ Error: Timed out 60000ms waiting for expect(locator).toHaveCount(expected)
  70 |     
  71 |     // Check that edges are rendered
  72 |     const edges = page.locator('#knowledge-graph line');
  73 |     await expect(edges).toHaveCount(7); // Based on the sample data
  74 |     
  75 |     // Check graph stats
  76 |     const stats = page.locator('#graph-stats');
  77 |     await expect(stats).toContainText('Nodes: 7');
  78 |     await expect(stats).toContainText('Edges: 7');
  79 |   });
  80 | });
```