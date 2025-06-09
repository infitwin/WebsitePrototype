# Test info

- Name: Curator Empty Response Handling >> should show error for network failures
- Location: /home/tim/WebsitePrototype/playwright-testing/tests/curator-empty-response.spec.js:188:3

# Error details

```
Error: expect(received).toContain(expected) // indexOf

Expected substring: "error"
Received string:    "
        Failed to initialize services. Interview cannot start.
    "
    at /home/tim/WebsitePrototype/playwright-testing/tests/curator-empty-response.spec.js:209:25
```

# Page snapshot

```yaml
- navigation:
  - link "← Dashboard":
    - /url: ../dashboard.html
  - heading "Memory Curator with Winston" [level=1]
  - button "Save & Exit"
  - button "Interviews"
  - button "New Interview"
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
- text: "Nodes: 5 • Edges: 5 Drag to pan • Scroll to zoom • Click to select"
- button "≡ Interview Manager"
- button "|| Stop Session"
- text: ↑ Click to expand chat
- heading "Current Question:" [level=3]
- paragraph: What's your earliest childhood memory that still brings you joy?
- text: 🎩 Hello! I'm Winston, your story curator. I'm here to help you capture and organize your precious memories. What would you like to talk about today? Test message during offline 🎩 Thank you for sharing that. How did this experience shape who you are today?
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
- text: Failed to initialize services. Interview cannot start.
```

# Test source

```ts
  109 |     // The textarea should accept the full message (no built-in limit detected)
  110 |     expect(actualValue.length).toBeGreaterThan(0);
  111 |     
  112 |     // Try to send it
  113 |     await messageInput.press('Enter');
  114 |     await page.waitForTimeout(1000);
  115 |     
  116 |     // If message was sent, verify it appears
  117 |     const userMessages = page.locator('.message.user-message');
  118 |     if (await userMessages.count() > 0) {
  119 |       const lastMessage = userMessages.last();
  120 |       const messageText = await lastMessage.locator('.message-content').textContent();
  121 |       expect(messageText).toBeTruthy();
  122 |     }
  123 |   });
  124 |
  125 |   test('should handle special characters in messages', async ({ page }) => {
  126 |     const messageInput = page.locator('#messageInput');
  127 |     const specialChars = '<script>alert("test")</script>!@#$%^&*(){}[]|\\:;"\'<>,.?/~`';
  128 |     
  129 |     // Type message with special characters
  130 |     await messageInput.fill(specialChars);
  131 |     await messageInput.press('Enter');
  132 |     
  133 |     // Wait for message to appear
  134 |     await page.waitForTimeout(1000);
  135 |     
  136 |     // Verify the message appears properly escaped
  137 |     const userMessages = page.locator('.message.user-message');
  138 |     if (await userMessages.count() > 0) {
  139 |       const lastMessage = userMessages.last();
  140 |       const messageText = await lastMessage.locator('.message-content').textContent();
  141 |       
  142 |       // Check that script tags are not executed (properly escaped)
  143 |       expect(messageText).toContain('script');
  144 |       
  145 |       // Verify no alert was triggered
  146 |       const alertPromise = page.waitForEvent('dialog', { timeout: 1000 }).catch(() => null);
  147 |       const alert = await alertPromise;
  148 |       expect(alert).toBeNull();
  149 |     }
  150 |   });
  151 |
  152 |   test('should maintain focus after sending message', async ({ page }) => {
  153 |     const messageInput = page.locator('#messageInput');
  154 |     
  155 |     // Type and send message
  156 |     await messageInput.fill('Test message');
  157 |     await messageInput.press('Enter');
  158 |     
  159 |     // Wait for processing
  160 |     await page.waitForTimeout(1000);
  161 |     
  162 |     // Check if input still has focus
  163 |     const isFocused = await messageInput.evaluate(el => document.activeElement === el);
  164 |     expect(isFocused).toBe(true);
  165 |   });
  166 |
  167 |   test('should handle textarea resize with multiple lines', async ({ page }) => {
  168 |     const messageInput = page.locator('#messageInput');
  169 |     
  170 |     // Type multi-line message
  171 |     await messageInput.fill('Line 1\nLine 2\nLine 3\nLine 4');
  172 |     
  173 |     // Get the height to ensure it expanded
  174 |     const height = await messageInput.evaluate(el => el.scrollHeight);
  175 |     expect(height).toBeGreaterThan(50); // Should be taller than single line
  176 |     
  177 |     // Send the message
  178 |     await messageInput.press('Control+Enter'); // Try Ctrl+Enter for multi-line
  179 |     await page.waitForTimeout(500);
  180 |     
  181 |     // If not sent, try regular Enter
  182 |     const inputValue = await messageInput.inputValue();
  183 |     if (inputValue) {
  184 |       await messageInput.press('Enter');
  185 |     }
  186 |   });
  187 |
  188 |   test('should show error for network failures', async ({ page }) => {
  189 |     // Simulate network failure by going offline
  190 |     await page.context().setOffline(true);
  191 |     
  192 |     const messageInput = page.locator('#messageInput');
  193 |     await messageInput.fill('Test message during offline');
  194 |     await messageInput.press('Enter');
  195 |     
  196 |     // Wait for error handling
  197 |     await page.waitForTimeout(2000);
  198 |     
  199 |     // Look for error toast or message
  200 |     const errorToast = page.locator('.toast.error');
  201 |     const isErrorVisible = await errorToast.isVisible().catch(() => false);
  202 |     
  203 |     // Re-enable network
  204 |     await page.context().setOffline(false);
  205 |     
  206 |     // Either an error should show or message should be queued
  207 |     if (isErrorVisible) {
  208 |       const errorText = await errorToast.textContent();
> 209 |       expect(errorText).toContain('error');
      |                         ^ Error: expect(received).toContain(expected) // indexOf
  210 |     }
  211 |   });
  212 | });
```