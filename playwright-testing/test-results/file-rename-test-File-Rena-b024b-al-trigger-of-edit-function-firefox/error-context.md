# Test info

- Name: File Rename Feature >> manual trigger of edit function
- Location: /home/tim/WebsitePrototype/playwright-testing/tests/file-rename-test.spec.js:133:3

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false
    at /home/tim/WebsitePrototype/playwright-testing/tests/file-rename-test.spec.js:168:28
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
- heading "My Files" [level=1]
- img
- text: Photo Vectorization 21/1000 this month
- img
- text: 22.3 MB of 10 GB used 0%
- img
- textbox "Search files by name, type, or content..."
- button "All Files8"
- button "With Faces7"
- button "Recent8"
- button "Upload":
  - img
  - text: Upload
- main:
  - img
  - paragraph: Drop files to upload
  - paragraph: or click to browse from your computer
  - paragraph: Supports JPG, PNG, PDF, DOC up to 50MB
  - checkbox
  - text: Vectorized
  - img "test-image5.jpg"
  - img
  - text: 1 face
  - button "Download":
    - img
  - button "Delete":
    - img
  - text: test-image5.jpg 3.6 MB 1 day ago
  - checkbox
  - text: Vectorized
  - img "test-image4.jpg"
  - img
  - text: 1 face
  - button "Download":
    - img
  - button "Delete":
    - img
  - text: test-image4.jpg 1.6 MB 1 day ago
  - checkbox
  - text: Vectorized
  - img "test-image3.jpg"
  - button "Download":
    - img
  - button "Delete":
    - img
  - text: test-image3.jpg 6.1 MB 1 day ago
  - checkbox
  - text: Vectorized
  - img "test-image2.jpg"
  - img
  - text: 1 face
  - button "Download":
    - img
  - button "Delete":
    - img
  - text: test-image2.jpg 4.6 MB 1 day ago
  - checkbox
  - text: Vectorized
  - img "test-image1.jpg"
  - img
  - text: 2 faces
  - button "Download":
    - img
  - button "Delete":
    - img
  - text: test-image1.jpg 1.5 MB 1 day ago
  - checkbox
  - text: Vectorized
  - img "100_0017.JPG"
  - img
  - text: 3 faces
  - button "Download":
    - img
  - button "Delete":
    - img
  - text: 100_0017.JPG 782.5 KB 1 day ago
  - checkbox
  - text: Vectorized
  - img "PXL_20240415_194503653.jpg"
  - img
  - text: 1 face
  - button "Download":
    - img
  - button "Delete":
    - img
  - text: PXL_20240415_194503653.jpg 2.4 MB 1 day ago
  - checkbox
  - text: Vectorized
  - img "PXL_20240416_185331489.jpg"
  - img
  - text: 2 faces
  - button "Download":
    - img
  - button "Delete":
    - img
  - text: PXL_20240416_185331489.jpg 1.8 MB 1 day ago
- heading "test-image5.jpg" [level=3]
- button "View Faces (1)":
  - img
  - text: View Faces (1)
- button:
  - img
- text: Loading image with faces... 3.6 MB 6/21/2025 image/jpeg
- heading "Comments" [level=4]
- text: No comments yet. Add the first one!
- textbox "Add a comment..."
- button "Add Comment"
```

# Test source

```ts
   68 |         inputType: input?.type,
   69 |         isInputFocused: document.activeElement === input
   70 |       };
   71 |     });
   72 |     
   73 |     console.log('Edit mode check:', hasInput);
   74 |     expect(hasInput.hasInput).toBe(true);
   75 |     expect(hasInput.inputValue).toBe(originalTitle);
   76 |   });
   77 |
   78 |   test('should save new name on Enter key', async ({ page }) => {
   79 |     // Click on first image
   80 |     const firstImage = await page.locator('.file-card .file-thumbnail').first();
   81 |     await firstImage.click();
   82 |     await page.waitForSelector('#imageModal.active');
   83 |     
   84 |     // Double-click to edit
   85 |     await page.dblclick('#imageModalTitle');
   86 |     
   87 |     // Wait for input to appear
   88 |     await page.waitForSelector('#imageModalTitle input');
   89 |     
   90 |     // Type new name
   91 |     const newName = 'Test Renamed File ' + Date.now();
   92 |     await page.fill('#imageModalTitle input', newName);
   93 |     
   94 |     // Press Enter
   95 |     await page.press('#imageModalTitle input', 'Enter');
   96 |     
   97 |     // Wait a bit for save
   98 |     await page.waitForTimeout(1000);
   99 |     
  100 |     // Check if title updated
  101 |     const updatedTitle = await page.textContent('#imageModalTitle');
  102 |     console.log('Updated title:', updatedTitle);
  103 |     expect(updatedTitle).toBe(newName);
  104 |     
  105 |     // Check if file card also updated
  106 |     const fileCardName = await page.textContent('.file-card .file-name');
  107 |     console.log('File card name:', fileCardName);
  108 |   });
  109 |
  110 |   test('should cancel edit on Escape key', async ({ page }) => {
  111 |     // Click on first image
  112 |     const firstImage = await page.locator('.file-card .file-thumbnail').first();
  113 |     await firstImage.click();
  114 |     await page.waitForSelector('#imageModal.active');
  115 |     
  116 |     const originalTitle = await page.textContent('#imageModalTitle');
  117 |     
  118 |     // Double-click to edit
  119 |     await page.dblclick('#imageModalTitle');
  120 |     await page.waitForSelector('#imageModalTitle input');
  121 |     
  122 |     // Type new name
  123 |     await page.fill('#imageModalTitle input', 'This should be cancelled');
  124 |     
  125 |     // Press Escape
  126 |     await page.press('#imageModalTitle input', 'Escape');
  127 |     
  128 |     // Check if title reverted
  129 |     const revertedTitle = await page.textContent('#imageModalTitle');
  130 |     expect(revertedTitle).toBe(originalTitle);
  131 |   });
  132 |
  133 |   test('manual trigger of edit function', async ({ page }) => {
  134 |     // Click on first image
  135 |     const firstImage = await page.locator('.file-card .file-thumbnail').first();
  136 |     await firstImage.click();
  137 |     await page.waitForSelector('#imageModal.active');
  138 |     
  139 |     // Manually trigger edit function
  140 |     const result = await page.evaluate(() => {
  141 |       const title = document.getElementById('imageModalTitle');
  142 |       const file = window.currentImageFile;
  143 |       
  144 |       console.log('Manual test - title:', title);
  145 |       console.log('Manual test - file:', file);
  146 |       
  147 |       if (window.startEditingFileName && title && file) {
  148 |         window.startEditingFileName(title, file);
  149 |         
  150 |         // Check if input was created
  151 |         const input = title.querySelector('input');
  152 |         return {
  153 |           success: true,
  154 |           hasInput: !!input,
  155 |           inputValue: input?.value
  156 |         };
  157 |       }
  158 |       
  159 |       return {
  160 |         success: false,
  161 |         hasStartEditingFileName: !!window.startEditingFileName,
  162 |         hasTitle: !!title,
  163 |         hasFile: !!file
  164 |       };
  165 |     });
  166 |     
  167 |     console.log('Manual trigger result:', result);
> 168 |     expect(result.success).toBe(true);
      |                            ^ Error: expect(received).toBe(expected) // Object.is equality
  169 |     expect(result.hasInput).toBe(true);
  170 |   });
  171 | });
```