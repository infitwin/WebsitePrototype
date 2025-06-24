# Test info

- Name: Neo4j Data Push Test >> should successfully push test data to Neo4j
- Location: /home/tim/WebsitePrototype/playwright-testing/tests/neo4j-data-push.spec.js:4:3

# Error details

```
Error: expect(received).toMatch(expected)

Expected pattern: /(Successfully generated|Failed to generate|Failed to connect)/
Received string:  ""
    at /home/tim/WebsitePrototype/playwright-testing/tests/neo4j-data-push.spec.js:41:24
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
  - link "🧪 Sandbox":
    - /url: sandbox.html
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
  - link "🛠️ Admin":
    - /url: admin-test-data.html
  - text: 👤 User Menu
  - link "🚪 Logout":
    - /url: auth.html
- heading "🛠️ Admin - Test Data Generator" [level=1]
- img
- strong: "Admin Area:"
- text: This page generates test data in Neo4j. Use with caution!
- heading "Current User" [level=3]
- paragraph: weezer@yev.com
- heading "Twin ID" [level=3]
- paragraph: No twin selected
- heading "Environment" [level=3]
- paragraph: Development
- heading "Generate Test Data" [level=2]:
  - img
  - text: Generate Test Data
- heading "Small Graph" [level=3]
- paragraph: Quick test dataset
- text: • 10-15 nodes • 15-20 relationships • ~5 seconds
- heading "Medium Graph" [level=3]
- paragraph: Standard test dataset
- text: • 50-75 nodes • 100-150 relationships • ~30 seconds
- heading "Large Graph" [level=3]
- paragraph: Stress test dataset
- text: • 200-300 nodes • 500-750 relationships • ~2 minutes
- button "Generate Test Data":
  - img
  - text: Generate Test Data
- button "Clear All Data":
  - img
  - text: Clear All Data
- text: "Failed to generate test data: Failed to connect to Neo4j"
- heading "Activity Logs" [level=2]
- text: "Waiting for action... [1:17:01 PM] User authenticated: weezer@yev.com [1:17:01 PM] Selected small graph size [1:17:01 PM] Starting small test data generation... [1:17:01 PM] User: zsvLTeIPJUYGnZHzWX7hVtLJlJX2, Twin: null [1:17:01 PM] Neo4j URI: neo4j://80dc1193.databases.neo4j.io [1:17:01 PM] 🔗 Connecting to Neo4j... [1:17:01 PM] URI: neo4j://80dc1193.databases.neo4j.io [1:17:01 PM] Username: neo4j [1:17:01 PM] Driver created, testing connection... [1:17:01 PM] ❌ Neo4j connection failed: Could not perform discovery. No routing servers available. Known routing table: RoutingTable[database=default database, expirationTime=0, currentTime=1750785421386, routers=[], readers=[], writers=[]] [1:17:01 PM] Generation failed: Failed to connect to Neo4j [1:17:01 PM] Error stack: Error: Failed to connect to Neo4j at generateTestDataInNeo4j (http://localhost:8357/pages/admin-test-data.html:694:23) at async HTMLButtonElement.<anonymous> (http://localhost:8357/pages/admin-test-data.html:634:34)"
```

# Test source

```ts
   1 | const { test, expect } = require('@playwright/test');
   2 |
   3 | test.describe('Neo4j Data Push Test', () => {
   4 |   test('should successfully push test data to Neo4j', async ({ page }) => {
   5 |     // Login
   6 |     await page.goto('http://localhost:8357/pages/auth.html');
   7 |     await page.click('[data-tab="login"]');
   8 |     await page.fill('.login-email', 'weezer@yev.com');
   9 |     await page.fill('.login-password', '123456');
  10 |     await page.click('button:has-text("Access Your Memories")');
  11 |     await page.waitForURL('**/dashboard.html');
  12 |     
  13 |     // Go to admin page
  14 |     await page.goto('http://localhost:8357/pages/admin-test-data.html');
  15 |     
  16 |     // Wait for page to load
  17 |     await page.waitForSelector('#generateBtn');
  18 |     
  19 |     // Select small test data
  20 |     await page.click('.size-option[data-size="small"]');
  21 |     
  22 |     // Click generate
  23 |     await page.click('#generateBtn');
  24 |     
  25 |     // Wait for either success or failure (max 60 seconds)
  26 |     await page.waitForFunction(() => {
  27 |       const statusMessage = document.getElementById('statusMessage');
  28 |       return statusMessage && statusMessage.style.display !== 'none';
  29 |     }, { timeout: 60000 });
  30 |     
  31 |     // Check the result
  32 |     const statusText = await page.locator('#statusMessage').textContent();
  33 |     const logsText = await page.locator('#logsContainer').textContent();
  34 |     
  35 |     console.log('Status Message:', statusText);
  36 |     console.log('Connection Logs:', logsText);
  37 |     
  38 |     // Test passes if we either:
  39 |     // 1. Successfully generated data, OR
  40 |     // 2. Got a connection error (which shows we tried to connect)
> 41 |     expect(statusText).toMatch(/(Successfully generated|Failed to generate|Failed to connect)/);
     |                        ^ Error: expect(received).toMatch(expected)
  42 |     
  43 |     // If successful, should show node/relationship counts
  44 |     if (statusText.includes('Successfully generated')) {
  45 |       expect(logsText).toMatch(/Generated \d+ nodes and \d+ relationships/);
  46 |       expect(logsText).toContain('Generation complete');
  47 |     }
  48 |   });
  49 | });
```