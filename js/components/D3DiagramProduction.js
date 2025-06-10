/**
 * D3.js Graph Component - Production Version
 * Clean version without test validation panels
 */

import React, { useEffect, useRef, useState, useImperativeHandle } from 'react';
import * as d3 from 'd3';

// PRESERVE: Reuse all existing configuration and utilities
import { visualConfig } from './Neo4jDiagram/config/visualConfig';
import { calculateOptimalNodeSize, calculateLayoutBounds, validateMathematicalRequirements } from './Neo4jDiagram/config/mathFormulas';
import { transformToVisNetwork, validateGraphData } from './Neo4jDiagram/utils/dataTransformer';
import { getNodeDisplayContent, getNodeColor } from './Neo4jDiagram/utils/nodeHelpers';

// Mock Data - PRESERVE: Same data structure
import { simpleTwoNodeData } from './Neo4jDiagram/mockData/simpleTwoNode';
import { familyTreeData } from './Neo4jDiagram/mockData/familyTree';
import { fullInterviewData } from './Neo4jDiagram/mockData/interviewData';
import { allObjectTypesData } from './Neo4jDiagram/mockData/allObjectTypes';

// Components
import GraphControls from './Neo4jDiagram/components/GraphControls';

// Styles
import './Neo4jDiagram/styles.css';

