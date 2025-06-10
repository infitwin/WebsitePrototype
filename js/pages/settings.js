/**
 * Settings Page Module
 * Uses centralized components from /js/components/ui/
 */

import { Button } from '../components/ui/button.js';
import { Modal } from '../components/ui/modal.js';
import { FormInput, FormValidator } from '../components/ui/form.js';
import { guardPage } from '../auth-guard.js';

// Settings state management
let userSettings = {
    displayName: 'John Doe',
    emailAddress: 'john.doe@email.com',
    phoneNumber: '+1 (555) 123-4567',
    timezone: 'America/Los_Angeles',
    emailNotifications: true,
    interviewReminders: true,
    weeklyDigest: false,
    sharedTwinAlerts: true,
    profileVisibility: true,
    analytics: true,
    memorySuggestions: true,
    // Preferences
    themePreference: 'light',
    languagePreference: 'en',
    dateFormat: 'mdy',
    autoSaveInterviews: true,
    compactView: false,
    animationEffects: true,
    soundEffects: false
};

let originalSettings = {};
let hasUnsavedChanges = false;
let isFormSubmitting = false;

// Form validators
const validators = {
    email: (value) => FormValidator.email(value) || 'Please enter a valid email address',
    phone: (value) => !value || FormValidator.phone(value) || 'Please enter a valid phone number',
    required: (value) => FormValidator.required(value) || 'This field is required',
    minLength: (min) => (value) => FormValidator.minLength(value, min) || `Must be at least ${min} characters`,
    passwordMatch: (password) => (value) => value === password || 'Passwords do not match',
    notSameAsOld: (oldPassword) => (value) => value !== oldPassword || 'New password must be different from current password'
};

// Initialize page
export function initializeSettings() {
    console.log('Settings initialized');
    
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('userSettings');
    if (savedSettings) {
        userSettings = { ...userSettings, ...JSON.parse(savedSettings) };
    }
    
    // Store original settings for reset functionality
    originalSettings = { ...userSettings };
    
    // Populate form fields
    populateFormFields();
    setupToggleSwitches();
    setupEventListeners();
    setupButtons();
    
    // Validate timezone on initialization
    validateTimezone();
    
    // Start monitoring for programmatic changes
    monitorTimezoneChanges();
}

// Setup all event listeners
function setupEventListeners() {
    // Account form
    const accountForm = document.getElementById('accountForm');
    accountForm.addEventListener('submit', handleAccountFormSubmit);
    
    // Security form
    const securityForm = document.getElementById('securityForm');
    securityForm.addEventListener('submit', handleSecurityFormSubmit);
    
    // Form input changes
    const formInputs = document.querySelectorAll('.infitwin-form__input');
    formInputs.forEach(input => {
        input.addEventListener('input', handleFormInputChange);
        input.addEventListener('blur', (e) => {
            if (e.target.dataset.validate) {
                validateField(e.target);
            }
        });
    });
    
    // Password strength checking
    const newPasswordInput = document.getElementById('newPassword');
    newPasswordInput.addEventListener('input', checkPasswordStrength);
    
    // Confirm password validation
    const confirmPasswordInput = document.getElementById('confirmPassword');
    confirmPasswordInput.addEventListener('input', validatePasswordMatch);
    
    // Toggle switches
    const toggleSwitches = document.querySelectorAll('.toggle-switch');
    toggleSwitches.forEach(toggle => {
        toggle.addEventListener('click', handleToggleClick);
    });
    
    // Preference dropdowns
    const preferenceSelects = ['themePreference', 'languagePreference', 'dateFormat'];
    preferenceSelects.forEach(id => {
        const element = document.getElementById(id);
        element.addEventListener('change', handlePreferenceChange);
    });
    
    // Timezone validation
    const timezoneSelect = document.getElementById('timezone');
    timezoneSelect.addEventListener('change', validateTimezone);
    
    // Warn about unsaved changes
    window.addEventListener('beforeunload', function(e) {
        if (hasUnsavedChanges) {
            e.preventDefault();
            e.returnValue = '';
        }
    });
}

