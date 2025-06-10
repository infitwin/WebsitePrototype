/**
 * Neo4j Interview Validation - Visual Configuration
 * Preserves the warm, inviting photo album aesthetic from our original design
 * 
 * IMPORTED FROM: InterviewVisualization/constants/graphConfig.js
 * Modified for vis-network compatibility
 */

export const visualConfig = {
  // Canvas settings
  canvas: {
    backgroundColor: '#FFFFFF',   // Pure white background
    padding: 0                    // Full screen usage
  },
  
  // Node colors by type (warm photo album palette) - PRESERVED
  nodeColors: {
    person:     '#9C88FF',  // Purple for people
    family:     '#9C88FF',  // Purple (same as person)
    event:      '#FF7675',  // Coral red for events
    memory:     '#6BCF7F',  // Green for memories
    place:      '#74B9FF',  // Blue for places
    time:       '#81ECEC',  // Light cyan for time
    central:    '#9C88FF'   // Central node (interviewee)
  },
  
  // Parent emoji defaults - PRESERVED
  parentEmojis: {
    person: '👤',
    family: '👤', 
    event: '💫',
    memory: '💭',
    place: '📍',
    time: '📅'
  },
  
  // Icon mappings for vis-network (combining spec requirements with our system)
  nodeIcons: {
    person: '👤',      // Spec requirement
    organization: '🏢', // Spec requirement
    place: '📍',       // Spec requirement
    education: '🎓',   // Spec requirement
    event: '📅',       // Spec requirement
    // Our additional types
    family: '👥',
    memory: '📷',
    memory_joy: '😊',
    memory_challenge: '💪',
    time: '⏰',
    central: '⭐'      // Star for interviewee
  },
  
  // Node sizing - ADAPTED for spec requirements
  nodes: {
    // Size range per spec: 20-50px based on node count
    minSize: 20,
    maxSize: 50,
    
    // Size multipliers from our original design
    centralScale: 1.3,     // Central node 30% larger
    primaryScale: 1.15,    // Important nodes 15% larger
    secondaryScale: 1.0,   // Standard nodes
    
    // Visual styling - PRESERVED
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    
    // Shadow effects - PRESERVED
    shadowEnabled: true,
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowBlur: 8,
    shadowOffsetX: 0,
    shadowOffsetY: 2,
    
    // Typography - PRESERVED
    fontSize: 13,  // Will be calculated as node_size × 0.6
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontWeight: 500,
    textColor: '#2C3E50',
    
    // Hover effects
    hover: {
      scale: 1.05,
      shadowBlur: 12,
      shadowOffsetY: 4,
      transitionDuration: 200
    },
    
    // Click interaction per spec
    clickScale: 1.3  // 30% increase on click per spec
  },
  
  // Edge styling - ADAPTED for spec
  edges: {
    // Base thickness calculation: node_size / 20
    minThickness: 1,
    thicknessRatio: 20,  // Divide node size by this
    
    // Visual properties - PRESERVED
    defaultColor: '#666666',
    width: 2,
    strokeColor: '#666666',
    strokeOpacity: 0.8,
    curvature: 0.2,
    
    // Hover state
    hover: {
      strokeOpacity: 0.6,
      strokeWidth: 2
    },
    
    // Filtered state
    filtered: {
      strokeOpacity: 0.15
    },
    
    // New edge highlighting per spec
    highlight: {
      color: '#FF6B6B',     // Bright color for new additions
      thicknessMultiplier: 3,  // 3x thickness initially
      duration: 3000        // 3 seconds before fade
    }
  },
  
  // Node filters - PRESERVED from our design
  nodeFilters: {
    family: { icon: '👥', label: 'Family' },
    memory: { icon: '📷', label: 'Memories' },
    event: { icon: '📅', label: 'Events' },
    place: { icon: '📍', label: 'Places' }
  },
  
  // Interaction settings
  interaction: {
    zoomEnabled: true,
    panEnabled: true,
    minZoom: 0.5,
    maxZoom: 2.0,
    dragEnabled: true,      // Per spec requirement
    multiSelectEnabled: false,
    selectionColor: '#DDB776',
    selectionWidth: 3
  },
  
  // Performance settings
  performance: {
    renderOnlyVisible: true,
    throttleRedraw: 16,     // 60fps target
    batchUpdates: true,
    maxNodes: 50           // Spec target capacity
  },
  
  // Highlighting system per spec
  highlighting: {
    newNodeDuration: 5000,    // 5 seconds
    newNodeColor: '#FFA500',  // Orange
    newNodeSizeMultiplier: 1.5,
    fadeTransition: 'smooth'
  }
};