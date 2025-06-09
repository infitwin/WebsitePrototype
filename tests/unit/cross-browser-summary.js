const fs = require('fs').promises;
const path = require('path');

// Summary report generator
async function generateCrossBrowserSummary() {
    console.log('📊 Generating Cross-Browser Testing Summary...\n');
    
    const summary = {
        generated: new Date().toISOString(),
        overview: {
            browsersTestd: ['Chromium/Chrome', 'Firefox', 'WebKit/Safari'],
            pagesTestd: ['index', 'auth', 'dashboard'],
            viewportsTested: ['Desktop (1920x1080)', 'Mobile (390x844)'],
            testTypes: ['Functional', 'Visual', 'Performance', 'Interactive']
        },
        results: {
            functional: {},
            visual: {},
            performance: {},
            interactive: {}
        },
        criticalIssues: [],
        recommendations: []
    };
    
    // Try to load test results if they exist
    try {
        // Load cross-browser test results
        const crossBrowserResults = JSON.parse(
            await fs.readFile('cross-browser-results/raw-results.json', 'utf8')
        );
        
        // Analyze functional results
        let totalTests = 0;
        let passedTests = 0;
        let failedTests = 0;
        
        for (const [browser, pages] of Object.entries(crossBrowserResults)) {
            for (const [pageKey, result] of Object.entries(pages)) {
                totalTests++;
                if (result.loaded && !result.error) {
                    passedTests++;
                } else {
                    failedTests++;
                    summary.criticalIssues.push({
                        severity: 'high',
                        browser,
                        page: pageKey,
                        issue: 'Page failed to load',
                        details: result.error || 'Unknown error'
                    });
                }
                
                // Check for JS errors
                if (result.jsErrors && result.jsErrors.length > 0) {
                    summary.criticalIssues.push({
                        severity: 'medium',
                        browser,
                        page: pageKey,
                        issue: 'JavaScript errors detected',
                        details: result.jsErrors.join(', ')
                    });
                }
            }
        }
        
        summary.results.functional = {
            total: totalTests,
            passed: passedTests,
            failed: failedTests,
            successRate: ((passedTests / totalTests) * 100).toFixed(1) + '%'
        };
        
    } catch (error) {
        console.log('⚠️  Could not load cross-browser test results');
    }
    
    // Try to load visual regression results
    try {
        const visualResults = JSON.parse(
            await fs.readFile('visual-regression/results.json', 'utf8')
        );
        
        summary.results.visual = {
            totalComparisons: visualResults.summary.totalTests,
            visuallyIdentical: visualResults.summary.passed,
            visualDifferences: visualResults.summary.warnings,
            testFailures: visualResults.summary.failed
        };
        
        // Add visual differences as issues
        if (visualResults.visualDifferences) {
            visualResults.visualDifferences.forEach(diff => {
                if (diff.difference > 10) {
                    summary.criticalIssues.push({
                        severity: 'medium',
                        browser: diff.browsers.join(' vs '),
                        page: diff.page,
                        issue: 'Significant visual difference',
                        details: `${diff.element || 'Full page'} shows ${diff.difference.toFixed(1)}% difference`
                    });
                }
            });
        }
        
    } catch (error) {
        console.log('⚠️  Could not load visual regression results');
    }
    
    // Generate recommendations based on findings
    summary.recommendations = generateRecommendations(summary);
    
    // Create comprehensive HTML report
    const htmlReport = generateHTMLSummaryReport(summary);
    await fs.writeFile('cross-browser-summary-report.html', htmlReport);
    
    // Create markdown report
    const markdownReport = generateMarkdownSummaryReport(summary);
    await fs.writeFile('cross-browser-summary-report.md', markdownReport);
    
    // Save JSON summary
    await fs.writeFile('cross-browser-summary.json', JSON.stringify(summary, null, 2));
    
    console.log('✅ Summary reports generated:');
    console.log('   - cross-browser-summary-report.html');
    console.log('   - cross-browser-summary-report.md');
    console.log('   - cross-browser-summary.json');
    
    return summary;
}

// Generate recommendations based on test results
function generateRecommendations(summary) {
    const recommendations = [];
    
    // Check functional test results
    if (summary.results.functional.failedTests > 0) {
        recommendations.push({
            priority: 'high',
            category: 'Functional',
            recommendation: 'Fix page loading issues in affected browsers',
            details: 'Some pages fail to load correctly. Review console errors and ensure all resources are accessible.'
        });
    }
    
    // Check for JavaScript errors
    const jsErrorIssues = summary.criticalIssues.filter(i => i.issue.includes('JavaScript'));
    if (jsErrorIssues.length > 0) {
        recommendations.push({
            priority: 'high',
            category: 'JavaScript',
            recommendation: 'Resolve JavaScript errors across browsers',
            details: 'JavaScript errors can break functionality. Use try-catch blocks and test all browser APIs.'
        });
    }
    
    // Check visual differences
    if (summary.results.visual.visualDifferences > 0) {
        recommendations.push({
            priority: 'medium',
            category: 'Visual',
            recommendation: 'Review and normalize visual differences',
            details: 'Use CSS reset/normalize stylesheets and test CSS features for browser compatibility.'
        });
    }
    
    // General recommendations
    recommendations.push({
        priority: 'medium',
        category: 'Testing',
        recommendation: 'Implement continuous cross-browser testing',
        details: 'Set up automated testing in CI/CD pipeline to catch issues early.'
    });
    
    recommendations.push({
        priority: 'low',
        category: 'Performance',
        recommendation: 'Optimize for slower browsers',
        details: 'Some browsers may have slower JavaScript engines. Profile and optimize critical paths.'
    });
    
    return recommendations;
}

