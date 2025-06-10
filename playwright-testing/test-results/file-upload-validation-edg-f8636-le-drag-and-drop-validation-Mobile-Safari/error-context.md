# Test info

- Name: File Upload Validation Edge Cases >> should handle drag and drop validation
- Location: /home/tim/WebsitePrototype/playwright-testing/tests/file-upload-validation-edge-cases.spec.js:429:3

# Error details

```
Error: expect(received).toBeTruthy()

Received: false
    at /home/tim/WebsitePrototype/playwright-testing/tests/file-upload-validation-edge-cases.spec.js:463:24
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
- main:
  - heading "My Files" [level=1]
  - paragraph: Manage your documents and media files
  - paragraph
  - textbox "Search files..."
  - text: 🔍
  - button "⊞"
  - button "☰"
  - text: "📁 Drag files here or click to browse Supported: Images, Documents, Spreadsheets, Ebooks (Max 10MB per file)"
  - button "📁Choose Files"
  - heading "Upload Queue" [level=3]
  - text: 0 files 📎 invalid.mp4 7 Bytes
  - button "↻"
  - text: "0% ✗ File type not supported. Supported types: Images (JPG, PNG, GIF, WEBP), Documents (PDF, DOC, DOCX, TXT, RTF), Spreadsheets (XLS, XLSX), Ebooks (EPUB)"
  - button "Pause All" [disabled]
  - button "Cancel All" [disabled]
  - checkbox "Select All"
  - text: "Select All Type:"
  - combobox "Type:":
    - option "All Files" [selected]
    - option "Images"
    - option "Documents"
    - option "Spreadsheets"
    - option "Ebooks"
  - text: "Sort by:"
  - combobox "Sort by:":
    - option "Newest First" [selected]
    - option "Oldest First"
    - option "Name (A-Z)"
    - option "Name (Z-A)"
    - option "Largest First"
    - option "Smallest First"
  - text: 📂
  - heading "No files yet" [level=3]
  - paragraph: Upload your first file to get started
  - text: "Debug: User must be authenticated"
  - heading "Storage Overview" [level=2]
  - heading "Storage Breakdown" [level=3]
  - paragraph: Unable to load storage data
  - heading "Quick Stats" [level=3]
  - text: 0 GB Total Used 0 Total Files 0 MB Largest File 0 MB Average Size
  - heading "Storage Usage" [level=3]
  - text: 0 MB of 1 GB used 0%
  - heading "Quick Actions" [level=3]
  - button "🔧 Optimize Storage"
  - button "📊 Export Report"
- text: "⚠ Upload complete: 0 succeeded, 1 failed"
- button "✕"
```

# Test source

