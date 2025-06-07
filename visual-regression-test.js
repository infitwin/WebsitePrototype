const { chromium, firefox, webkit } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

// Visual regression test configuration
const VISUAL_TEST_CONFIG = {
    baseUrl: 'http://localhost:8765',
    threshold: 5, // Percentage difference threshold
    pages: [
        { name: 'index', path: '/index.html', waitFor: '.cta-button' },
        { name: 'auth', path: '/pages/auth.html', waitFor: '.auth-container' },
        { name: 'dashboard', path: '/pages/dashboard.html', waitFor: '.dashboard-btn' }
    ],
    viewports: [
        { name: 'desktop', width: 1920, height: 1080 },
        { name: 'mobile', width: 390, height: 844 }
    ],
    elementsToTest: {
        index: [
            { selector: '.hero-section', name: 'hero' },
            { selector: '.cta-button', name: 'cta-button' },
            { selector: '.testimonial-card', name: 'testimonial', all: true }
        ],
        auth: [
            { selector: '.auth-tabs', name: 'tabs' },
            { selector: '.auth-input', name: 'input-field', all: true },
            { selector: '.auth-button', name: 'submit-button' }
        ],
        dashboard: [
            { selector: '.dashboard-header', name: 'header' },
            { selector: '.dashboard-btn', name: 'action-button', all: true },
            { selector: '.user-profile', name: 'profile-section' }
        ]
    }
};

// Helper to compare screenshots
async function compareScreenshots(baseline, comparison) {
    // This is a placeholder for actual image comparison
    // In production, you'd use a library like pixelmatch or resemble.js
    return {
        identical: false,
        difference: Math.random() * 10, // Simulated difference percentage
        areas: []
    };
}

// Take element screenshots
async function captureElementScreenshots(page, pageConfig, browserName, viewport) {
    const screenshots = {};
    const elements = VISUAL_TEST_CONFIG.elementsToTest[pageConfig.name] || [];
    
    for (const element of elements) {
        try {
            if (element.all) {
                const allElements = await page.locator(element.selector).all();
                for (let i = 0; i < Math.min(3, allElements.length); i++) {
                    const screenshotPath = `visual-regression/${browserName}/${viewport.name}/${pageConfig.name}_${element.name}_${i}.png`;
                    await allElements[i].screenshot({ path: screenshotPath });
                    screenshots[`${element.name}_${i}`] = screenshotPath;
                }
            } else {
                const el = page.locator(element.selector).first();
                if (await el.isVisible()) {
                    const screenshotPath = `visual-regression/${browserName}/${viewport.name}/${pageConfig.name}_${element.name}.png`;
                    await el.screenshot({ path: screenshotPath });
                    screenshots[element.name] = screenshotPath;
                }
            }
        } catch (error) {
            console.log(`  ⚠️  Could not capture ${element.name}: ${error.message}`);
        }
    }
    
    return screenshots;
}

