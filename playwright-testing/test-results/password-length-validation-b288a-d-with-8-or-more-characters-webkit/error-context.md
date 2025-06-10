# Test info

- Name: Password Length Validation - Issue #31 >> should accept password with 8 or more characters
- Location: /home/tim/WebsitePrototype/playwright-testing/tests/password-length-validation.spec.js:68:3

# Error details

```
Error: expect(received).toBeFalsy()

Received: true
    at /home/tim/WebsitePrototype/playwright-testing/tests/password-length-validation.spec.js:84:25
```

# Page snapshot

```yaml
- img
- navigation:
  - link "← Back to Home":
    - /url: ../index.html
- img "Infitwin"
- paragraph: Begin Your Memory Journey
- button "Sign Up"
- button "Log In"
- text: or Full Name *
- textbox "Full Name *": Test User
- text: Email *
- textbox "Email *": test@example.com
- text: Password *
- textbox "Password *": Password123!
- button "Toggle password visibility": 👁️
- text: At least 8 characters Confirm Password *
- textbox "Confirm Password *": Password123!
- button "Toggle password visibility": 👁️
- text: Re-enter your password
- button "Create Your Archive"
- paragraph:
  - text: By signing up, you agree to our
  - link "Terms of Service":
    - /url: "#"
  - text: and
  - link "Privacy Policy":
    - /url: "#"
- text: 🌾 Discovered 🗨️ Explored 🏔️ Envisioned 🌅 Begin Failed to create account. Please try again.
```

# Test source

```ts
   1 | const { test, expect } = require('@playwright/test');
   2 |
   3 | test.describe('Password Length Validation - Issue #31', () => {
   4 |   test.beforeEach(async ({ page }) => {
   5 |     await page.goto('http://localhost:8357/pages/auth.html');
   6 |     await page.waitForLoadState('networkidle');
   7 |     
   8 |     // Switch to signup tab
   9 |     await page.click('[data-tab="signup"]');
  10 |     await page.waitForTimeout(100);
  11 |   });
  12 |
  13 |   test('should reject password with exactly 7 characters', async ({ page }) => {
  14 |     // Fill signup form with 7-character password
  15 |     await page.fill('#signup-name', 'Test User');
  16 |     await page.fill('#signup-email', 'test@example.com');
  17 |     await page.fill('#signup-password', 'Pass123'); // 7 characters
  18 |     await page.fill('#confirmPassword', 'Pass123');
  19 |     
  20 |     // Submit the form
  21 |     await page.click('button[type="submit"]');
  22 |     
  23 |     // Wait for notification to appear
  24 |     await page.waitForTimeout(1000);
  25 |     
  26 |     // Check for custom validation message (not browser default)
  27 |     const notificationSelectors = [
  28 |       'text=/Password must be at least 8 characters/i',
  29 |       'text=/at least 8 characters/i',
  30 |       '.auth-notification'
  31 |     ];
  32 |     
  33 |     let customNotificationFound = false;
  34 |     let notificationText = '';
  35 |     
  36 |     for (const selector of notificationSelectors) {
  37 |       try {
  38 |         const element = await page.locator(selector).first();
  39 |         if (await element.isVisible()) {
  40 |           notificationText = await element.textContent();
  41 |           console.log(`Found notification: "${notificationText}"`);
  42 |           if (notificationText.includes('at least 8 characters')) {
  43 |             customNotificationFound = true;
  44 |             break;
  45 |           }
  46 |         }
  47 |       } catch (e) {
  48 |         // Selector not found, continue
  49 |       }
  50 |     }
  51 |     
  52 |     // Should NOT show browser default message
  53 |     const browserDefaultMessage = await page.locator('text=/you are currently using.*characters/i').first().isVisible().catch(() => false);
  54 |     
  55 |     // Take screenshot for debugging
  56 |     if (!customNotificationFound) {
  57 |       await page.screenshot({ path: 'password-length-validation-issue.png', fullPage: true });
  58 |     }
  59 |     
  60 |     console.log('Custom notification found:', customNotificationFound);
  61 |     console.log('Browser default message visible:', browserDefaultMessage);
  62 |     console.log('Notification text:', notificationText);
  63 |     
  64 |     expect(customNotificationFound).toBeTruthy();
  65 |     expect(browserDefaultMessage).toBeFalsy();
  66 |   });
  67 |
  68 |   test('should accept password with 8 or more characters', async ({ page }) => {
  69 |     // Fill signup form with valid 8-character password
  70 |     await page.fill('#signup-name', 'Test User');
  71 |     await page.fill('#signup-email', 'test@example.com');
  72 |     await page.fill('#signup-password', 'Password123!'); // Valid password
  73 |     await page.fill('#confirmPassword', 'Password123!');
  74 |     
  75 |     // Submit the form
  76 |     await page.click('button[type="submit"]');
  77 |     
  78 |     // Wait for either success or Firebase error (which is expected in test)
  79 |     await page.waitForTimeout(2000);
  80 |     
  81 |     // Should not show length validation error
  82 |     const lengthError = await page.locator('text=/at least 8 characters/i').first().isVisible().catch(() => false);
  83 |     
> 84 |     expect(lengthError).toBeFalsy();
     |                         ^ Error: expect(received).toBeFalsy()
  85 |   });
  86 | });
```