// Generate HTML summary report
function generateHTMLSummaryReport(summary) {
    const severityColors = {
        high: '#e74c3c',
        medium: '#f39c12',
        low: '#3498db'
    };
    
    const priorityColors = {
        high: '#e74c3c',
        medium: '#f39c12',
        low: '#3498db'
    };
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cross-Browser Testing Summary - Infitwin</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            margin-bottom: 30px;
            text-align: center;
        }
        
        h1 {
            margin: 0 0 10px 0;
            font-size: 2.5em;
        }
        
        .overview-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .overview-card {
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .overview-card h3 {
            margin-top: 0;
            color: #34495e;
        }
        
        .overview-card ul {
            margin: 0;
            padding-left: 20px;
        }
        
        .results-section {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            margin-bottom: 30px;
        }
        
        .results-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }
        
        .result-card {
            text-align: center;
            padding: 20px;
            border-radius: 8px;
            background: #f8f9fa;
        }
        
        .result-value {
            font-size: 2.5em;
            font-weight: bold;
            margin: 10px 0;
        }
        
        .result-label {
            color: #7f8c8d;
            font-size: 0.9em;
        }
        
        .success { color: #27ae60; }
        .warning { color: #f39c12; }
        .danger { color: #e74c3c; }
        
        .issues-section {
            margin-bottom: 30px;
        }
        
        .issue-item {
            background: white;
            border-left: 4px solid;
            padding: 15px;
            margin: 10px 0;
            border-radius: 5px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        
        .issue-high { border-color: #e74c3c; }
        .issue-medium { border-color: #f39c12; }
        .issue-low { border-color: #3498db; }
        
        .issue-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
        }
        
        .severity-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.8em;
            font-weight: bold;
            color: white;
        }
        
        .recommendations-section {
            background: #e8f8f5;
            padding: 30px;
            border-radius: 10px;
            margin-bottom: 30px;
        }
        
        .recommendation-item {
            background: white;
            padding: 20px;
            margin: 15px 0;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        
        .recommendation-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
        }
        
        .priority-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.8em;
            font-weight: bold;
            color: white;
        }
        
        .footer {
            text-align: center;
            color: #7f8c8d;
            margin-top: 50px;
            padding: 20px;
        }
        
        @media (max-width: 768px) {
            .overview-grid, .results-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Cross-Browser Testing Summary</h1>
        <p>Comprehensive test results for Infitwin website</p>
        <p>Generated: ${new Date(summary.generated).toLocaleString()}</p>
    </div>
    
    <div class="overview-grid">
        <div class="overview-card">
            <h3>Browsers Tested</h3>
            <ul>
                ${summary.overview.browsersTestd.map(b => `<li>${b}</li>`).join('')}
            </ul>
        </div>
        <div class="overview-card">
            <h3>Pages Tested</h3>
            <ul>
                ${summary.overview.pagesTestd.map(p => `<li>${p}</li>`).join('')}
            </ul>
        </div>
        <div class="overview-card">
            <h3>Viewports</h3>
            <ul>
                ${summary.overview.viewportsTested.map(v => `<li>${v}</li>`).join('')}
            </ul>
        </div>
        <div class="overview-card">
            <h3>Test Types</h3>
            <ul>
                ${summary.overview.testTypes.map(t => `<li>${t}</li>`).join('')}
            </ul>
        </div>
    </div>
    
    ${summary.results.functional.total ? `
        <div class="results-section">
            <h2>Test Results Summary</h2>
            <div class="results-grid">
                <div class="result-card">
                    <div class="result-label">Functional Tests</div>
                    <div class="result-value">${summary.results.functional.total}</div>
                    <div class="success">${summary.results.functional.successRate} passed</div>
                </div>
                ${summary.results.visual.totalComparisons ? `
                    <div class="result-card">
                        <div class="result-label">Visual Comparisons</div>
                        <div class="result-value">${summary.results.visual.totalComparisons}</div>
                        <div class="warning">${summary.results.visual.visualDifferences} differences</div>
                    </div>
                ` : ''}
                <div class="result-card">
                    <div class="result-label">Critical Issues</div>
                    <div class="result-value danger">${summary.criticalIssues.filter(i => i.severity === 'high').length}</div>
                    <div>High severity</div>
                </div>
                <div class="result-card">
                    <div class="result-label">Total Issues</div>
                    <div class="result-value warning">${summary.criticalIssues.length}</div>
                    <div>All severities</div>
                </div>
            </div>
        </div>
    ` : ''}
    
    ${summary.criticalIssues.length > 0 ? `
        <div class="issues-section">
            <h2>Issues Found</h2>
            ${summary.criticalIssues.map(issue => `
                <div class="issue-item issue-${issue.severity}">
                    <div class="issue-header">
                        <div>
                            <strong>${issue.browser} - ${issue.page}</strong>
                            <br>${issue.issue}
                        </div>
                        <span class="severity-badge" style="background: ${severityColors[issue.severity]}">
                            ${issue.severity.toUpperCase()}
                        </span>
                    </div>
                    <div class="issue-details">
                        ${issue.details}
                    </div>
                </div>
            `).join('')}
        </div>
    ` : `
        <div class="results-section">
            <h2>✅ No Critical Issues Found</h2>
            <p>All browsers passed functional testing without critical errors!</p>
        </div>
    `}
    
    <div class="recommendations-section">
        <h2>Recommendations</h2>
        ${summary.recommendations.map(rec => `
            <div class="recommendation-item">
                <div class="recommendation-header">
                    <div>
                        <strong>${rec.category}: ${rec.recommendation}</strong>
                    </div>
                    <span class="priority-badge" style="background: ${priorityColors[rec.priority]}">
                        ${rec.priority.toUpperCase()} PRIORITY
                    </span>
                </div>
                <p>${rec.details}</p>
            </div>
        `).join('')}
    </div>
    
    <div class="footer">
        <p>For detailed results, view the individual test reports:</p>
        <p>
            <a href="cross-browser-results/compatibility-report.html">Full Compatibility Report</a> |
            <a href="visual-regression/report.html">Visual Regression Report</a> |
            <a href="cross-browser-results/browser-compatibility-matrix.html">Browser Matrix</a>
        </p>
    </div>
</body>
</html>`;
}

// Generate markdown summary report
function generateMarkdownSummaryReport(summary) {
    let markdown = `# Cross-Browser Testing Summary Report

Generated: ${new Date(summary.generated).toLocaleString()}

## Overview

### Browsers Tested
${summary.overview.browsersTestd.map(b => `- ${b}`).join('\n')}

### Pages Tested
${summary.overview.pagesTestd.map(p => `- ${p}`).join('\n')}

### Viewports
${summary.overview.viewportsTested.map(v => `- ${v}`).join('\n')}

### Test Types
${summary.overview.testTypes.map(t => `- ${t}`).join('\n')}

## Test Results

`;

    if (summary.results.functional.total) {
        markdown += `### Functional Testing
- Total Tests: ${summary.results.functional.total}
- Passed: ${summary.results.functional.passed}
- Failed: ${summary.results.functional.failed}
- Success Rate: ${summary.results.functional.successRate}

`;
    }

    if (summary.results.visual.totalComparisons) {
        markdown += `### Visual Testing
- Total Comparisons: ${summary.results.visual.totalComparisons}
- Visually Identical: ${summary.results.visual.visuallyIdentical}
- Visual Differences: ${summary.results.visual.visualDifferences}
- Test Failures: ${summary.results.visual.testFailures}

`;
    }

    if (summary.criticalIssues.length > 0) {
        markdown += `## Critical Issues

`;
        const highSeverity = summary.criticalIssues.filter(i => i.severity === 'high');
        const mediumSeverity = summary.criticalIssues.filter(i => i.severity === 'medium');
        
        if (highSeverity.length > 0) {
            markdown += `### High Severity Issues
${highSeverity.map(issue => `- **${issue.browser} - ${issue.page}**: ${issue.issue}
  - Details: ${issue.details}`).join('\n')}

`;
        }
        
        if (mediumSeverity.length > 0) {
            markdown += `### Medium Severity Issues
${mediumSeverity.map(issue => `- **${issue.browser} - ${issue.page}**: ${issue.issue}
  - Details: ${issue.details}`).join('\n')}

`;
        }
    }

    markdown += `## Recommendations

${summary.recommendations.map(rec => `### ${rec.category} (${rec.priority} priority)
**${rec.recommendation}**
${rec.details}
`).join('\n')}

## Next Steps

1. Address high-priority issues first
2. Review visual differences to ensure they don't impact user experience
3. Implement recommended testing practices
4. Set up continuous cross-browser testing in CI/CD pipeline

## Additional Resources

- [Full Compatibility Report](cross-browser-results/compatibility-report.html)
- [Visual Regression Report](visual-regression/report.html)
- [Browser Compatibility Matrix](cross-browser-results/browser-compatibility-matrix.html)
`;

    return markdown;
}

// Run if executed directly
if (require.main === module) {
    generateCrossBrowserSummary().catch(console.error);
}

module.exports = { generateCrossBrowserSummary };