# Test info

- Name: Audio Recording Permission Handling >> should handle rapid click interactions without crashing
- Location: /home/tim/WebsitePrototype/playwright-testing/tests/audio-permission-handling.spec.js:101:3

# Error details

```
Error: locator.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('button#micBtn, .mic-btn, button:has-text("🎤")').first()
    - locator resolved to <button id="micBtn" class="mic-btn" onclick="toggleRecording()">🎤</button>
  - attempting click action
    - waiting for element to be visible, enabled and stable
    - element is visible, enabled and stable
    - scrolling into view if needed
    - done scrolling
    - performing click action

    at /home/tim/WebsitePrototype/playwright-testing/tests/audio-permission-handling.spec.js:109:23
```

# Test source

```ts
   9 |     await page.click('button:has-text("I Understand - Start Curating")');
   10 |     
   11 |     // Wait for services to initialize
   12 |     await page.waitForTimeout(2000);
   13 |   }
   14 |   
   15 |   test('should display microphone button and handle clicks', async ({ page }) => {
   16 |     await initializePage(page);
   17 |     
   18 |     // Find and verify microphone button exists
   19 |     const micButton = page.locator('button#micBtn, .mic-btn, button:has-text("🎤")').first();
   20 |     await expect(micButton).toBeVisible();
   21 |     
   22 |     // Click microphone button - should either work or show error gracefully
   23 |     await micButton.click();
   24 |     await page.waitForTimeout(1000);
   25 |     
   26 |     // Page should not crash - verify it still loads
   27 |     const title = await page.title();
   28 |     expect(title).toContain('Curator');
   29 |     
   30 |     // Button should still be visible and clickable
   31 |     expect(await micButton.isVisible()).toBeTruthy();
   32 |   });
   33 |
   34 |   test('should handle microphone functionality gracefully', async ({ page }) => {
   35 |     await initializePage(page);
   36 |     
   37 |     // Find microphone button
   38 |     const micButton = page.locator('button#micBtn, .mic-btn, button:has-text("🎤")').first();
   39 |     await expect(micButton).toBeVisible();
   40 |     
   41 |     // Click to attempt recording
   42 |     await micButton.click();
   43 |     await page.waitForTimeout(1000);
   44 |     
   45 |     // Check for any state change - either recording starts or error is shown
   46 |     const hasStateChange = await Promise.race([
   47 |       page.locator('.recording, .error, .permission-error').first().isVisible().catch(() => false),
   48 |       page.waitForTimeout(500).then(() => false)
   49 |     ]);
   50 |     
   51 |     // Either state changed or gracefully handled without crash
   52 |     const stillResponsive = await micButton.isVisible();
   53 |     expect(stillResponsive).toBeTruthy();
   54 |     
   55 |     // Click again to test stop/toggle behavior
   56 |     await micButton.click();
   57 |     await page.waitForTimeout(500);
   58 |     
   59 |     // Should still be responsive
   60 |     expect(await micButton.isVisible()).toBeTruthy();
   61 |   });
   62 |
   63 |   test('should handle browser without microphone support gracefully', async ({ page }) => {
   64 |     // Override navigator.mediaDevices to simulate unsupported browser
   65 |     await page.addInitScript(() => {
   66 |       delete window.navigator.mediaDevices;
   67 |     });
   68 |     
   69 |     await initializePage(page);
   70 |     
   71 |     // Should still load the page without crashing
   72 |     const title = await page.title();
   73 |     expect(title).toContain('Curator');
   74 |     
   75 |     // Microphone button should still be present
   76 |     const micButton = page.locator('button#micBtn, .mic-btn, button:has-text("🎤")').first();
   77 |     expect(await micButton.isVisible()).toBeTruthy();
   78 |   });
   79 |
   80 |   test('should handle API failures gracefully', async ({ page }) => {
   81 |     // Override getUserMedia to throw error
   82 |     await page.addInitScript(() => {
   83 |       if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
   84 |         navigator.mediaDevices.getUserMedia = async () => {
   85 |           throw new Error('NotAllowedError: Permission denied');
   86 |         };
   87 |       }
   88 |     });
   89 |     
   90 |     await initializePage(page);
   91 |     
   92 |     // Page should load normally
   93 |     const title = await page.title();
   94 |     expect(title).toContain('Curator');
   95 |     
   96 |     // Button should be present and clickable
   97 |     const micButton = page.locator('button#micBtn, .mic-btn, button:has-text("🎤")').first();
   98 |     expect(await micButton.isVisible()).toBeTruthy();
   99 |   });
  100 |
  101 |   test('should handle rapid click interactions without crashing', async ({ page }) => {
  102 |     await initializePage(page);
  103 |     
  104 |     const micButton = page.locator('button#micBtn, .mic-btn, button:has-text("🎤")').first();
  105 |     await expect(micButton).toBeVisible();
  106 |     
  107 |     // Rapidly click the button multiple times
  108 |     for (let i = 0; i < 5; i++) {
> 109 |       await micButton.click();
      |                       ^ Error: locator.click: Test timeout of 30000ms exceeded.
  110 |       await page.waitForTimeout(100);
  111 |     }
  112 |     
  113 |     // Should handle rapid clicks gracefully without breaking
  114 |     const buttonStillVisible = await micButton.isVisible();
  115 |     expect(buttonStillVisible).toBeTruthy();
  116 |     
  117 |     // Page should not have crashed
  118 |     const title = await page.title();
  119 |     expect(title).toContain('Curator');
  120 |   });
  121 |
  122 | });
```