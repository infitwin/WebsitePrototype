/**
 * Interview Validation Wrapper
 * Implements the 70/30 split layout with graph and info panel
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import D3Diagram from '../D3Diagram/index';
import InfoPanel from './components/InfoPanel';
import mockDataService from './services/mockDataService';
import SearchBar from '../common/SearchBar';
import FilterPills from '../common/FilterPills';

const InterviewValidation = ({ width = window.innerWidth, height = window.innerHeight }) => {
  // State management
  const [operations, setOperations] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [highlightedElements, setHighlightedElements] = useState(new Set());
  const [highlightTimeouts, setHighlightTimeouts] = useState({});
  
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [activeFilters, setActiveFilters] = useState(new Set());
  
  // Label visibility state
  const [labelsVisible, setLabelsVisible] = useState(true);
  
  // Refs
  const diagramRef = useRef(null);
  
  // Subscribe to data changes
  useEffect(() => {
    const unsubscribe = mockDataService.subscribe((data, operation) => {
      console.log('Data changed:', operation.type, data);
      // In a real implementation, this would update the graph
      // For now, we'll just log it and add to operations
      if (operation.type !== 'LOAD_PRESET') {
        // The operation is already added by our handlers
      }
    });
    
    return unsubscribe;
  }, []);
  
  // Calculate dimensions for 70/30 split
  const graphWidth = width * 0.7;
  const panelWidth = width * 0.3;

  // Add operation to history
  const addOperation = useCallback((type, itemName, details = null, elementId = null, elementType = 'node') => {
    const operation = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      type,
      itemName,
      details,
      highlight: true,
      elementId,
      elementType
    };
    
    setOperations(prev => [...prev, operation]);
    
    // Remove highlight after 5 seconds
    setTimeout(() => {
      setOperations(prev => 
        prev.map(op => op.id === operation.id ? { ...op, highlight: false } : op)
      );
    }, 5000);
    
    return operation;
  }, []);

  // Handle operation click from info panel
  const handleOperationClick = useCallback((operation) => {
    // Find and highlight the corresponding graph element
    console.log('Operation clicked:', operation);
    
    if (operation.elementId) {
      // Clear any existing timeout for this element
      if (highlightTimeouts[operation.elementId]) {
        clearTimeout(highlightTimeouts[operation.elementId]);
      }
      
      // Add to highlighted elements
      setHighlightedElements(prev => new Set([...prev, operation.elementId]));
      
      // Set timeout to remove highlight after 3-5 seconds
      const timeout = setTimeout(() => {
        setHighlightedElements(prev => {
          const newSet = new Set(prev);
          newSet.delete(operation.elementId);
          return newSet;
        });
        
        setHighlightTimeouts(prev => {
          const newTimeouts = { ...prev };
          delete newTimeouts[operation.elementId];
          return newTimeouts;
        });
      }, 4000); // 4 seconds for good visibility
      
      setHighlightTimeouts(prev => ({ ...prev, [operation.elementId]: timeout }));
    }
  }, [highlightTimeouts]);

  // Handle node events from graph
  const handleNodeSelect = useCallback((node) => {
    setSelectedNode(node);
    addOperation('SELECT', node.name || node.id, `Type: ${node.type}`, node.id, 'node');
  }, [addOperation]);

  const handleNodeHover = useCallback((node) => {
    setHoveredNode(node);
  }, []);

  const handleNodeClick = useCallback((node) => {
    // This will be used for error flagging
    const isErrorFlag = window.event?.shiftKey; // Shift+click to flag error
    
    if (isErrorFlag) {
      const op = addOperation('ERROR_FLAG', node.name || node.id, 'User flagged as incorrect', node.id, 'node');
      // Trigger immediate highlight for error flags
      handleOperationClick(op);
      // In Phase 5, this would send to WebSocket
    } else {
      handleNodeSelect(node);
    }
  }, [handleNodeSelect, addOperation]);

  // Mock data operations for Phase 2
  const handleNodeAdd = useCallback((node) => {
    const op = addOperation('ADD_NODE', node.name || node.id, `Type: ${node.type}`, node.id, 'node');
    // Highlight new node
    handleOperationClick(op);
  }, [addOperation, handleOperationClick]);

  const handleEdgeAdd = useCallback((edge) => {
    const op = addOperation('ADD_EDGE', edge.type || 'RELATIONSHIP', 
      `${edge.source} → ${edge.target}`, edge.id || `${edge.source}-${edge.target}`, 'edge');
    // Highlight new edge
    handleOperationClick(op);
  }, [addOperation, handleOperationClick]);

  const handleNodeUpdate = useCallback((node) => {
    const op = addOperation('UPDATE_NODE', node.name || node.id, 'Properties updated', node.id, 'node');
    // Highlight updated node
    handleOperationClick(op);
  }, [addOperation, handleOperationClick]);

  const handleNodeDelete = useCallback((node) => {
    addOperation('DELETE_NODE', node.name || node.id, 'Removed from graph', node.id, 'node');
    // No highlight for deleted nodes
  }, [addOperation]);

  // Search handler
  const handleSearch = useCallback((term) => {
    setSearchTerm(term);
    
    if (!term) {
      setSearchResults([]);
      if (diagramRef.current?.clearHighlights) {
        diagramRef.current.clearHighlights();
      }
      return;
    }
    
    // Get current data from mockDataService
    const currentData = mockDataService.getData();
    
    // Search nodes by name, label, or type
    const results = currentData.nodes.filter(node => {
      const searchStr = term.toLowerCase();
      return (
        node.name?.toLowerCase().includes(searchStr) ||
        node.label?.toLowerCase().includes(searchStr) ||
        node.type?.toLowerCase().includes(searchStr)
      );
    });
    
    setSearchResults(results);
    
    // Highlight search results in the graph
    if (diagramRef.current?.highlightNodes) {
      diagramRef.current.highlightNodes(results.map(n => n.id));
    }
  }, []);

  // Filter toggle handler
  const handleFilterToggle = useCallback((filterType) => {
    const newFilters = new Set(activeFilters);
    
    if (newFilters.has(filterType)) {
      newFilters.delete(filterType);
    } else {
      newFilters.add(filterType);
    }
    
    setActiveFilters(newFilters);
    
    // Apply filters to the graph
    if (diagramRef.current?.applyFilters) {
      diagramRef.current.applyFilters(Array.from(newFilters));
    }
  }, [activeFilters]);

  return (
    <div style={{ 
      display: 'flex', 
      width, 
      height,
      backgroundColor: '#FFFFFF'
    }}>
      {/* Graph Visualization (70%) */}
      <div style={{ width: graphWidth, height, position: 'relative' }}>
        <SearchBar 
          onSearch={handleSearch} 
          resultCount={searchResults.length} 
        />
        <FilterPills 
          activeFilters={activeFilters} 
          onFilterToggle={handleFilterToggle} 
          labelsVisible={labelsVisible}
          onLabelsToggle={() => setLabelsVisible(!labelsVisible)}
        />
        <D3Diagram
          ref={diagramRef}
          width={graphWidth}
          height={height}
          onNodeClick={handleNodeClick}
          onNodeHover={handleNodeHover}
          onNodeAdd={handleNodeAdd}
          onEdgeAdd={handleEdgeAdd}
          onNodeUpdate={handleNodeUpdate}
          onNodeDelete={handleNodeDelete}
          highlightedElements={highlightedElements}
          searchTerm={searchTerm}
          activeFilters={activeFilters}
          labelsVisible={labelsVisible}
        />
      </div>
      
      {/* Info Panel (30%) */}
      <InfoPanel
        operations={operations}
        selectedNode={selectedNode}
        hoveredNode={hoveredNode}
        onOperationClick={handleOperationClick}
        onClearSelection={() => setSelectedNode(null)}
      />
      
      {/* Data Control Panel for Phase 2 Testing */}
      <div style={{
        position: 'absolute',
        top: 20,
        right: panelWidth + 20,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        padding: '10px',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        fontSize: '12px'
      }}>
        <h4 style={{ margin: '0 0 10px 0' }}>Phase 2: Data Operations</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <button 
            onClick={() => {
              const newNode = mockDataService.addNode({
                id: `node_${Date.now()}`,
                name: `Test Node ${operations.length + 1}`,
                type: 'person'
              });
              handleNodeAdd(newNode);
            }}
            style={{
              padding: '4px 8px',
              fontSize: '11px',
              cursor: 'pointer'
            }}
          >
            Add Node
          </button>
          <button 
            onClick={() => {
              if (selectedNode) {
                const updated = mockDataService.updateNode(selectedNode.id, {
                  name: selectedNode.name + ' (Updated)',
                  updated: true
                });
                handleNodeUpdate(updated);
              }
            }}
            disabled={!selectedNode}
            style={{
              padding: '4px 8px',
              fontSize: '11px',
              cursor: 'pointer'
            }}
          >
            Update Selected
          </button>
          <button 
            onClick={() => {
              if (selectedNode) {
                mockDataService.deleteNode(selectedNode.id);
                handleNodeDelete(selectedNode);
                setSelectedNode(null);
              }
            }}
            disabled={!selectedNode}
            style={{
              padding: '4px 8px',
              fontSize: '11px',
              cursor: 'pointer',
              color: 'red'
            }}
          >
            Delete Selected
          </button>
          <hr style={{ margin: '5px 0' }} />
          <div style={{ fontSize: '10px', color: '#666' }}>
            Shift+Click node to flag error
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewValidation;