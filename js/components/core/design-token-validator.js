/**
 * Design Token Validator - Prevents Hardcoded Values
 * 
 * This module validates that components use design system tokens
 * instead of hardcoded values, preventing inconsistency.
 */

// Design system tokens that should be used instead of hardcoded values
const DESIGN_TOKENS = {
  // Colors that should use CSS custom properties
  colors: [
    '#6B46C1', '#8B5CF6', '#553C9A', // Primary purple variants
    '#F3F4F6', '#FFFFFF', '#F8F9FA', // Background colors
    '#10B981', '#FFD700', '#3B82F6', '#EF4444', // State colors
    '#374151', '#6B7280', '#9CA3AF', // Text colors
    '#E5E7EB', '#F3F4F6', '#D1D5DB' // Border colors
  ],
  
  // Spacing values that should use design system
  spacing: [
    '4px', '8px', '16px', '24px', '32px', '48px', '64px', '96px'
  ],
  
  // Font sizes that should use design system
  fontSizes: [
    '12px', '14px', '16px', '18px', '20px', '24px', '30px', '36px', '48px'
  ]
};

/**
 * Validate that an element uses design system tokens
 */
export function validateDesignTokens(element, componentType) {
  const isProduction = typeof process !== 'undefined' 
    ? process.env.NODE_ENV === 'production'
    : false; // In browser, assume not production
    
  if (isProduction) {
    return; // Skip validation in production
  }
  
  const issues = [];
  const computedStyle = window.getComputedStyle(element);
  
  // Check for hardcoded colors
  issues.push(...validateColors(computedStyle, componentType));
  
  // Check for hardcoded spacing
  issues.push(...validateSpacing(computedStyle, componentType));
  
  // Check for hardcoded font sizes
  issues.push(...validateFontSizes(computedStyle, componentType));
  
  // Report issues
  if (issues.length > 0) {
    console.group(`⚠️ Design System Violations in ${componentType}`);
    issues.forEach(issue => {
      console.warn(`${issue.property}: ${issue.value} should use ${issue.suggestion}`);
    });
    console.groupEnd();
    
    // In strict mode, throw error to force compliance
    const strictMode = typeof process !== 'undefined' 
      ? process.env.STRICT_DESIGN_SYSTEM === 'true'
      : false;
      
    if (strictMode) {
      throw new Error(`${componentType} violates design system. Use design tokens instead of hardcoded values.`);
    }
  }
}

/**
 * Validate color usage
 */
function validateColors(computedStyle, componentType) {
  const issues = [];
  const colorProperties = [
    'color', 'backgroundColor', 'borderColor', 
    'outlineColor', 'boxShadow'
  ];
  
  colorProperties.forEach(property => {
    const value = computedStyle[property];
    if (value && value !== 'none' && value !== 'transparent') {
      // Convert rgb/rgba to hex for comparison
      const hexColor = rgbToHex(value);
      
      if (DESIGN_TOKENS.colors.some(token => hexColor.includes(token))) {
        issues.push({
          property,
          value,
          suggestion: 'var(--color-*) design token',
          severity: 'warning'
        });
      }
    }
  });
  
  return issues;
}

/**
 * Validate spacing usage
 */
function validateSpacing(computedStyle, componentType) {
  const issues = [];
  const spacingProperties = [
    'padding', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
    'margin', 'marginTop', 'marginRight', 'marginBottom', 'marginLeft',
    'gap', 'rowGap', 'columnGap'
  ];
  
  spacingProperties.forEach(property => {
    const value = computedStyle[property];
    if (value && value !== '0px' && value !== 'auto' && value !== 'normal') {
      if (DESIGN_TOKENS.spacing.includes(value)) {
        issues.push({
          property,
          value,
          suggestion: 'var(--spacing-*) design token',
          severity: 'warning'
        });
      }
    }
  });
  
  return issues;
}

/**
 * Validate font size usage
 */
function validateFontSizes(computedStyle, componentType) {
  const issues = [];
  const fontSize = computedStyle.fontSize;
  
  if (fontSize && DESIGN_TOKENS.fontSizes.includes(fontSize)) {
    issues.push({
      property: 'fontSize',
      value: fontSize,
      suggestion: 'var(--font-size-*) design token',
      severity: 'warning'
    });
  }
  
  return issues;
}

/**
 * Convert RGB/RGBA color to hex for comparison
 */
function rgbToHex(rgb) {
  if (rgb.startsWith('#')) return rgb;
  
  const result = rgb.match(/\d+/g);
  if (!result || result.length < 3) return rgb;
  
  const [r, g, b] = result.map(num => parseInt(num));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
}

/**
 * Scan all elements on page for design system violations
 */
export function auditPageDesignSystem() {
  const isProduction = typeof process !== 'undefined' 
    ? process.env.NODE_ENV === 'production'
    : false; // In browser, assume not production
    
  if (isProduction) {
    return;
  }
  
  const issues = [];
  const elements = document.querySelectorAll('*');
  
  elements.forEach(element => {
    const tagName = element.tagName.toLowerCase();
    const className = element.className;
    
    try {
      const elementIssues = [];
      const computedStyle = window.getComputedStyle(element);
      
      elementIssues.push(...validateColors(computedStyle, `${tagName}.${className}`));
      elementIssues.push(...validateSpacing(computedStyle, `${tagName}.${className}`));
      elementIssues.push(...validateFontSizes(computedStyle, `${tagName}.${className}`));
      
      if (elementIssues.length > 0) {
        issues.push({
          element,
          tagName,
          className,
          issues: elementIssues
        });
      }
    } catch (e) {
      // Skip elements that can't be analyzed
    }
  });
  
  if (issues.length > 0) {
    console.group('🎨 Page Design System Audit');
    console.log(`Found ${issues.length} elements with design system violations`);
    issues.forEach(({ element, tagName, className, issues: elementIssues }) => {
      console.group(`${tagName}${className ? '.' + className : ''}`);
      elementIssues.forEach(issue => {
        console.warn(`${issue.property}: ${issue.value} → ${issue.suggestion}`);
      });
      console.log('Element:', element);
      console.groupEnd();
    });
    console.groupEnd();
  } else {
    console.log('✅ No design system violations found on this page');
  }
  
  return issues;
}

// Export utility for manual checking
if (typeof window !== 'undefined') {
  const isDevelopment = typeof process !== 'undefined' 
    ? process.env.NODE_ENV !== 'production'
    : window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  
  if (isDevelopment) {
    window.auditDesignSystem = auditPageDesignSystem;
  }
}