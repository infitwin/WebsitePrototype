const { chromium, firefox, webkit } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

// Test configuration
const TEST_CONFIG = {
    baseUrl: 'http://localhost:8765',
    browsers: ['chromium', 'firefox', 'webkit'],
    pages: [
        { name: 'index', path: '/index.html', title: 'Infitwin - Capture Your Life Story' },
        { name: 'auth', path: '/pages/auth.html', title: 'Sign In - Infitwin' },
        { name: 'dashboard', path: '/pages/dashboard.html', title: 'Dashboard - Infitwin' }
    ],
    viewports: [
        { name: 'desktop', width: 1920, height: 1080 },
        { name: 'mobile', width: 390, height: 844 }
    ],
    interactiveTests: {
        auth: async (page) => {
            // Test tab switching
            const signUpTab = await page.locator('button:has-text("Sign Up")');
            if (await signUpTab.isVisible()) {
                await signUpTab.click();
                await page.waitForTimeout(500);
                const signUpForm = await page.locator('#signup-form').isVisible();
                return { tabSwitching: signUpForm };
            }
            return { tabSwitching: false };
        },
        dashboard: async (page) => {
            // Test button hover states
            const buttons = await page.locator('.dashboard-btn').all();
            const hoverTests = [];
            
            for (let i = 0; i < Math.min(3, buttons.length); i++) {
                const button = buttons[i];
                const beforeColor = await button.evaluate(el => 
                    window.getComputedStyle(el).backgroundColor
                );
                await button.hover();
                await page.waitForTimeout(100);
                const afterColor = await button.evaluate(el => 
                    window.getComputedStyle(el).backgroundColor
                );
                hoverTests.push({
                    index: i,
                    changed: beforeColor !== afterColor
                });
            }
            
            return { buttonHovers: hoverTests };
        }
    }
};

// Browser compatibility matrix
const compatibilityMatrix = {
    features: {},
    visualDifferences: {},
    performanceMetrics: {},
    errors: {},
    issues: []
};

// Helper function to launch browser
async function launchBrowser(browserType) {
    const browsers = {
        chromium: chromium,
        firefox: firefox,
        webkit: webkit
    };
    
    return await browsers[browserType].launch({
        headless: true
    });
}

// Test page loading and basic functionality
async function testPage(browser, browserName, page, viewport) {
    const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        ignoreHTTPSErrors: true
    });
    
    const browserPage = await context.newPage();
    const results = {
        loaded: false,
        title: '',
        loadTime: 0,
        jsErrors: [],
        consoleErrors: [],
        screenshot: null,
        interactiveTests: {}
    };
    
    // Capture console errors
    browserPage.on('console', msg => {
        if (msg.type() === 'error') {
            results.consoleErrors.push(msg.text());
        }
    });
    
    // Capture page errors
    browserPage.on('pageerror', error => {
        results.jsErrors.push(error.toString());
    });
    
    try {
        const startTime = Date.now();
        
        // Navigate to page
        const response = await browserPage.goto(`${TEST_CONFIG.baseUrl}${page.path}`, {
            waitUntil: 'networkidle',
            timeout: 30000
        });
        
        results.loaded = response.ok();
        results.loadTime = Date.now() - startTime;
        
        // Wait for page to stabilize
        await browserPage.waitForTimeout(1000);
        
        // Get page title
        results.title = await browserPage.title();
        
        // Take screenshot
        const screenshotDir = `cross-browser-results/${browserName}/${viewport.name}`;
        await fs.mkdir(screenshotDir, { recursive: true });
        
        const screenshotPath = path.join(screenshotDir, `${page.name}.png`);
        await browserPage.screenshot({ 
            path: screenshotPath,
            fullPage: true 
        });
        results.screenshot = screenshotPath;
        
        // Run interactive tests if available
        if (TEST_CONFIG.interactiveTests[page.name]) {
            try {
                results.interactiveTests = await TEST_CONFIG.interactiveTests[page.name](browserPage);
            } catch (error) {
                results.interactiveTests = { error: error.toString() };
            }
        }
        
        // Check for common CSS issues
        const cssIssues = await browserPage.evaluate(() => {
            const issues = [];
            
            // Check for missing fonts
            const computedStyles = window.getComputedStyle(document.body);
            const fontFamily = computedStyles.fontFamily;
            if (fontFamily.includes('Times') || fontFamily.includes('serif')) {
                issues.push('Default serif font detected - custom fonts may not be loading');
            }
            
            // Check for layout overflow
            if (document.body.scrollWidth > window.innerWidth) {
                issues.push('Horizontal scroll detected - possible layout overflow');
            }
            
            // Check for broken images
            const images = document.querySelectorAll('img');
            images.forEach(img => {
                if (!img.complete || img.naturalWidth === 0) {
                    issues.push(`Broken image: ${img.src}`);
                }
            });
            
            return issues;
        });
        
        if (cssIssues.length > 0) {
            results.cssIssues = cssIssues;
        }
        
    } catch (error) {
        results.error = error.toString();
    } finally {
        await context.close();
    }
    
    return results;
}

