const fs = require('fs').promises;
const path = require('path');

// Browser compatibility matrix template
const browserCompatibilityMatrix = {
    browsers: {
        chromium: {
            name: "Chromium/Chrome",
            versions: "Latest",
            engine: "Blink",
            marketShare: "~65%"
        },
        firefox: {
            name: "Firefox",
            versions: "Latest",
            engine: "Gecko",
            marketShare: "~3%"
        },
        webkit: {
            name: "Safari/WebKit",
            versions: "Latest",
            engine: "WebKit",
            marketShare: "~19%"
        },
        edge: {
            name: "Edge",
            versions: "Latest (Chromium-based)",
            engine: "Blink",
            marketShare: "~5%"
        }
    },
    features: {
        "CSS Grid": {
            chromium: { supported: true, version: "57+" },
            firefox: { supported: true, version: "52+" },
            webkit: { supported: true, version: "10.1+" },
            edge: { supported: true, version: "16+" }
        },
        "CSS Flexbox": {
            chromium: { supported: true, version: "29+" },
            firefox: { supported: true, version: "28+" },
            webkit: { supported: true, version: "9+" },
            edge: { supported: true, version: "12+" }
        },
        "CSS Variables": {
            chromium: { supported: true, version: "49+" },
            firefox: { supported: true, version: "31+" },
            webkit: { supported: true, version: "9.1+" },
            edge: { supported: true, version: "15+" }
        },
        "CSS Transitions": {
            chromium: { supported: true, version: "26+" },
            firefox: { supported: true, version: "16+" },
            webkit: { supported: true, version: "6.1+" },
            edge: { supported: true, version: "12+" }
        },
        "CSS Transforms": {
            chromium: { supported: true, version: "36+" },
            firefox: { supported: true, version: "16+" },
            webkit: { supported: true, version: "9+" },
            edge: { supported: true, version: "12+" }
        },
        "Local Storage": {
            chromium: { supported: true, version: "4+" },
            firefox: { supported: true, version: "3.5+" },
            webkit: { supported: true, version: "4+" },
            edge: { supported: true, version: "12+" }
        },
        "Fetch API": {
            chromium: { supported: true, version: "42+" },
            firefox: { supported: true, version: "39+" },
            webkit: { supported: true, version: "10.1+" },
            edge: { supported: true, version: "14+" }
        },
        "ES6 Modules": {
            chromium: { supported: true, version: "61+" },
            firefox: { supported: true, version: "60+" },
            webkit: { supported: true, version: "11+" },
            edge: { supported: true, version: "16+" }
        },
        "Intersection Observer": {
            chromium: { supported: true, version: "51+" },
            firefox: { supported: true, version: "55+" },
            webkit: { supported: true, version: "12.1+" },
            edge: { supported: true, version: "15+" }
        },
        "Web Fonts (WOFF2)": {
            chromium: { supported: true, version: "36+" },
            firefox: { supported: true, version: "39+" },
            webkit: { supported: true, version: "10+" },
            edge: { supported: true, version: "14+" }
        }
    },
    knownIssues: {
        chromium: [
            "None identified in testing"
        ],
        firefox: [
            "Slight differences in default form styling",
            "Different scrollbar appearance"
        ],
        webkit: [
            "Requires -webkit- prefix for some CSS properties",
            "Different default font rendering"
        ],
        edge: [
            "Inherits most Chromium behavior",
            "Legacy Edge (pre-Chromium) not supported"
        ]
    },
    recommendations: {
        general: [
            "Use CSS autoprefixer for better compatibility",
            "Test form elements across browsers due to styling differences",
            "Implement feature detection for progressive enhancement",
            "Use normalized CSS to reduce browser differences",
            "Test on real devices when possible, especially for Safari/iOS"
        ],
        cssCompatibility: [
            "Always provide fallbacks for newer CSS features",
            "Use vendor prefixes where necessary (-webkit-, -moz-)",
            "Test gradients and filters across browsers",
            "Verify custom scrollbar styling"
        ],
        javascriptCompatibility: [
            "Use transpilation for older browser support if needed",
            "Avoid using experimental APIs without fallbacks",
            "Test event handling across browsers",
            "Verify localStorage/sessionStorage quotas"
        ],
        performanceConsiderations: [
            "Optimize images and assets for all browsers",
            "Test lazy loading implementation",
            "Monitor memory usage in long-running sessions",
            "Check animation performance across browsers"
        ]
    },
    testingStrategy: {
        automated: [
            "Playwright for cross-browser automation",
            "Screenshot comparison for visual regression",
            "Performance metrics collection",
            "JavaScript error monitoring"
        ],
        manual: [
            "Interactive element testing",
            "Accessibility testing with screen readers",
            "Touch/gesture testing on mobile browsers",
            "Print layout verification"
        ],
        tools: [
            "BrowserStack for real device testing",
            "Chrome DevTools for debugging",
            "Firefox Developer Tools for CSS Grid inspection",
            "Safari Web Inspector for WebKit-specific issues"
        ]
    }
};

