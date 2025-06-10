/**
 * ⚠️ CRITICAL: NEVER EDIT INTERNAL CONTROL SIZES OR POSITIONS ⚠️
 * 
 * This is ONE INTEGRATED NEXUS CONTROL component.
 * 
 * DO NOT:
 * - Edit internal element sizes, positions, or layouts
 * - Change LAYOUT constants (header height, sidebar ratios, etc.)
 * - Modify containerStyle dimensions or positioning
 * - Adjust graph or sidebar widths/heights internally
 * - Split or extract parts of this control
 * 
 * TO RESIZE THIS CONTROL:
 * - Only change the container size that holds this component
 * - Pass different width/height props to the component
 * - Adjust the parent container's CSS (padding, positioning, etc.)
 * 
 * The control automatically scales all internal elements proportionally
 * based on the width/height props you provide.
 */

// Browser-compatible version of Neo4jCompactControl
(function() {
  'use strict';

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

  // Layout dimensions - DO NOT EDIT THESE
  const LAYOUT = {
    header: { height: 120 },
    sidebar: { widthRatio: 0.3 },
    graph: { widthRatio: 0.7 },
    status: { height: 32 }
  };

  // Mock data for visualization
  const mockData = {
    nodes: [
      { id: 'JD', name: 'John Doe', type: 'person', x: 400, y: 300 },
      { id: 'MS', name: 'Margaret Smith', type: 'person', x: 300, y: 200 },
      { id: 'RS', name: 'Robert Smith', type: 'person', x: 500, y: 200 },
      { id: 'MD', name: 'Michael Davis', type: 'person', x: 350, y: 400 },
      { id: 'SD', name: 'Sarah Davis', type: 'person', x: 450, y: 400 }
    ],
    links: [
      { source: 'JD', target: 'MS', relationship: 'knows' },
      { source: 'JD', target: 'RS', relationship: 'works_with' },
      { source: 'JD', target: 'MD', relationship: 'family' },
      { source: 'JD', target: 'SD', relationship: 'family' },
      { source: 'MS', target: 'RS', relationship: 'married' }
    ]
  };

  // Neo4jCompactControl React Component
  window.Neo4jCompactControl = function Neo4jCompactControl({ 
    data = mockData, 
    width = 800, 
    height = 800,
    onNodeSelect,
    onEdgeSelect,
    style = {},
    mode = 'interview'
  }) {
    const [selectedNode, setSelectedNode] = React.useState(null);
    const [selectedEdge, setSelectedEdge] = React.useState(null);
    const [activeTab, setActiveTab] = React.useState('ACTIVE');

    const containerStyle = React.useMemo(() => ({
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

    const graphWidth = width * LAYOUT.graph.widthRatio;
    const graphHeight = height - LAYOUT.header.height;
    const sidebarWidth = width * LAYOUT.sidebar.widthRatio;

    return React.createElement('div', { style: containerStyle },
      // Header
      React.createElement('div', {
        style: {
          background: THEME.colors.backgroundWhite,
          borderBottom: `1px solid ${THEME.colors.border}`,
          padding: `${THEME.spacing.md} ${THEME.spacing.lg}`,
          height: LAYOUT.header.height,
          display: 'flex',
          flexDirection: 'column'
        }
      },
        // Title and Controls Row
        React.createElement('div', {
          style: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: THEME.spacing.sm
          }
        },
          React.createElement('h2', {
            style: {
              margin: 0,
              fontSize: '18px',
              fontWeight: '600',
              color: THEME.colors.text
            }
          }, 'Nexus - Interview Mode'),
          
          // Control buttons
          React.createElement('div', {
            style: { display: 'flex', gap: THEME.spacing.sm }
          },
            React.createElement('button', {
              style: {
                padding: '4px 8px',
                border: `1px solid ${THEME.colors.borderLight}`,
                borderRadius: THEME.borderRadius.sm,
                background: THEME.colors.backgroundWhite,
                fontSize: '10px',
                cursor: 'pointer'
              }
            }, 'Center'),
            React.createElement('button', {
              style: {
                padding: '4px 8px',
                border: `1px solid ${THEME.colors.borderLight}`,
                borderRadius: THEME.borderRadius.sm,
                background: THEME.colors.backgroundWhite,
                fontSize: '10px',
                cursor: 'pointer'
              }
            }, 'Fit'),
            React.createElement('button', {
              style: {
                padding: '4px 8px',
                border: `1px solid ${THEME.colors.borderLight}`,
                borderRadius: THEME.borderRadius.sm,
                background: THEME.colors.backgroundWhite,
                fontSize: '10px',
                cursor: 'pointer'
              }
            }, 'Reset')
          )
        ),

        // Search bar
        React.createElement('input', {
          type: 'text',
          placeholder: 'Search...',
          style: {
            width: '100%',
            padding: THEME.spacing.sm,
            border: `1px solid ${THEME.colors.borderLight}`,
            borderRadius: THEME.borderRadius.sm,
            fontSize: '14px'
          }
        })
      ),

      // Main Content Area
      React.createElement('div', {
        style: {
          flex: 1,
          display: 'flex',
          position: 'relative'
        }
      },
        // Graph Visualization
        React.createElement('div', {
          style: {
            width: graphWidth,
            height: graphHeight,
            position: 'relative',
            background: '#fafafa',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }
        },
          React.createElement('div', {
            style: {
              textAlign: 'center',
              color: THEME.colors.muted
            }
          },
            React.createElement('h3', { style: { margin: '0 0 8px 0' } }, 'Neo4j Graph'),
            React.createElement('p', { style: { margin: 0, fontSize: '12px' } }, 
              `${data.nodes?.length || 0} nodes • ${data.links?.length || 0} edges`
            )
          )
        ),

        // Sidebar
        React.createElement('div', {
          style: {
            width: sidebarWidth,
            height: graphHeight,
            borderLeft: `1px solid ${THEME.colors.border}`,
            display: 'flex',
            flexDirection: 'column',
            background: THEME.colors.backgroundWhite
          }
        },
          // Tabs
          React.createElement('div', {
            style: {
              display: 'flex',
              borderBottom: `1px solid ${THEME.colors.border}`
            }
          },
            React.createElement('button', {
              style: {
                flex: 1,
                padding: THEME.spacing.sm,
                border: 'none',
                background: activeTab === 'ACTIVE' ? THEME.colors.primary : 'transparent',
                color: activeTab === 'ACTIVE' ? 'white' : THEME.colors.text,
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer'
              },
              onClick: () => setActiveTab('ACTIVE')
            }, 'ACTIVE'),
            React.createElement('button', {
              style: {
                flex: 1,
                padding: THEME.spacing.sm,
                border: 'none',
                background: activeTab === 'HISTORY' ? THEME.colors.primary : 'transparent',
                color: activeTab === 'HISTORY' ? 'white' : THEME.colors.text,
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer'
              },
              onClick: () => setActiveTab('HISTORY')
            }, 'HISTORY')
          ),

          // Tab Content
          React.createElement('div', {
            style: {
              flex: 1,
              padding: THEME.spacing.md,
              fontSize: '12px',
              color: THEME.colors.muted
            }
          },
            activeTab === 'ACTIVE' 
              ? 'Click on a node or edge to see details'
              : 'No actions yet'
          )
        )
      ),

      // Status bar
      React.createElement('div', {
        style: {
          height: LAYOUT.status.height,
          padding: `0 ${THEME.spacing.lg}`,
          background: THEME.colors.background,
          borderTop: `1px solid ${THEME.colors.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '11px',
          color: THEME.colors.muted
        }
      },
        React.createElement('span', null, 
          `Nodes: ${data.nodes?.length || 0} • Edges: ${data.links?.length || 0}`
        ),
        React.createElement('span', null, 'Drag • Zoom • Click to select')
      )
    );
  };

})();