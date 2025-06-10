/**
 * Neo4j Diagram Component - DEPRECATED
 * This component has been replaced by D3Diagram
 * Keeping minimal stub to prevent build errors
 */

import React, { useRef, useImperativeHandle } from 'react';

const Neo4jDiagram = React.forwardRef((props, ref) => {
  const containerRef = useRef(null);

  // Expose methods to parent component (for compatibility)
  useImperativeHandle(ref, () => ({
    highlightNodes: () => {
      console.warn('Neo4jDiagram is deprecated - use D3Diagram instead');
    },
    clearHighlights: () => {
      console.warn('Neo4jDiagram is deprecated - use D3Diagram instead');
    },
    applyFilters: () => {
      console.warn('Neo4jDiagram is deprecated - use D3Diagram instead');
    }
  }));

  return (
    <div 
      ref={containerRef}
      style={{ 
        width: props.width || '100%', 
        height: props.height || '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f0f0f0',
        border: '2px dashed #ccc',
        color: '#666'
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <h3>⚠️ DEPRECATED COMPONENT</h3>
        <p>Neo4jDiagram has been replaced by D3Diagram</p>
        <p>This is a compatibility stub</p>
      </div>
    </div>
  );
});

export default Neo4jDiagram;