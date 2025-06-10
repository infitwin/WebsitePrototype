# Test info

- Name: Logout Functionality >> All authenticated pages should have logout in sidebar
- Location: /home/tim/WebsitePrototype/playwright-testing/tests/logout-functionality.spec.js:51:3

# Error details

```
Error: expect.toBeVisible: Error: strict mode violation: locator('.sidebar-nav .logout-item') resolved to 2 elements:
    1) <a href="auth.html" onclick="handleLogout(event)" class="user-dropdown-item logout-item">…</a> aka locator('#userDropdown').getByRole('link', { name: '🚪 Logout' })
    2) <a href="auth.html" onclick="handleLogout(event)" class="sidebar-nav-item logout-item">…</a> aka getByRole('link', { name: '🚪 Logout' }).nth(1)

Call log:
  - expect.toBeVisible with timeout 60000ms
  - waiting for locator('.sidebar-nav .logout-item')

    at /home/tim/WebsitePrototype/playwright-testing/tests/logout-functionality.spec.js:70:34
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
- text: We've sent a verification link to user@example.com Please check your email and click the verification link to continue building your memory archive. Didn't receive the email?
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
  13 | test.describe('Logout Functionality', () => {
  14 |   test('Sidebar logout button should log out user', async ({ page }) => {
  15 |     // Login first
  16 |     await loginUser(page);
  17 |     
  18 |     // Verify we're on dashboard
  19 |     await expect(page).toHaveURL(/dashboard\.html/);
  20 |     
  21 |     // Click the logout button in sidebar
  22 |     await page.click('.sidebar-nav .logout-item');
  23 |     
  24 |     // Should redirect to auth page
  25 |     await expect(page).toHaveURL(/auth\.html/);
  26 |     
  27 |     // Verify localStorage is cleared
  28 |     const isAuthenticated = await page.evaluate(() => localStorage.getItem('isAuthenticated'));
  29 |     expect(isAuthenticated).toBeNull();
  30 |   });
  31 |   
  32 |   test('Dashboard should not have duplicate logout in header', async ({ page }) => {
  33 |     // Login first
  34 |     await loginUser(page);
  35 |     
  36 |     // Open user dropdown menu
  37 |     await page.click('#userMenuToggle');
  38 |     
  39 |     // Check that dropdown is visible
  40 |     await expect(page.locator('#userDropdownMenu')).toBeVisible();
  41 |     
  42 |     // Check that there's no logout option in the dropdown
  43 |     const logoutInDropdown = await page.locator('#userDropdownMenu').locator('text=Logout').count();
  44 |     expect(logoutInDropdown).toBe(0);
  45 |     
  46 |     // Check that Settings option is still there
  47 |     const settingsInDropdown = await page.locator('#userDropdownMenu').locator('text=Settings').count();
  48 |     expect(settingsInDropdown).toBe(1);
  49 |   });
  50 |   
  51 |   test('All authenticated pages should have logout in sidebar', async ({ page }) => {
  52 |     await loginUser(page);
  53 |     
  54 |     const authenticatedPages = [
  55 |       'dashboard.html',
  56 |       'twin-management.html',
  57 |       'my-files.html',
  58 |       'settings.html',
  59 |       'curator.html',
  60 |       'interview.html',
  61 |       'talk-to-twin.html',
  62 |       'interview-transcripts.html'
  63 |     ];
  64 |     
  65 |     for (const pageName of authenticatedPages) {
  66 |       await page.goto(`http://localhost:8357/pages/${pageName}`);
  67 |       
  68 |       // Check that sidebar logout button exists
  69 |       const logoutButton = page.locator('.sidebar-nav .logout-item');
> 70 |       await expect(logoutButton).toBeVisible();
     |                                  ^ Error: expect.toBeVisible: Error: strict mode violation: locator('.sidebar-nav .logout-item') resolved to 2 elements:
  71 |       
  72 |       // Verify it has the logout icon and text
  73 |       await expect(logoutButton).toContainText('🚪');
  74 |     }
  75 |   });
  76 | });
```