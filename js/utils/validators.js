/**
 * Validators
 * 
 * Input validation functions for data integrity and security
 */

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid
 */
export function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} Validation result
 */
export function validatePassword(password) {
    const errors = [];
    
    if (password.length < 8) {
        errors.push('Password must be at least 8 characters');
    }
    
    if (!/[a-z]/.test(password)) {
        errors.push('Password must contain lowercase letters');
    }
    
    if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain uppercase letters');
    }
    
    if (!/[0-9]/.test(password)) {
        errors.push('Password must contain numbers');
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

/**
 * Validate memory object
 * @param {Object} memory - Memory object to validate
 * @returns {Object} Validation result
 */
export function validateMemory(memory) {
    const errors = [];
    
    // Required fields
    if (!memory.userId) {
        errors.push('User ID is required');
    }
    
    if (!memory.content || memory.content.trim().length === 0) {
        errors.push('Content is required');
    }
    
    // Content length
    if (memory.content && memory.content.length > 5000) {
        errors.push('Content must be less than 5000 characters');
    }
    
    // Valid type
    const validTypes = ['winston_interview', 'manual', 'voice', 'photo'];
    if (!validTypes.includes(memory.type)) {
        errors.push(`Type must be one of: ${validTypes.join(', ')}`);
    }
    
    // Valid privacy
    const validPrivacy = ['private', 'shared'];
    if (!validPrivacy.includes(memory.privacy)) {
        errors.push(`Privacy must be one of: ${validPrivacy.join(', ')}`);
    }
    
    // Timestamp format
    if (memory.timestamp && !isValidISODate(memory.timestamp)) {
        errors.push('Timestamp must be valid ISO date string');
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

/**
 * Sanitize user input to prevent XSS
 * @param {string} input - User input
 * @returns {string} Sanitized input
 */
export function sanitizeInput(input) {
    if (typeof input !== 'string') return '';
    
    // Basic HTML entity encoding
    return input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
}

/**
 * Validate and sanitize tags
 * @param {string[]} tags - Array of tags
 * @returns {string[]} Sanitized tags
 */
export function sanitizeTags(tags) {
    if (!Array.isArray(tags)) return [];
    
    return tags
        .filter(tag => typeof tag === 'string')
        .map(tag => tag.trim().toLowerCase())
        .filter(tag => tag.length > 0 && tag.length <= 50)
        .filter(tag => /^[a-z0-9-_]+$/.test(tag))
        .slice(0, 20); // Maximum 20 tags
}

/**
 * Check if string is valid ISO date
 * @param {string} dateString - Date string to validate
 * @returns {boolean} True if valid ISO date
 */
export function isValidISODate(dateString) {
    try {
        const date = new Date(dateString);
        return date.toISOString() === dateString;
    } catch {
        return false;
    }
}

/**
 * Validate file for memory attachment
 * @param {File} file - File to validate
 * @returns {Object} Validation result
 */
export function validateMemoryFile(file) {
    const errors = [];
    const maxSize = 50 * 1024 * 1024; // 50MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    
    if (file.size > maxSize) {
        errors.push('File must be less than 50MB');
    }
    
    if (!allowedTypes.includes(file.type)) {
        errors.push('File must be JPEG, PNG, GIF, or WebP');
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

/**
 * Validate user profile data
 * @param {Object} profile - Profile data
 * @returns {Object} Validation result
 */
export function validateProfile(profile) {
    const errors = [];
    
    if (!profile.name || profile.name.trim().length === 0) {
        errors.push('Name is required');
    }
    
    if (profile.name && profile.name.length > 100) {
        errors.push('Name must be less than 100 characters');
    }
    
    if (profile.email && !isValidEmail(profile.email)) {
        errors.push('Invalid email format');
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors
    };
}