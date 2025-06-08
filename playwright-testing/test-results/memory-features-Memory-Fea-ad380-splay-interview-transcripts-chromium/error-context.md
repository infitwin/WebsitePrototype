# Test info

- Name: Memory Features >> should display interview transcripts
- Location: /home/tim/WebsitePrototype/playwright-testing/tests/memory-features.spec.js:97:3

# Error details

```
Error: expect(received).toBeTruthy()

Received: false
    at /home/tim/WebsitePrototype/playwright-testing/tests/memory-features.spec.js:115:29
```

# Page snapshot

```yaml
- navigation:
  - link "🏠 Dashboard":
    - /url: dashboard.html
  - link "📚 My Memories":
    - /url: explore.html
  - link "👥 Twin Management":
    - /url: twin-management.html
  - link "🔍 Explore":
    - /url: explore.html
  - link "🎤 Interview":
    - /url: interview.html
  - link "📝 Transcripts":
    - /url: interview-transcripts.html
  - link "📤 Artifact Uploader":
    - /url: file-browser.html
  - link "💬 Talk to Twin":
    - /url: talk-to-twin.html
  - link "📁 My Files":
    - /url: file-browser.html
  - link "⚙️ Settings":
    - /url: settings.html
- main:
  - heading "Interview Transcripts" [level=1]
  - paragraph: Review and manage your interview sessions
  - button "🎤 Start New Interview"
  - text: 0 Total Sessions 0h 0m Total Duration 0 Total Messages Never Last Session
  - heading "Your Interview Sessions" [level=2]
  - combobox:
    - option "Newest First" [selected]
    - option "Oldest First"
    - option "Longest First"
    - option "Shortest First"
- button "✕"
```

# Test source

```ts
   15 |     const descriptionInput = page.locator('textarea, input[type="text"], .memory-input').first();
   16 |     const hasDescription = await descriptionInput.isVisible().catch(() => false);
   17 |     
   18 |     expect(hasTitle || hasDescription).toBeTruthy();
   19 |     
   20 |     // Check for file upload
   21 |     const fileUpload = page.locator('input[type="file"], button:has-text("Upload"), .upload-button').first();
   22 |     await expect(fileUpload).toBeVisible();
   23 |     
   24 |     // Check for save/submit button
   25 |     const saveButton = page.locator('button:has-text("Save"), button:has-text("Capture"), button[type="submit"]').first();
   26 |     await expect(saveButton).toBeVisible();
   27 |   });
   28 |
   29 |   test('should have memory type selection', async ({ page }) => {
   30 |     await page.goto('http://localhost:8357/pages/capture-first-memory.html');
   31 |     
   32 |     // Check for memory type options
   33 |     const typeSelectors = page.locator('input[type="radio"], select, .memory-type, button[role="tab"]');
   34 |     const typeCount = await typeSelectors.count();
   35 |     expect(typeCount).toBeGreaterThan(0);
   36 |   });
   37 |
   38 |   test('should display memory archive', async ({ page }) => {
   39 |     await page.goto('http://localhost:8357/pages/memory-archive.html');
   40 |     
   41 |     // Check page header
   42 |     const header = page.locator('h1:has-text("Archive"), h1:has-text("Memories"), h2:has-text("Memory")').first();
   43 |     await expect(header).toBeVisible();
   44 |     
   45 |     // Check for memory grid or list
   46 |     const memoryContainer = page.locator('.memory-grid, .memory-list, .archive-container, [class*="memories"]').first();
   47 |     await expect(memoryContainer).toBeVisible();
   48 |     
   49 |     // Check for filter/search
   50 |     const searchBar = page.locator('input[type="search"], input[placeholder*="search"], .search-input').first();
   51 |     const hasSearch = await searchBar.isVisible().catch(() => false);
   52 |     
   53 |     const filterButton = page.locator('button:has-text("Filter"), .filter-button').first();
   54 |     const hasFilter = await filterButton.isVisible().catch(() => false);
   55 |     
   56 |     expect(hasSearch || hasFilter).toBeTruthy();
   57 |   });
   58 |
   59 |   test('should have memory cards or items', async ({ page }) => {
   60 |     await page.goto('http://localhost:8357/pages/memory-archive.html');
   61 |     
   62 |     // Check for memory items
   63 |     const memoryItems = page.locator('.memory-card, .memory-item, .archive-item, article');
   64 |     const itemCount = await memoryItems.count();
   65 |     
   66 |     // May have placeholder or empty state
   67 |     if (itemCount === 0) {
   68 |       const emptyState = page.locator('.empty-state, .no-memories, p:has-text("No memories")').first();
   69 |       await expect(emptyState).toBeVisible();
   70 |     } else {
   71 |       expect(itemCount).toBeGreaterThan(0);
   72 |     }
   73 |   });
   74 |
   75 |   test('should display interview interface', async ({ page }) => {
   76 |     await page.goto('http://localhost:8357/pages/interview.html');
   77 |     
   78 |     // Check page elements
   79 |     const header = page.locator('h1:has-text("Interview"), h2:has-text("Interview")').first();
   80 |     await expect(header).toBeVisible();
   81 |     
   82 |     // Check for start/record button
   83 |     const startButton = page.locator('button:has-text("Start"), button:has-text("Record"), button:has-text("Begin")').first();
   84 |     await expect(startButton).toBeVisible();
   85 |     
   86 |     // Check for question display area
   87 |     const questionArea = page.locator('.question, .interview-question, [class*="question"]').first();
   88 |     const hasQuestionArea = await questionArea.isVisible().catch(() => false);
   89 |     
   90 |     // Check for response area
   91 |     const responseArea = page.locator('textarea, .response-area, audio').first();
   92 |     const hasResponseArea = await responseArea.isVisible().catch(() => false);
   93 |     
   94 |     expect(hasQuestionArea || hasResponseArea).toBeTruthy();
   95 |   });
   96 |
   97 |   test('should display interview transcripts', async ({ page }) => {
   98 |     await page.goto('http://localhost:8357/pages/interview-transcripts.html');
   99 |     
  100 |     // Check header
  101 |     const header = page.locator('h1:has-text("Transcript"), h2:has-text("Interview")').first();
  102 |     await expect(header).toBeVisible();
  103 |     
  104 |     // Check for transcript list or content
  105 |     const transcriptContainer = page.locator('.transcript-list, .transcripts, .interview-list, main').first();
  106 |     await expect(transcriptContainer).toBeVisible();
  107 |     
  108 |     // Check for transcript items or empty state
  109 |     const transcriptItems = page.locator('.transcript-item, .transcript-card, article');
  110 |     const itemCount = await transcriptItems.count();
  111 |     
  112 |     if (itemCount === 0) {
  113 |       const emptyState = page.locator('.empty-state, p:has-text("No transcripts")').first();
  114 |       const hasEmptyState = await emptyState.isVisible().catch(() => false);
> 115 |       expect(hasEmptyState).toBeTruthy();
      |                             ^ Error: expect(received).toBeTruthy()
  116 |     }
  117 |   });
  118 |
  119 |   test('should have date/time stamps on memories', async ({ page }) => {
  120 |     await page.goto('http://localhost:8357/pages/memory-archive.html');
  121 |     
  122 |     // Look for date/time elements
  123 |     const dateElements = page.locator('time, .date, .timestamp, [class*="date"], [class*="time"]');
  124 |     const hasDateElements = await dateElements.first().isVisible().catch(() => false);
  125 |     
  126 |     if (hasDateElements) {
  127 |       expect(await dateElements.count()).toBeGreaterThan(0);
  128 |     }
  129 |   });
  130 | });
```