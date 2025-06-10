/**
 * Node helper utilities for Neo4j Interview Validation
 * IMPORTED FROM: InterviewVisualization/utils/nodeRendering.js
 * 
 * Provides smart emoji selection, initials generation, and color mapping
 */

import { visualConfig } from '../config/visualConfig';
import { getNodeSize } from '../config/mathFormulas';

/**
 * Get initials from a name
 * PRESERVED from original implementation
 */
export const getInitials = (name) => {
  if (!name) return '';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return parts[0][0] + parts[parts.length - 1][0];
  }
  return parts[0][0];
};

/**
 * Smart emoji selection based on node name/description
 * ENHANCED with spec requirements
 */
export const getSmartEmoji = (node) => {
  // First check if node has explicit icon from spec
  if (node.icon) {
    return node.icon;
  }
  
  // Check node type icons (spec requirements)
  if (visualConfig.nodeIcons[node.type]) {
    return visualConfig.nodeIcons[node.type];
  }
  
  // Smart keyword detection (preserved from original)
  const name = (node.name || '').toLowerCase();
  const desc = (node.description || '').toLowerCase();
  const text = name + ' ' + desc;
  
  // Check for specific keywords
  if (text.includes('wedding')) return '💑';
  if (text.includes('graduation') || text.includes('degree')) return '🎓';
  if (text.includes('birthday')) return '🎂';
  if (text.includes('hospital') || text.includes('doctor')) return '🏥';
  if (text.includes('work') || text.includes('job')) return '💼';
  if (text.includes('travel') || text.includes('vacation')) return '✈️';
  if (text.includes('baby') || text.includes('birth')) return '👶';
  if (text.includes('school')) return '🏫';
  if (text.includes('home') || text.includes('house')) return '🏠';
  if (text.includes('party') || text.includes('celebration')) return '🎉';
  
  // Parent-child fallback as per spec
  if (node.parentType && visualConfig.parentEmojis[node.parentType]) {
    return visualConfig.parentEmojis[node.parentType];
  }
  
  // Return parent emoji as final fallback
  return visualConfig.parentEmojis[node.type] || '📌';
};

/**
 * Map node types to colors
 * PRESERVED from original implementation
 */
export const getNodeColor = (nodeType) => {
  // Direct mapping from visualConfig
  if (visualConfig.nodeColors[nodeType]) {
    return visualConfig.nodeColors[nodeType];
  }
  
  // Handle special cases
  switch(nodeType) {
    case 'memory_joy':
    case 'memory_challenge':
      return visualConfig.nodeColors.memory;
    default:
      // Default to person color if unknown
      return visualConfig.nodeColors.person;
  }
};

/**
 * Determine if node should show as person type
 * For nodes that should display initials instead of icons
 */
export const isPersonNode = (node) => {
  return node.type === 'person' || 
         node.type === 'family' || 
         node.type === 'central' ||
         (node.type === 'organization' && node.showAsAvatar);
};

/**
 * Get display content for node
 * Returns either emoji/icon or initials
 */
export const getNodeDisplayContent = (node) => {
  if (isPersonNode(node) && node.name) {
    return {
      type: 'initials',
      content: getInitials(node.name)
    };
  }
  
  return {
    type: 'emoji',
    content: getSmartEmoji(node)
  };
};

/**
 * Convert node data to vis-network format
 * This is the bridge between our data structure and vis-network requirements
 */
export const toVisNetworkNode = (node, config, labelsVisible = true) => {
  const display = getNodeDisplayContent(node);
  const color = getNodeColor(node.type);
  const { nodeSize } = config;
  
  // Calculate actual size based on node importance
  const actualSize = getNodeSize(node, nodeSize);
  
  return {
    id: node.id,
    label: labelsVisible ? (node.name || node.label || node.id) : '',
    
    // Visual properties
    size: actualSize,
    color: {
      background: color,
      border: 'rgba(255, 255, 255, 0.9)',
      highlight: {
        background: color,
        border: '#DDB776'
      },
      hover: {
        background: color,
        border: 'rgba(255, 255, 255, 1)'
      }
    },
    
    // Shape and content
    shape: 'circle', // Default shape, will be overridden to 'custom' in main component
    font: {
      size: config.fontSize,
      face: visualConfig.nodes.fontFamily,
      color: visualConfig.nodes.textColor,
      strokeWidth: 2,
      strokeColor: '#ffffff',
      background: 'rgba(255, 255, 255, 0.8)'
    },
    
    // Custom properties for our drawing
    nodeContent: display,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    
    // Interaction
    borderWidth: visualConfig.nodes.borderWidth,
    borderWidthSelected: visualConfig.interaction.selectionWidth,
    
    // Physics
    fixed: node.id === 'interviewee' ? { x: true, y: true } : false,
    
    // Original data preserved
    originalData: node
  };
};