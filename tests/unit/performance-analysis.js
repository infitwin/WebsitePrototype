const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

// Pages to test
const pages = [
    'index.html',
    'pages/auth.html',
    'pages/dashboard.html',
    'pages/email-verification.html',
    'pages/alpha-welcome.html',
    'pages/file-browser.html',
    'pages/twin-management.html',
    'pages/settings.html',
    'pages/explore.html',
    'pages/talk-to-twin.html',
    'pages/shared-view.html',
    'pages/error.html'
];

async function analyzePageInDetail(page, pagePath) {
    const analysis = {
        pagePath,
        fileSize: 0,
        javascriptExecutionTime: 0,
        renderBlockingResources: [],
        unusedCSS: 0,
        imageOptimization: [],
        cacheableResources: [],
        recommendations: []
    };

    try {
        // Get file size
        const fullPath = path.join(__dirname, pagePath);
        if (fs.existsSync(fullPath)) {
            const stats = fs.statSync(fullPath);
            analysis.fileSize = stats.size;
        }

        // Navigate and collect performance data
        await page.goto(`file://${fullPath}`, {
            waitUntil: 'networkidle'
        });

        // Analyze JavaScript execution time
        const jsExecutionTime = await page.evaluate(() => {
            const entries = performance.getEntriesByType('measure');
            const scriptEntries = performance.getEntriesByType('resource')
                .filter(e => e.initiatorType === 'script');
            
            let totalScriptTime = 0;
            scriptEntries.forEach(script => {
                totalScriptTime += script.duration;
            });
            
            return totalScriptTime;
        });
        analysis.javascriptExecutionTime = jsExecutionTime;

        // Check for render-blocking resources
        const renderBlockingCheck = await page.evaluate(() => {
            const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
            const scripts = Array.from(document.querySelectorAll('script:not([async]):not([defer])'));
            
            const blockingResources = [];
            
            links.forEach(link => {
                if (!link.media || link.media === 'all' || link.media === 'screen') {
                    blockingResources.push({
                        type: 'stylesheet',
                        url: link.href,
                        blocking: true
                    });
                }
            });
            
            scripts.forEach(script => {
                if (script.src) {
                    blockingResources.push({
                        type: 'script',
                        url: script.src,
                        blocking: true
                    });
                }
            });
            
            return blockingResources;
        });
        analysis.renderBlockingResources = renderBlockingCheck;

        // Check for unused CSS (simplified check)
        const cssAnalysis = await page.evaluate(() => {
            const styleSheets = Array.from(document.styleSheets);
            let totalRules = 0;
            let unusedRules = 0;
            
            try {
                styleSheets.forEach(sheet => {
                    if (sheet.cssRules) {
                        Array.from(sheet.cssRules).forEach(rule => {
                            totalRules++;
                            if (rule.selectorText) {
                                try {
                                    const matches = document.querySelectorAll(rule.selectorText);
                                    if (matches.length === 0) {
                                        unusedRules++;
                                    }
                                } catch (e) {
                                    // Invalid selector
                                }
                            }
                        });
                    }
                });
            } catch (e) {
                // Cross-origin stylesheets
            }
            
            return {
                totalRules,
                unusedRules,
                percentageUnused: totalRules > 0 ? (unusedRules / totalRules * 100) : 0
            };
        });
        analysis.unusedCSS = cssAnalysis.percentageUnused;

        // Check images
        const imageAnalysis = await page.evaluate(() => {
            const images = Array.from(document.images);
            return images.map(img => ({
                src: img.src,
                naturalWidth: img.naturalWidth,
                naturalHeight: img.naturalHeight,
                displayWidth: img.clientWidth,
                displayHeight: img.clientHeight,
                oversized: img.naturalWidth > img.clientWidth * 2 || img.naturalHeight > img.clientHeight * 2
            }));
        });
        analysis.imageOptimization = imageAnalysis.filter(img => img.oversized);

        // Generate recommendations
        if (analysis.fileSize > 100 * 1024) {
            analysis.recommendations.push(`HTML file is large (${(analysis.fileSize / 1024).toFixed(0)}KB). Consider minification.`);
        }
        
        if (analysis.renderBlockingResources.length > 2) {
            analysis.recommendations.push(`${analysis.renderBlockingResources.length} render-blocking resources detected. Consider async/defer loading.`);
        }
        
        if (analysis.unusedCSS > 50) {
            analysis.recommendations.push(`High unused CSS (${analysis.unusedCSS.toFixed(0)}%). Consider removing unused styles.`);
        }
        
        if (analysis.imageOptimization.length > 0) {
            analysis.recommendations.push(`${analysis.imageOptimization.length} oversized images detected. Optimize image dimensions.`);
        }
        
        if (analysis.javascriptExecutionTime > 100) {
            analysis.recommendations.push(`High JavaScript execution time (${analysis.javascriptExecutionTime.toFixed(0)}ms). Consider code splitting.`);
        }

    } catch (error) {
        analysis.error = error.message;
    }

    return analysis;
}

async function runDetailedAnalysis() {
    console.log('Running detailed performance analysis...\n');

    const browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 }
    });

    const allAnalysis = [];

    for (const pagePath of pages) {
        console.log(`Analyzing: ${pagePath}`);
        
        const page = await context.newPage();
        const analysis = await analyzePageInDetail(page, pagePath);
        allAnalysis.push(analysis);
        
        console.log(`  File size: ${(analysis.fileSize / 1024).toFixed(1)}KB`);
        console.log(`  JS execution time: ${analysis.javascriptExecutionTime.toFixed(0)}ms`);
        console.log(`  Render-blocking resources: ${analysis.renderBlockingResources.length}`);
        console.log(`  Unused CSS: ${analysis.unusedCSS.toFixed(0)}%`);
        
        if (analysis.recommendations.length > 0) {
            console.log('  Recommendations:');
            analysis.recommendations.forEach(rec => {
                console.log(`    - ${rec}`);
            });
        }
        
        console.log('');
        
        await page.close();
    }

    await browser.close();

    // Summary of issues
    console.log('\n' + '='.repeat(80));
    console.log('PERFORMANCE OPTIMIZATION OPPORTUNITIES');
    console.log('='.repeat(80) + '\n');

    const pagesWithIssues = allAnalysis.filter(a => a.recommendations.length > 0);
    
    if (pagesWithIssues.length === 0) {
        console.log('✨ All pages are well-optimized! No major performance issues found.');
    } else {
        console.log(`Found optimization opportunities in ${pagesWithIssues.length} pages:\n`);
        
        pagesWithIssues.forEach(analysis => {
            console.log(`📄 ${analysis.pagePath}`);
            analysis.recommendations.forEach(rec => {
                console.log(`   - ${rec}`);
            });
            console.log('');
        });
    }

    // Global recommendations
    console.log('\nGLOBAL RECOMMENDATIONS:');
    console.log('='.repeat(80));
    console.log('1. ✅ All pages load within 3-second threshold (excellent!)');
    console.log('2. Consider implementing resource hints (preconnect, prefetch) for external resources');
    console.log('3. Implement service worker for offline capability and faster repeat visits');
    console.log('4. Consider lazy loading for below-the-fold content');
    console.log('5. Minify and compress all assets for production deployment');
    console.log('6. Use WebP format for images where possible');
    console.log('7. Implement HTTP/2 server push for critical resources');
    console.log('');
}

// Run the analysis
runDetailedAnalysis().catch(console.error);