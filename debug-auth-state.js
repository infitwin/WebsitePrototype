import { chromium } from 'playwright';

async function debugAuthState() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Capture console logs
  page.on('console', msg => {
    console.log(`[CONSOLE ${msg.type()}] ${msg.text()}`);
  });

  try {
    console.log('=== DEBUGGING AUTHENTICATION STATE TRANSITION ===');
    
    // 1. Start at login page and check initial auth state
    console.log('\n1. Checking initial auth state on login page...');
    await page.goto('http://localhost:8357/pages/auth.html');
    await page.waitForLoadState('networkidle');
    
    const initialAuthState = await page.evaluate(async () => {
      try {
        const { auth } = await import('../js/firebase-config.js');
        return {
          currentUser: auth.currentUser ? auth.currentUser.uid : null,
          authStateReady: true
        };
      } catch (error) {
        return { error: error.message, authStateReady: false };
      }
    });
    console.log('Initial auth state:', initialAuthState);
    
    // 2. Login
    console.log('\n2. Performing login...');
    await page.click('[data-tab="login"]');
    await page.fill('.login-email', 'weezer@yev.com');
    await page.fill('.login-password', '123456');
    await page.click('button:has-text("Access Your Memories")');
    await page.waitForURL('**/dashboard.html');
    
    // 3. Check auth state after login on dashboard
    console.log('\n3. Checking auth state on dashboard...');
    const dashboardAuthState = await page.evaluate(async () => {
      try {
        const { auth } = await import('../js/firebase-config.js');
        return {
          currentUser: auth.currentUser ? {
            uid: auth.currentUser.uid,
            email: auth.currentUser.email,
            emailVerified: auth.currentUser.emailVerified
          } : null,
          authStateReady: true
        };
      } catch (error) {
        return { error: error.message, authStateReady: false };
      }
    });
    console.log('Dashboard auth state:', dashboardAuthState);
    
    // 4. Navigate to My Files and check auth state immediately
    console.log('\n4. Navigating to My Files and checking auth state...');
    await page.goto('http://localhost:8357/pages/my-files.html');
    
    // Check auth state immediately after navigation
    const immediateMyFilesAuth = await page.evaluate(async () => {
      try {
        const { auth } = await import('../js/firebase-config.js');
        return {
          currentUser: auth.currentUser ? {
            uid: auth.currentUser.uid,
            email: auth.currentUser.email,
            emailVerified: auth.currentUser.emailVerified
          } : null,
          authStateReady: true
        };
      } catch (error) {
        return { error: error.message, authStateReady: false };
      }
    });
    console.log('Immediate My Files auth state:', immediateMyFilesAuth);
    
    // 5. Wait for page to load and check auth state again
    await page.waitForLoadState('networkidle');
    console.log('\n5. Checking auth state after My Files page load...');
    
    const finalMyFilesAuth = await page.evaluate(async () => {
      try {
        const { auth } = await import('../js/firebase-config.js');
        
        // Also check if auth state change listener exists
        const hasAuthListener = typeof auth.onAuthStateChanged === 'function';
        
        return {
          currentUser: auth.currentUser ? {
            uid: auth.currentUser.uid,
            email: auth.currentUser.email,
            emailVerified: auth.currentUser.emailVerified
          } : null,
          authStateReady: true,
          hasAuthListener
        };
      } catch (error) {
        return { error: error.message, authStateReady: false };
      }
    });
    console.log('Final My Files auth state:', finalMyFilesAuth);
    
    // 6. Try to manually wait for auth state and then call getUserFiles
    console.log('\n6. Manually waiting for auth state and testing getUserFiles...');
    const manualAuthTest = await page.evaluate(async () => {
      try {
        const { auth } = await import('../js/firebase-config.js');
        const { getUserFiles } = await import('../js/file-service.js');
        
        // Wait for auth state to be ready
        return new Promise((resolve) => {
          const unsubscribe = auth.onAuthStateChanged(async (user) => {
            console.log('Auth state changed:', user ? user.uid : 'no user');
            unsubscribe();
            
            if (user) {
              try {
                const result = await getUserFiles();
                resolve({
                  success: true,
                  user: { uid: user.uid, email: user.email },
                  filesResult: result
                });
              } catch (error) {
                resolve({
                  success: false,
                  user: { uid: user.uid, email: user.email },
                  error: error.message
                });
              }
            } else {
              resolve({
                success: false,
                user: null,
                error: 'No authenticated user'
              });
            }
          });
        });
      } catch (error) {
        return { error: error.message };
      }
    });
    console.log('Manual auth test result:', manualAuthTest);
    
    await page.screenshot({ path: '/home/tim/WebsitePrototype/debug-auth-state.png', fullPage: true });
    
  } catch (error) {
    console.error('Error during auth state debugging:', error);
  } finally {
    await browser.close();
  }
}

debugAuthState();