// Setup centralized buttons
function setupButtons() {
    // Replace Save Account button
    const saveAccountBtn = document.getElementById('saveAccountBtn');
    if (saveAccountBtn) {
        const parent = saveAccountBtn.parentElement;
        saveAccountBtn.remove();
        
        const newSaveBtn = new Button({
            text: 'Save Changes',
            type: 'primary',
            icon: '💾',
            onClick: () => handleAccountFormSubmit(new Event('submit'))
        });
        parent.insertBefore(newSaveBtn.element, parent.firstChild);
    }
    
    // Replace logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        const parent = logoutBtn.parentElement;
        logoutBtn.remove();
        
        const newLogoutBtn = new Button({
            text: 'Sign Out',
            type: 'danger',
            icon: '🚪',
            onClick: handleLogout
        });
        parent.appendChild(newLogoutBtn.element);
    }
    
    // Replace preferences save button
    const savePreferencesBtn = document.getElementById('savePreferencesBtn');
    if (savePreferencesBtn) {
        const parent = savePreferencesBtn.parentElement;
        savePreferencesBtn.remove();
        
        const newPrefsBtn = new Button({
            text: 'Save Preferences',
            type: 'primary',
            icon: '⚙️',
            onClick: handleSavePreferences
        });
        parent.insertBefore(newPrefsBtn.element, parent.firstChild);
    }
}

// Form population
function populateFormFields() {
    const fields = [
        { id: 'displayName', setting: 'displayName' },
        { id: 'emailAddress', setting: 'emailAddress' },
        { id: 'phoneNumber', setting: 'phoneNumber' },
        { id: 'timezone', setting: 'timezone' },
        { id: 'themePreference', setting: 'themePreference' },
        { id: 'languagePreference', setting: 'languagePreference' },
        { id: 'dateFormat', setting: 'dateFormat' }
    ];
    
    fields.forEach(({ id, setting }) => {
        const field = document.getElementById(id);
        if (field) {
            field.value = userSettings[setting];
        }
    });
}

// Toggle setup
function setupToggleSwitches() {
    const toggles = document.querySelectorAll('[data-setting]');
    toggles.forEach(toggle => {
        const setting = toggle.dataset.setting;
        const input = toggle.querySelector('.toggle-input');
        const isActive = userSettings[setting];
        
        if (isActive) {
            toggle.classList.add('active');
            input.checked = true;
        } else {
            toggle.classList.remove('active');
            input.checked = false;
        }
    });
}

// Account form submission
async function handleAccountFormSubmit(e) {
    e.preventDefault();
    
    if (isFormSubmitting) return;
    
    // Validate timezone
    const timezoneValue = document.getElementById('timezone').value;
    const validTimezones = ['America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles'];
    
    if (!validTimezones.includes(timezoneValue)) {
        showFieldError('timezone', 'Please select a valid timezone');
        return;
    }
    
    clearFieldError('timezone');
    isFormSubmitting = true;
    
    // Create loading button
    const saveBtn = Button.primary({
        text: 'Saving...',
        loading: true
    });
    
    // Replace current button with loading state
    const buttonGroup = document.querySelector('#accountForm .button-group');
    const currentBtn = buttonGroup.querySelector('button');
    currentBtn.replaceWith(saveBtn.element);
    
    // Simulate API call
    setTimeout(() => {
        // Update settings
        userSettings.displayName = document.getElementById('displayName').value;
        userSettings.emailAddress = document.getElementById('emailAddress').value;
        userSettings.phoneNumber = document.getElementById('phoneNumber').value;
        userSettings.timezone = document.getElementById('timezone').value;
        
        saveSettings();
        showSuccessMessage('Account settings saved!');
        hasUnsavedChanges = false;
        
        // Replace with normal button
        const newSaveBtn = Button.primary({
            text: 'Save Changes',
            icon: '💾',
            onClick: () => handleAccountFormSubmit(new Event('submit'))
        });
        saveBtn.element.replaceWith(newSaveBtn.element);
        isFormSubmitting = false;
    }, 1500);
}

// Security form submission
async function handleSecurityFormSubmit(e) {
    e.preventDefault();
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Validate all fields
    const errors = [];
    if (!validators.required(currentPassword)) {
        showFieldError('currentPassword', 'Current password is required');
        errors.push('currentPassword');
    }
    
    if (!validators.required(newPassword)) {
        showFieldError('newPassword', 'New password is required');
        errors.push('newPassword');
    } else if (!validators.minLength(8)(newPassword)) {
        showFieldError('newPassword', 'Password must be at least 8 characters');
        errors.push('newPassword');
    } else if (!validators.notSameAsOld(currentPassword)(newPassword)) {
        showFieldError('newPassword', 'New password must be different from current password');
        errors.push('newPassword');
    }
    
    if (!validators.required(confirmPassword)) {
        showFieldError('confirmPassword', 'Please confirm your password');
        errors.push('confirmPassword');
    } else if (!validators.passwordMatch(newPassword)(confirmPassword)) {
        showFieldError('confirmPassword', 'Passwords do not match');
        errors.push('confirmPassword');
    }
    
    if (errors.length > 0) return;
    
    // Show loading state
    const changeBtn = Button.primary({
        text: 'Changing...',
        loading: true
    });
    
    const buttonGroup = document.querySelector('#securityForm .button-group');
    const currentBtn = buttonGroup.querySelector('button');
    currentBtn.replaceWith(changeBtn.element);
    
    // Simulate API call
    setTimeout(() => {
        showSuccessMessage('Password changed successfully!');
        resetSecurityForm();
        
        // Replace with normal button
        const newChangeBtn = Button.primary({
            text: 'Change Password',
            icon: '🔒',
            onClick: () => handleSecurityFormSubmit(new Event('submit'))
        });
        changeBtn.element.replaceWith(newChangeBtn.element);
    }, 2000);
}

// Handle logout
async function handleLogout() {
    const modal = Modal.confirm({
        title: 'Sign Out',
        message: 'Are you sure you want to sign out?',
        confirmText: 'Sign Out',
        onConfirm: async () => {
            try {
                // Sign out from Firebase
                await firebase.auth().signOut();
                
                // Clear local storage
                localStorage.removeItem('userName');
                localStorage.removeItem('userEmail');
                localStorage.removeItem('userSettings');
                
                // Redirect to login page
                window.location.href = '../auth.html';
            } catch (error) {
                console.error('Logout error:', error);
                Modal.alert({
                    title: 'Error',
                    message: 'Error signing out. Please try again.',
                    type: 'danger'
                });
            }
        }
    });
}

// Password strength checker
function checkPasswordStrength() {
    const password = document.getElementById('newPassword').value;
    const strengthContainer = document.getElementById('passwordStrength');
    const strengthText = strengthContainer.querySelector('.strength-text');
    
    if (password.length === 0) {
        strengthContainer.classList.remove('show');
        return;
    }
    
    strengthContainer.classList.add('show');
    
    let score = 0;
    let feedback = [];
    let isWeak = false;
    
    // Check for weak patterns
    const weakPatterns = [
        /^(.)\1{7,}$/,
        /^(012|123|234|345|456|567|678|789|890)+/,
        /^(987|876|765|654|543|432|321|210|109)+/,
        /^(qwerty|asdf|zxcv|password|admin|login)/i,
        /^[0-9]+$/,
        /^[a-z]+$/,
        /^[A-Z]+$/,
    ];
    
    for (const pattern of weakPatterns) {
        if (pattern.test(password)) {
            isWeak = true;
            break;
        }
    }
    
    if (isWeak) {
        score = 0;
        feedback.push('avoid common patterns');
    } else {
        if (password.length >= 8) score++;
        else feedback.push('at least 8 characters');
        
        if (/[a-z]/.test(password)) score++;
        else feedback.push('lowercase letters');
        
        if (/[A-Z]/.test(password)) score++;
        else feedback.push('uppercase letters');
        
        if (/[0-9]/.test(password)) score++;
        else feedback.push('numbers');
        
        if (/[^A-Za-z0-9]/.test(password)) score++;
        else feedback.push('special characters');
    }
    
    // Update UI
    strengthContainer.className = 'password-strength show';
    const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong'];
    
    if (score <= 1) {
        strengthContainer.classList.add('strength-weak');
        strengthText.textContent = `${strengthLabels[0]} - Add ${feedback.slice(0, 2).join(', ')}`;
    } else if (score === 2) {
        strengthContainer.classList.add('strength-fair');
        strengthText.textContent = `${strengthLabels[1]} - Add ${feedback.slice(0, 1).join(', ')}`;
    } else if (score === 3) {
        strengthContainer.classList.add('strength-good');
        strengthText.textContent = `${strengthLabels[2]} - Almost there!`;
    } else {
        strengthContainer.classList.add('strength-strong');
        strengthText.textContent = `${strengthLabels[3]} - Excellent password`;
    }
}

// Utility functions
function showFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    const errorDiv = field.parentNode.querySelector('.form-error');
    
    field.classList.add('error');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    }
    
    field.focus();
}

