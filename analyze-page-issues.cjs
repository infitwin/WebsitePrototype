const { chromium } = require('playwright');

async function analyzePageIssues() {
  const browser = await chromium.launch({ headless: false }); // Visual mode to see issues
  const page = await browser.newPage();
  
  try {
    console.log('🔍 VISUAL ANALYSIS: What should we see vs what we actually see?');
    
    // Login flow
    await page.goto('http://localhost:8357/pages/my-files.html');
    await page.waitForTimeout(2000);
    
    const loginTab = await page.locator('[data-tab="login"]').count();
    if (loginTab > 0) {
      await page.click('[data-tab="login"]');
      await page.fill('.login-email', 'weezer@yev.com');
      await page.fill('.login-password', '123456');
      await page.click('button:has-text("Access Your Memories")');
      await page.waitForTimeout(3000);
    }
    
    const skipButton = await page.locator('button:has-text("Skip for Testing")').count();
    if (skipButton > 0) {
      await page.click('button:has-text("Skip for Testing")');
      await page.waitForTimeout(2000);
    }
    
    await page.goto('http://localhost:8357/pages/my-files.html');
    await page.waitForTimeout(3000);
    
    // Take current screenshot
    await page.screenshot({ path: 'current-my-files-analysis.png', fullPage: true });
    console.log('📸 Current page screenshot: current-my-files-analysis.png');
    
    // ANALYZE WHAT'S WRONG vs WHAT'S EXPECTED
    const pageAnalysis = await page.evaluate(() => {
      return {
        // STORAGE INDICATOR ANALYSIS
        storage: {
          storageText: document.querySelector('.storage-text')?.textContent || 'not found',
          storagePercent: document.getElementById('storagePercent')?.textContent || 'not found',
          storageBar: {
            exists: !!document.getElementById('storageBar'),
            width: document.getElementById('storageBar')?.style.width || 'not set',
            backgroundColor: document.getElementById('storageBar')?.style.backgroundColor || 'not set'
          }
        },
        
        // FILE CARDS ANALYSIS
        files: {
          totalCards: document.querySelectorAll('.file-card').length,
          cardsWithFaces: document.querySelectorAll('.face-indicator').length,
          cardsProcessing: document.querySelectorAll('.processing-indicator').length,
          sampleCardData: Array.from(document.querySelectorAll('.file-card')).slice(0, 3).map(card => ({
            fileName: card.querySelector('.file-name')?.textContent || 'no name',
            faceIndicator: card.querySelector('.face-indicator')?.textContent || 'no faces',
            processingIndicator: card.querySelector('.processing-indicator')?.textContent || 'not processing',
            hasImage: !!card.querySelector('img'),
            thumbnailContent: card.querySelector('.file-thumbnail')?.textContent || 'no content'
          }))
        },
        
        // FILTER COUNTS ANALYSIS
        filters: {
          allCount: document.getElementById('allCount')?.textContent || 'not found',
          facesCount: document.getElementById('facesCount')?.textContent || 'not found', 
          processingCount: document.getElementById('processingCount')?.textContent || 'not found',
          recentCount: document.getElementById('recentCount')?.textContent || 'not found'
        },
        
        // PAGE LAYOUT ANALYSIS
        layout: {
          hasFiles: document.querySelectorAll('.file-card').length > 0,
          emptyStateVisible: document.getElementById('emptyState')?.style.display !== 'none',
          uploadZoneVisible: document.getElementById('uploadZone')?.style.display !== 'none',
          sidebarMargin: window.getComputedStyle(document.querySelector('.main-content-wrapper') || document.body).marginLeft
        }
      };
    });
    
    console.log('\n🔍 VISUAL ANALYSIS RESULTS:');
    
    // EXPECTED vs ACTUAL for Storage
    console.log('\n📊 STORAGE INDICATOR:');
    console.log('❓ EXPECTED: "3.5 GB of 10 GB used" with 35% and green bar');
    console.log('✓ ACTUAL:', pageAnalysis.storage.storageText);
    console.log('✓ ACTUAL Percent:', pageAnalysis.storage.storagePercent);
    console.log('✓ ACTUAL Bar Width:', pageAnalysis.storage.storageBar.width);
    
    if (pageAnalysis.storage.storageText.includes('NaN') || pageAnalysis.storage.storagePercent.includes('NaN')) {
      console.log('❌ ISSUE: Storage shows NaN - calculation error in storage logic');
    }
    
    // EXPECTED vs ACTUAL for Files
    console.log('\n📁 FILE DISPLAY:');
    console.log('❓ EXPECTED: Files with actual thumbnails, real face counts, proper processing states');
    console.log('✓ ACTUAL Total Files:', pageAnalysis.files.totalCards);
    console.log('✓ ACTUAL Files with Faces:', pageAnalysis.files.cardsWithFaces);
    console.log('✓ ACTUAL Files Processing:', pageAnalysis.files.cardsProcessing);
    
    console.log('\n📋 SAMPLE FILE CARDS:');
    pageAnalysis.files.sampleCardData.forEach((card, i) => {
      console.log(`File ${i + 1}:`);
      console.log(`  Name: ${card.fileName}`);
      console.log(`  Faces: ${card.faceIndicator}`);
      console.log(`  Processing: ${card.processingIndicator}`);
      console.log(`  Has Image: ${card.hasImage}`);
      console.log(`  Thumbnail: ${card.thumbnailContent}`);
    });
    
    // EXPECTED vs ACTUAL for Filters
    console.log('\n🏷️ FILTER COUNTS:');
    console.log('❓ EXPECTED: Accurate counts matching displayed files');
    console.log(`✓ ACTUAL All: ${pageAnalysis.filters.allCount} (should match ${pageAnalysis.files.totalCards} files)`);
    console.log(`✓ ACTUAL Faces: ${pageAnalysis.filters.facesCount} (should match ${pageAnalysis.files.cardsWithFaces} face indicators)`);
    console.log(`✓ ACTUAL Processing: ${pageAnalysis.filters.processingCount} (should match ${pageAnalysis.files.cardsProcessing} processing)`);
    
    // ISSUES FOUND
    console.log('\n❌ ISSUES DETECTED:');
    const issues = [];
    
    if (pageAnalysis.storage.storageText.includes('NaN')) {
      issues.push('Storage indicator shows NaN - storage calculation broken');
    }
    
    if (pageAnalysis.files.cardsWithFaces === 0 && pageAnalysis.files.totalCards > 0) {
      issues.push('No face indicators showing - face detection not working or database missing face data');
    }
    
    if (pageAnalysis.files.sampleCardData.some(card => !card.hasImage && card.thumbnailContent === '')) {
      issues.push('File thumbnails not loading - thumbnail generation failing');
    }
    
    if (parseInt(pageAnalysis.filters.allCount) !== pageAnalysis.files.totalCards) {
      issues.push(`Filter count mismatch - All shows ${pageAnalysis.filters.allCount} but ${pageAnalysis.files.totalCards} files displayed`);
    }
    
    if (pageAnalysis.layout.sidebarMargin !== '60px') {
      issues.push(`Sidebar margin wrong - expected 60px, got ${pageAnalysis.layout.sidebarMargin}`);
    }
    
    issues.forEach((issue, i) => {
      console.log(`${i + 1}. ${issue}`);
    });
    
    if (issues.length === 0) {
      console.log('✅ No major issues detected');
    }
    
    console.log('\n🎯 NEXT STEPS:');
    if (pageAnalysis.storage.storageText.includes('NaN')) {
      console.log('1. Fix storage calculation in updateStorageIndicator function');
    }
    if (pageAnalysis.files.cardsWithFaces === 0) {
      console.log('2. Check database for face data or fix face detection display');
    }
    if (issues.some(i => i.includes('thumbnail'))) {
      console.log('3. Fix thumbnail generation and display');
    }
    
  } catch (error) {
    console.error('❌ Analysis error:', error.message);
  } finally {
    console.log('\n⏳ Keeping browser open for 15 seconds to visually inspect...');
    await page.waitForTimeout(15000);
    await browser.close();
  }
}

analyzePageIssues().catch(console.error);