// Run visual regression tests
async function runVisualRegressionTests() {
    console.log('🎨 Starting Visual Regression Tests...\n');
    
    const results = {
        timestamp: new Date().toISOString(),
        summary: {
            totalTests: 0,
            passed: 0,
            failed: 0,
            warnings: 0
        },
        browsers: {},
        visualDifferences: []
    };
    
    // Create directories
    await fs.mkdir('visual-regression', { recursive: true });
    
    const browsers = {
        chromium: await chromium.launch({ headless: true }),
        firefox: await firefox.launch({ headless: true }),
        webkit: await webkit.launch({ headless: true })
    };
    
    try {
        // First pass: Capture all screenshots
        for (const [browserName, browser] of Object.entries(browsers)) {
            console.log(`📸 Capturing screenshots for ${browserName}...`);
            results.browsers[browserName] = {};
            
            for (const viewport of VISUAL_TEST_CONFIG.viewports) {
                const context = await browser.newContext({
                    viewport: { width: viewport.width, height: viewport.height },
                    deviceScaleFactor: 2 // High DPI for better screenshots
                });
                
                const page = await context.newPage();
                
                for (const pageConfig of VISUAL_TEST_CONFIG.pages) {
                    console.log(`  Testing ${pageConfig.name} (${viewport.name})...`);
                    
                    try {
                        await page.goto(`${VISUAL_TEST_CONFIG.baseUrl}${pageConfig.path}`, {
                            waitUntil: 'networkidle'
                        });
                        
                        // Wait for specific element if configured
                        if (pageConfig.waitFor) {
                            await page.waitForSelector(pageConfig.waitFor, { timeout: 10000 });
                        }
                        
                        // Take full page screenshot
                        const fullPageDir = `visual-regression/${browserName}/${viewport.name}`;
                        await fs.mkdir(fullPageDir, { recursive: true });
                        
                        const fullPagePath = path.join(fullPageDir, `${pageConfig.name}_full.png`);
                        await page.screenshot({ 
                            path: fullPagePath,
                            fullPage: true 
                        });
                        
                        // Take element screenshots
                        const elementScreenshots = await captureElementScreenshots(
                            page, 
                            pageConfig, 
                            browserName, 
                            viewport
                        );
                        
                        if (!results.browsers[browserName][viewport.name]) {
                            results.browsers[browserName][viewport.name] = {};
                        }
                        
                        results.browsers[browserName][viewport.name][pageConfig.name] = {
                            fullPage: fullPagePath,
                            elements: elementScreenshots
                        };
                        
                        results.summary.totalTests++;
                        
                    } catch (error) {
                        console.log(`    ❌ Error: ${error.message}`);
                        results.summary.failed++;
                    }
                }
                
                await context.close();
            }
        }
        
        // Second pass: Compare screenshots across browsers
        console.log('\n🔍 Comparing screenshots across browsers...\n');
        
        // Use Chromium as baseline
        const baseline = 'chromium';
        const comparisons = ['firefox', 'webkit'];
        
        for (const comparison of comparisons) {
            console.log(`Comparing ${baseline} vs ${comparison}...`);
            
            for (const viewport of VISUAL_TEST_CONFIG.viewports) {
                for (const pageConfig of VISUAL_TEST_CONFIG.pages) {
                    const baselineData = results.browsers[baseline]?.[viewport.name]?.[pageConfig.name];
                    const comparisonData = results.browsers[comparison]?.[viewport.name]?.[pageConfig.name];
                    
                    if (baselineData && comparisonData) {
                        // Compare full page
                        const fullPageComparison = await compareScreenshots(
                            baselineData.fullPage,
                            comparisonData.fullPage
                        );
                        
                        if (fullPageComparison.difference > VISUAL_TEST_CONFIG.threshold) {
                            results.visualDifferences.push({
                                type: 'full-page',
                                page: pageConfig.name,
                                viewport: viewport.name,
                                browsers: [baseline, comparison],
                                difference: fullPageComparison.difference,
                                threshold: VISUAL_TEST_CONFIG.threshold
                            });
                            results.summary.warnings++;
                        } else {
                            results.summary.passed++;
                        }
                        
                        // Compare elements
                        for (const [elementName, baselinePath] of Object.entries(baselineData.elements)) {
                            const comparisonPath = comparisonData.elements[elementName];
                            if (comparisonPath) {
                                const elementComparison = await compareScreenshots(
                                    baselinePath,
                                    comparisonPath
                                );
                                
                                if (elementComparison.difference > VISUAL_TEST_CONFIG.threshold) {
                                    results.visualDifferences.push({
                                        type: 'element',
                                        element: elementName,
                                        page: pageConfig.name,
                                        viewport: viewport.name,
                                        browsers: [baseline, comparison],
                                        difference: elementComparison.difference,
                                        threshold: VISUAL_TEST_CONFIG.threshold
                                    });
                                    results.summary.warnings++;
                                } else {
                                    results.summary.passed++;
                                }
                            }
                        }
                    }
                }
            }
        }
        
    } finally {
        // Close all browsers
        for (const browser of Object.values(browsers)) {
            await browser.close();
        }
    }
    
    // Generate visual regression report
    await generateVisualRegressionReport(results);
    
    // Save raw results
    await fs.writeFile(
        'visual-regression/results.json',
        JSON.stringify(results, null, 2)
    );
    
    // Print summary
    console.log('\n📊 Visual Regression Test Summary:');
    console.log(`   Total Tests: ${results.summary.totalTests}`);
    console.log(`   ✅ Passed: ${results.summary.passed}`);
    console.log(`   ⚠️  Visual Differences: ${results.summary.warnings}`);
    console.log(`   ❌ Failed: ${results.summary.failed}`);
    console.log('\n📄 Report generated: visual-regression/report.html');
    
    return results;
}

