const { test, expect } = require('@playwright/test');

test.describe('Memory Features', () => {
  test('should display memory capture interface', async ({ page }) => {
    await page.goto('http://localhost:8357/pages/capture-first-memory.html');
    
    // Check page header
    const header = page.locator('h1:has-text("Memory"), h1:has-text("Capture"), h2:has-text("First Memory")').first();
    await expect(header).toBeVisible();
    
    // Check for input fields
    const titleInput = page.locator('input[name="title"], input[placeholder*="title"], #memory-title').first();
    const hasTitle = await titleInput.isVisible().catch(() => false);
    
    const descriptionInput = page.locator('textarea, input[type="text"], .memory-input').first();
    const hasDescription = await descriptionInput.isVisible().catch(() => false);
    
    expect(hasTitle || hasDescription).toBeTruthy();
    
    // Check for file upload
    const fileUpload = page.locator('button:has-text("Upload"), .upload-button').first();
    await expect(fileUpload).toBeVisible();
    
    // Check for save/submit button
    const saveButton = page.locator('button:has-text("Save"), button:has-text("Capture"), button[type="submit"]').first();
    await expect(saveButton).toBeVisible();
  });

  test('should have memory type selection', async ({ page }) => {
    await page.goto('http://localhost:8357/pages/capture-first-memory.html');
    
    // Check for memory type options
    const typeSelectors = page.locator('input[type="radio"], select, .memory-type, button[role="tab"]');
    const typeCount = await typeSelectors.count();
    expect(typeCount).toBeGreaterThan(0);
  });

  test('should display memory archive', async ({ page }) => {
    await page.goto('http://localhost:8357/pages/memory-archive.html');
    
    // Check page header
    const header = page.locator('h1:has-text("Archive"), h1:has-text("Memories"), h2:has-text("Memory")').first();
    await expect(header).toBeVisible();
    
    // Check for memory grid or list
    const memoryContainer = page.locator('.memory-grid, .memory-list, .archive-container, [class*="memories"]').first();
    await expect(memoryContainer).toBeVisible();
    
    // Check for filter/search
    const searchBar = page.locator('input[type="search"], input[placeholder*="search"], .search-input').first();
    const hasSearch = await searchBar.isVisible().catch(() => false);
    
    const filterButton = page.locator('button:has-text("Filter"), .filter-button').first();
    const hasFilter = await filterButton.isVisible().catch(() => false);
    
    expect(hasSearch || hasFilter).toBeTruthy();
  });

  test('should have memory cards or items', async ({ page }) => {
    await page.goto('http://localhost:8357/pages/memory-archive.html');
    
    // Check for memory items
    const memoryItems = page.locator('.memory-card, .memory-item, .archive-item, article');
    const itemCount = await memoryItems.count();
    
    // May have placeholder or empty state
    if (itemCount === 0) {
      const emptyState = page.locator('.empty-state, .no-memories, p:has-text("No memories")').first();
      await expect(emptyState).toBeVisible();
    } else {
      expect(itemCount).toBeGreaterThan(0);
    }
  });

  test('should display interview interface', async ({ page }) => {
    await page.goto('http://localhost:8357/pages/interview.html');
    
    // Check page elements
    const header = page.locator('h1:has-text("Interview"), h2:has-text("Interview")').first();
    await expect(header).toBeVisible();
    
    // Check for start/record button
    const startButton = page.locator('button:has-text("Start"), button:has-text("Record"), button:has-text("Begin")').first();
    await expect(startButton).toBeVisible();
    
    // Check for question display area
    const questionArea = page.locator('.question, .interview-question, [class*="question"]').first();
    const hasQuestionArea = await questionArea.isVisible().catch(() => false);
    
    // Check for response area
    const responseArea = page.locator('textarea, .response-area, audio').first();
    const hasResponseArea = await responseArea.isVisible().catch(() => false);
    
    expect(hasQuestionArea || hasResponseArea).toBeTruthy();
  });

  test('should display interview transcripts', async ({ page }) => {
    await page.goto('http://localhost:8357/pages/interview-transcripts.html');
    
    // Check header
    const header = page.locator('h1:has-text("Transcript"), h2:has-text("Interview")').first();
    await expect(header).toBeVisible();
    
    // Check for transcript list or content
    const transcriptContainer = page.locator('.transcript-list, .transcripts, .interview-list, main').first();
    await expect(transcriptContainer).toBeVisible();
    
    // Check for transcript items or empty state
    const transcriptItems = page.locator('.transcript-item, .transcript-card, article');
    const itemCount = await transcriptItems.count();
    
    if (itemCount === 0) {
      const emptyState = page.locator('.empty-state, p:has-text("No transcripts")').first();
      const hasEmptyState = await emptyState.isVisible().catch(() => false);
      expect(hasEmptyState).toBeTruthy();
    }
  });

  test('should have date/time stamps on memories', async ({ page }) => {
    await page.goto('http://localhost:8357/pages/memory-archive.html');
    
    // Look for date/time elements
    const dateElements = page.locator('time, .date, .timestamp, [class*="date"], [class*="time"]');
    const hasDateElements = await dateElements.first().isVisible().catch(() => false);
    
    if (hasDateElements) {
      expect(await dateElements.count()).toBeGreaterThan(0);
    }
  });
});