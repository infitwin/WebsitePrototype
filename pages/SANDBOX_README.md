# Sandbox Page Implementation

This document explains how the Nexus Sandbox page implements drag and drop functionality using the Nexus Graph Control v16.3.0 bundle.

## Overview

The sandbox page (`sandbox.html`) demonstrates two completely separate drag and drop systems:

1. **Node Panel (👤)** - Creates new nodes from Neo4j database
2. **Artifacts Panel (📎)** - Attaches files from Firebase storage to existing elements

## Implementation Details

### Node Panel (👤 Button)

**Purpose**: Drag Neo4j database nodes to create new graph elements

**Guide Used**: `NODE_DRAG_DROP_GUIDE.md`

**Drag Format**:
```javascript
e.dataTransfer.setData('text/plain', JSON.stringify({
    dragType: 'node',           // REQUIRED: Identifies as node drag
    sourceControl: 'node-list', // REQUIRED: Must be 'node-list'
    id: 'neo4j_node_id',
    name: 'John Smith',
    type: 'person',             // person, organization, event, place, thing
    label: 'John Smith',
    properties: { /* Neo4j properties */ }
}));
```

**Result**: Creates green circles (new nodes) on the graph

**Handler**: `onNodeDrop` callback processes these drops

### Artifacts Panel (📎 Button)

**Purpose**: Drag files from Firebase storage to attach to existing graph elements

**Guide Used**: `FILE_DROP_GUIDE.md`

**Drag Format**:
```javascript
e.dataTransfer.setData('text/plain', JSON.stringify({
    // NO dragType: 'node' - this would create nodes instead of attachments
    // NO sourceControl: 'node-list' - this is not from node list
    name: 'document.pdf',
    type: 'application/pdf',    // REQUIRED: prevents undefined errors
    url: 'https://firebase.com/files/doc.pdf',
    size: 1024000,
    source: 'artifact-panel',   // Custom metadata
    fileId: 'firebase_id',      // Custom metadata
    timestamp: '2025-06-25T...' // Custom metadata
}));
```

**Result**: Attaches files to existing nodes/edges (no new nodes created)

**Handler**: `onFileDrop` callback processes these drops

## File Drop Handler Implementation

The `handleSandboxFileDrop` function handles both real files and artifacts:

```javascript
function handleSandboxFileDrop(file, target) {
    if (file._file) {
        // Real file from file system
        handleRealFile(file._file, target);
    } else if (file.url) {
        // Artifact from panel (URL-based)
        handleArtifactFile(file, target);
    } else {
        // Legacy test data
        handleTestData(file, target);
    }
}
```

### Real Files
- **Source**: Operating system file drag
- **Data**: Actual File objects with binary content
- **Processing**: Use FileReader for content access

### Artifacts
- **Source**: Firebase storage via artifacts panel
- **Data**: JSON with URL, metadata
- **Processing**: Use URL for remote file access

## Key Fixes Implemented

### 1. JSON Parse Error Fix
**Problem**: `SyntaxError: Unexpected token 'h', "https://fi"... is not valid JSON`

**Cause**: Artifact panel was sending raw URLs instead of JSON

**Fix**: Wrap artifact data in `JSON.stringify()`:
```javascript
// WRONG (causes crash):
e.dataTransfer.setData('text/plain', 'https://firebase.com/file.pdf');

// CORRECT (works):
e.dataTransfer.setData('text/plain', JSON.stringify({
    name: 'file.pdf',
    type: 'application/pdf',
    url: 'https://firebase.com/file.pdf'
}));
```

### 2. Green Node Creation Fix
**Problem**: Artifacts created green nodes instead of attaching to existing elements

**Cause**: Artifact panel was using `dragType: 'node'` and `sourceControl: 'node-list'`

**Fix**: Remove node-specific fields from artifact data:
```javascript
// WRONG (creates nodes):
JSON.stringify({
    dragType: 'node',           // Remove this
    sourceControl: 'node-list', // Remove this
    url: 'https://...'
})

// CORRECT (attaches to nodes):
JSON.stringify({
    name: 'file.pdf',
    type: 'application/pdf', 
    url: 'https://...'
})
```

### 3. Undefined Type Error Fix
**Problem**: `Cannot read properties of undefined (reading 'startsWith')`

**Cause**: Missing `type` property in artifact data

**Fix**: Always include `type` in artifact JSON:
```javascript
JSON.stringify({
    name: 'document.pdf',
    type: 'application/pdf',  // Required
    url: 'https://...'
})
```

## System Separation

**CRITICAL**: Node Panel and Artifacts Panel are completely separate systems and must never be mixed:

| Panel | Purpose | Creates | Format | Guide |
|-------|---------|---------|--------|-------|
| Node Panel (👤) | Drag database nodes | New nodes (green circles) | `dragType: 'node'` | NODE_DRAG_DROP_GUIDE.md |
| Artifacts Panel (📎) | Drag storage files | File attachments | JSON with `url` field | FILE_DROP_GUIDE.md |

## Bundle Usage

The implementation uses the Nexus Graph Control bundle exactly as provided:

```javascript
// Bundle is loaded as-is
<script src="../js/nexus-graph-control-v16.3.0.bundle.min.js"></script>

// Configuration through documented props only
React.createElement(window.NexusGraphControl.NexusGraphControl, {
    data: currentSandboxData,
    onNodeDrop: handleSandboxNodeDrop,  // For nodes from node panel
    onFileDrop: handleSandboxFileDrop   // For files/artifacts
});
```

**No modifications were made to the bundle itself** - only configuration through the documented API.

## Testing

1. **Node Panel**: Open node panel (👤), drag Neo4j nodes → Creates green circles
2. **Artifacts Panel**: Open artifacts panel (📎), drag files → Attaches to existing elements  
3. **File System**: Drag files from OS directly → Uses `onFileDrop` for file processing
4. **Error Handling**: All previous JSON parse errors resolved

## File Structure

- `sandbox.html` - Main implementation
- `js/nexus-graph-control-v16.3.0.bundle.min.js` - Unmodified bundle
- `NODE_DRAG_DROP_GUIDE.md` - Guide for node panel implementation
- `FILE_DROP_GUIDE.md` - Guide for artifacts panel implementation