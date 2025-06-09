// Authentication helper for Playwright tests

export class AuthHelper {
  constructor(page) {
    this.page = page;
  }

  async loginAsTestUser(userType = 'standard') {
    const testUsers = {
      standard: {
        userName: 'Test User',
        userEmail: 'test@example.com',
        userId: 'test-user-123'
      },
      admin: {
        userName: 'Admin User', 
        userEmail: 'admin@example.com',
        userId: 'admin-user-456'
      },
      premium: {
        userName: 'Premium User',
        userEmail: 'premium@example.com', 
        userId: 'premium-user-789'
      }
    };

    const user = testUsers[userType];
    
    // Set localStorage values that the app expects
    await this.page.evaluate((userData) => {
      localStorage.setItem('userName', userData.userName);
      localStorage.setItem('userEmail', userData.userEmail);
      localStorage.setItem('userId', userData.userId);
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('authTimestamp', Date.now().toString());
      
      // Set user settings
      const userSettings = {
        displayName: userData.userName,
        emailAddress: userData.userEmail,
        emailNotifications: true,
        profileVisibility: true
      };
      localStorage.setItem('userSettings', JSON.stringify(userSettings));
    }, user);

    console.log(`✅ Logged in as ${user.userName} (${userType})`);
  }

  async logout() {
    await this.page.evaluate(() => {
      localStorage.removeItem('userName');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userId');
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('authTimestamp');
      localStorage.removeItem('userSettings');
    });
    console.log('✅ Logged out - localStorage cleared');
  }

  async skipAuthGuard() {
    // Bypass auth-guard.js by setting flag
    await this.page.evaluate(() => {
      window.skipAuthGuard = true;
      localStorage.setItem('skipAuthGuard', 'true');
    });
  }

  async isLoggedIn() {
    return await this.page.evaluate(() => {
      return localStorage.getItem('isAuthenticated') === 'true';
    });
  }

  async getCurrentUser() {
    return await this.page.evaluate(() => {
      return {
        name: localStorage.getItem('userName'),
        email: localStorage.getItem('userEmail'),
        id: localStorage.getItem('userId')
      };
    });
  }
}