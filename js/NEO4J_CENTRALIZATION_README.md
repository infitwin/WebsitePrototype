# Neo4j Visualization - Centralized Implementation

## Overview

The Neo4j visualization has been centralized to prevent duplication and ensure consistency across the application. This document describes the new centralized implementation and migration guide.

## New Centralized Files

### 1. `/js/neo4j-unified.js` (Recommended for HTML pages)
- **Purpose**: Non-ES6 module for direct script tag usage
- **Usage**: For pages that load JavaScript via `<script>` tags
- **Features**: Full visualization with search, filters, history panel, and CRUD operations
- **Example**:
```html
<script src="../js/neo4j-unified.js"></script>
<script>
  const viz = new Neo4jVisualization('#container', {
    width: 800,
    height: 600,
    showFilters: true,
    showSearch: true,
    showHistory: true,
    onNodeSelect: (node) => console.log('Selected:', node)
  });
  
  viz.setData({
    nodes: [...],
    edges: [...]
  });
</script>
```

### 2. `/js/neo4j-centralized.js` (For ES6 module usage)
- **Purpose**: ES6 module version for modern JavaScript applications
- **Usage**: For React components or module-based applications
- **Features**: Same as unified version but with ES6 imports/exports
- **Example**:
```javascript
import { Neo4jVisualization } from '../js/neo4j-centralized.js';

const viz = new Neo4jVisualization('#container', options);
```

## Migration Guide

### From `neo4j-init.js`
The old `neo4j-init.js` created a global `Neo4jVisualization` class. The new unified version maintains the same API:

**Before**:
```html
<script src="../js/neo4j-init.js"></script>
<script>
  const viz = new Neo4jVisualization('#container');
</script>
```

**After**:
```html
<script src="../js/neo4j-unified.js"></script>
<script>
  const viz = new Neo4jVisualization('#container');
</script>
```

### From `neo4j-visualization.js`
The old export version is replaced by the ES6 module:

**Before**:
```javascript
import { Neo4jVisualization } from '../js/neo4j-visualization.js';
```

**After**:
```javascript
import { Neo4jVisualization } from '../js/neo4j-centralized.js';
```

## Features

The centralized Neo4j visualization includes:

1. **Search Functionality**
   - Real-time node search
   - Highlight matching nodes
   - Clear search results

2. **Filter System**
   - Filter by node type (Person, Event, Place, Memory)
   - Visual indicators for active filters
   - Clear all filters option

3. **History Panel**
   - Track all user actions
   - Show active operations
   - Keep last 20 actions

4. **Interactive Features**
   - Click to select nodes/edges
   - Drag to pan
   - Scroll to zoom
   - Delete key to remove selected nodes

5. **Customization Options**
   - Configurable dimensions
   - Show/hide panels (search, filters, history)
   - Custom event handlers
   - Styling options

## API Reference

### Constructor Options
```javascript
{
  width: 800,              // Container width
  height: 600,             // Container height
  showFilters: true,       // Show filter buttons
  showSearch: true,        // Show search bar
  showHistory: true,       // Show history panel
  onNodeSelect: function,  // Node click handler
  onEdgeSelect: function,  // Edge click handler
  onNodeDelete: function,  // Node delete handler
  onNodeCreate: function,  // Node create handler
  onNodeUpdate: function,  // Node update handler
  onEdgeCreate: function,  // Edge create handler
  style: {}               // Additional CSS styles
}
```

### Methods
- `setData(data)` - Update visualization data
- `highlightNodes(nodeIds)` - Highlight specific nodes
- `clearHighlights()` - Clear all highlights
- `applyFilters(nodeTypes)` - Apply node type filters
- `destroy()` - Clean up and remove visualization

## Deprecated Files

The following files should no longer be used:
- `/js/neo4j-init.js` - Use `neo4j-unified.js` instead
- `/js/neo4j-visualization.js` - Use `neo4j-centralized.js` instead
- `/js/components/Neo4jDiagram/index.js` - Deprecated stub

## Notes

- The centralized implementation is based on the latest version from `neo4j-visualization-test`
- D3DiagramProduction component is shared between both implementations
- The unified version includes all features from the test implementation
- Backward compatibility is maintained for existing code