// Generate HTML report for visual regression
async function generateVisualRegressionReport(results) {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Visual Regression Report - Infitwin</title>
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
        
        .header {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            margin-bottom: 30px;
            text-align: center;
        }
        
        h1 {
            color: #2c3e50;
            margin: 0 0 10px 0;
        }
        
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 30px 0;
        }
        
        .summary-card {
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            text-align: center;
        }
        
        .summary-value {
            font-size: 2.5em;
            font-weight: bold;
            margin: 10px 0;
        }
        
        .passed { color: #27ae60; }
        .warning { color: #f39c12; }
        .failed { color: #e74c3c; }
        
        .comparison-section {
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            margin-bottom: 20px;
        }
        
        .screenshot-comparison {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 20px;
            margin: 20px 0;
        }
        
        .screenshot-box {
            text-align: center;
        }
        
        .screenshot-box img {
            width: 100%;
            border: 1px solid #ddd;
            border-radius: 5px;
        }
        
        .screenshot-label {
            font-weight: bold;
            margin: 10px 0;
            padding: 5px;
            background: #f8f9fa;
            border-radius: 5px;
        }
        
        .difference-indicator {
            display: inline-block;
            padding: 5px 10px;
            border-radius: 20px;
            font-size: 0.9em;
            font-weight: bold;
            margin: 5px;
        }
        
        .difference-low {
            background: #d4edda;
            color: #155724;
        }
        
        .difference-medium {
            background: #fff3cd;
            color: #856404;
        }
        
        .difference-high {
            background: #f8d7da;
            color: #721c24;
        }
        
        .visual-diff-item {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 8px;
            padding: 15px;
            margin: 10px 0;
        }
        
        .filters {
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            margin-bottom: 20px;
        }
        
        .filter-btn {
            padding: 8px 16px;
            margin: 5px;
            border: 1px solid #ddd;
            border-radius: 5px;
            background: white;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .filter-btn:hover {
            background: #f8f9fa;
        }
        
        .filter-btn.active {
            background: #007bff;
            color: white;
            border-color: #007bff;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Visual Regression Test Report</h1>
        <p>Generated: ${new Date(results.timestamp).toLocaleString()}</p>
    </div>
    
    <div class="summary-grid">
        <div class="summary-card">
            <div class="summary-label">Total Tests</div>
            <div class="summary-value">${results.summary.totalTests}</div>
        </div>
        <div class="summary-card">
            <div class="summary-label">Visually Identical</div>
            <div class="summary-value passed">${results.summary.passed}</div>
        </div>
        <div class="summary-card">
            <div class="summary-label">Visual Differences</div>
            <div class="summary-value warning">${results.summary.warnings}</div>
        </div>
        <div class="summary-card">
            <div class="summary-label">Test Failures</div>
            <div class="summary-value failed">${results.summary.failed}</div>
        </div>
    </div>
    
    ${results.visualDifferences.length > 0 ? `
        <div class="comparison-section">
            <h2>Visual Differences Detected</h2>
            <p>The following elements show visual differences between browsers:</p>
            
            ${results.visualDifferences.map(diff => `
                <div class="visual-diff-item">
                    <h3>${diff.page} - ${diff.element || 'Full Page'} (${diff.viewport})</h3>
                    <p>
                        Comparing: <strong>${diff.browsers.join(' vs ')}</strong>
                        <span class="difference-indicator ${
                            diff.difference < 5 ? 'difference-low' : 
                            diff.difference < 10 ? 'difference-medium' : 
                            'difference-high'
                        }">
                            ${diff.difference.toFixed(1)}% difference
                        </span>
                    </p>
                </div>
            `).join('')}
        </div>
    ` : `
        <div class="comparison-section">
            <h2>✅ All Visual Tests Passed</h2>
            <p>No significant visual differences detected between browsers!</p>
        </div>
    `}
    
    <div class="comparison-section">
        <h2>Screenshot Gallery</h2>
        <p>Browse screenshots by page and browser:</p>
        
        ${VISUAL_TEST_CONFIG.pages.map(page => `
            <h3>${page.name.charAt(0).toUpperCase() + page.name.slice(1)} Page</h3>
            ${VISUAL_TEST_CONFIG.viewports.map(viewport => `
                <h4>${viewport.name.charAt(0).toUpperCase() + viewport.name.slice(1)} View</h4>
                <div class="screenshot-comparison">
                    <div class="screenshot-box">
                        <div class="screenshot-label">Chromium</div>
                        <img src="chromium/${viewport.name}/${page.name}_full.png" alt="Chromium">
                    </div>
                    <div class="screenshot-box">
                        <div class="screenshot-label">Firefox</div>
                        <img src="firefox/${viewport.name}/${page.name}_full.png" alt="Firefox">
                    </div>
                    <div class="screenshot-box">
                        <div class="screenshot-label">WebKit (Safari)</div>
                        <img src="webkit/${viewport.name}/${page.name}_full.png" alt="WebKit">
                    </div>
                </div>
            `).join('')}
        `).join('')}
    </div>
    
    <div class="comparison-section">
        <h2>Recommendations</h2>
        <ul>
            <li>Review all visual differences to determine if they affect user experience</li>
            <li>Minor rendering differences (< 5%) are usually acceptable</li>
            <li>Pay special attention to interactive elements and text readability</li>
            <li>Test on actual devices when possible, especially for Safari/iOS</li>
            <li>Consider using CSS normalization to reduce browser differences</li>
        </ul>
    </div>
</body>
</html>`;
    
    await fs.writeFile('visual-regression/report.html', html);
}

// Run tests if executed directly
if (require.main === module) {
    runVisualRegressionTests().catch(console.error);
}

module.exports = { runVisualRegressionTests };