// Generate markdown report
async function generateMarkdownMatrix() {
    let markdown = `# Browser Compatibility Matrix - Infitwin

Generated: ${new Date().toISOString()}

## Supported Browsers

| Browser | Version | Engine | Market Share |
|---------|---------|--------|--------------|
`;

    // Add browser information
    for (const [key, browser] of Object.entries(browserCompatibilityMatrix.browsers)) {
        markdown += `| ${browser.name} | ${browser.versions} | ${browser.engine} | ${browser.marketShare} |\n`;
    }

    markdown += `\n## Feature Compatibility\n\n`;
    markdown += `| Feature | Chrome/Edge | Firefox | Safari | Notes |\n`;
    markdown += `|---------|-------------|---------|--------|-------|\n`;

    // Add feature compatibility
    for (const [feature, support] of Object.entries(browserCompatibilityMatrix.features)) {
        const chromeSupport = support.chromium.supported ? '✅' : '❌';
        const firefoxSupport = support.firefox.supported ? '✅' : '❌';
        const safariSupport = support.webkit.supported ? '✅' : '❌';
        
        markdown += `| ${feature} | ${chromeSupport} v${support.chromium.version} | ${firefoxSupport} v${support.firefox.version} | ${safariSupport} v${support.webkit.version} | All modern versions supported |\n`;
    }

    markdown += `\n## Known Browser-Specific Issues\n\n`;

    for (const [browser, issues] of Object.entries(browserCompatibilityMatrix.knownIssues)) {
        markdown += `### ${browser.charAt(0).toUpperCase() + browser.slice(1)}\n`;
        issues.forEach(issue => {
            markdown += `- ${issue}\n`;
        });
        markdown += '\n';
    }

    markdown += `## Recommendations\n\n`;

    for (const [category, recommendations] of Object.entries(browserCompatibilityMatrix.recommendations)) {
        markdown += `### ${category.charAt(0).toUpperCase() + category.slice(1).replace(/([A-Z])/g, ' $1').trim()}\n`;
        recommendations.forEach(rec => {
            markdown += `- ${rec}\n`;
        });
        markdown += '\n';
    }

    markdown += `## Testing Strategy\n\n`;

    for (const [type, strategies] of Object.entries(browserCompatibilityMatrix.testingStrategy)) {
        markdown += `### ${type.charAt(0).toUpperCase() + type.slice(1)} Testing\n`;
        strategies.forEach(strategy => {
            markdown += `- ${strategy}\n`;
        });
        markdown += '\n';
    }

    markdown += `## Browser-Specific CSS Considerations\n\n`;
    markdown += `\`\`\`css
/* Safari-specific fixes */
@supports (-webkit-appearance: none) {
    /* Safari-only CSS */
}

/* Firefox-specific fixes */
@-moz-document url-prefix() {
    /* Firefox-only CSS */
}

/* Chrome/Edge-specific fixes */
@supports (-webkit-appearance: none) and (not (overflow: -webkit-marquee)) and (not (-ms-ime-align: auto)) {
    /* Chrome/Edge-only CSS */
}
\`\`\`\n\n`;

    markdown += `## Minimum Browser Versions\n\n`;
    markdown += `Based on the features used in the Infitwin website, these are the minimum supported versions:\n\n`;
    markdown += `- **Chrome/Edge**: 61+ (ES6 Modules)\n`;
    markdown += `- **Firefox**: 60+ (ES6 Modules)\n`;
    markdown += `- **Safari**: 12.1+ (Intersection Observer)\n`;
    markdown += `- **Mobile Safari**: iOS 12.2+\n`;
    markdown += `- **Samsung Internet**: 8.2+\n\n`;

    markdown += `## Testing Checklist\n\n`;
    markdown += `- [ ] Test all pages load without errors\n`;
    markdown += `- [ ] Verify responsive design at multiple breakpoints\n`;
    markdown += `- [ ] Check all interactive elements (buttons, forms, toggles)\n`;
    markdown += `- [ ] Test navigation and routing\n`;
    markdown += `- [ ] Verify animations and transitions\n`;
    markdown += `- [ ] Check font loading and rendering\n`;
    markdown += `- [ ] Test form validation and submission\n`;
    markdown += `- [ ] Verify localStorage functionality\n`;
    markdown += `- [ ] Check print styles\n`;
    markdown += `- [ ] Test accessibility features\n`;

    return markdown;
}

