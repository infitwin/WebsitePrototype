import { chromium } from 'playwright';
import path from 'path';

async function captureDashboardNeo4j() {
    console.log('🎯 Starting dashboard Neo4j control capture...');
    
    const browser = await chromium.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const context = await browser.newContext({
        viewport: { width: 1400, height: 900 }
    });
    
    const page = await context.newPage();
    
    try {
        // Navigate to dashboard
        console.log('📍 Navigating to dashboard...');
        await page.goto('http://localhost:8357/pages/dashboard.html', { 
            waitUntil: 'networkidle',
            timeout: 10000 
        });
        
        // Wait for page to fully load
        await page.waitForTimeout(2000);
        
        // Check if Neo4j container exists
        const neo4jContainer = await page.$('#neo4j-graph-container');
        if (neo4jContainer) {
            console.log('✅ Neo4j container found');
        } else {
            console.log('❌ Neo4j container not found');
        }
        
        // Check if NexusControl is loaded
        const nexusControlExists = await page.evaluate(() => {
            return typeof window.NexusControl !== 'undefined';
        });
        console.log(`NexusControl loaded: ${nexusControlExists ? '✅' : '❌'}`);
        
        // Check if dashboard nexus viz is initialized
        const dashboardNexusExists = await page.evaluate(() => {
            return typeof window.dashboardNexusViz !== 'undefined';
        });
        console.log(`Dashboard Nexus initialized: ${dashboardNexusExists ? '✅' : '❌'}`);
        
        // Take full page screenshot
        console.log('📸 Taking full page screenshot...');
        await page.screenshot({
            path: 'dashboard-full-page.png',
            fullPage: true
        });
        
        // Focus on the Knowledge Graph section and take detailed screenshot
        const knowledgeSystem = await page.$('.knowledge-system');
        if (knowledgeSystem) {
            console.log('📸 Taking Knowledge Graph section screenshot...');
            await knowledgeSystem.screenshot({
                path: 'dashboard-neo4j-control.png'
            });
        }
        
        // Focus specifically on the graph section
        const graphSection = await page.$('.graph-section');
        if (graphSection) {
            console.log('📸 Taking detailed graph section screenshot...');
            await graphSection.screenshot({
                path: 'dashboard-graph-detailed.png'
            });
        }
        
        // Take screenshot of the Neo4j container specifically
        if (neo4jContainer) {
            console.log('📸 Taking Neo4j container screenshot...');
            await neo4jContainer.screenshot({
                path: 'dashboard-neo4j-container.png'
            });
        }
        
        // Inspect the actual DOM structure
        const graphStructure = await page.evaluate(() => {
            const container = document.querySelector('#neo4j-graph-container');
            if (!container) return 'Container not found';
            
            return {
                innerHTML: container.innerHTML.substring(0, 500),
                children: Array.from(container.children).map(child => ({
                    tagName: child.tagName,
                    className: child.className,
                    id: child.id
                }))
            };
        });
        
        console.log('🔍 Graph container structure:', JSON.stringify(graphStructure, null, 2));
        
        // Check console errors
        const logs = [];
        page.on('console', msg => logs.push(`${msg.type()}: ${msg.text()}`));
        page.on('pageerror', err => logs.push(`ERROR: ${err.message}`));
        
        await page.waitForTimeout(1000);
        
        console.log('📋 Console logs:', logs.slice(-10));
        
        console.log('✅ Screenshots saved:');
        console.log('  - dashboard-full-page.png (complete dashboard)');
        console.log('  - dashboard-neo4j-control.png (knowledge graph section)');
        console.log('  - dashboard-graph-detailed.png (graph section detail)');
        console.log('  - dashboard-neo4j-container.png (neo4j container)');
        
    } catch (error) {
        console.error('❌ Error capturing dashboard:', error.message);
    } finally {
        await browser.close();
    }
}

// Run the capture
captureDashboardNeo4j();