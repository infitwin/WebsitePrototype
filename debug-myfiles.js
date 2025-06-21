import { chromium } from 'playwright';

async function debugMyFiles() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Capture console logs
  page.on('console', msg => {
    console.log(`[CONSOLE ${msg.type()}] ${msg.text()}`);
  });

  // Capture network errors
  page.on('response', response => {
    if (!response.ok()) {
      console.log(`[NETWORK ERROR] ${response.status()} ${response.url()}`);
    }
  });

  try {
    console.log('=== DEBUGGING MY FILES PAGE ===');
    
    // 1. Navigate to auth page and login
    console.log('\n1. Logging in...');
    await page.goto('http://localhost:8357/pages/auth.html');
    await page.click('[data-tab="login"]');
    await page.fill('.login-email', 'weezer@yev.com');
    await page.fill('.login-password', '123456');
    await page.click('button:has-text("Access Your Memories")');
    
    // Wait for dashboard to load
    await page.waitForURL('**/dashboard.html');
    console.log('✓ Login successful');
    
    // 2. Navigate to My Files page
    console.log('\n2. Navigating to My Files page...');
    await page.goto('http://localhost:8357/pages/my-files.html');
    await page.waitForLoadState('networkidle');
    console.log('✓ My Files page loaded');
    
    // 3. Inject debugging code
    console.log('\n3. Injecting debugging code...');
    
    const debugResults = await page.evaluate(async () => {
      const results = {
        firebaseInitialized: false,
        userAuthenticated: false,
        getUserFilesExists: false,
        getUserFilesResult: null,
        firebaseConnection: null,
        consoleErrors: [],
        domElements: {},
        moduleSystem: {},
        imports: {}
      };
      
      // Check module system
      results.moduleSystem = {
        firebaseConfig: typeof window.firebase !== 'undefined' ? 'window.firebase exists' : 'no window.firebase',
        importMap: !!document.querySelector('script[type="importmap"]'),
        moduleScripts: document.querySelectorAll('script[type="module"]').length
      };
      
      // Check if Firebase v9 modules are available
      try {
        const { auth, db, storage } = await import('../js/firebase-config.js');
        results.imports.firebaseConfig = 'imported successfully';
        results.firebaseInitialized = true;
        
        // Check authentication
        const user = auth.currentUser;
        results.userAuthenticated = !!user;
        if (user) {
          results.userInfo = {
            uid: user.uid,
            email: user.email,
            emailVerified: user.emailVerified
          };
        }
        
        // Check if getUserFiles function exists and try to call it
        try {
          const { getUserFiles } = await import('../js/file-service.js');
          results.getUserFilesExists = true;
          results.imports.fileService = 'imported successfully';
          
          // Try to call getUserFiles
          const filesResult = await getUserFiles();
          results.getUserFilesResult = filesResult;
        } catch (error) {
          results.getUserFilesResult = { error: error.message, stack: error.stack };
          results.imports.fileService = `error: ${error.message}`;
        }
        
      } catch (error) {
        results.firebaseConnection = error.message;
        results.imports.firebaseConfig = `error: ${error.message}`;
      }
      
      // Check for key DOM elements
      results.domElements = {
        filesContainer: !!document.querySelector('#filesContainer'),
        loadingState: !!document.querySelector('#loadingState'),
        emptyState: !!document.querySelector('#emptyState'),
        uploadZone: !!document.querySelector('#uploadZone'),
        loadingGrid: !!document.querySelector('#loadingGrid'),
        mainContentWrapper: !!document.querySelector('.main-content-wrapper'),
        symphonyContent: !!document.querySelector('.symphony-content')
      };
      
      // Check if page initialization is complete
      results.pageState = {
        domContentLoaded: document.readyState,
        initializeFunctionExists: typeof window.initializeMyFiles !== 'undefined',
        currentFiles: typeof window.currentFiles !== 'undefined' ? window.currentFiles : 'undefined'
      };
      
      return results;
    });
    
    // 4. Check Firebase configuration
    console.log('\n4. Checking Firebase configuration...');
    const firebaseConfig = await page.evaluate(() => {
      if (typeof firebase !== 'undefined') {
        return {
          app: firebase.app().options,
          authDomain: firebase.app().options.authDomain,
          projectId: firebase.app().options.projectId
        };
      }
      return null;
    });
    
    // 5. Test file service functions directly
    console.log('\n5. Testing file service functions...');
    const fileServiceTest = await page.evaluate(async () => {
      const tests = {};
      
      // Test Firebase Storage reference
      if (typeof firebase !== 'undefined' && firebase.storage) {
        try {
          const storage = firebase.storage();
          const storageRef = storage.ref();
          tests.storageRef = 'Available';
        } catch (error) {
          tests.storageRef = `Error: ${error.message}`;
        }
      }
      
      // Test Firestore
      if (typeof firebase !== 'undefined' && firebase.firestore) {
        try {
          const db = firebase.firestore();
          tests.firestore = 'Available';
        } catch (error) {
          tests.firestore = `Error: ${error.message}`;
        }
      }
      
      return tests;
    });
    
    // 6. Take screenshot for visual debugging
    await page.screenshot({ path: '/home/tim/WebsitePrototype/debug-myfiles-screenshot.png', fullPage: true });
    
    // 7. Print results
    console.log('\n=== DEBUG RESULTS ===');
    console.log('Module System:', debugResults.moduleSystem);
    console.log('Imports:', debugResults.imports);
    console.log('Firebase Initialized:', debugResults.firebaseInitialized);
    console.log('User Authenticated:', debugResults.userAuthenticated);
    if (debugResults.userInfo) {
      console.log('User Info:', debugResults.userInfo);
    }
    console.log('getUserFiles Function Exists:', debugResults.getUserFilesExists);
    console.log('getUserFiles Result:', debugResults.getUserFilesResult);
    console.log('Page State:', debugResults.pageState);
    console.log('Firebase Configuration:', firebaseConfig);
    console.log('File Service Tests:', fileServiceTest);
    console.log('DOM Elements:', debugResults.domElements);
    
    if (debugResults.firebaseConnection) {
      console.log('Firebase Connection Error:', debugResults.firebaseConnection);
    }
    
    console.log('\nScreenshot saved to: debug-myfiles-screenshot.png');
    
  } catch (error) {
    console.error('Error during debugging:', error);
  } finally {
    await browser.close();
  }
}

debugMyFiles();