/**
 * Quick console check for settings page
 * Inject this into the browser console on the settings page
 */

console.log('🔧 Quick Settings Page Console Check');
console.log('='.repeat(40));

// Check 1: Firebase availability
console.log('\n1. Firebase Check:');
if (typeof firebase !== 'undefined') {
    console.log('✅ Firebase is loaded');
    console.log('✅ Firebase version:', firebase.SDK_VERSION || 'Version available');
    
    if (firebase.auth) {
        console.log('✅ Firebase Auth module loaded');
    } else {
        console.log('❌ Firebase Auth module missing');
    }
    
    if (firebase.firestore) {
        console.log('✅ Firebase Firestore module loaded');
    } else {
        console.log('⚠️  Firebase Firestore module not loaded (may not be needed)');
    }
} else {
    console.log('❌ Firebase not loaded');
}

// Check 2: Page elements
console.log('\n2. Page Elements Check:');
const displayName = document.querySelector('#displayName');
const saveButton = document.querySelector('button');
const toggles = document.querySelectorAll('.toggle-switch input[type="checkbox"]');

console.log(`✅ Display name field: ${displayName ? 'Found' : 'Missing'}`);
console.log(`✅ Save button: ${saveButton ? 'Found' : 'Missing'}`);
console.log(`✅ Toggle switches: ${toggles.length} found`);

// Check 3: localStorage
console.log('\n3. localStorage Check:');
const userSettings = localStorage.getItem('userSettings');
if (userSettings) {
    try {
        const parsed = JSON.parse(userSettings);
        console.log('✅ userSettings in localStorage:', Object.keys(parsed));
    } catch (e) {
        console.log('❌ userSettings exists but invalid JSON');
    }
} else {
    console.log('⚠️  No userSettings in localStorage yet');
}

// Check 4: Global variables
console.log('\n4. Global Variables Check:');
console.log(`userSettings variable: ${typeof userSettings !== 'undefined' ? 'Defined' : 'Undefined'}`);

console.log('\n' + '='.repeat(40));
console.log('🏁 Quick check complete');

// Return summary
return {
    firebase: typeof firebase !== 'undefined',
    firebaseAuth: typeof firebase !== 'undefined' && !!firebase.auth,
    displayNameField: !!document.querySelector('#displayName'),
    saveButton: !!document.querySelector('button'),
    toggleCount: document.querySelectorAll('.toggle-switch input[type="checkbox"]').length,
    hasLocalStorage: !!localStorage.getItem('userSettings'),
    userSettingsGlobal: typeof userSettings !== 'undefined'
};