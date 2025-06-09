# Test info

- Name: Dashboard Category Tiles Edge Cases >> should handle widget container resizing
- Location: /home/tim/WebsitePrototype/playwright-testing/tests/dashboard-category-tiles-edge-cases.spec.js:186:3

# Error details

```
Error: expect(received).toContain(expected) // indexOf

Expected substring: "1fr"
Received string:    "309.967px"
    at /home/tim/WebsitePrototype/playwright-testing/tests/dashboard-category-tiles-edge-cases.spec.js:214:50
```

# Page snapshot

```yaml
- navigation:
  - link "🏠 Dashboard":
    - /url: dashboard.html
  - link "📚 My Memories":
    - /url: memory-archive.html
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
    - /url: file-browser.html
  - link "⚙️ Settings":
    - /url: settings.html
- banner:
  - text: G
  - heading "Guest User" [level=1]
  - paragraph: guest@example.com
  - button "Notifications": 🔔
- main:
  - textbox "Search nodes..."
  - text: "Filters:"
  - button "👤 Person"
  - button "📅 Event"
  - button "📍 Place"
  - button "📷 Memory"
  - button "Clear All"
  - img: Y📅📷📍🏢
  - text: ACTIVE QUEUE No active operations DATA OPERATIONS
  - button "🗑️ Delete Selected" [disabled]
  - button "📥 Export Data"
  - button "🧹 Clear All"
  - text: HISTORY
  - button "Clear"
  - text: "Nodes: 5 • Edges: 5 Drag to pan • Scroll to zoom • Click to select 0 📷"
  - heading "Recent Memories" [level=3]
  - paragraph: Last 7 days
  - text: 0 ✨
  - heading "Key Moments" [level=3]
  - paragraph: Life highlights
  - text: 0 👥
  - heading "People" [level=3]
  - paragraph: Connections
  - text: 0 📍
  - heading "Places" [level=3]
  - paragraph: Locations visited
  - text: 0 🚀
  - heading "Projects" [level=3]
  - paragraph: Achievements
  - text: 0 💡
  - heading "Insights" [level=3]
  - paragraph: Patterns & themes
- button "Add new memory": +
```

# Test source

