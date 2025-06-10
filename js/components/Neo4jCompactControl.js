import React, { useState, useRef, useMemo, useCallback } from 'react';
import D3DiagramProduction from './D3DiagramProduction';

// Theme and styling constants
const THEME = {
  colors: {
    primary: '#007bff',
    danger: '#dc3545',
    border: '#dee2e6',
    borderLight: '#ddd',
    background: '#f8f9fa',
    backgroundWhite: 'white',
    text: '#333',
    muted: '#666',
    light: '#999'
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px'
  },
  borderRadius: {
    sm: '3px',
    md: '6px',
    lg: '12px'
  },
  shadows: {
    sm: '0 1px 3px rgba(0,0,0,0.05)',
    md: '0 4px 20px rgba(0,0,0,0.08)'
  }
};

// Button style configurations
const BUTTON_STYLES = {
  base: {
    padding: '4px 8px',
    border: `1px solid ${THEME.colors.borderLight}`,
    borderRadius: THEME.borderRadius.sm,
    fontSize: '10px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  primary: {
    background: THEME.colors.backgroundWhite,
    color: THEME.colors.text
  },
  active: {
    background: THEME.colors.primary,
    color: THEME.colors.backgroundWhite
  },
  danger: {
    background: THEME.colors.danger,
    color: THEME.colors.backgroundWhite,
    border: `1px solid ${THEME.colors.danger}`
  }
};

// Filter configuration
const FILTER_CONFIG = {
  person: { color: '#9C88FF', icon: '👤', types: ['central', 'family'] },
  event: { color: '#FF7675', icon: '📅', types: ['event'] },
  place: { color: '#74B9FF', icon: '📍', types: ['place'] },
  memory: { color: '#6BCF7F', icon: '📷', types: ['memory', 'memory_challenge', 'memory_joy'] }
};

// Layout dimensions
const LAYOUT = {
  header: { height: 120 },
  sidebar: { widthRatio: 0.3 },
  graph: { widthRatio: 0.7 },
  status: { height: 32 }
};

/**
 * Reusable control button component
 */
const ControlButton = ({ children, onClick, variant = 'primary', title, style = {}, ...props }) => {
  const variantStyles = {
    primary: BUTTON_STYLES.primary,
    active: BUTTON_STYLES.active,
    danger: BUTTON_STYLES.danger
  };

  return (
    <span
      onClick={onClick}
      style={{
        ...BUTTON_STYLES.base,
        ...variantStyles[variant],
        ...style
      }}
      title={title}
      {...props}
    >
      {children}
    </span>
  );
};

/**
 * Custom hook for diagram operations
 */
const useDiagramOperations = (diagramRef) => {
  const callDiagramMethod = useCallback((methodName, ...args) => {
    if (diagramRef.current) {
      diagramRef.current[methodName](...args);
    }
  }, [diagramRef]);

  return useMemo(() => ({
    center: () => callDiagramMethod('handleCenter'),
    resetZoom: () => callDiagramMethod('handleResetZoom'),
    resetLayout: () => callDiagramMethod('handleResetLayout'),
    beautify: () => callDiagramMethod('handleBeautify'),
    toggleStickyMode: () => callDiagramMethod('toggleStickyMode'),
    clearHighlights: () => callDiagramMethod('clearHighlights'),
    highlightNodes: (nodeIds) => callDiagramMethod('highlightNodes', nodeIds),
    applyFilters: (types) => callDiagramMethod('applyFilters', types)
  }), [callDiagramMethod]);
};

/**
 * Custom hook for search functionality
 */
const useSearch = (data, diagramOps) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = useCallback((e) => {
    const term = e.target.value;
    setSearchTerm(term);
    
    if (term) {
      const matchingNodeIds = data?.nodes
        ?.filter(node => 
          [node.name, node.label]
            .filter(Boolean)
            .some(text => text.toLowerCase().includes(term.toLowerCase()))
        )
        .map(node => node.id) || [];
      
      diagramOps.highlightNodes(matchingNodeIds);
    } else {
      diagramOps.clearHighlights();
    }
  }, [data, diagramOps]);

  const clearSearch = useCallback(() => {
    setSearchTerm('');
    diagramOps.clearHighlights();
  }, [diagramOps]);

  return { searchTerm, handleSearch, clearSearch };
};