// Compare results across browsers
function analyzeResults(allResults) {
    // Check feature compatibility
    for (const page of TEST_CONFIG.pages) {
        compatibilityMatrix.features[page.name] = {};
        
        for (const viewport of TEST_CONFIG.viewports) {
            const viewportKey = `${page.name}_${viewport.name}`;
            compatibilityMatrix.features[page.name][viewport.name] = {};
            
            // Check if page loads in all browsers
            const loadResults = {};
            for (const browser of TEST_CONFIG.browsers) {
                const result = allResults[browser][viewportKey];
                loadResults[browser] = result.loaded && !result.error;
            }
            compatibilityMatrix.features[page.name][viewport.name].loads = loadResults;
            
            // Check for JavaScript errors
            const jsErrorResults = {};
            for (const browser of TEST_CONFIG.browsers) {
                const result = allResults[browser][viewportKey];
                jsErrorResults[browser] = result.jsErrors.length === 0 && result.consoleErrors.length === 0;
            }
            compatibilityMatrix.features[page.name][viewport.name].noJsErrors = jsErrorResults;
            
            // Compare load times
            const loadTimes = {};
            for (const browser of TEST_CONFIG.browsers) {
                const result = allResults[browser][viewportKey];
                loadTimes[browser] = result.loadTime;
            }
            compatibilityMatrix.performanceMetrics[viewportKey] = loadTimes;
            
            // Collect all errors
            for (const browser of TEST_CONFIG.browsers) {
                const result = allResults[browser][viewportKey];
                if (result.jsErrors.length > 0 || result.consoleErrors.length > 0) {
                    if (!compatibilityMatrix.errors[viewportKey]) {
                        compatibilityMatrix.errors[viewportKey] = {};
                    }
                    compatibilityMatrix.errors[viewportKey][browser] = {
                        jsErrors: result.jsErrors,
                        consoleErrors: result.consoleErrors
                    };
                }
                
                // Record CSS issues
                if (result.cssIssues && result.cssIssues.length > 0) {
                    compatibilityMatrix.issues.push({
                        page: page.name,
                        viewport: viewport.name,
                        browser: browser,
                        type: 'css',
                        issues: result.cssIssues
                    });
                }
            }
        }
    }
    
    // Analyze interactive test results
    for (const page of TEST_CONFIG.pages) {
        if (TEST_CONFIG.interactiveTests[page.name]) {
            for (const viewport of TEST_CONFIG.viewports) {
                const viewportKey = `${page.name}_${viewport.name}`;
                const interactiveResults = {};
                
                for (const browser of TEST_CONFIG.browsers) {
                    const result = allResults[browser][viewportKey];
                    if (result.interactiveTests && !result.interactiveTests.error) {
                        interactiveResults[browser] = result.interactiveTests;
                    }
                }
                
                if (Object.keys(interactiveResults).length > 0) {
                    if (!compatibilityMatrix.features[page.name][viewport.name].interactive) {
                        compatibilityMatrix.features[page.name][viewport.name].interactive = {};
                    }
                    compatibilityMatrix.features[page.name][viewport.name].interactive = interactiveResults;
                }
            }
        }
    }
    
    return compatibilityMatrix;
}