```ts
  114 |       expect(number).toBeLessThanOrEqual(999);
  115 |     }
  116 |   });
  117 |
  118 |   test('should maintain tile hover states', async ({ page }) => {
  119 |     const tiles = page.locator('.category-tile');
  120 |     const tileCount = await tiles.count();
  121 |     
  122 |     if (tileCount > 0) {
  123 |       const firstTile = tiles.first();
  124 |       
  125 |       // Get initial styles
  126 |       const initialStyles = await firstTile.evaluate(el => {
  127 |         const styles = window.getComputedStyle(el);
  128 |         return {
  129 |           transform: styles.transform,
  130 |           boxShadow: styles.boxShadow,
  131 |           cursor: styles.cursor
  132 |         };
  133 |       });
  134 |       
  135 |       // Hover
  136 |       await firstTile.hover();
  137 |       await page.waitForTimeout(100);
  138 |       
  139 |       // Get hover styles
  140 |       const hoverStyles = await firstTile.evaluate(el => {
  141 |         const styles = window.getComputedStyle(el);
  142 |         return {
  143 |           transform: styles.transform,
  144 |           boxShadow: styles.boxShadow,
  145 |           cursor: styles.cursor
  146 |         };
  147 |       });
  148 |       
  149 |       // Should have pointer cursor at minimum
  150 |       expect(hoverStyles.cursor).toBe('pointer');
  151 |       
  152 |       // Move away
  153 |       await page.mouse.move(0, 0);
  154 |     }
  155 |   });
  156 |
  157 |   test('should handle floating action button interactions', async ({ page }) => {
  158 |     const fab = page.locator('#addMemoryBtn');
  159 |     
  160 |     if (await fab.isVisible()) {
  161 |       // Test rapid clicks
  162 |       for (let i = 0; i < 3; i++) {
  163 |         await fab.click();
  164 |         await page.waitForTimeout(100);
  165 |       }
  166 |       
  167 |       // FAB should still be functional
  168 |       await expect(fab).toBeVisible();
  169 |       
  170 |       // Test hover state
  171 |       await fab.hover();
  172 |       
  173 |       const fabStyles = await fab.evaluate(el => {
  174 |         const styles = window.getComputedStyle(el);
  175 |         return {
  176 |           transform: styles.transform,
  177 |           boxShadow: styles.boxShadow
  178 |         };
  179 |       });
  180 |       
  181 |       // Should have some styling
  182 |       expect(fabStyles.transform || fabStyles.boxShadow).toBeTruthy();
  183 |     }
  184 |   });
  185 |
  186 |   test('should handle widget container resizing', async ({ page }) => {
  187 |     // Test different viewport sizes
  188 |     const viewports = [
  189 |       { width: 1920, height: 1080 }, // Desktop
  190 |       { width: 768, height: 1024 }, // Tablet
  191 |       { width: 375, height: 667 }, // Mobile
  192 |     ];
  193 |     
  194 |     for (const viewport of viewports) {
  195 |       await page.setViewportSize(viewport);
  196 |       await page.waitForTimeout(300);
  197 |       
  198 |       // Check widgets grid adapts
  199 |       const widgetsGrid = page.locator('.widgets-grid');
  200 |       if (await widgetsGrid.isVisible()) {
  201 |         const gridStyles = await widgetsGrid.evaluate(el => {
  202 |           const styles = window.getComputedStyle(el);
  203 |           return {
  204 |             gridTemplateColumns: styles.gridTemplateColumns,
  205 |             gap: styles.gap
  206 |           };
  207 |         });
  208 |         
  209 |         // Should have grid styles
  210 |         expect(gridStyles.gridTemplateColumns).toBeTruthy();
  211 |         
  212 |         // On mobile, should be single column
  213 |         if (viewport.width < 768) {
> 214 |           expect(gridStyles.gridTemplateColumns).toContain('1fr');
      |                                                  ^ Error: expect(received).toContain(expected) // indexOf
  215 |         }
  216 |       }
  217 |     }
  218 |   });
  219 |
  220 |   test('should handle Neo4j graph container interactions', async ({ page }) => {
  221 |     const graphContainer = page.locator('#neo4j-graph-container');
  222 |     
  223 |     if (await graphContainer.isVisible()) {
  224 |       // Test clicking on graph area
  225 |       await graphContainer.click({ position: { x: 100, y: 100 } });
  226 |       await graphContainer.click({ position: { x: 200, y: 200 } });
  227 |       
  228 |       // Test dragging
  229 |       await page.mouse.move(150, 150);
  230 |       await page.mouse.down();
  231 |       await page.mouse.move(250, 250);
  232 |       await page.mouse.up();
  233 |       
  234 |       // Container should remain stable
  235 |       await expect(graphContainer).toBeVisible();
  236 |       
  237 |       const containerBox = await graphContainer.boundingBox();
  238 |       expect(containerBox.height).toBe(450); // Height should remain as specified
  239 |     }
  240 |   });
  241 |
  242 |   test('should handle notification button badge updates', async ({ page }) => {
  243 |     const notificationBtn = page.locator('.notification-btn');
  244 |     
  245 |     if (await notificationBtn.isVisible()) {
  246 |       // Simulate badge updates
  247 |       await page.evaluate(() => {
  248 |         const btn = document.querySelector('.notification-btn');
  249 |         if (btn) {
  250 |           // Add a badge
  251 |           const badge = document.createElement('span');
  252 |           badge.className = 'notification-badge';
  253 |           badge.textContent = '99+';
  254 |           btn.appendChild(badge);
  255 |         }
  256 |       });
  257 |       
  258 |       // Click notification button
  259 |       await notificationBtn.click();
  260 |       
  261 |       // Should handle click without errors
  262 |       await expect(notificationBtn).toBeVisible();
  263 |     }
  264 |   });
  265 |
  266 |   test('should handle empty state for all categories', async ({ page }) => {
  267 |     // Set all counts to 0
  268 |     const categoryIds = ['recentCount', 'momentsCount', 'peopleCount', 'placesCount', 'projectsCount', 'insightsCount'];
  269 |     
  270 |     for (const id of categoryIds) {
  271 |       await page.evaluate((elementId) => {
  272 |         const element = document.getElementById(elementId);
  273 |         if (element) {
  274 |           element.textContent = '0';
  275 |         }
  276 |       }, id);
  277 |     }
  278 |     
  279 |     // Click on empty category tiles
  280 |     const tiles = page.locator('.category-tile');
  281 |     const tileCount = await tiles.count();
  282 |     
  283 |     for (let i = 0; i < Math.min(tileCount, 3); i++) {
  284 |       await tiles.nth(i).click();
  285 |       await page.waitForTimeout(100);
  286 |     }
  287 |     
  288 |     // Should handle empty states gracefully
  289 |     await expect(page.locator('.symphony-dashboard')).toBeVisible();
  290 |   });
  291 | });
```