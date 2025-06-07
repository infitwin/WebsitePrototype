# Firebase Integration Guide

## Overview
This guide provides step-by-step instructions for integrating Firebase Authentication and Firestore into the Infitwin application.

## Prerequisites

### 1. Firebase Project Setup
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project named "infitwin-alpha" (or similar)
3. Enable Authentication with Email/Password provider
4. Create a Firestore database in production mode
5. Get your configuration values from Project Settings

### 2. Environment Setup
Create a `.env` file in the project root (never commit this):
```
FIREBASE_API_KEY=your-api-key
FIREBASE_AUTH_DOMAIN=your-auth-domain
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-storage-bucket
FIREBASE_MESSAGING_SENDER_ID=your-sender-id
FIREBASE_APP_ID=your-app-id
```

## Installation

### 1. Install Firebase SDK
```bash
npm install firebase
```

### 2. Update firebase-config.js
Replace the placeholder values with your actual Firebase configuration.

## Security Rules

### Firestore Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // Memories subcollection
      match /memories/{memoryId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

### Authentication Rules
- Email/Password authentication enabled
- Email verification required for full access
- Password reset functionality enabled

## Implementation Checklist

### Phase 1: Basic Auth
- [ ] Install Firebase SDK
- [ ] Configure firebase-config.js
- [ ] Update auth.js to use Firebase Auth
- [ ] Test signup/login flow
- [ ] Deploy security rules

### Phase 2: Email Verification
- [ ] Enable email verification in auth.js
- [ ] Update email-verification.html
- [ ] Test verification flow
- [ ] Handle unverified users

### Phase 3: Session Management
- [ ] Implement auth state persistence
- [ ] Add auth guards to protected pages
- [ ] Update dashboard with real user data
- [ ] Test cross-tab session sync

### Phase 4: Memory Storage
- [ ] Connect to Firestore
- [ ] Implement memory CRUD operations
- [ ] Update Winston to save memories
- [ ] Test data persistence

## Testing

### Manual Testing
1. **Registration Flow**
   - Sign up with valid email
   - Check verification email
   - Verify email works
   - Login successful

2. **Session Testing**
   - Login and refresh page
   - Open in new tab
   - Logout from one tab
   - Check auth guards

3. **Memory Testing**
   - Complete Winston interview
   - Check Firestore for saved memory
   - Reload and verify persistence
   - Test privacy settings

### Automated Testing
```javascript
// Example test structure
describe('Firebase Auth', () => {
  test('User can register', async () => {
    // Test implementation
  });
  
  test('Email verification required', async () => {
    // Test implementation
  });
});
```

## Common Issues

### Issue: Firebase not defined
**Solution:** Ensure Firebase SDK is properly imported and initialized

### Issue: Permission denied errors
**Solution:** Check Firestore security rules and user authentication state

### Issue: Email verification not sending
**Solution:** Check Firebase project email settings and quotas

### Issue: Session not persisting
**Solution:** Verify auth persistence setting is correct

## Development Workflow

1. **Make changes** to integration code
2. **Test locally** with Firebase emulators (optional)
3. **Run manual tests** from checklist
4. **Check browser console** for errors
5. **Commit with clear message**
6. **Update build plan** progress

## Resources

- [Firebase Auth Documentation](https://firebase.google.com/docs/auth/web/start)
- [Firestore Documentation](https://firebase.google.com/docs/firestore/quickstart)
- [Firebase Security Rules](https://firebase.google.com/docs/rules)
- [Firebase Emulator Suite](https://firebase.google.com/docs/emulator-suite)

## Support

For Firebase-specific issues:
- Check Firebase Status: https://status.firebase.google.com/
- Firebase Support: https://firebase.google.com/support

For project-specific issues:
- Create GitHub issue in the repository
- Tag with 'firebase-integration' label