```ts
  363 |       await page.waitForTimeout(100);
  364 |       
  365 |       // Should handle special characters gracefully without crashing
  366 |       const pageStillFunctional = await page.locator('#fileInput').isVisible();
  367 |       expect(pageStillFunctional).toBeTruthy();
  368 |     }
  369 |   });
  370 |
  371 |   test('should handle empty file selection gracefully', async ({ page }) => {
  372 |     const fileInput = page.locator('#fileInput');
  373 |     
  374 |     if (!await fileInput.isVisible()) {
  375 |       test.skip('File input not found on this page');
  376 |     }
  377 |     
  378 |     // Simulate empty file selection
  379 |     await page.evaluate(() => {
  380 |       const fileInput = document.querySelector('#fileInput');
  381 |       if (fileInput) {
  382 |         const dataTransfer = new DataTransfer();
  383 |         fileInput.files = dataTransfer.files; // Empty file list
  384 |         
  385 |         // Trigger change event
  386 |         const event = new Event('change', { bubbles: true });
  387 |         fileInput.dispatchEvent(event);
  388 |       }
  389 |     });
  390 |     
  391 |     // Should handle empty selection without errors
  392 |     const pageStillFunctional = await page.locator('#fileInput').isVisible();
  393 |     expect(pageStillFunctional).toBeTruthy();
  394 |     
  395 |     // Should not show error messages for empty selection
  396 |     const hasErrors = await page.locator('text=/error/i, .error').first().isVisible().catch(() => false);
  397 |     expect(hasErrors).toBeFalsy();
  398 |   });
  399 |
  400 |   test('should handle zero-byte files', async ({ page }) => {
  401 |     const fileInput = page.locator('#fileInput');
  402 |     
  403 |     if (!await fileInput.isVisible()) {
  404 |       test.skip('File input not found on this page');
  405 |     }
  406 |     
  407 |     // Create zero-byte file
  408 |     await page.evaluate(() => {
  409 |       const fileInput = document.querySelector('#fileInput');
  410 |       if (fileInput) {
  411 |         const dataTransfer = new DataTransfer();
  412 |         const emptyFile = new File([], 'empty.jpg', { type: 'image/jpeg' });
  413 |         dataTransfer.items.add(emptyFile);
  414 |         fileInput.files = dataTransfer.files;
  415 |         
  416 |         // Trigger change event
  417 |         const event = new Event('change', { bubbles: true });
  418 |         fileInput.dispatchEvent(event);
  419 |       }
  420 |     });
  421 |     
  422 |     await page.waitForTimeout(300);
  423 |     
  424 |     // Should handle zero-byte files appropriately (either accept or show specific error)
  425 |     const pageStillFunctional = await page.locator('#fileInput').isVisible();
  426 |     expect(pageStillFunctional).toBeTruthy();
  427 |   });
  428 |
  429 |   test('should handle drag and drop validation', async ({ page }) => {
  430 |     const dropZone = page.locator('#dropZone, .file-drop-zone, .drop-zone');
  431 |     
  432 |     if (!await dropZone.isVisible()) {
  433 |       test.skip('Drop zone not found on this page');
  434 |     }
  435 |     
  436 |     // Test drag and drop with invalid file
  437 |     const boundingBox = await dropZone.boundingBox();
  438 |     if (boundingBox) {
  439 |       // Simulate drag enter
  440 |       await page.mouse.move(boundingBox.x + boundingBox.width / 2, boundingBox.y + boundingBox.height / 2);
  441 |       
  442 |       // Mock drag and drop with invalid file
  443 |       await page.evaluate(() => {
  444 |         const dropZone = document.querySelector('#dropZone, .file-drop-zone, .drop-zone');
  445 |         if (dropZone) {
  446 |           const dataTransfer = new DataTransfer();
  447 |           const invalidFile = new File(['content'], 'invalid.mp4', { type: 'video/mp4' });
  448 |           dataTransfer.items.add(invalidFile);
  449 |           
  450 |           // Simulate drop event
  451 |           const dropEvent = new DragEvent('drop', {
  452 |             bubbles: true,
  453 |             dataTransfer: dataTransfer
  454 |           });
  455 |           dropZone.dispatchEvent(dropEvent);
  456 |         }
  457 |       });
  458 |       
  459 |       await page.waitForTimeout(500);
  460 |       
  461 |       // Should show validation error for dropped invalid file
  462 |       const hasError = await page.locator('text=/not.*supported/i, .error').first().isVisible().catch(() => false);
> 463 |       expect(hasError).toBeTruthy();
      |                        ^ Error: expect(received).toBeTruthy()
  464 |     }
  465 |   });
  466 |
  467 |   test('should handle rapid multiple file selections', async ({ page }) => {
  468 |     const fileInput = page.locator('#fileInput');
  469 |     
  470 |     if (!await fileInput.isVisible()) {
  471 |       test.skip('File input not found on this page');
  472 |     }
  473 |     
  474 |     // Rapidly select different files to test for race conditions
  475 |     const testFiles = [
  476 |       { name: 'file1.jpg', type: 'image/jpeg' },
  477 |       { name: 'file2.png', type: 'image/png' },
  478 |       { name: 'file3.pdf', type: 'application/pdf' },
  479 |       { name: 'invalid.mp4', type: 'video/mp4' },
  480 |       { name: 'file4.txt', type: 'text/plain' }
  481 |     ];
  482 |     
  483 |     for (const testFile of testFiles) {
  484 |       await page.evaluate((mockFile) => {
  485 |         const fileInput = document.querySelector('#fileInput');
  486 |         if (fileInput) {
  487 |           const dataTransfer = new DataTransfer();
  488 |           const file = new File(['content'], mockFile.name, { type: mockFile.type });
  489 |           dataTransfer.items.add(file);
  490 |           fileInput.files = dataTransfer.files;
  491 |           
  492 |           // Trigger change event
  493 |           const event = new Event('change', { bubbles: true });
  494 |           fileInput.dispatchEvent(event);
  495 |         }
  496 |       }, testFile);
  497 |       
  498 |       await page.waitForTimeout(50); // Very short wait to test rapid selection
  499 |     }
  500 |     
  501 |     // Should handle rapid selections without crashing
  502 |     const pageStillFunctional = await page.locator('#fileInput').isVisible();
  503 |     expect(pageStillFunctional).toBeTruthy();
  504 |   });
  505 |
  506 | });
```