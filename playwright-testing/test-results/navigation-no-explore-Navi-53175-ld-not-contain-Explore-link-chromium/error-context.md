# Test info

- Name: Navigation Without Explore >> Navigation should not contain Explore link
- Location: /home/tim/WebsitePrototype/playwright-testing/tests/navigation-no-explore.spec.js:14:3

# Error details

```
Error: Timed out 60000ms waiting for expect(locator).toContainText(expected)

Locator: locator('[data-page="curator"]')
Expected string: "Curator"
Received: <element(s) not found>
Call log:
  - expect.toContainText with timeout 60000ms
  - waiting for locator('[data-page="curator"]')
    - waiting for" http://localhost:8357/pages/email-verification.html" navigation to finish...
    - navigated to "http://localhost:8357/pages/email-verification.html"

    at /home/tim/WebsitePrototype/playwright-testing/tests/navigation-no-explore.spec.js:40:29
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
  13 | test.describe('Navigation Without Explore', () => {
  14 |   test('Navigation should not contain Explore link', async ({ page }) => {
  15 |     await loginUser(page);
  16 |     
  17 |     // Check that Explore link is not in navigation
  18 |     const exploreLink = page.locator('.sidebar-nav a[href="explore.html"]');
  19 |     await expect(exploreLink).toHaveCount(0);
  20 |     
  21 |     // Check that there's no data-page="explore"
  22 |     const exploreItem = page.locator('[data-page="explore"]');
  23 |     await expect(exploreItem).toHaveCount(0);
  24 |     
  25 |     // Verify other navigation items are still present
  26 |     const expectedItems = [
  27 |       { page: 'dashboard', text: 'Dashboard' },
  28 |       { page: 'twin', text: 'Twin Management' },
  29 |       { page: 'interview', text: 'Interview' },
  30 |       { page: 'curator', text: 'Curator' },
  31 |       { page: 'transcripts', text: 'Transcripts' },
  32 |       { page: 'talk', text: 'Talk to Twin' },
  33 |       { page: 'files', text: 'My Files' },
  34 |       { page: 'settings', text: 'Settings' }
  35 |     ];
  36 |     
  37 |     for (const item of expectedItems) {
  38 |       const navItem = page.locator(`[data-page="${item.page}"]`);
  39 |       await expect(navItem).toBeVisible();
> 40 |       await expect(navItem).toContainText(item.text);
     |                             ^ Error: Timed out 60000ms waiting for expect(locator).toContainText(expected)
  41 |     }
  42 |   });
  43 |   
  44 |   test('Curator page should be accessible as memory exploration alternative', async ({ page }) => {
  45 |     await loginUser(page);
  46 |     
  47 |     // Click on Curator link
  48 |     await page.click('[data-page="curator"]');
  49 |     
  50 |     // Verify we're on the curator page
  51 |     await expect(page).toHaveURL(/curator\.html/);
  52 |     
  53 |     // Verify Curator page loaded successfully
  54 |     await expect(page.locator('h1, h2').first()).toBeVisible();
  55 |   });
  56 | });
```