// Generate HTML report
async function generateReport(matrix, allResults) {
    const reportHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cross-Browser Compatibility Report - Infitwin</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1400px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }
        
        h1, h2, h3 {
            color: #2c3e50;
        }
        
        .summary {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            margin-bottom: 30px;
        }
        
        .compatibility-table {
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            margin-bottom: 30px;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
        }
        
        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #e0e0e0;
        }
        
        th {
            background: #34495e;
            color: white;
            font-weight: 600;
        }
        
        tr:hover {
            background: #f8f9fa;
        }
        
        .pass {
            color: #27ae60;
            font-weight: 600;
        }
        
        .fail {
            color: #e74c3c;
            font-weight: 600;
        }
        
        .warning {
            color: #f39c12;
            font-weight: 600;
        }
        
        .browser-icon {
            display: inline-block;
            width: 20px;
            height: 20px;
            margin-right: 8px;
            vertical-align: middle;
        }
        
        .performance-bar {
            background: #ecf0f1;
            height: 20px;
            border-radius: 10px;
            overflow: hidden;
            position: relative;
            margin: 5px 0;
        }
        
        .performance-fill {
            background: #3498db;
            height: 100%;
            transition: width 0.3s ease;
        }
        
        .screenshot-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }
        
        .screenshot-item {
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .screenshot-item img {
            width: 100%;
            height: auto;
            display: block;
        }
        
        .screenshot-label {
            padding: 10px;
            background: #f8f9fa;
            font-weight: 600;
            text-align: center;
        }
        
        .issues-section {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        
        .issue-item {
            background: white;
            padding: 15px;
            margin: 10px 0;
            border-radius: 5px;
            border-left: 4px solid #f39c12;
        }
        
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }
        
        .metric-card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            text-align: center;
        }
        
        .metric-value {
            font-size: 2em;
            font-weight: bold;
            color: #3498db;
        }
        
        .metric-label {
            color: #7f8c8d;
            margin-top: 5px;
        }
        
        code {
            background: #f4f4f4;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
        }
        
        .error-details {
            background: #fee;
            border: 1px solid #fcc;
            border-radius: 5px;
            padding: 10px;
            margin: 5px 0;
            font-family: monospace;
            font-size: 0.9em;
            white-space: pre-wrap;
        }
    </style>
</head>
<body>
    <h1>Cross-Browser Compatibility Report</h1>
    <p class="test-date">Generated on: ${new Date().toLocaleString()}</p>
    
    <div class="summary">
        <h2>Executive Summary</h2>
        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-value">${TEST_CONFIG.browsers.length}</div>
                <div class="metric-label">Browsers Tested</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${TEST_CONFIG.pages.length}</div>
                <div class="metric-label">Pages Tested</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${TEST_CONFIG.viewports.length}</div>
                <div class="metric-label">Viewports</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${matrix.issues.length}</div>
                <div class="metric-label">Issues Found</div>
            </div>
        </div>
    </div>
    
    <div class="compatibility-table">
        <h2>Browser Compatibility Matrix</h2>
        <table>
            <thead>
                <tr>
                    <th>Page</th>
                    <th>Viewport</th>
                    <th>Feature</th>
                    <th>Chromium</th>
                    <th>Firefox</th>
                    <th>WebKit (Safari)</th>
                </tr>
            </thead>
            <tbody>
                ${generateCompatibilityRows(matrix)}
            </tbody>
        </table>
    </div>
    
    <div class="compatibility-table">
        <h2>Performance Metrics (Load Time in ms)</h2>
        <table>
            <thead>
                <tr>
                    <th>Page</th>
                    <th>Viewport</th>
                    <th>Chromium</th>
                    <th>Firefox</th>
                    <th>WebKit (Safari)</th>
                </tr>
            </thead>
            <tbody>
                ${generatePerformanceRows(matrix)}
            </tbody>
        </table>
    </div>
    
    ${matrix.issues.length > 0 ? generateIssuesSection(matrix) : ''}
    
    ${Object.keys(matrix.errors).length > 0 ? generateErrorsSection(matrix) : ''}
    
    <div class="screenshot-section">
        <h2>Visual Comparison</h2>
        ${generateScreenshotGrid()}
    </div>
    
    <div class="recommendations">
        <h2>Recommendations</h2>
        ${generateRecommendations(matrix, allResults)}
    </div>
