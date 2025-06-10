/**
 * Mock Data Service
 * Provides CRUD operations for Phase 2 testing
 * Will be replaced with WebSocket operations in Phase 5
 */

import { simpleTwoNodeData } from '../mockData/simpleTwoNode';
import { familyTreeData } from '../mockData/familyTree';
import { fullInterviewData } from '../mockData/interviewData';

class MockDataService {
  constructor() {
    // Initialize with simple data
    this.currentData = JSON.parse(JSON.stringify(simpleTwoNodeData));
    this.operationHistory = [];
    this.listeners = new Set();
  }

  // Subscribe to data changes
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // Notify all listeners of data changes
  notify(operation) {
    this.operationHistory.push({
      ...operation,
      timestamp: new Date().toISOString()
    });
    
    this.listeners.forEach(callback => {
      callback(this.currentData, operation);
    });
  }

  // Get current data
  getData() {
    return JSON.parse(JSON.stringify(this.currentData));
  }

  // Load preset data
  loadPreset(preset) {
    switch(preset) {
      case 'simple':
        this.currentData = JSON.parse(JSON.stringify(simpleTwoNodeData));
        break;
      case 'family':
        this.currentData = JSON.parse(JSON.stringify(familyTreeData));
        break;
      case 'full':
        this.currentData = JSON.parse(JSON.stringify(fullInterviewData));
        break;
      default:
        throw new Error(`Unknown preset: ${preset}`);
    }
    
    this.notify({
      type: 'LOAD_PRESET',
      preset,
      nodeCount: this.currentData.nodes.length,
      edgeCount: this.currentData.edges.length
    });
  }

  // Add node
  addNode(node) {
    // Validate node
    if (!node.id) {
      throw new Error('Node must have an id');
    }
    
    if (this.currentData.nodes.find(n => n.id === node.id)) {
      throw new Error(`Node with id ${node.id} already exists`);
    }
    
    // Add node with defaults
    const newNode = {
      name: node.name || node.id,
      type: node.type || 'person',
      label: node.label || node.name || node.id,
      ...node
    };
    
    this.currentData.nodes.push(newNode);
    
    this.notify({
      type: 'ADD_NODE',
      node: newNode
    });
    
    return newNode;
  }

  // Update node
  updateNode(nodeId, updates) {
    const nodeIndex = this.currentData.nodes.findIndex(n => n.id === nodeId);
    
    if (nodeIndex === -1) {
      throw new Error(`Node with id ${nodeId} not found`);
    }
    
    // Don't allow changing id
    delete updates.id;
    
    const updatedNode = {
      ...this.currentData.nodes[nodeIndex],
      ...updates
    };
    
    this.currentData.nodes[nodeIndex] = updatedNode;
    
    this.notify({
      type: 'UPDATE_NODE',
      nodeId,
      updates,
      node: updatedNode
    });
    
    return updatedNode;
  }

  // Delete node
  deleteNode(nodeId) {
    const nodeIndex = this.currentData.nodes.findIndex(n => n.id === nodeId);
    
    if (nodeIndex === -1) {
      throw new Error(`Node with id ${nodeId} not found`);
    }
    
    // Remove node
    const [deletedNode] = this.currentData.nodes.splice(nodeIndex, 1);
    
    // Remove connected edges
    const deletedEdges = [];
    this.currentData.edges = this.currentData.edges.filter(edge => {
      if (edge.source === nodeId || edge.target === nodeId) {
        deletedEdges.push(edge);
        return false;
      }
      return true;
    });
    
    this.notify({
      type: 'DELETE_NODE',
      nodeId,
      node: deletedNode,
      cascadedEdges: deletedEdges
    });
    
    return { node: deletedNode, edges: deletedEdges };
  }

  // Add edge
  addEdge(edge) {
    // Validate edge
    if (!edge.source || !edge.target) {
      throw new Error('Edge must have source and target');
    }
    
    // Check nodes exist
    const sourceExists = this.currentData.nodes.find(n => n.id === edge.source);
    const targetExists = this.currentData.nodes.find(n => n.id === edge.target);
    
    if (!sourceExists) {
      throw new Error(`Source node ${edge.source} not found`);
    }
    
    if (!targetExists) {
      throw new Error(`Target node ${edge.target} not found`);
    }
    
    // Generate id if not provided
    const newEdge = {
      id: edge.id || `edge_${Date.now()}`,
      type: edge.type || 'RELATED_TO',
      label: edge.label || edge.type || 'Related To',
      ...edge
    };
    
    this.currentData.edges.push(newEdge);
    
    this.notify({
      type: 'ADD_EDGE',
      edge: newEdge
    });
    
    return newEdge;
  }

  // Update edge
  updateEdge(edgeId, updates) {
    const edgeIndex = this.currentData.edges.findIndex(e => e.id === edgeId);
    
    if (edgeIndex === -1) {
      throw new Error(`Edge with id ${edgeId} not found`);
    }
    
    // Don't allow changing id, source, or target
    delete updates.id;
    delete updates.source;
    delete updates.target;
    
    const updatedEdge = {
      ...this.currentData.edges[edgeIndex],
      ...updates
    };
    
    this.currentData.edges[edgeIndex] = updatedEdge;
    
    this.notify({
      type: 'UPDATE_EDGE',
      edgeId,
      updates,
      edge: updatedEdge
    });
    
    return updatedEdge;
  }

  // Delete edge
  deleteEdge(edgeId) {
    const edgeIndex = this.currentData.edges.findIndex(e => e.id === edgeId);
    
    if (edgeIndex === -1) {
      throw new Error(`Edge with id ${edgeId} not found`);
    }
    
    const [deletedEdge] = this.currentData.edges.splice(edgeIndex, 1);
    
    this.notify({
      type: 'DELETE_EDGE',
      edgeId,
      edge: deletedEdge
    });
    
    return deletedEdge;
  }

  // Batch operations
  batchUpdate(operations) {
    const results = [];
    
    operations.forEach(op => {
      try {
        switch(op.type) {
          case 'ADD_NODE':
            results.push(this.addNode(op.data));
            break;
          case 'UPDATE_NODE':
            results.push(this.updateNode(op.id, op.data));
            break;
          case 'DELETE_NODE':
            results.push(this.deleteNode(op.id));
            break;
          case 'ADD_EDGE':
            results.push(this.addEdge(op.data));
            break;
          case 'UPDATE_EDGE':
            results.push(this.updateEdge(op.id, op.data));
            break;
          case 'DELETE_EDGE':
            results.push(this.deleteEdge(op.id));
            break;
          default:
            throw new Error(`Unknown operation type: ${op.type}`);
        }
      } catch (error) {
        results.push({ error: error.message, operation: op });
      }
    });
    
    return results;
  }

  // Get operation history
  getHistory() {
    return [...this.operationHistory];
  }

  // Clear all data
  clear() {
    this.currentData = { nodes: [], edges: [] };
    this.operationHistory = [];
    
    this.notify({
      type: 'CLEAR',
      message: 'All data cleared'
    });
  }
}

// Export singleton instance
export default new MockDataService();