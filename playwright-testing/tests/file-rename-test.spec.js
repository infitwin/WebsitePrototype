const { test, expect } = require('@playwright/test');

test.describe('File Rename Feature', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('http://localhost:8357/pages/auth.html');
    await page.click('[data-tab="login"]');
    await page.fill('.login-email', 'weezer@yev.com');
    await page.fill('.login-password', '123456');
    await page.click('button:has-text("Access Your Memories")');
    await page.waitForURL('**/dashboard.html');
    
    // Navigate to My Files
    await page.goto('http://localhost:8357/pages/my-files.html');
    await page.waitForSelector('.file-card', { timeout: 10000 });
  });

  test('should show double-click handler is attached', async ({ page }) => {
    // Click on first image to open modal
    const firstImage = await page.locator('.file-card .file-thumbnail').first();
    await firstImage.click();
    
    // Wait for modal to open
    await page.waitForSelector('#imageModal.active');
    
    // Check if double-click handler is attached
    const hasHandler = await page.evaluate(() => {
      const title = document.getElementById('imageModalTitle');
      console.log('Title element:', title);
      console.log('ondblclick:', title?.ondblclick);
      console.log('_editHandler:', title?._editHandler);
      return {
        hasTitle: !!title,
        hasOndblclick: !!title?.ondblclick,
        hasEditHandler: !!title?._editHandler,
        titleText: title?.textContent,
        cursorStyle: title?.style.cursor,
        titleTooltip: title?.title
      };
    });
    
    console.log('Handler check:', hasHandler);
    expect(hasHandler.hasTitle).toBe(true);
    expect(hasHandler.hasOndblclick).toBe(true);
    expect(hasHandler.cursorStyle).toBe('text');
  });

  test('should enter edit mode on double-click', async ({ page }) => {
    // Click on first image
    const firstImage = await page.locator('.file-card .file-thumbnail').first();
    await firstImage.click();
    await page.waitForSelector('#imageModal.active');
    
    // Get original title
    const originalTitle = await page.textContent('#imageModalTitle');
    console.log('Original title:', originalTitle);
    
    // Double-click the title
    await page.dblclick('#imageModalTitle');
    
    // Check if input appears
    const hasInput = await page.evaluate(() => {
      const title = document.getElementById('imageModalTitle');
      const input = title?.querySelector('input');
      return {
        hasInput: !!input,
        inputValue: input?.value,
        inputType: input?.type,
        isInputFocused: document.activeElement === input
      };
    });
    
    console.log('Edit mode check:', hasInput);
    expect(hasInput.hasInput).toBe(true);
    expect(hasInput.inputValue).toBe(originalTitle);
  });

  test('should save new name on Enter key', async ({ page }) => {
    // Click on first image
    const firstImage = await page.locator('.file-card .file-thumbnail').first();
    await firstImage.click();
    await page.waitForSelector('#imageModal.active');
    
    // Double-click to edit
    await page.dblclick('#imageModalTitle');
    
    // Wait for input to appear
    await page.waitForSelector('#imageModalTitle input');
    
    // Type new name
    const newName = 'Test Renamed File ' + Date.now();
    await page.fill('#imageModalTitle input', newName);
    
    // Press Enter
    await page.press('#imageModalTitle input', 'Enter');
    
    // Wait a bit for save
    await page.waitForTimeout(1000);
    
    // Check if title updated
    const updatedTitle = await page.textContent('#imageModalTitle');
    console.log('Updated title:', updatedTitle);
    expect(updatedTitle).toBe(newName);
    
    // Check if file card also updated
    const fileCardName = await page.textContent('.file-card .file-name');
    console.log('File card name:', fileCardName);
  });

  test('should cancel edit on Escape key', async ({ page }) => {
    // Click on first image
    const firstImage = await page.locator('.file-card .file-thumbnail').first();
    await firstImage.click();
    await page.waitForSelector('#imageModal.active');
    
    const originalTitle = await page.textContent('#imageModalTitle');
    
    // Double-click to edit
    await page.dblclick('#imageModalTitle');
    await page.waitForSelector('#imageModalTitle input');
    
    // Type new name
    await page.fill('#imageModalTitle input', 'This should be cancelled');
    
    // Press Escape
    await page.press('#imageModalTitle input', 'Escape');
    
    // Check if title reverted
    const revertedTitle = await page.textContent('#imageModalTitle');
    expect(revertedTitle).toBe(originalTitle);
  });

  test('manual trigger of edit function', async ({ page }) => {
    // Click on first image
    const firstImage = await page.locator('.file-card .file-thumbnail').first();
    await firstImage.click();
    await page.waitForSelector('#imageModal.active');
    
    // Manually trigger edit function
    const result = await page.evaluate(() => {
      const title = document.getElementById('imageModalTitle');
      const file = window.currentImageFile;
      
      console.log('Manual test - title:', title);
      console.log('Manual test - file:', file);
      
      if (window.startEditingFileName && title && file) {
        window.startEditingFileName(title, file);
        
        // Check if input was created
        const input = title.querySelector('input');
        return {
          success: true,
          hasInput: !!input,
          inputValue: input?.value
        };
      }
      
      return {
        success: false,
        hasStartEditingFileName: !!window.startEditingFileName,
        hasTitle: !!title,
        hasFile: !!file
      };
    });
    
    console.log('Manual trigger result:', result);
    expect(result.success).toBe(true);
    expect(result.hasInput).toBe(true);
  });
});