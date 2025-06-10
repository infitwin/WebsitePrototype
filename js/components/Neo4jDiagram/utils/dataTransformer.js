/**
 * Data transformation utilities
 * ADAPTED FROM: src/dataTransformer.js
 * 
 * Transforms data between different formats (Neo4j, vis-network, mock data)
 */

import { toVisNetworkNode } from './nodeHelpers';
import { visualConfig } from '../config/visualConfig';

/**
 * Transform Neo4j/mock data to vis-network format
 */
export const transformToVisNetwork = (data, config, labelsVisible = true) => {
  console.log('Transforming data to vis-network format:', {
    nodes: data.nodes?.length || 0,
    edges: data.edges?.length || data.links?.length || 0
  });
  
  // Transform nodes
  const visNodes = data.nodes.map(node => toVisNetworkNode(node, config, labelsVisible));
  
  // Create node ID map for validation
  const nodeIds = new Set(visNodes.map(n => n.id));
  
  // Transform edges (handle both 'edges' and 'links' naming)
  const edges = data.edges || data.links || [];
  const visEdges = edges
    .filter(edge => {
      const sourceExists = nodeIds.has(edge.source);
      const targetExists = nodeIds.has(edge.target);
      
      if (!sourceExists || !targetExists) {
        console.warn('Skipping edge with missing nodes:', {
          source: edge.source,
          target: edge.target,
          sourceExists,
          targetExists
        });
        return false;
      }
      return true;
    })
    .map(edge => ({
      id: edge.id,
      from: edge.source,
      to: edge.target,
      label: edge.label || edge.type,
      // Style based on config
      width: config.edgeThickness,
      color: {
        color: visualConfig.edges.strokeColor,
        opacity: visualConfig.edges.strokeOpacity,
        highlight: visualConfig.interaction.selectionColor,
        hover: visualConfig.edges.hover.strokeColor || visualConfig.edges.strokeColor
      },
      smooth: {
        enabled: true,
        type: 'curvedCW',
        roundness: visualConfig.edges.curvature
      },
      font: {
        size: config.edgeFontSize || (config.fontSize * 0.8),
        face: visualConfig.nodes.fontFamily,
        color: '#666666',
        strokeWidth: 3,
        strokeColor: '#FFFFFF'
      },
      // Interaction
      hoverWidth: config.edgeThickness * 1.5,
      selectionWidth: config.edgeThickness * 2,
      // Original data
      originalData: edge
    }));
  
  console.log(`Transformed: ${visNodes.length} nodes, ${visEdges.length} edges`);
  
  return {
    nodes: visNodes,
    edges: visEdges
  };
};

/**
 * Transform data for different phases of implementation
 */
export const getPhaseData = (phase, mockData) => {
  switch(phase) {
    case 1:
      // Phase 1: Simple static data
      return mockData;
      
    case 2:
      // Phase 2: Mock CRUD operations
      return {
        ...mockData,
        // Add metadata for tracking changes
        metadata: {
          lastModified: new Date().toISOString(),
          version: 1
        }
      };
      
    case 3:
    case 4:
      // Phase 3-4: Full mock data with validation
      return {
        ...mockData,
        metadata: {
          lastModified: new Date().toISOString(),
          version: 1,
          validated: true
        }
      };
      
    case 5:
      // Phase 5: WebSocket format (future)
      return {
        type: 'GRAPH_UPDATE',
        data: mockData,
        timestamp: new Date().toISOString()
      };
      
    default:
      return mockData;
  }
};

/**
 * Validate graph data structure
 */
export const validateGraphData = (data) => {
  const errors = [];
  
  if (!data) {
    errors.push('Data is null or undefined');
    return { valid: false, errors };
  }
  
  if (!data.nodes || !Array.isArray(data.nodes)) {
    errors.push('Missing or invalid nodes array');
  }
  
  if (!data.edges && !data.links) {
    errors.push('Missing edges/links array');
  }
  
  // Check for required node properties
  data.nodes?.forEach((node, index) => {
    if (!node.id) {
      errors.push(`Node at index ${index} missing required 'id' property`);
    }
    if (!node.type) {
      errors.push(`Node ${node.id || index} missing required 'type' property`);
    }
  });
  
  // Check for interviewee node
  const hasInterviewee = data.nodes?.some(n => n.id === 'interviewee' || n.type === 'central');
  if (!hasInterviewee) {
    errors.push('Missing central/interviewee node');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};