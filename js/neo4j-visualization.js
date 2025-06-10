/**
 * DEPRECATED: This file has been replaced by neo4j-centralized.js
 * Please update your code to use the new centralized implementation
 */

console.warn('[DEPRECATION WARNING] neo4j-visualization.js is deprecated. Please use neo4j-centralized.js instead.');
console.warn('See /js/NEO4J_CENTRALIZATION_README.md for migration guide.');

// Re-export from the new centralized module for backward compatibility
export { Neo4jVisualization } from './neo4j-centralized.js';