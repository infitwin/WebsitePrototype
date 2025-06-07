# Bug Report: Missing Password Toggle on Auth Page

**Page:** pages/auth.html  
**Browser:** All browsers  
**Device:** Desktop/Mobile/Tablet  
**Test Category:** Interactive  
**Priority:** Medium

## Expected Behavior
Password fields should have an eye icon that allows users to toggle password visibility (show/hide text).

## Actual Behavior
Password fields only have standard password input with no toggle functionality.

## Steps to Reproduce
1. Go to 'pages/auth.html'
2. Click on password field
3. Look for eye icon to toggle password visibility
4. No toggle functionality present

## Impact
- Reduces user experience for password entry
- Users cannot verify they typed password correctly
- Common UX pattern missing

## Suggested Fix
Add password toggle functionality:
1. Add eye icon next to password fields
2. Add JavaScript to toggle input type between 'password' and 'text'
3. Update CSS for proper styling

## Testing Checklist Reference
- **Document:** docs/testing/frontend-testing-checklist.md
- **Test Item:** "Password toggle works"
- **Page Section:** PAGE 2: pages/auth.html - Interactive Tests