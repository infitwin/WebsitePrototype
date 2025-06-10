// Simple script to check page state via curl and parsing
const { execSync } = require('child_process');
const fs = require('fs');

function checkPageState() {
    try {
        // Fetch the page HTML
        const html = execSync('curl -s http://localhost:8357/pages/my-files.html', { encoding: 'utf8' });
        
        // Check for navigation issues
        const hasUsername = html.includes('class="user-name username"') || html.includes('weezer@yev.com');
        const hasLoadingSpinner = html.includes('Loading your files');
        const hasEmptyState = html.includes('No files yet');
        
        console.log('🔍 Page State Check:');
        console.log('-------------------');
        console.log(`Username in nav: ${hasUsername ? '❌ YES (needs fixing)' : '✅ NO (correct)'}`);
        console.log(`Loading spinner: ${hasLoadingSpinner ? '✅ Present' : '❌ Missing'}`);
        console.log(`Empty state: ${hasEmptyState ? '✅ Present' : '❌ Missing'}`);
        
        // Save page for analysis
        fs.writeFileSync('my-files-page-snapshot.html', html);
        console.log('\n📄 Page saved to: my-files-page-snapshot.html');
        
        // Check JavaScript files
        console.log('\n🔍 Checking JavaScript files:');
        
        // Check navigation.js
        const navJs = execSync('curl -s http://localhost:8357/js/navigation.js', { encoding: 'utf8' });
        const hasUpdateUserInfo = navJs.includes('updateUserInfo()');
        console.log(`navigation.js calls updateUserInfo: ${hasUpdateUserInfo ? '❌ YES (may update nav)' : '✅ NO'}`);
        
        // Check file-service.js
        const fileJs = execSync('curl -s http://localhost:8357/js/file-service.js', { encoding: 'utf8' });
        const usesRootCollection = fileJs.includes('collection(db, "files")');
        console.log(`file-service.js uses root collection: ${usesRootCollection ? '✅ YES' : '❌ NO'}`);
        
    } catch (error) {
        console.error('Error:', error.message);
    }
}

checkPageState();