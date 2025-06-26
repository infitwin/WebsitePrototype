/**
 * Bundle checking utilities
 */

/**
 * Check if required bundles are loaded
 * @returns {boolean} True if React, ReactDOM, and NexusGraphControl are loaded
 */
export function checkBundle() {
    const hasReact = typeof React !== 'undefined';
    const hasReactDOM = typeof ReactDOM !== 'undefined';
    const hasNexus = typeof window.NexusGraphControl !== 'undefined';
    
    return hasReact && hasReactDOM && hasNexus;
}