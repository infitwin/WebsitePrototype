const { test, expect } = require('@playwright/test');
const path = require('path');

test.describe('File Upload Validation Edge Cases', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8357/pages/file-browser.html');
    await page.waitForLoadState('networkidle');
  });

  test('should reject files larger than 10MB size limit', async ({ page }) => {
    // Find file input and drop zone
    const fileInput = page.locator('#fileInput');
    const dropZone = page.locator('#dropZone, .file-drop-zone');
    
    if (!await fileInput.isVisible() && !await dropZone.isVisible()) {
      test.skip('File upload interface not found on this page');
    }
    
    // Create a large file blob that exceeds 10MB (simulate 15MB file)
    const largeMockFile = await page.evaluate(() => {
      const size = 15 * 1024 * 1024; // 15MB
      const buffer = new ArrayBuffer(size);
      const file = new File([buffer], 'large-file.jpg', { type: 'image/jpeg' });
      return {
        name: file.name,
        size: file.size,
        type: file.type
      };
    });
    
    // Mock file selection with oversized file
    await page.evaluate((mockFile) => {
      const fileInput = document.querySelector('#fileInput');
      if (fileInput) {
        const dataTransfer = new DataTransfer();
        const file = new File([new ArrayBuffer(mockFile.size)], mockFile.name, { type: mockFile.type });
        dataTransfer.items.add(file);
        fileInput.files = dataTransfer.files;
        
        // Trigger change event
        const event = new Event('change', { bubbles: true });
        fileInput.dispatchEvent(event);
      }
    }, largeMockFile);
    
    // Should show error message about file size
    const errorSelectors = [
      'text=/file.*size.*10.*mb/i',
      'text=/file.*too.*large/i',
      'text=/size.*limit/i',
      '.error',
      '.upload-error',
      '[class*="error"]'
    ];
    
    let errorFound = false;
    for (const selector of errorSelectors) {
      if (await page.locator(selector).first().isVisible().catch(() => false)) {
        errorFound = true;
        break;
      }
    }
    
    expect(errorFound).toBeTruthy();
  });

  test('should reject unsupported file types', async ({ page }) => {
    const fileInput = page.locator('#fileInput');
    const dropZone = page.locator('#dropZone, .file-drop-zone');
    
    if (!await fileInput.isVisible() && !await dropZone.isVisible()) {
      test.skip('File upload interface not found on this page');
    }
    
    // Test various unsupported file types
    const unsupportedFiles = [
      { name: 'video.mp4', type: 'video/mp4' },
      { name: 'audio.mp3', type: 'audio/mp3' },
      { name: 'executable.exe', type: 'application/x-msdownload' },
      { name: 'script.js', type: 'application/javascript' },
      { name: 'archive.zip', type: 'application/zip' },
      { name: 'unknown.xyz', type: 'application/octet-stream' },
      { name: 'image.bmp', type: 'image/bmp' }, // BMP not in supported list
      { name: 'presentation.ppt', type: 'application/vnd.ms-powerpoint' }
    ];
    
    for (const unsupportedFile of unsupportedFiles) {
      // Mock file selection with unsupported file type
      await page.evaluate((mockFile) => {
        const fileInput = document.querySelector('#fileInput');
        if (fileInput) {
          const dataTransfer = new DataTransfer();
          const file = new File(['content'], mockFile.name, { type: mockFile.type });
          dataTransfer.items.add(file);
          fileInput.files = dataTransfer.files;
          
          // Trigger change event
          const event = new Event('change', { bubbles: true });
          fileInput.dispatchEvent(event);
        }
      }, unsupportedFile);
      
      await page.waitForTimeout(300);
      
      // Should show error message about unsupported file type
      const errorSelectors = [
        'text=/file.*type.*not.*supported/i',
        'text=/unsupported.*file/i',
        'text=/not.*supported/i',
        '.error',
        '.upload-error'
      ];
      
      let errorFound = false;
      for (const selector of errorSelectors) {
        if (await page.locator(selector).first().isVisible().catch(() => false)) {
          errorFound = true;
          break;
        }
      }
      
      expect(errorFound).toBeTruthy();
    }
  });

  test('should accept all supported file types', async ({ page }) => {
    const fileInput = page.locator('#fileInput');
    
    if (!await fileInput.isVisible()) {
      test.skip('File input not found on this page');
    }
    
    // Test supported file types from the specification
    const supportedFiles = [
      // Images
      { name: 'image.jpg', type: 'image/jpeg' },
      { name: 'image.jpeg', type: 'image/jpeg' },
      { name: 'image.png', type: 'image/png' },
      { name: 'image.gif', type: 'image/gif' },
      { name: 'image.webp', type: 'image/webp' },
      
      // Documents
      { name: 'document.pdf', type: 'application/pdf' },
      { name: 'document.doc', type: 'application/msword' },
      { name: 'document.docx', type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
      { name: 'document.txt', type: 'text/plain' },
      { name: 'document.rtf', type: 'application/rtf' },
      
      // Spreadsheets
      { name: 'spreadsheet.xls', type: 'application/vnd.ms-excel' },
      { name: 'spreadsheet.xlsx', type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
      
      // Ebooks
      { name: 'book.epub', type: 'application/epub+zip' }
    ];
    
    for (const supportedFile of supportedFiles) {
      // Mock file selection with supported file type
      await page.evaluate((mockFile) => {
        const fileInput = document.querySelector('#fileInput');
        if (fileInput) {
          const dataTransfer = new DataTransfer();
          const file = new File(['test content'], mockFile.name, { type: mockFile.type });
          dataTransfer.items.add(file);
          fileInput.files = dataTransfer.files;
          
          // Trigger change event
          const event = new Event('change', { bubbles: true });
          fileInput.dispatchEvent(event);
        }
      }, supportedFile);
      
      await page.waitForTimeout(200);
      
      // Should NOT show error for supported file types
      const fileTypeErrorShown = await page.locator('text=/file.*type.*not.*supported/i').first().isVisible().catch(() => false);
      expect(fileTypeErrorShown).toBeFalsy();
    }
  });

  test('should reject files with extremely long filenames', async ({ page }) => {
    const fileInput = page.locator('#fileInput');
    
    if (!await fileInput.isVisible()) {
      test.skip('File input not found on this page');
    }
    
    // Create filename with more than 200 characters
    const longFilename = 'a'.repeat(201) + '.jpg';
    
    await page.evaluate((filename) => {
      const fileInput = document.querySelector('#fileInput');
      if (fileInput) {
        const dataTransfer = new DataTransfer();
        const file = new File(['content'], filename, { type: 'image/jpeg' });
        dataTransfer.items.add(file);
        fileInput.files = dataTransfer.files;
        
        // Trigger change event
        const event = new Event('change', { bubbles: true });
        fileInput.dispatchEvent(event);
      }
    }, longFilename);
    
    // Should show error about filename length
    const errorSelectors = [
      'text=/file.*name.*200.*characters/i',
      'text=/filename.*too.*long/i',
      'text=/name.*length/i',
      '.error'
    ];
    
    let errorFound = false;
    for (const selector of errorSelectors) {
      if (await page.locator(selector).first().isVisible().catch(() => false)) {
        errorFound = true;
        break;
      }
    }
    
    expect(errorFound).toBeTruthy();
  });

  test('should handle multiple file upload validation', async ({ page }) => {
    const fileInput = page.locator('#fileInput');
    
    if (!await fileInput.isVisible()) {
      test.skip('File input not found on this page');
    }
    
    // Test mixed valid and invalid files in multiple selection
    await page.evaluate(() => {
      const fileInput = document.querySelector('#fileInput');
      if (fileInput) {
        const dataTransfer = new DataTransfer();
        
        // Add mix of valid and invalid files
        const validFile = new File(['content'], 'valid.jpg', { type: 'image/jpeg' });
        const invalidTypeFile = new File(['content'], 'invalid.mp4', { type: 'video/mp4' });
        const oversizedFile = new File([new ArrayBuffer(11 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });
        
        dataTransfer.items.add(validFile);
        dataTransfer.items.add(invalidTypeFile);
        dataTransfer.items.add(oversizedFile);
        
        fileInput.files = dataTransfer.files;
        
        // Trigger change event
        const event = new Event('change', { bubbles: true });
        fileInput.dispatchEvent(event);
      }
    });
    
    await page.waitForTimeout(500);
    
    // Should show multiple error messages or summary of issues
    const hasErrors = await page.locator('.error, .upload-error, [class*="error"]').first().isVisible().catch(() => false);
    expect(hasErrors).toBeTruthy();
  });

  test('should handle files with special characters in names', async ({ page }) => {
    const fileInput = page.locator('#fileInput');
    
    if (!await fileInput.isVisible()) {
      test.skip('File input not found on this page');
    }
    
    // Test files with various special characters
    const specialCharFiles = [
      'file with spaces.jpg',
      'file-with-dashes.jpg',
      'file_with_underscores.jpg',
      'file.with.dots.jpg',
      'file(with)parens.jpg',
      'file[with]brackets.jpg',
      'file{with}braces.jpg',
      'file&with&ampersands.jpg',
      'file%with%percent.jpg',
      'file+with+plus.jpg',
      'file=with=equals.jpg',
      'file@with@at.jpg',
      'file#with#hash.jpg',
      'file$with$dollar.jpg',
      'file!with!exclamation.jpg',
      'file?with?question.jpg',
      'file*with*asterisk.jpg',
      'fileçwithçaccents.jpg',
      'fileñwithñspanish.jpg',
      'file中文characters.jpg'
    ];
    
    for (const specialFileName of specialCharFiles) {
      await page.evaluate((filename) => {
        const fileInput = document.querySelector('#fileInput');
        if (fileInput) {
          const dataTransfer = new DataTransfer();
          const file = new File(['content'], filename, { type: 'image/jpeg' });
          dataTransfer.items.add(file);
          fileInput.files = dataTransfer.files;
          
          // Trigger change event
          const event = new Event('change', { bubbles: true });
          fileInput.dispatchEvent(event);
        }
      }, specialFileName);
      
      await page.waitForTimeout(100);
      
      // Should handle special characters gracefully without crashing
      const pageStillFunctional = await page.locator('#fileInput').isVisible();
      expect(pageStillFunctional).toBeTruthy();
    }
  });

  test('should handle empty file selection gracefully', async ({ page }) => {
    const fileInput = page.locator('#fileInput');
    
    if (!await fileInput.isVisible()) {
      test.skip('File input not found on this page');
    }
    
    // Simulate empty file selection
    await page.evaluate(() => {
      const fileInput = document.querySelector('#fileInput');
      if (fileInput) {
        const dataTransfer = new DataTransfer();
        fileInput.files = dataTransfer.files; // Empty file list
        
        // Trigger change event
        const event = new Event('change', { bubbles: true });
        fileInput.dispatchEvent(event);
      }
    });
    
    // Should handle empty selection without errors
    const pageStillFunctional = await page.locator('#fileInput').isVisible();
    expect(pageStillFunctional).toBeTruthy();
    
    // Should not show error messages for empty selection
    const hasErrors = await page.locator('text=/error/i, .error').first().isVisible().catch(() => false);
    expect(hasErrors).toBeFalsy();
  });

  test('should handle zero-byte files', async ({ page }) => {
    const fileInput = page.locator('#fileInput');
    
    if (!await fileInput.isVisible()) {
      test.skip('File input not found on this page');
    }
    
    // Create zero-byte file
    await page.evaluate(() => {
      const fileInput = document.querySelector('#fileInput');
      if (fileInput) {
        const dataTransfer = new DataTransfer();
        const emptyFile = new File([], 'empty.jpg', { type: 'image/jpeg' });
        dataTransfer.items.add(emptyFile);
        fileInput.files = dataTransfer.files;
        
        // Trigger change event
        const event = new Event('change', { bubbles: true });
        fileInput.dispatchEvent(event);
      }
    });
    
    await page.waitForTimeout(300);
    
    // Should handle zero-byte files appropriately (either accept or show specific error)
    const pageStillFunctional = await page.locator('#fileInput').isVisible();
    expect(pageStillFunctional).toBeTruthy();
  });

  test('should handle drag and drop validation', async ({ page }) => {
    const dropZone = page.locator('#dropZone, .file-drop-zone, .drop-zone');
    
    if (!await dropZone.isVisible()) {
      test.skip('Drop zone not found on this page');
    }
    
    // Test drag and drop with invalid file
    const boundingBox = await dropZone.boundingBox();
    if (boundingBox) {
      // Simulate drag enter
      await page.mouse.move(boundingBox.x + boundingBox.width / 2, boundingBox.y + boundingBox.height / 2);
      
      // Mock drag and drop with invalid file
      await page.evaluate(() => {
        const dropZone = document.querySelector('#dropZone, .file-drop-zone, .drop-zone');
        if (dropZone) {
          const dataTransfer = new DataTransfer();
          const invalidFile = new File(['content'], 'invalid.mp4', { type: 'video/mp4' });
          dataTransfer.items.add(invalidFile);
          
          // Simulate drop event
          const dropEvent = new DragEvent('drop', {
            bubbles: true,
            dataTransfer: dataTransfer
          });
          dropZone.dispatchEvent(dropEvent);
        }
      });
      
      await page.waitForTimeout(500);
      
      // Should show validation error for dropped invalid file
      const hasError = await page.locator('text=/not.*supported/i, .error').first().isVisible().catch(() => false);
      expect(hasError).toBeTruthy();
    }
  });

  test('should handle rapid multiple file selections', async ({ page }) => {
    const fileInput = page.locator('#fileInput');
    
    if (!await fileInput.isVisible()) {
      test.skip('File input not found on this page');
    }
    
    // Rapidly select different files to test for race conditions
    const testFiles = [
      { name: 'file1.jpg', type: 'image/jpeg' },
      { name: 'file2.png', type: 'image/png' },
      { name: 'file3.pdf', type: 'application/pdf' },
      { name: 'invalid.mp4', type: 'video/mp4' },
      { name: 'file4.txt', type: 'text/plain' }
    ];
    
    for (const testFile of testFiles) {
      await page.evaluate((mockFile) => {
        const fileInput = document.querySelector('#fileInput');
        if (fileInput) {
          const dataTransfer = new DataTransfer();
          const file = new File(['content'], mockFile.name, { type: mockFile.type });
          dataTransfer.items.add(file);
          fileInput.files = dataTransfer.files;
          
          // Trigger change event
          const event = new Event('change', { bubbles: true });
          fileInput.dispatchEvent(event);
        }
      }, testFile);
      
      await page.waitForTimeout(50); // Very short wait to test rapid selection
    }
    
    // Should handle rapid selections without crashing
    const pageStillFunctional = await page.locator('#fileInput').isVisible();
    expect(pageStillFunctional).toBeTruthy();
  });

});