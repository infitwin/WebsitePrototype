# Test info

- Name: test face deletion fix with console logging
- Location: /home/tim/WebsitePrototype/playwright-testing/tests/test-face-deletion-fix.spec.js:3:1

# Error details

```
Error: page.waitForSelector: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('.modal-container') to be visible

    at /home/tim/WebsitePrototype/playwright-testing/tests/test-face-deletion-fix.spec.js:53:16
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
  - text: 👤 User Menu
  - link "🚪 Logout":
    - /url: auth.html
- main:
  - heading "My Files" [level=1]
  - paragraph: Manage your documents and media files
  - paragraph: weezer (weezer@yev.com)
  - img
  - searchbox "Search"
  - button "⊞"
  - button "☰"
  - text: "📁 Drag files here or click to browse Supported: Images, Documents, Spreadsheets, Ebooks, GEDCOM files (Max 10MB per file)"
  - button "📁Choose Files"
  - text: "Type:"
  - combobox "Type:":
    - option "All Files"
    - option "Images"
    - option "Documents"
    - option "Spreadsheets"
    - option "Ebooks"
    - option "GEDCOM Files"
    - option "Vectorized Images"
    - option "Extracted Faces" [selected]
  - text: "Sort by:"
  - combobox "Sort by:":
    - option "Name" [selected]
    - option "Date"
    - option "Size"
    - option "Type"
  - text: 2 files
  - checkbox
  - img "100_0017.JPG"
  - text: 100_0017.JPG 782.54 KB
  - button "↓"
  - button "✕"
  - checkbox
  - img "PXL_20230621_231143799.jpg"
  - text: PXL_20230621_231143799.jpg 2.72 MB
  - button "↓"
  - button "✕"
  - heading "Extracted Faces" [level=3]
  - paragraph: Faces detected from your vectorized images
  - button "✕"
  - img "Extracted face"
  - text: "10000% From: PXL_20230621_231143799.jpg Box: 0x0"
  - button "✕"
  - img "Extracted face"
  - text: "10000% From: 100_0017.JPG Box: 0x0"
  - button "✕"
  - img "Extracted face"
  - text: "10000% From: 100_0017.JPG Box: 0x0"
  - heading "Storage Usage" [level=2]
  - text: 3.48 MB of 10GB used (0%)
  - heading "Breakdown by Type" [level=3]
  - text: Images 0 MB Documents 0 MB Spreadsheets 0 MB Ebooks 0 MB GEDCOM 0 MB Other 0 MB
```

# Test source

```ts
   1 | const { test, expect } = require('@playwright/test');
   2 |
   3 | test('test face deletion fix with console logging', async ({ page }) => {
   4 |   // Capture console logs
   5 |   page.on('console', msg => {
   6 |     console.log(`[Browser ${msg.type()}]:`, msg.text());
   7 |   });
   8 |
   9 |   // Login
  10 |   await page.goto('http://localhost:8357/pages/auth.html');
  11 |   await page.click('[data-tab="login"]');
  12 |   await page.fill('.login-email', 'weezer@yev.com');
  13 |   await page.fill('.login-password', '123456');
  14 |   await page.click('button:has-text("Access Your Memories")');
  15 |   await page.waitForURL('**/dashboard.html');
  16 |
  17 |   // Navigate to My Files
  18 |   await page.goto('http://localhost:8357/pages/my-files.html');
  19 |   await page.waitForSelector('#filesContainer:visible, #emptyState:visible');
  20 |   await page.waitForTimeout(2000);
  21 |
  22 |   // Select Extracted Faces
  23 |   await page.selectOption('#fileTypeFilter', 'faces');
  24 |   await page.waitForTimeout(3000);
  25 |
  26 |   // Get face data before deletion
  27 |   const faceData = await page.evaluate(() => {
  28 |     const faces = Array.from(document.querySelectorAll('.face-item'));
  29 |     return faces.map((face, index) => {
  30 |       const confidence = face.querySelector('.face-confidence')?.textContent.trim();
  31 |       const source = face.querySelector('.face-source')?.textContent.trim();
  32 |       const faceId = face.dataset.faceId;
  33 |       const fileId = face.dataset.fileId;
  34 |       return { index, confidence, source, faceId, fileId };
  35 |     });
  36 |   });
  37 |   
  38 |   console.log('\nFaces before deletion:', faceData);
  39 |
  40 |   if (faceData.length > 0) {
  41 |     // Find a face with lower confidence (easier to identify)
  42 |     const targetFace = faceData.find(f => f.confidence !== '10000%') || faceData[0];
  43 |     console.log('\nTargeting face for deletion:', targetFace);
  44 |     
  45 |     // Hover over the target face
  46 |     const faceSelector = `[data-face-id="${targetFace.faceId}"]`;
  47 |     await page.hover(faceSelector);
  48 |     
  49 |     // Click the delete button
  50 |     await page.click(`${faceSelector} .face-delete-btn`);
  51 |     
  52 |     // Wait for confirmation modal
> 53 |     await page.waitForSelector('.modal-container');
     |                ^ Error: page.waitForSelector: Test timeout of 30000ms exceeded.
  54 |     
  55 |     // Check modal content
  56 |     const modalText = await page.textContent('.modal-content');
  57 |     console.log('\nModal text:', modalText);
  58 |     
  59 |     // Click Delete
  60 |     await page.click('button:has-text("Delete")');
  61 |     
  62 |     // Wait for deletion to complete
  63 |     await page.waitForTimeout(3000);
  64 |     
  65 |     // Check if face was removed
  66 |     const remainingFaces = await page.evaluate(() => {
  67 |       return document.querySelectorAll('.face-item').length;
  68 |     });
  69 |     
  70 |     console.log(`\nFaces after deletion: ${remainingFaces} (was ${faceData.length})`);
  71 |     
  72 |     // Take screenshot
  73 |     await page.screenshot({ path: 'face-deletion-fixed.png', fullPage: true });
  74 |     
  75 |     // Check for notification
  76 |     const notifications = await page.evaluate(() => {
  77 |       const notifs = document.querySelectorAll('.notification-message');
  78 |       return Array.from(notifs).map(n => n.textContent);
  79 |     });
  80 |     
  81 |     console.log('\nNotifications:', notifications);
  82 |     
  83 |   } else {
  84 |     console.log('\nNo faces found to test deletion');
  85 |   }
  86 | });
```