function clearFieldError(fieldId) {
    const field = document.getElementById(fieldId);
    const errorDiv = field.parentNode.querySelector('.form-error');
    
    field.classList.remove('error');
    if (errorDiv) {
        errorDiv.style.display = 'none';
    }
}

function showSuccessMessage(message) {
    const messageEl = document.getElementById('successMessage');
    messageEl.textContent = message;
    messageEl.classList.add('show');
    
    setTimeout(() => {
        messageEl.classList.remove('show');
    }, 3000);
}

function saveSettings() {
    localStorage.setItem('userSettings', JSON.stringify(userSettings));
    console.log('Settings saved:', userSettings);
}

// Additional helper functions
function handleFormInputChange() {
    hasUnsavedChanges = true;
}

function handleToggleClick(e) {
    e.preventDefault();
    const toggle = e.currentTarget;
    const input = toggle.querySelector('.toggle-input');
    const setting = toggle.dataset.setting;
    
    if (toggle.classList.contains('saving')) return;
    
    const newState = !input.checked;
    input.checked = newState;
    
    if (newState) {
        toggle.classList.add('active');
    } else {
        toggle.classList.remove('active');
    }
    
    toggle.classList.add('saving');
    
    setTimeout(() => {
        userSettings[setting] = newState;
        saveSettings();
        showSuccessMessage('Setting updated!');
        toggle.classList.remove('saving');
    }, 300);
}

function handlePreferenceChange() {
    hasUnsavedChanges = true;
}

function handleSavePreferences() {
    const saveBtn = Button.primary({
        text: 'Saving...',
        loading: true
    });
    
    // Update preferences
    userSettings.themePreference = document.getElementById('themePreference').value;
    userSettings.languagePreference = document.getElementById('languagePreference').value;
    userSettings.dateFormat = document.getElementById('dateFormat').value;
    
    setTimeout(() => {
        saveSettings();
        showSuccessMessage('Preferences saved successfully!');
        hasUnsavedChanges = false;
    }, 1000);
}

function validateField(field) {
    const fieldType = field.dataset.validate;
    const value = field.value.trim();
    
    clearFieldError(field.id);
    
    switch (fieldType) {
        case 'email':
            if (value && !validators.email(value)) {
                showFieldError(field.id, 'Please enter a valid email address');
            }
            break;
        case 'phone':
            if (value && !validators.phone(value)) {
                showFieldError(field.id, 'Please enter a valid phone number');
            }
            break;
        case 'required':
            if (!validators.required(value)) {
                showFieldError(field.id, 'This field is required');
            }
            break;
    }
}

function validatePasswordMatch() {
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const confirmInput = document.getElementById('confirmPassword');
    
    if (confirmPassword.length > 0 && newPassword !== confirmPassword) {
        confirmInput.classList.add('error');
    } else {
        confirmInput.classList.remove('error');
    }
}

function validateTimezone() {
    const timezoneSelect = document.getElementById('timezone');
    const timezoneValue = timezoneSelect.value;
    const validTimezones = ['America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles'];
    
    if (!validTimezones.includes(timezoneValue)) {
        timezoneSelect.value = 'America/Los_Angeles';
        showFieldError('timezone', 'Invalid timezone selected. Reset to Pacific Time.');
        setTimeout(() => clearFieldError('timezone'), 3000);
        return false;
    }
    
    clearFieldError('timezone');
    return true;
}

function monitorTimezoneChanges() {
    const timezoneSelect = document.getElementById('timezone');
    let lastValidValue = timezoneSelect.value || 'America/Los_Angeles';
    const validTimezones = ['America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles'];
    
    const checkDisabled = () => window.disableTimezoneMonitoring;
    
    const observer = new MutationObserver(() => {
        if (checkDisabled()) return;
        
        const currentValue = timezoneSelect.value;
        if (!currentValue || !validTimezones.includes(currentValue)) {
            timezoneSelect.value = lastValidValue;
        } else {
            lastValidValue = currentValue;
        }
    });
    
    observer.observe(timezoneSelect, { 
        attributes: true, 
        attributeFilter: ['value'] 
    });
}

function resetSecurityForm() {
    document.getElementById('securityForm').reset();
    document.getElementById('passwordStrength').classList.remove('show');
    
    const passwordInputs = ['currentPassword', 'newPassword', 'confirmPassword'];
    passwordInputs.forEach(id => clearFieldError(id));
}

// Export functions needed by other modules
export {
    handleLogout,
    showSuccessMessage,
    saveSettings
};