</body>
</html>`;
    
    await fs.writeFile('cross-browser-results/compatibility-report.html', reportHtml);
    return 'cross-browser-results/compatibility-report.html';
}

// Helper function to generate compatibility table rows
function generateCompatibilityRows(matrix) {
    let rows = '';
    
    for (const page of TEST_CONFIG.pages) {
        for (const viewport of TEST_CONFIG.viewports) {
            const features = matrix.features[page.name][viewport.name];
            
            // Page loading row
            rows += `
                <tr>
                    <td>${page.name}</td>
                    <td>${viewport.name}</td>
                    <td>Page Loads</td>
                    <td class="${features.loads.chromium ? 'pass' : 'fail'}">${features.loads.chromium ? '✓ Pass' : '✗ Fail'}</td>
                    <td class="${features.loads.firefox ? 'pass' : 'fail'}">${features.loads.firefox ? '✓ Pass' : '✗ Fail'}</td>
                    <td class="${features.loads.webkit ? 'pass' : 'fail'}">${features.loads.webkit ? '✓ Pass' : '✗ Fail'}</td>
                </tr>
            `;
            
            // JavaScript errors row
            rows += `
                <tr>
                    <td>${page.name}</td>
                    <td>${viewport.name}</td>
                    <td>No JS Errors</td>
                    <td class="${features.noJsErrors.chromium ? 'pass' : 'fail'}">${features.noJsErrors.chromium ? '✓ Pass' : '✗ Fail'}</td>
                    <td class="${features.noJsErrors.firefox ? 'pass' : 'fail'}">${features.noJsErrors.firefox ? '✓ Pass' : '✗ Fail'}</td>
                    <td class="${features.noJsErrors.webkit ? 'pass' : 'fail'}">${features.noJsErrors.webkit ? '✓ Pass' : '✗ Fail'}</td>
                </tr>
            `;
            
            // Interactive features if available
            if (features.interactive && Object.keys(features.interactive).length > 0) {
                const firstBrowser = Object.keys(features.interactive)[0];
                const interactiveTests = features.interactive[firstBrowser];
                
                for (const [testName, testResult] of Object.entries(interactiveTests)) {
                    rows += `
                        <tr>
                            <td>${page.name}</td>
                            <td>${viewport.name}</td>
                            <td>${testName}</td>
                    `;
                    
                    for (const browser of TEST_CONFIG.browsers) {
                        if (features.interactive[browser] && features.interactive[browser][testName] !== undefined) {
                            const result = features.interactive[browser][testName];
                            const passed = Array.isArray(result) ? result.every(r => r.changed) : result;
                            rows += `<td class="${passed ? 'pass' : 'warning'}">${passed ? '✓ Works' : '⚠ Partial'}</td>`;
                        } else {
                            rows += `<td class="warning">⚠ N/A</td>`;
                        }
                    }
                    
                    rows += '</tr>';
                }
            }
        }
    }
    
    return rows;
}

// Helper function to generate performance rows
function generatePerformanceRows(matrix) {
    let rows = '';
    
    for (const page of TEST_CONFIG.pages) {
        for (const viewport of TEST_CONFIG.viewports) {
            const key = `${page.name}_${viewport.name}`;
            const metrics = matrix.performanceMetrics[key];
            
            if (metrics) {
                rows += `
                    <tr>
                        <td>${page.name}</td>
                        <td>${viewport.name}</td>
                        <td>${metrics.chromium || 'N/A'}</td>
                        <td>${metrics.firefox || 'N/A'}</td>
                        <td>${metrics.webkit || 'N/A'}</td>
                    </tr>
                `;
            }
        }
    }
    
    return rows;
}

// Helper function to generate issues section
function generateIssuesSection(matrix) {
    let issuesHtml = '<div class="issues-section"><h2>Known Issues</h2>';
    
    for (const issue of matrix.issues) {
        issuesHtml += `
            <div class="issue-item">
                <strong>${issue.browser} - ${issue.page} (${issue.viewport})</strong>
                <p>Type: ${issue.type}</p>
                <ul>
                    ${issue.issues.map(i => `<li>${i}</li>`).join('')}
                </ul>
            </div>
        `;
    }
    
    issuesHtml += '</div>';
    return issuesHtml;
}

// Helper function to generate errors section
function generateErrorsSection(matrix) {
    let errorsHtml = '<div class="compatibility-table"><h2>JavaScript Errors</h2><table><thead><tr><th>Page</th><th>Browser</th><th>Error Type</th><th>Details</th></tr></thead><tbody>';
    
    for (const [pageKey, browserErrors] of Object.entries(matrix.errors)) {
        for (const [browser, errors] of Object.entries(browserErrors)) {
            if (errors.jsErrors.length > 0) {
                errorsHtml += `
                    <tr>
                        <td>${pageKey}</td>
                        <td>${browser}</td>
                        <td>Page Error</td>
                        <td><div class="error-details">${errors.jsErrors.join('\n')}</div></td>
                    </tr>
                `;
            }
            
            if (errors.consoleErrors.length > 0) {
                errorsHtml += `
                    <tr>
                        <td>${pageKey}</td>
                        <td>${browser}</td>
                        <td>Console Error</td>
                        <td><div class="error-details">${errors.consoleErrors.join('\n')}</div></td>
                    </tr>
                `;
            }
        }
    }
    
    errorsHtml += '</tbody></table></div>';
    return errorsHtml;
}

// Helper function to generate screenshot grid
function generateScreenshotGrid() {
    let html = '';
    
    for (const page of TEST_CONFIG.pages) {
        html += `<h3>${page.name.charAt(0).toUpperCase() + page.name.slice(1)} Page</h3><div class="screenshot-grid">`;
        
        for (const browser of TEST_CONFIG.browsers) {
            for (const viewport of TEST_CONFIG.viewports) {
                const screenshotPath = `${browser}/${viewport.name}/${page.name}.png`;
                html += `
                    <div class="screenshot-item">
                        <div class="screenshot-label">${browser} - ${viewport.name}</div>
                        <img src="${screenshotPath}" alt="${page.name} - ${browser} - ${viewport.name}" loading="lazy">
                    </div>
                `;
            }
        }
        
        html += '</div>';
    }
    
    return html;
}

// Helper function to generate recommendations
function generateRecommendations(matrix, allResults) {
    const recommendations = [];
    
    // Check for browser-specific failures
    const browserFailures = {};
    for (const page of TEST_CONFIG.pages) {
        for (const viewport of TEST_CONFIG.viewports) {
            const features = matrix.features[page.name][viewport.name];
            
            for (const browser of TEST_CONFIG.browsers) {
                if (!features.loads[browser] || !features.noJsErrors[browser]) {
                    if (!browserFailures[browser]) {
                        browserFailures[browser] = [];
                    }
                    browserFailures[browser].push(`${page.name} (${viewport.name})`);
                }
            }
        }
    }
    
    // Generate browser-specific recommendations
    if (Object.keys(browserFailures).length > 0) {
        recommendations.push('<h3>Browser-Specific Issues</h3><ul>');
        
        for (const [browser, pages] of Object.entries(browserFailures)) {
            recommendations.push(`<li><strong>${browser}:</strong> Issues detected on ${pages.join(', ')}. Review console errors and ensure all polyfills are loaded.</li>`);
        }
        
        recommendations.push('</ul>');
    }
    
    // Performance recommendations
    recommendations.push('<h3>Performance Optimization</h3><ul>');
    
    let slowestLoads = [];
    for (const [pageKey, metrics] of Object.entries(matrix.performanceMetrics)) {
        for (const [browser, time] of Object.entries(metrics)) {
            if (time > 2000) {
                slowestLoads.push({ page: pageKey, browser, time });
            }
        }
    }
    
    if (slowestLoads.length > 0) {
        recommendations.push('<li>The following pages have slow load times (>2s):');
        recommendations.push('<ul>');
        slowestLoads.forEach(item => {
            recommendations.push(`<li>${item.page} on ${item.browser}: ${item.time}ms</li>`);
        });
        recommendations.push('</ul></li>');
    } else {
        recommendations.push('<li>All pages load within acceptable time limits (< 2s)</li>');
    }
    
    recommendations.push('</ul>');
    
    // CSS and visual recommendations
    if (matrix.issues.length > 0) {
        recommendations.push('<h3>CSS and Visual Issues</h3><ul>');
        
        const cssIssueTypes = new Set();
        matrix.issues.forEach(issue => {
            if (issue.type === 'css') {
                issue.issues.forEach(i => {
                    if (i.includes('font')) cssIssueTypes.add('fonts');
                    if (i.includes('scroll')) cssIssueTypes.add('layout');
                    if (i.includes('image')) cssIssueTypes.add('images');
                });
            }
        });
        
        if (cssIssueTypes.has('fonts')) {
            recommendations.push('<li>Font loading issues detected. Ensure web fonts are properly loaded with fallbacks.</li>');
        }
        if (cssIssueTypes.has('layout')) {
            recommendations.push('<li>Layout overflow detected. Review responsive design and use proper viewport constraints.</li>');
        }
        if (cssIssueTypes.has('images')) {
            recommendations.push('<li>Broken images detected. Verify all image paths and implement proper error handling.</li>');
        }
        
        recommendations.push('</ul>');
    }
    
    // General recommendations
    recommendations.push('<h3>General Recommendations</h3><ul>');
    recommendations.push('<li>Test all interactive features manually in each browser to verify functionality</li>');
    recommendations.push('<li>Implement progressive enhancement for better cross-browser support</li>');
    recommendations.push('<li>Use feature detection instead of browser detection</li>');
    recommendations.push('<li>Ensure all third-party libraries are compatible with target browsers</li>');
    recommendations.push('<li>Consider using CSS prefixes for better compatibility</li>');
    recommendations.push('<li>Regularly update and test with latest browser versions</li>');
    recommendations.push('</ul>');
    
    return recommendations.join('\n');
}

// Main test runner
async function runCrossBrowserTests() {
    console.log('Starting cross-browser compatibility tests...');
    console.log(`Testing ${TEST_CONFIG.browsers.length} browsers across ${TEST_CONFIG.pages.length} pages`);
    
    const allResults = {};
    
    // Create results directory
    await fs.mkdir('cross-browser-results', { recursive: true });
    
    // Test each browser
    for (const browserName of TEST_CONFIG.browsers) {
        console.log(`\nTesting ${browserName}...`);
        allResults[browserName] = {};
        
        const browser = await launchBrowser(browserName);
        
        try {
            // Test each page
            for (const page of TEST_CONFIG.pages) {
                for (const viewport of TEST_CONFIG.viewports) {
                    const key = `${page.name}_${viewport.name}`;
                    console.log(`  Testing ${page.name} (${viewport.name})...`);
                    
                    const results = await testPage(browser, browserName, page, viewport);
                    allResults[browserName][key] = results;
                    
                    if (!results.loaded) {
                        console.log(`    ✗ Failed to load`);
                    } else {
                        console.log(`    ✓ Loaded in ${results.loadTime}ms`);
                        if (results.jsErrors.length > 0) {
                            console.log(`    ⚠ ${results.jsErrors.length} JS errors`);
                        }
                        if (results.consoleErrors.length > 0) {
                            console.log(`    ⚠ ${results.consoleErrors.length} console errors`);
                        }
                    }
                }
            }
        } finally {
            await browser.close();
        }
    }
    
    // Analyze results
    console.log('\nAnalyzing results...');
    const compatibilityMatrix = analyzeResults(allResults);
    
    // Save raw results
    await fs.writeFile(
        'cross-browser-results/raw-results.json',
        JSON.stringify(allResults, null, 2)
    );
    
    // Save compatibility matrix
    await fs.writeFile(
        'cross-browser-results/compatibility-matrix.json',
        JSON.stringify(compatibilityMatrix, null, 2)
    );
    
    // Generate HTML report
    console.log('Generating HTML report...');
    const reportPath = await generateReport(compatibilityMatrix, allResults);
    
    // Generate summary
    console.log('\n=== Cross-Browser Compatibility Summary ===');
    console.log(`Total issues found: ${compatibilityMatrix.issues.length}`);
    console.log(`Report generated: ${reportPath}`);
    console.log('\nKey findings:');
    
    // Summary of failures
    const failures = [];
    for (const page of TEST_CONFIG.pages) {
        for (const viewport of TEST_CONFIG.viewports) {
            const features = compatibilityMatrix.features[page.name][viewport.name];
            for (const browser of TEST_CONFIG.browsers) {
                if (!features.loads[browser]) {
                    failures.push(`- ${page.name} fails to load in ${browser} (${viewport.name})`);
                } else if (!features.noJsErrors[browser]) {
                    failures.push(`- ${page.name} has JS errors in ${browser} (${viewport.name})`);
                }
            }
        }
    }
    
    if (failures.length > 0) {
        console.log('\nFailures:');
        failures.forEach(f => console.log(f));
    } else {
        console.log('✓ All pages load successfully in all browsers!');
    }
    
    console.log('\nView the full report at:', path.resolve(reportPath));
}

// Run tests if executed directly
if (require.main === module) {
    runCrossBrowserTests().catch(console.error);
}

module.exports = { runCrossBrowserTests };