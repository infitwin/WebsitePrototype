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

    at /home/tim/WebsitePrototype/playwright-testing/tests/audio-permission-handling.spec.js:109:23
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
- navigation:
  - link "← Dashboard":
    - /url: ../dashboard.html
  - heading "Memory Curator with Winston" [level=1]
  - text: Curation Progress 15% 3 of 20 memories curated
  - button "↶ Undo" [disabled]
  - button "↷ Redo" [disabled]
  - button "Save & Exit"
  - button "Interviews"
  - button "New Interview"
- heading "Memory Knowledge Graph" [level=2]
- button "Center"
- button "Fit"
- button "Reset"
- button "✨ Beautify"
- textbox "Search memories and connections..."
- button
- button "👤 Person"
- button "📅 Event"
- button "📍 Place"
- button "💭 Memory"
- button "🎨 Story"
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
- text: "Nodes: 5 • Edges: 5 Drag to pan • Scroll to zoom • Click to select Memories: 0 • Connections: 0 • Stories: 0"
- heading "Curation Activity" [level=3]
- heading "Active Session" [level=4]
- text: Winston is curating memories
- heading "Recent Stories" [level=4]
- text: 21:19 Childhood memories curated
- button "≡ Interview Manager"
- button "|| Stop Session"
- text: ↑ Click to expand chat
- heading "Current Question:" [level=3]
- paragraph: What's your earliest childhood memory that still brings you joy?
- text: 🎩 Hello! I'm Winston, your story curator. I'm here to help you capture and organize your precious memories. What would you like to talk about today?
- textbox "Share your response here..."
- button "🎤"
- button "+ New Interview"
- button "Interview about Photo"
- heading "OPEN INTERVIEWS" [level=4]
- text: Family Stories (12/25) 2 days ago
- button "Resume"
- text: Career Journey (5/30) 1 week ago
- button "Resume"
- heading "COMPLETED" [level=4]
- text: Wedding Day ✓ 1 month ago
- button "View"
- text: "Failed to start recording: Maximum call stack size exceeded."
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