const D3DiagramProduction = React.forwardRef(({ 
  width = window.innerWidth, 
  height = window.innerHeight,
  onNodeClick,
  onNodeHover,
  onEdgeClick,
  onNodeAdd,
  onEdgeAdd,
  onNodeUpdate,
  onNodeDelete,
  highlightedElements = new Set(),
  searchTerm = '',
  activeFilters = new Set(),
  labelsVisible = true,
  currentData: externalData = null, // Allow external data override
  stickyMode: externalStickyMode = false
}, ref) => {
  const svgRef = useRef(null);
  const simulationRef = useRef(null);
  const zoomRef = useRef(null);
  const [currentData, setCurrentData] = useState(externalData || fullInterviewData);
  const [error, setError] = useState(null);
  const [selectedElements, setSelectedElements] = useState(new Set());
  const [stickyMode, setStickyMode] = useState(externalStickyMode);
  const stickyModeRef = useRef(externalStickyMode);

  // Update currentData when external data changes
  useEffect(() => {
    if (externalData) {
      setCurrentData(externalData);
    }
  }, [externalData]);

  // Update sticky mode when external prop changes
  useEffect(() => {
    setStickyMode(externalStickyMode);
    stickyModeRef.current = externalStickyMode;
  }, [externalStickyMode]);

  // Update sticky mode ref
  useEffect(() => {
    stickyModeRef.current = stickyMode;
  }, [stickyMode]);

  // Expose methods to parent component - PRESERVE: Same interface
  useImperativeHandle(ref, () => ({
    highlightNodes: (nodeIds) => {
      // D3 implementation of node highlighting
      const svg = d3.select(svgRef.current);
      svg.selectAll('.node')
        .style('opacity', d => nodeIds.includes(d.id) ? 1.0 : 0.3)
        .style('stroke-width', d => nodeIds.includes(d.id) ? 5 : 3);
    },
    
    clearHighlights: () => {
      const svg = d3.select(svgRef.current);
      svg.selectAll('.node')
        .style('opacity', 1.0)
        .style('stroke-width', 3);
    },
    
    applyFilters: (filterTypes) => {
      const svg = d3.select(svgRef.current);
      
      if (filterTypes.length === 0) {
        // Show all
        svg.selectAll('.node').style('display', 'block');
        svg.selectAll('.edge').style('display', 'block');
      } else {
        // Filter nodes
        svg.selectAll('.node')
          .style('display', d => filterTypes.includes(d.originalData?.type) ? 'block' : 'none');
        
        // Filter edges based on visible nodes
        svg.selectAll('.edge')
          .style('display', d => {
            const sourceVisible = filterTypes.includes(d.source.originalData?.type);
            const targetVisible = filterTypes.includes(d.target.originalData?.type);
            return sourceVisible && targetVisible ? 'block' : 'none';
          });
      }
    },
    
    handleCenter,
    handleResetZoom,
    handleResetLayout,
    handleBeautify,
    
    toggleStickyMode: () => {
      setStickyMode(prev => !prev);
    }
  }));

  // Helper function to create node initials
  const getInitials = (name) => {
    if (!name) return '';
    return name.split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Helper function to handle keyboard events
  const handleKeyDown = (event) => {
    if (event.key === 'Delete' && selectedElements.size > 0) {
      // Delete selected elements
      selectedElements.forEach(elementId => {
        const element = currentData.nodes.find(n => n.id === elementId) || 
                       currentData.edges?.find(e => e.id === elementId);
        
        if (element && onNodeDelete) {
          onNodeDelete(element);
        }
      });
      setSelectedElements(new Set());
    } else if (event.key === 'Escape') {
      // Clear highlights and selection on ESC
      const svg = d3.select(svgRef.current);
      svg.selectAll('.node')
        .style('opacity', 1.0)
        .style('stroke-width', 3);
      setSelectedElements(new Set());
    }
  };

  useEffect(() => {
    // Add keyboard event listener
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElements]);

  useEffect(() => {
    if (!svgRef.current) return;

    try {
      // PRESERVE: Same validation logic
      const validation = validateGraphData(currentData);
      if (!validation.valid) {
        setError(`Invalid data: ${validation.errors.join(', ')}`);
        return;
      }

      // PRESERVE: Same mathematical calculations
      const nodeCount = currentData.nodes.length;
      const sizingConfig = calculateOptimalNodeSize(nodeCount, width, height);
      
      console.log('D3 Production Sizing config:', sizingConfig);

      // PRESERVE: Same data transformation
      const visData = transformToVisNetwork(currentData, sizingConfig, labelsVisible);
      
      // Create D3 data structure
      const nodes = visData.nodes.map(node => ({
        ...node,
        display: getNodeDisplayContent(node.originalData),
        bgColor: getNodeColor(node.originalData.type),
        initials: getInitials(node.originalData?.name || node.label || node.name),
        fullName: node.originalData?.name || node.label || node.name || '',
        nodeSize: sizingConfig.nodeSize,
        fontSize: Math.max(12, 24)})); // 24px font for 40px diameter = 0.6 ratio

      const links = visData.edges.map(edge => ({
        ...edge,
        source: edge.from,
        target: edge.to
      }));

      // Clear previous visualization
      const svg = d3.select(svgRef.current);
      svg.selectAll('*').remove();
      svg.on('.zoom', null);

      // Create SVG with proper dimensions
      svg
        .attr('width', width)
        .attr('height', height)
        .style('background-color', visualConfig.canvas.backgroundColor);

      // Add zoom behavior
      const zoom = d3.zoom()
        .scaleExtent([0.1, 10])
        .filter(event => !event.ctrlKey) // Allow zoom from 10% to 1000%
        .on('zoom', (event) => {
          const { transform } = event;
          svg.selectAll('g.graph-container')
            .attr('transform', transform);
        });

      zoomRef.current = zoom; // Store for control functions
      svg.call(zoom);

      // Add a background rectangle for click detection
      svg.append('rect')
        .attr('width', width)
        .attr('height', height)
        .attr('fill', 'transparent')
        .style('cursor', 'grab')
        .on('click', function(event) {
          // Clear highlights when clicking on empty space
          if (event.target === this) {
            svg.selectAll('.node')
              .style('opacity', 1.0)
              .style('stroke-width', 3);
            
            // Clear selection
            setSelectedElements(new Set());
          }
        });

      // Create main container group for zoom/pan
      const container = svg.append('g').attr('class', 'graph-container');

      // Create force simulation
      const simulation = d3.forceSimulation(nodes).alpha(0.3).alphaDecay(0.02).velocityDecay(0.8)
        .force('link', d3.forceLink(links).id(d => d.id).distance(sizingConfig.edgeLength * 1.2))
        .force('charge', d3.forceManyBody().strength(-300).distanceMax(200))
        .force('center', d3.forceCenter(width / 2, height / 2).strength(0.1))
        .force('collision', d3.forceCollide().radius(30).iterations(1));

      simulationRef.current = simulation;

      // Create container groups (inside zoom container)
      const linkGroup = container.append('g').attr('class', 'links');
      const nodeGroup = container.append('g').attr('class', 'nodes');

      // Create links (edges) - visible layer
      const link = linkGroup.selectAll('.edge')
        .data(links)
        .enter().append('line')
        .attr('class', 'edge')
        .attr('stroke', '#444444') // Professional dark gray
        .attr('stroke-width', Math.max(2, sizingConfig.edgeThickness)) // Proper thickness
        .attr('stroke-opacity', 0.8) // Slight transparency
        .attr('stroke-linecap', 'round');

      // Create invisible interaction layer for edges
      const linkInteraction = linkGroup.selectAll('.edge-interaction')
        .data(links)
        .enter().append('line')
        .attr('class', 'edge-interaction')
        .attr('stroke', 'transparent')
        .attr('stroke-width', '12px')
        .style('cursor', 'pointer')
        .style('pointer-events', 'stroke')
        .on("click", function(event, d) {
          event.stopPropagation();
          
          // Toggle selection
          const edgeId = d.id || `${d.source.id}-${d.target.id}`;
          const newSelected = new Set(selectedElements);
          
          if (newSelected.has(edgeId)) {
            newSelected.delete(edgeId);
          } else {
            newSelected.add(edgeId);
          }
          
          setSelectedElements(newSelected);
          
          // Call parent callback with properly formatted edge data
          if (onEdgeClick) {
            const edgeData = {
              id: d.id,
              label: d.label,
              type: d.originalData?.type || d.label,
              source: {
                id: d.source.id,
                name: d.source.fullName || d.source.name || d.source.id
              },
              target: {
                id: d.target.id,
                name: d.target.fullName || d.target.name || d.target.id
              },
              originalData: d.originalData
            };
            onEdgeClick(edgeData);
          }
          
          console.log('Edge clicked:', edgeId, 'Selected:', newSelected.has(edgeId));
        })
        .on('mouseover', function(event, d) {
          // Find the corresponding visible edge and highlight it
          const edgeIndex = links.indexOf(d);
          const visibleEdge = linkGroup.selectAll('.edge').nodes()[edgeIndex];
          if (visibleEdge) {
            d3.select(visibleEdge)
              .attr('stroke-width', Math.max(3, sizingConfig.edgeThickness * 1.8))
              .attr('stroke-opacity', 1);
          }
        })
        .on('mouseout', function(event, d) {
          const edgeId = d.id || `${d.source.id}-${d.target.id}`;
          const isSelected = selectedElements.has(edgeId);
          const edgeIndex = links.indexOf(d);
          const visibleEdge = linkGroup.selectAll('.edge').nodes()[edgeIndex];
          if (visibleEdge) {
            d3.select(visibleEdge)
              .attr('stroke-width', isSelected ? sizingConfig.edgeThickness * 2 : sizingConfig.edgeThickness)
              .attr('stroke-opacity', Math.max(0.7, visualConfig.edges.strokeOpacity));
          }
        });

      // Create nodes
      const node = nodeGroup.selectAll('.node')
        .data(nodes)
        .enter().append('g')
        .attr('class', 'node')
        .style("cursor", "pointer").classed("node-interactive", true)
        .call(d3.drag()
          .on('start', dragstarted)
          .on('drag', dragged)
          .on('end', dragended))
        .on("click", function(event, d) {
          event.stopPropagation();
          
          // Toggle selection
          const newSelected = new Set(selectedElements);
          
          if (newSelected.has(d.id)) {
            newSelected.delete(d.id);
          } else {
            newSelected.add(d.id);
          }
          
          setSelectedElements(newSelected);
          
          // Call parent callback
          if (onNodeClick) {
            onNodeClick(d.originalData || d);
          }
        })
        .on("dblclick", function(event, d) {
          event.stopPropagation();
          // Double-click to release node from fixed position
          d.fx = null;
          d.fy = null;
          simulation.alpha(0.3).restart();
        })
        .on('mouseover', function(event, d) {
          // Hover effect
          d3.select(this).select("circle")
            .attr('r', 20)
            .attr('stroke-width', 5);

          if (onNodeHover) {
            onNodeHover(d.originalData || d);
          }
        })
        .on('mouseout', function(event, d) {
          // Reset hover
          d3.select(this).select("circle")
            .attr('r', 20)
            .attr('stroke-width', selectedElements.has(d.id) ? 5 : 3);

          if (onNodeHover) {
            onNodeHover(null);
          }
        });

      // Add circles to nodes
      node.append('circle')
        .attr('r', 20)
        .attr('fill', d => d.bgColor)
        .attr('stroke', 'rgba(255, 255, 255, 0.9)')
        .attr('stroke-width', 3)
        .filter(d => visualConfig.nodes.shadowEnabled)
        .style('filter', 'drop-shadow(2px 2px 4px rgba(0,0,0,0.3))');

      // Add initials/emoji to nodes (centered)
      node.append('text')
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'central')
        .attr('fill', '#FFFFFF')
        .attr('font-size', d => d.fontSize)
        .attr('font-weight', 'bold')
        .attr('font-family', d => d.display.type === 'emoji' ? 
          '-apple-system, BlinkMacSystemFont, "Segoe UI Emoji", sans-serif' : 
          visualConfig.nodes.fontFamily)
        .text(d => d.display.type === 'emoji' ? d.display.content : d.initials)
        .style('pointer-events', 'none')
        .style('filter', 'drop-shadow(1px 1px 1px rgba(0,0,0,0.8))')
        .attr('stroke', '#000000')
        .attr('stroke-width', '0.5px');

      // Drag functions
      function dragstarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
        
        // In sticky mode, fix all other nodes when one is dragged
        if (stickyModeRef.current) {
          nodes.forEach(node => {
            if (node.id !== d.id && node.fx === null) {
              node.fx = node.x;
              node.fy = node.y;
            }
          });
        }
      }

      function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
      }

      function dragended(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        // Only keep the node fixed if sticky mode is on or it's the interviewee
        if (!stickyModeRef.current && d.id !== 'interviewee') {
          d.fx = null;
          d.fy = null;
        }
      }

      // Update positions on simulation tick
      simulation.on('tick', () => {
        // Apply boundary constraints
        nodes.forEach(d => {
        // Apply boundary constraints with damping
        const margin = 30;
        d.x = Math.max(margin, Math.min(width - margin, d.x));
        d.y = Math.max(margin, Math.min(height - margin, d.y));
        
        // Apply velocity damping near boundaries
        if (d.vx && (d.x <= margin + 10 || d.x >= width - margin - 10)) {
          d.vx *= 0.5;
        }
        if (d.vy && (d.y <= margin + 10 || d.y >= height - margin - 10)) {
          d.vy *= 0.5;
        }
      });
        link
          .attr('x1', d => d.source.x)
          .attr('y1', d => d.source.y)
          .attr('x2', d => d.target.x)
          .attr('y2', d => d.target.y);

        linkInteraction
          .attr('x1', d => d.source.x)
          .attr('y1', d => d.source.y)
          .attr('x2', d => d.target.x)
          .attr('y2', d => d.target.y);

        node
          .attr('transform', d => `translate(${d.x},${d.y})`);
      });

      // Fix interviewee position at center if it exists
      const intervieweeNode = nodes.find(n => n.id === 'interviewee');
      if (intervieweeNode) {
        const bounds = calculateLayoutBounds(width, height, nodeCount);
        intervieweeNode.fx = bounds.centerX;
        intervieweeNode.fy = bounds.centerY;
      }

      // Cleanup
      return () => {
        if (simulationRef.current) {
          simulationRef.current.stop();
        }
        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove();
        svg.on('.zoom', null);
        simulationRef.current = null;
        zoomRef.current = null;
      };

    } catch (err) {
      console.error('Failed to create D3 visualization:', err);
      setError(err.message);
    }
  }, [currentData, width, height, labelsVisible]);

  // Handle sticky mode toggle
  useEffect(() => {
    if (!simulationRef.current) return;
    
    const nodes = simulationRef.current.nodes();
    
    if (stickyMode) {
      // Fix all nodes in their current positions
      nodes.forEach(node => {
        node.fx = node.x;
        node.fy = node.y;
      });
    } else {
      // Only release nodes that weren't manually dragged
      // Keep the interviewee fixed
      nodes.forEach(node => {
        if (node.id !== 'interviewee') {
          node.fx = null;
          node.fy = null;
        }
      });
      
      // Restart simulation to let nodes settle
      simulationRef.current.alpha(0.3).restart();
    }
  }, [stickyMode]);

  // Update selection styles when selectedElements changes
  useEffect(() => {
    const svg = d3.select(svgRef.current);
    
    // Update node selection styles
    svg.selectAll('.node circle')
      .attr('stroke-width', d => selectedElements.has(d.id) ? 5 : 3)
      .attr('stroke', d => selectedElements.has(d.id) ? visualConfig.interaction.selectionColor : 'rgba(255, 255, 255, 0.9)');

    // Update edge selection styles
    svg.selectAll('.edge')
      .attr('stroke', d => {
        const edgeId = d.id || `${d.source.id}-${d.target.id}`;
        return selectedElements.has(edgeId) ? visualConfig.interaction.selectionColor : '#444444';
      })
      .attr('stroke-width', d => {
        const edgeId = d.id || `${d.source.id}-${d.target.id}`;
        const baseWidth = parseFloat(d3.select(d3.select('.edge').node()).attr('stroke-width')) || 2;
        return selectedElements.has(edgeId) ? baseWidth * 2 : baseWidth;
      });
  }, [selectedElements]);

  // PRESERVE: Same control functions
  const handleCenter = () => {
    if (simulationRef.current && zoomRef.current) {
      const svg = d3.select(svgRef.current);
      
      // Get the bounding box of all nodes
      const nodes = simulationRef.current.nodes();
      if (nodes.length === 0) return;
      
      const xMin = Math.min(...nodes.map(n => n.x));
      const xMax = Math.max(...nodes.map(n => n.x));
      const yMin = Math.min(...nodes.map(n => n.y));
      const yMax = Math.max(...nodes.map(n => n.y));
      
      const centerX = (xMin + xMax) / 2;
      const centerY = (yMin + yMax) / 2;
      const graphWidth = xMax - xMin + 100; // Add padding
      const graphHeight = yMax - yMin + 100;
      
      // Calculate scale to fit
      const scale = Math.min(width / graphWidth, height / graphHeight, 2);
      
      // Center the graph
      const translateX = width / 2 - centerX * scale;
      const translateY = height / 2 - centerY * scale;
      
      const transform = d3.zoomIdentity
        .translate(translateX, translateY)
        .scale(scale);
        
      svg.transition().duration(1000).call(zoomRef.current.transform, transform);
    }
  };

  const handleResetZoom = () => {
    if (zoomRef.current) {
      const svg = d3.select(svgRef.current);
      svg.transition().duration(500).call(zoomRef.current.transform, d3.zoomIdentity);
    }
  };

  const handleResetLayout = () => {
    if (simulationRef.current) {
      // Release all fixed positions
      simulationRef.current.nodes().forEach(node => {
        node.fx = null;
        node.fy = null;
      });
      
      // Reset the interviewee to center if it exists
      const intervieweeNode = simulationRef.current.nodes().find(n => n.id === 'interviewee');
      if (intervieweeNode) {
        const bounds = calculateLayoutBounds(width, height, simulationRef.current.nodes().length);
        intervieweeNode.fx = bounds.centerX;
        intervieweeNode.fy = bounds.centerY;
      }
      
      simulationRef.current.alpha(1).restart();
    }
  };

  const handleBeautify = () => {
    if (simulationRef.current) {
      // Release all fixed positions except interviewee
      simulationRef.current.nodes().forEach(node => {
        if (node.id !== 'interviewee') {
          node.fx = null;
          node.fy = null;
        }
      });
      
      // Update forces for better layout
      const nodes = simulationRef.current.nodes();
      const links = simulationRef.current.force('link').links();
      
      simulationRef.current
        .force('charge', d3.forceManyBody().strength(-500).distanceMax(300))
        .force('link', d3.forceLink(links).id(d => d.id).distance(150).strength(0.5))
        .force('collision', d3.forceCollide().radius(40).iterations(2))
        .alpha(1)
        .restart();
    }
  };

  return (
    <div style={{ position: 'relative', width, height, backgroundColor: visualConfig.canvas.backgroundColor }}>
      {/* SVG Container */}
      <svg ref={svgRef} style={{ width: '100%', height: '100%' }} />
      
      
      {/* Error Display */}
      {error && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(255, 0, 0, 0.1)',
          color: 'red',
          padding: '20px',
          borderRadius: '8px',
          border: '1px solid red'
        }}>
          Error: {error}
        </div>
      )}
    </div>
  );
});

D3DiagramProduction.displayName = 'D3DiagramProduction';

export default D3DiagramProduction;