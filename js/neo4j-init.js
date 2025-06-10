/**
 * DEPRECATED: This file has been replaced by neo4j-unified.js
 * Please update your code to use the new centralized implementation
 */

console.warn('[DEPRECATION WARNING] neo4j-init.js is deprecated. Please use neo4j-unified.js instead.');
console.warn('See /js/NEO4J_CENTRALIZATION_README.md for migration guide.');

// Load the new unified version to maintain backward compatibility
const script = document.createElement('script');
script.src = '../js/neo4j-unified.js';
script.onload = function() {
  console.log('[NEO4J] Loaded unified version for backward compatibility');
};
document.head.appendChild(script);