/**
 * Compact Neo4j Visualization Control - Square Hero Component
 * Perfectly sized for embedding in other pages
 */
const Neo4jCompactControl = ({ 
  data, 
  width = 800, 
  height = 800,
  onNodeSelect,
  onEdgeSelect,
  style = {},
  mode = 'interview' // Add mode prop for future WebSocket integration
}) => {
  const diagramRef = useRef(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [actionHistory, setActionHistory] = useState([]);
  const [activeFilters, setActiveFilters] = useState(new Set());
  const [stickyMode, setStickyMode] = useState(false);

  // Custom hooks for cleaner code organization
  const diagramOps = useDiagramOperations(diagramRef);
  const { searchTerm, handleSearch, clearSearch } = useSearch(data, diagramOps);

  // Memoized calculations for performance
  const nodeCount = useMemo(() => data?.nodes?.length || 0, [data?.nodes]);
  const edgeCount = useMemo(() => data?.edges?.length || 0, [data?.edges]);

  const addToHistory = useCallback((action, target, itemData = null) => {
    const entry = {
      timestamp: new Date().toLocaleTimeString(),
      action,
      target,
      data: itemData
    };
    setActionHistory(prev => [entry, ...prev.slice(0, 9)]);
  }, []);

  const handleNodeClick = useCallback((node) => {
    setSelectedNode(node);
    setSelectedEdge(null);
    diagramOps.clearHighlights();
    addToHistory('NODE', node.name || node.id, { type: 'node', item: node });
    onNodeSelect?.(node);
  }, [diagramOps, addToHistory, onNodeSelect]);

  const handleEdgeClick = useCallback((edge) => {
    setSelectedEdge(edge);
    setSelectedNode(null);
    diagramOps.clearHighlights();
    addToHistory('RELATIONSHIP', edge.label || 'Connection', { type: 'edge', item: edge });
    onEdgeSelect?.(edge);
  }, [diagramOps, addToHistory, onEdgeSelect]);

  // handleSearch is now provided by useSearch hook

  const handleHistoryClick = useCallback((entry) => {
    if (!entry.data) return;
    
    if (entry.data.type === 'node') {
      const node = entry.data.item;
      setSelectedNode(node);
      setSelectedEdge(null);
      diagramOps.highlightNodes([node.id]);
    } else if (entry.data.type === 'edge') {
      const edge = entry.data.item;
      setSelectedEdge(edge);
      setSelectedNode(null);
      if (edge.source && edge.target) {
        diagramOps.highlightNodes([edge.source.id, edge.target.id]);
      }
    }
  }, [diagramOps]);

  const handleFilterToggle = useCallback((filterType) => {
    const newFilters = new Set(activeFilters);
    const isAdding = !newFilters.has(filterType);
    
    if (isAdding) {
      newFilters.add(filterType);
    } else {
      newFilters.delete(filterType);
    }
    setActiveFilters(newFilters);
    
    // Convert filter types to actual node types using FILTER_CONFIG
    const actualNodeTypes = [];
    newFilters.forEach(filter => {
      if (FILTER_CONFIG[filter]) {
        actualNodeTypes.push(...FILTER_CONFIG[filter].types);
      }
    });
    
    diagramOps.applyFilters(actualNodeTypes);
    addToHistory('FILTER', `${isAdding ? 'Show' : 'Hide'} ${filterType}`, { 
      type: 'filter', 
      filterType, 
      active: isAdding 
    });
  }, [activeFilters, diagramOps, addToHistory]);

  const containerStyle = useMemo(() => ({
    width,
    height,
    margin: '0 auto',
    background: THEME.colors.backgroundWhite,
    borderRadius: THEME.borderRadius.lg,
    boxShadow: THEME.shadows.md,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    ...style
  }), [width, height, style]);

  return (
    <div style={containerStyle}>
      {/* Compact Header */}
      <div style={{
        background: THEME.colors.backgroundWhite,
        borderBottom: `1px solid ${THEME.colors.border}`,
        padding: `${THEME.spacing.md} ${THEME.spacing.lg}`
      }}>
        {/* Title and Controls Row */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '10px'
        }}>
          <h2 style={{ margin: 0, color: '#333', fontSize: '1.2rem' }}>
            Nexus
          </h2>
          
          {/* Compact Control Buttons */}
          <div style={{ display: 'flex', gap: THEME.spacing.xs }}>
            <ControlButton onClick={diagramOps.center} title="Center graph">
              Center
            </ControlButton>
            <ControlButton onClick={diagramOps.resetZoom} title="Fit graph to view">
              Fit
            </ControlButton>
            <ControlButton onClick={diagramOps.resetLayout} title="Reset node positions">
              Reset
            </ControlButton>
            <ControlButton onClick={diagramOps.beautify} title="Optimize layout">
              ✨ Beautify
            </ControlButton>
            <ControlButton 
              onClick={() => {
                setStickyMode(!stickyMode);
                diagramOps.toggleStickyMode();
              }}
              variant={stickyMode ? 'active' : 'primary'}
              title={stickyMode ? "Unlock nodes" : "Lock nodes in place"}
            >
              📌 {stickyMode ? 'Locked' : 'Lock'}
            </ControlButton>
            {searchTerm && (
              <ControlButton 
                onClick={clearSearch}
                variant="danger"
                style={{ marginLeft: THEME.spacing.sm }}
                title="Clear search highlights (or press ESC)"
              >
                Clear
              </ControlButton>
            )}
          </div>
        </div>
        
        {/* Search and Filters Row */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={handleSearch}
            style={{
              padding: '6px 10px',
              flex: 1,
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '12px',
              outline: 'none'
            }}
          />
          
          {/* Compact Filter Buttons */}
          {Object.entries(FILTER_CONFIG).map(([type, config]) => (
            <button
              key={type}
              onClick={() => handleFilterToggle(type)}
              style={{
                width: '28px',
                height: '28px',
                border: `1px solid ${THEME.colors.borderLight}`,
                borderRadius: THEME.borderRadius.md,
                background: activeFilters.has(type) ? config.color : THEME.colors.backgroundWhite,
                color: activeFilters.has(type) ? THEME.colors.backgroundWhite : THEME.colors.text,
                fontSize: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s'
              }}
              title={`Toggle ${type} nodes`}
            >
              {config.icon}
            </button>
          ))}
          
          {/* Clear Filters Button */}
          {activeFilters.size > 0 && (
            <ControlButton
              onClick={() => {
                setActiveFilters(new Set());
                diagramOps.applyFilters([]);
                addToHistory('FILTER', 'Clear all filters', { type: 'filter', action: 'clear' });
              }}
              variant="danger"
              title="Clear all filters"
            >
              Clear
            </ControlButton>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ 
        flex: 1,
        display: 'flex',
        position: 'relative'
      }}>
        {/* Graph Visualization */}
        <div style={{ 
          flex: 1,
          position: 'relative'
        }}>
          <D3DiagramProduction
            ref={diagramRef}
            width={width * LAYOUT.graph.widthRatio}
            height={height - LAYOUT.header.height}
            currentData={data}
            onNodeClick={handleNodeClick}
            onEdgeClick={handleEdgeClick}
            onNodeDelete={(node) => addToHistory('DELETE NODE', node.name || node.id)}
            onNodeAdd={(node) => addToHistory('CREATE NODE', node.name || node.id)}
            onNodeUpdate={(node) => addToHistory('UPDATE NODE', node.name || node.id)}
            onEdgeAdd={(edge) => addToHistory('CREATE RELATIONSHIP', edge.label || 'Connection')}
            activeFilters={activeFilters}
            labelsVisible={true}
            stickyMode={stickyMode}
          />
        </div>
        
        {/* Compact Activity Panel */}
        <div style={{
          width: width * LAYOUT.sidebar.widthRatio,
          background: THEME.colors.background,
          borderLeft: `1px solid ${THEME.colors.border}`,
          padding: THEME.spacing.md,
          display: 'flex',
          flexDirection: 'column',
          gap: THEME.spacing.md
        }}>
          {/* Active Selection Details */}
          <div style={{
            background: THEME.colors.backgroundWhite,
            borderRadius: THEME.borderRadius.md,
            padding: '10px',
            boxShadow: THEME.shadows.sm,
            minHeight: '120px'
          }}>
            <h4 style={{ 
              margin: '0 0 8px 0', 
              fontSize: '12px',
              fontWeight: '600',
              color: '#333'
            }}>
              ACTIVE
            </h4>
            {selectedNode ? (
              <div style={{ fontSize: '11px' }}>
                <div style={{
                  padding: '8px',
                  background: '#f0f7ff',
                  borderRadius: '4px',
                  border: '1px solid #cce5ff'
                }}>
                  <div style={{ fontWeight: '600', color: '#004085', marginBottom: '4px' }}>
                    {selectedNode.name || selectedNode.label || selectedNode.id}
                  </div>
                  <div style={{ color: '#666', marginBottom: '3px' }}>
                    <strong>Type:</strong> {selectedNode.type}
                  </div>
                  {selectedNode.label && selectedNode.label !== selectedNode.name && (
                    <div style={{ color: '#666', marginBottom: '3px' }}>
                      <strong>Label:</strong> {selectedNode.label}
                    </div>
                  )}
                  {selectedNode.date && (
                    <div style={{ color: '#666', marginBottom: '3px' }}>
                      <strong>Date:</strong> {selectedNode.date}
                    </div>
                  )}
                  <div style={{ color: '#666' }}>
                    <strong>ID:</strong> {selectedNode.id}
                  </div>
                </div>
              </div>
            ) : selectedEdge ? (
              <div style={{ fontSize: '11px' }}>
                <div style={{
                  padding: '8px',
                  background: '#fff3cd',
                  borderRadius: '4px',
                  border: '1px solid #ffeeba'
                }}>
                  <div style={{ fontWeight: '600', color: '#856404', marginBottom: '4px' }}>
                    {selectedEdge.label || selectedEdge.type || 'Connection'}
                  </div>
                  <div style={{ color: '#666', marginBottom: '3px' }}>
                    <strong>From:</strong> {selectedEdge.source?.name || selectedEdge.source?.id || selectedEdge.source}
                  </div>
                  <div style={{ color: '#666', marginBottom: '3px' }}>
                    <strong>To:</strong> {selectedEdge.target?.name || selectedEdge.target?.id || selectedEdge.target}
                  </div>
                  {selectedEdge.type && (
                    <div style={{ color: '#666' }}>
                      <strong>Type:</strong> {selectedEdge.type}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ fontSize: '10px', color: '#999', fontStyle: 'italic' }}>
                Click on a node or edge to see details
              </div>
            )}
          </div>
          
          {/* History */}
          <div style={{
            background: THEME.colors.backgroundWhite,
            borderRadius: THEME.borderRadius.md,
            padding: '10px',
            flex: 1,
            boxShadow: THEME.shadows.sm,
            display: 'flex',
            flexDirection: 'column'
          }}>
            <h4 style={{ 
              margin: '0 0 8px 0', 
              fontSize: '12px',
              fontWeight: '600',
              color: '#333'
            }}>
              HISTORY
            </h4>
            <div style={{
              flex: 1,
              overflowY: 'auto',
              fontSize: '10px',
              color: '#666'
            }}>
              {actionHistory.slice(0, 6).map((entry, index) => (
                <div 
                  key={index} 
                  onClick={() => handleHistoryClick(entry)}
                  style={{
                    padding: '4px 0',
                    borderBottom: index < 5 ? '1px solid #f0f0f0' : 'none',
                    cursor: entry.data ? 'pointer' : 'default',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (entry.data) {
                      e.currentTarget.style.backgroundColor = '#f0f0f0';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <div style={{ color: '#999', fontSize: '9px' }}>
                    [{entry.timestamp}]
                  </div>
                  <div style={{ 
                    color: entry.data ? '#007bff' : '#666',
                    textDecoration: entry.data ? 'underline' : 'none'
                  }}>
                    <strong>{entry.action}:</strong> {entry.target}
                  </div>
                </div>
              ))}
              {actionHistory.length === 0 && (
                <div style={{ fontStyle: 'italic', color: '#999' }}>
                  No actions yet
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Compact Status Bar */}
      <div style={{
        padding: `${THEME.spacing.sm} ${THEME.spacing.md}`,
        background: THEME.colors.background,
        borderTop: `1px solid ${THEME.colors.border}`,
        fontSize: '10px',
        color: THEME.colors.muted,
        display: 'flex',
        justifyContent: 'space-between'
      }}>
        <span>
          <strong>Nodes:</strong> {nodeCount} • 
          <strong>Edges:</strong> {edgeCount}
        </span>
        <span>
          Drag • Zoom • Click to select
        </span>
      </div>
    </div>
  );
};

export default Neo4jCompactControl;