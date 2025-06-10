/**
 * Mathematical formulas for Neo4j Interview Validation
 * ADAPTED FROM: InterviewVisualization/utils/mathFormulas.js
 * 
 * Combines our Phase 1 tested formulas with new spec requirements:
 * Spec formula: node_size = max(20, min(50, sqrt(screen_area / node_count) * 0.4))
 * Our formula: nodeRadius = √(targetNodeContent/(nodeCount×π))
 */

// Golden ratio for aesthetic proportions
export const GOLDEN_RATIO = 1.618;

/**
 * Calculate optimal node sizing per specification
 * Merges our proven approach with spec requirements
 */
export const calculateOptimalNodeSize = (nodeCount, canvasWidth, canvasHeight) => {
  // Calculate screen area
  const screenArea = canvasWidth * canvasHeight;
  
  // Apply specification formula
  const specSize = Math.sqrt(screenArea / nodeCount) * 0.4;
  const nodeSize = Math.max(20, Math.min(50, specSize));
  
  // Calculate related parameters per spec
  const edgeLength = nodeSize * 2.5;
  const edgeThickness = Math.max(1, nodeSize / 20);
  const minSeparation = nodeSize * 1.5;
  // Node font formula: Math.max(10, Math.min(30, Math.floor(node_size * 0.6)))
  const fontSize = Math.max(10, Math.min(30, Math.floor(nodeSize * 0.6)));
  
  // Edge font formula: Math.max(8, Math.min(16, Math.floor(edge_length * 0.12)))
  const edgeFontSize = Math.max(8, Math.min(16, Math.floor(edgeLength * 0.12)));
  const clickTargetSize = nodeSize * 1.3;
  
  return {
    nodeSize,
    edgeLength,
    edgeThickness,
    minSeparation,
    fontSize,
    edgeFontSize,
    clickTargetSize,
    // Scale factors from our original design
    centralNodeScale: 1.3,    // Interviewee prominence
    primaryNodeScale: 1.15,   // Important nodes
    secondaryScale: 1.0       // Standard nodes
  };
};

/**
 * Calculate responsive sizes based on window dimensions
 * PRESERVED from original implementation
 */
export const getResponsiveSizes = (width, height) => {
  const minDimension = Math.min(width, height);
  const baseFactor = Math.max(0.7, Math.min(1.3, minDimension / 800));
  
  return {
    // Font sizes
    baseFontSize: Math.max(11, Math.min(15, 13 * baseFactor)),
    emojiFontSize: Math.max(14, Math.min(24, 18 * baseFactor)),
    initialsFontSize: Math.max(12, Math.min(20, 16 * baseFactor)),
    
    // Spacing
    labelOffset: 10 * baseFactor,
    padding: 5 * baseFactor
  };
};

/**
 * Calculate node size based on type and importance
 * Applies our scale factors to spec-calculated base size
 */
export const getNodeSize = (node, baseNodeSize) => {
  if (node.type === 'central' || node.id === 'interviewee') {
    return baseNodeSize * 1.3; // 30% larger for interviewee
  } else if (node.type === 'family' || node.type === 'event' || node.importance === 'primary') {
    return baseNodeSize * 1.15; // 15% larger for important nodes
  }
  return baseNodeSize; // Standard size for others
};

/**
 * Vis-network specific: Convert our sizing to vis format
 */
export const toVisNetworkSize = (pixelSize) => {
  // vis-network uses a different scale, this converts our pixel sizes
  return pixelSize / 2; // Approximate conversion, will be tuned
};

/**
 * Calculate physics parameters for vis-network
 * Based on our force simulation experience
 */
export const calculatePhysicsParams = (nodeCount, nodeSize) => {
  // Repulsion should increase with node count to prevent overlap
  const repulsion = Math.max(50, 200 - nodeCount * 2);
  
  // Spring length is our edge length
  const springLength = nodeSize * 2.5;
  
  // Damping prevents endless motion
  const damping = 0.09;
  
  return {
    repulsion,
    springLength,
    damping,
    // Additional vis-network specific params
    gravitationalConstant: -2000,
    centralGravity: 0.3,
    springConstant: 0.04
  };
};

/**
 * Calculate layout bounds to keep graph centered
 * Especially important for fixed center interviewee
 */
export const calculateLayoutBounds = (canvasWidth, canvasHeight, nodeCount) => {
  const padding = Math.max(50, Math.min(150, canvasWidth * 0.1));
  
  return {
    minX: padding,
    maxX: canvasWidth - padding,
    minY: padding,
    maxY: canvasHeight - padding,
    centerX: canvasWidth / 2,
    centerY: canvasHeight / 2
  };
};

/**
 * Information density calculation for quality metrics
 */
export const calculateInformationDensity = (nodeCount, edgeCount, canvasArea) => {
  const totalElements = nodeCount + edgeCount;
  const elementsPerPixel = totalElements / canvasArea;
  
  // Target: 15-25 nodes visible per screen
  const idealDensity = 20 / canvasArea;
  const densityRatio = elementsPerPixel / idealDensity;
  
  // Score 0-100 where 100 is perfect density
  if (densityRatio >= 0.6 && densityRatio <= 1.25) {
    return 100; // Perfect range
  } else if (densityRatio < 0.6) {
    return Math.round(densityRatio * 166); // Too sparse
  } else {
    return Math.round(100 / densityRatio); // Too dense
  }
};

/**
 * Validate all mathematical requirements
 * Returns object with pass/fail for each test
 */
export const validateMathematicalRequirements = (config, nodeCount, canvasWidth, canvasHeight) => {
  const { nodeSize, edgeLength, minSeparation, fontSize, edgeFontSize, clickTargetSize } = config;
  
  // Calculate expected values using the exact formulas
  const expectedNodeFont = Math.max(10, Math.min(30, Math.floor(nodeSize * 0.6)));
  const expectedEdgeFont = Math.max(8, Math.min(16, Math.floor(edgeLength * 0.12)));
  
  // Check font ratios per specification (0.55-0.65 for nodes, 0.10-0.15 for edges)
  const nodeFontRatio = fontSize / nodeSize;
  const edgeFontRatio = edgeFontSize / edgeLength;
  
  return {
    nodeSizeRange: nodeSize >= 20 && nodeSize <= 50,
    edgeLengthRatio: Math.abs(edgeLength - nodeSize * 2.5) / edgeLength < 0.1, // 10% tolerance
    minSeparationRatio: Math.abs(minSeparation - nodeSize * 1.5) / minSeparation < 0.1,
    fontSizeFormula: fontSize === expectedNodeFont, // Exact formula match
    fontSizeRatio: nodeFontRatio >= 0.55 && nodeFontRatio <= 0.65, // Spec range
    edgeFontSizeFormula: edgeFontSize === expectedEdgeFont, // Exact formula match
    edgeFontSizeRatio: edgeFontRatio >= 0.10 && edgeFontRatio <= 0.15, // Spec range
    clickTargetRatio: Math.abs(clickTargetSize - nodeSize * 1.3) / clickTargetSize < 0.1,
    clickableSize: nodeSize >= 24 // Minimum for reliable clicking
  };
};