// Generate HTML compatibility table
async function generateHTMLMatrix() {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Browser Compatibility Matrix - Infitwin</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }
        
        .header {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            margin-bottom: 30px;
            text-align: center;
        }
        
        h1 {
            color: #2c3e50;
            margin: 0 0 10px 0;
        }
        
        .generated-date {
            color: #7f8c8d;
            font-size: 0.9em;
        }
        
        .matrix-table {
            background: white;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            margin-bottom: 30px;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
        }
        
        th {
            background: #34495e;
            color: white;
            padding: 15px;
            text-align: left;
            font-weight: 600;
        }
        
        td {
            padding: 15px;
            border-bottom: 1px solid #ecf0f1;
        }
        
        tr:hover {
            background: #f8f9fa;
        }
        
        .supported {
            color: #27ae60;
            font-weight: bold;
        }
        
        .not-supported {
            color: #e74c3c;
            font-weight: bold;
        }
        
        .partial {
            color: #f39c12;
            font-weight: bold;
        }
        
        .browser-icon {
            width: 30px;
            height: 30px;
            display: inline-block;
            vertical-align: middle;
            margin-right: 10px;
        }
        
        .feature-group {
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            margin-bottom: 20px;
        }
        
        .recommendation-list {
            background: #e8f5e9;
            padding: 20px;
            border-radius: 10px;
            margin: 10px 0;
        }
        
        .issue-list {
            background: #fff3e0;
            padding: 20px;
            border-radius: 10px;
            margin: 10px 0;
        }
        
        .browser-card {
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            margin-bottom: 20px;
            display: inline-block;
            width: calc(50% - 20px);
            margin-right: 20px;
            vertical-align: top;
        }
        
        .browser-card h3 {
            color: #2c3e50;
            margin-top: 0;
        }
        
        ul {
            padding-left: 20px;
        }
        
        li {
            margin: 8px 0;
        }
        
        .compatibility-icon {
            font-size: 1.2em;
            margin-right: 5px;
        }
        
        @media (max-width: 768px) {
            .browser-card {
                width: 100%;
                margin-right: 0;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Browser Compatibility Matrix</h1>
        <p class="generated-date">Generated: ${new Date().toLocaleString()}</p>
    </div>
    
    <div class="matrix-table">
        <h2 style="padding: 20px 20px 10px 20px; margin: 0;">Feature Support Matrix</h2>
        <table>
            <thead>
                <tr>
                    <th>Feature</th>
                    <th>Chrome/Edge</th>
                    <th>Firefox</th>
                    <th>Safari</th>
                    <th>Notes</th>
                </tr>
            </thead>
            <tbody>
                ${Object.entries(browserCompatibilityMatrix.features).map(([feature, support]) => `
                    <tr>
                        <td><strong>${feature}</strong></td>
                        <td class="supported">✅ ${support.chromium.version}</td>
                        <td class="supported">✅ ${support.firefox.version}</td>
                        <td class="supported">✅ ${support.webkit.version}</td>
                        <td>Fully supported in all modern browsers</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
    
    <h2>Browser-Specific Considerations</h2>
    
    <div style="display: flex; flex-wrap: wrap;">
        ${Object.entries(browserCompatibilityMatrix.knownIssues).map(([browser, issues]) => `
            <div class="browser-card">
                <h3>${browserCompatibilityMatrix.browsers[browser].name}</h3>
                <div class="issue-list">
                    <h4>Known Issues:</h4>
                    <ul>
                        ${issues.map(issue => `<li>${issue}</li>`).join('')}
                    </ul>
                </div>
            </div>
        `).join('')}
    </div>
    
    <div class="feature-group">
        <h2>Testing Recommendations</h2>
        
        ${Object.entries(browserCompatibilityMatrix.recommendations).map(([category, recommendations]) => `
            <div class="recommendation-list">
                <h3>${category.charAt(0).toUpperCase() + category.slice(1).replace(/([A-Z])/g, ' $1').trim()}</h3>
                <ul>
                    ${recommendations.map(rec => `<li>${rec}</li>`).join('')}
                </ul>
            </div>
        `).join('')}
    </div>
    
    <div class="feature-group">
        <h2>Minimum Supported Versions</h2>
        <table style="width: auto;">
            <tr>
                <td><strong>Chrome/Edge:</strong></td>
                <td>Version 61+ (ES6 Modules)</td>
            </tr>
            <tr>
                <td><strong>Firefox:</strong></td>
                <td>Version 60+ (ES6 Modules)</td>
            </tr>
            <tr>
                <td><strong>Safari:</strong></td>
                <td>Version 12.1+ (Intersection Observer)</td>
            </tr>
            <tr>
                <td><strong>Mobile Safari:</strong></td>
                <td>iOS 12.2+</td>
            </tr>
        </table>
    </div>
</body>
</html>`;
    
    return html;
}

// Main function
async function generateMatrixFiles() {
    console.log('Generating browser compatibility matrix files...');
    
    // Create directory for results
    await fs.mkdir('cross-browser-results', { recursive: true });
    
    // Generate and save markdown matrix
    const markdown = await generateMarkdownMatrix();
    await fs.writeFile('cross-browser-results/browser-compatibility-matrix.md', markdown);
    console.log('✅ Generated: browser-compatibility-matrix.md');
    
    // Generate and save HTML matrix
    const html = await generateHTMLMatrix();
    await fs.writeFile('cross-browser-results/browser-compatibility-matrix.html', html);
    console.log('✅ Generated: browser-compatibility-matrix.html');
    
    // Save JSON data
    await fs.writeFile(
        'cross-browser-results/browser-compatibility-data.json',
        JSON.stringify(browserCompatibilityMatrix, null, 2)
    );
    console.log('✅ Generated: browser-compatibility-data.json');
    
    console.log('\nAll files generated successfully in cross-browser-results/');
}

// Run if executed directly
if (require.main === module) {
    generateMatrixFiles().catch(console.error);
}

module.exports = { browserCompatibilityMatrix, generateMatrixFiles };