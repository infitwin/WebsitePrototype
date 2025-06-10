/**
 * Unified Neo4j Visualization Module
 * Non-ES6 module version for direct script tag usage
 * Based on the latest version from neo4j-visualization-test
 */

(function(window) {
  'use strict';

  /**
   * Neo4jVisualization - Main class for all Neo4j visualizations
   * Provides the same functionality as the React component but for vanilla JS
   */
  class Neo4jVisualization {
    constructor(container, options = {}) {
      this.container = typeof container === 'string' ? document.querySelector(container) : container;
      this.options = {
        width: 800,
        height: 600,
        showFilters: true,
        showSearch: true,
        showHistory: true,
        showDataManager: false, // Added for compatibility with existing code
        onNodeSelect: null,
        onEdgeSelect: null,
        onNodeDelete: null,
        onNodeCreate: null,
        onNodeUpdate: null,
        onEdgeCreate: null,
        style: {},
        ...options
      };
      
      this.data = null;
      this.selectedNode = null;
      this.selectedEdge = null;
      this.searchTerm = '';
      this.actionHistory = [];
      this.activeOperation = null;
      this.activeFilters = new Set();
      this.diagram = null;
      
      this.init();
    }
    
    init() {
      // Create the main container structure
      const html = `
        <div class="neo4j-visualization-container" style="
          width: ${this.options.width}px;
          height: ${this.options.height}px;
          display: flex;
          flex-direction: column;
          border: 1px solid #ddd;
          border-radius: 8px;
          background: white;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          overflow: hidden;
          ${Object.entries(this.options.style).map(([k, v]) => `${k}: ${v}`).join('; ')}
        ">
          ${(this.options.showSearch || this.options.showFilters) ? `
          <div class="neo4j-controls-header" style="
            padding: 12px 15px;
            border-bottom: 1px solid #eee;
            background: #f8f9fa;
          ">
            ${this.options.showSearch ? `
            <div class="neo4j-search-container" style="
              display: flex;
              align-items: center;
              ${this.options.showFilters ? 'margin-bottom: 10px;' : ''}
            ">
              <div style="position: relative; flex: 1;">
                <input type="text" 
                  class="neo4j-search-input"
                  placeholder="Search nodes..." 
                  style="
                    width: 100%;
                    padding: 6px 30px 6px 10px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    font-size: 13px;
                    outline: none;
                  ">
                <span style="
                  position: absolute;
                  right: 8px;
                  top: 50%;
                  transform: translateY(-50%);
                  color: #999;
                  font-size: 12px;
                ">🔍</span>
              </div>
            </div>
            ` : ''}
            
            ${this.options.showFilters ? `
            <div class="neo4j-filters" style="
              display: flex;
              gap: 6px;
              align-items: center;
              flex-wrap: wrap;
            ">
              <span style="
                font-size: 11px;
                font-weight: 600;
                color: #666;
                margin-right: 8px;
              ">Filters:</span>
              ${this.createFilterButtons()}
              <button class="neo4j-clear-filters" style="
                padding: 4px 8px;
                border: 1px solid #ddd;
                border-radius: 12px;
                background: #f5f5f5;
                color: #666;
                font-size: 10px;
                cursor: pointer;
                display: none;
              ">Clear</button>
            </div>
            ` : ''}
          </div>
          ` : ''}
          
          <div class="neo4j-main-content" style="
            flex: 1;
            display: flex;
            position: relative;
          ">
            <div class="neo4j-visualization" style="flex: 1;">
              <svg class="neo4j-svg" width="${this.options.showHistory ? this.options.width * 0.7 : this.options.width}" 
                   height="${this.options.height - (this.options.showSearch || this.options.showFilters ? 80 : 0) - 40}"></svg>
            </div>
            
            ${this.options.showHistory ? `
            <div class="neo4j-history-panel" style="
              width: ${this.options.width * 0.3}px;
              border-left: 1px solid #eee;
              background: #f8f9fa;
              display: flex;
              flex-direction: column;
            ">
              <div style="
                padding: 10px;
                border-bottom: 1px solid #eee;
                background: white;
              ">
                <div style="font-size: 11px; font-weight: 600; margin-bottom: 6px;">
                  ACTIVE QUEUE
                </div>
                <div class="neo4j-active-operation" style="
                  font-size: 10px;
                  color: #999;
                  font-style: italic;
                ">No active operations</div>
              </div>
              
              <div style="
                flex: 1;
                padding: 10px;
                overflow-y: auto;
              ">
                <div style="font-size: 11px; font-weight: 600; margin-bottom: 8px;">
                  HISTORY
                </div>
                <div class="neo4j-history-list" style="font-size: 10px; color: #666;">
                  <div style="font-style: italic; color: #999;">No actions yet</div>
                </div>
              </div>
            </div>
            ` : ''}
          </div>
          
          <div class="neo4j-status-bar" style="
            padding: 6px 10px;
            background: #f8f9fa;
            border-top: 1px solid #eee;
            font-size: 10px;
            color: #666;
            display: flex;
            justify-content: space-between;
          ">
            <span class="neo4j-stats">
              <strong>Nodes:</strong> 0 • <strong>Edges:</strong> 0
            </span>
            <span>Drag to pan • Scroll to zoom • Click to select • Del to delete</span>
          </div>
        </div>
      `;
      
      this.container.innerHTML = html;
      this.attachEventListeners();
      this.initD3Diagram();
    }
    
    createFilterButtons() {
      const filters = [
        { type: 'person', label: 'Person', color: '#9C88FF', icon: '👤' },
        { type: 'event', label: 'Event', color: '#FF7675', icon: '📅' },
        { type: 'place', label: 'Place', color: '#74B9FF', icon: '📍' },
        { type: 'memory', label: 'Memory', color: '#6BCF7F', icon: '📷' }
      ];
      
      return filters.map(filter => `
        <button class="neo4j-filter-btn" data-filter="${filter.type}" style="
          padding: 4px 8px;
          border: 1px solid #ddd;
          border-radius: 12px;
          background: white;
          color: #333;
          font-size: 10px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 3px;
          transition: all 0.2s;
        ">
          <span style="font-size: 10px;">${filter.icon}</span>
          <span>${filter.label}</span>
        </button>
      `).join('');
    }
    
    attachEventListeners() {
      // Search input
      const searchInput = this.container.querySelector('.neo4j-search-input');
      if (searchInput) {
        searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
      }
      
      // Filter buttons
      const filterBtns = this.container.querySelectorAll('.neo4j-filter-btn');
      filterBtns.forEach(btn => {
        btn.addEventListener('click', () => this.handleFilterToggle(btn.dataset.filter));
      });
      
      // Clear filters button
      const clearBtn = this.container.querySelector('.neo4j-clear-filters');
      if (clearBtn) {
        clearBtn.addEventListener('click', () => this.clearFilters());
      }
      
      // Keyboard events
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Delete' && this.selectedNode) {
          if (this.options.onNodeDelete) {
            this.options.onNodeDelete(this.selectedNode);
          }
        }
      });
    }
    
    initD3Diagram() {
      const svg = d3.select(this.container.querySelector('.neo4j-svg'));
      const width = +svg.attr('width');
      const height = +svg.attr('height');
      
      // Initialize D3 visualization with production D3DiagramProduction if available
      if (window.D3DiagramProduction) {
        // Use the React component version if loaded
        console.log('Using D3DiagramProduction component');
      } else {
        // Use our simplified D3 visualization
        this.diagram = new D3Visualization(svg.node(), {
          width,
          height,
          onNodeClick: (node) => this.handleNodeClick(node),
          onEdgeClick: (edge) => this.handleEdgeClick(edge),
          onNodeDelete: (node) => this.handleNodeDelete(node),
          onNodeCreate: (node) => this.handleNodeCreate(node),
          onNodeUpdate: (node) => this.handleNodeUpdate(node),
          onEdgeCreate: (edge) => this.handleEdgeCreate(edge)
        });
      }
    }
    
    setData(data) {
      this.data = data;
      if (this.diagram) {
        this.diagram.updateData(data);
      }
      this.updateStats();
    }
    
    updateStats() {
      const statsEl = this.container.querySelector('.neo4j-stats');
      if (statsEl && this.data) {
        statsEl.innerHTML = `
          <strong>Nodes:</strong> ${this.data.nodes?.length || 0} • 
          <strong>Edges:</strong> ${this.data.edges?.length || 0}
        `;
      }
    }
    
    handleSearch(term) {
      this.searchTerm = term;
      if (this.diagram && term) {
        const matchingNodeIds = this.data?.nodes
          ?.filter(node => 
            node.name?.toLowerCase().includes(term.toLowerCase()) ||
            node.label?.toLowerCase().includes(term.toLowerCase())
          )
          .map(node => node.id) || [];
        
        this.diagram.highlightNodes(matchingNodeIds);
      } else if (this.diagram) {
        this.diagram.clearHighlights();
      }
    }
    
    handleFilterToggle(filterType) {
      const typeMapping = {
        'person': ['central', 'family'],
        'event': ['event'],
        'place': ['place'],
        'memory': ['memory', 'memory_challenge', 'memory_joy']
      };
      
      if (this.activeFilters.has(filterType)) {
        this.activeFilters.delete(filterType);
      } else {
        this.activeFilters.add(filterType);
      }
      
      // Update button styles
      const btn = this.container.querySelector(`[data-filter="${filterType}"]`);
      const filterConfig = {
        'person': '#9C88FF',
        'event': '#FF7675',
        'place': '#74B9FF',
        'memory': '#6BCF7F'
      };
      
      if (this.activeFilters.has(filterType)) {
        btn.style.background = filterConfig[filterType];
        btn.style.color = 'white';
      } else {
        btn.style.background = 'white';
        btn.style.color = '#333';
      }
      
      // Show/hide clear button
      const clearBtn = this.container.querySelector('.neo4j-clear-filters');
      if (clearBtn) {
        clearBtn.style.display = this.activeFilters.size > 0 ? 'block' : 'none';
      }
      
      // Apply filters to diagram
      const actualNodeTypes = [];
      this.activeFilters.forEach(filter => {
        if (typeMapping[filter]) {
          actualNodeTypes.push(...typeMapping[filter]);
        }
      });
      
      if (this.diagram) {
        this.diagram.applyFilters(actualNodeTypes);
      }
      
      this.addToHistory('FILTER', `${this.activeFilters.has(filterType) ? 'Show' : 'Hide'} ${filterType}`);
    }
    
    clearFilters() {
      this.activeFilters.clear();
      
      // Reset all filter buttons
      const filterBtns = this.container.querySelectorAll('.neo4j-filter-btn');
      filterBtns.forEach(btn => {
        btn.style.background = 'white';
        btn.style.color = '#333';
      });
      
      // Hide clear button
      const clearBtn = this.container.querySelector('.neo4j-clear-filters');
      if (clearBtn) {
        clearBtn.style.display = 'none';
      }
      
      if (this.diagram) {
        this.diagram.applyFilters([]);
      }
    }
    
    addToHistory(action, target) {
      const entry = {
        timestamp: new Date().toLocaleTimeString(),
        action,
        target
      };
      this.actionHistory.unshift(entry);
      this.actionHistory = this.actionHistory.slice(0, 20); // Keep last 20
      
      // Show active operation for CRUD operations
      if (['DELETE NODE', 'CREATE NODE', 'UPDATE NODE', 'CREATE RELATIONSHIP'].includes(action)) {
        this.showActiveOperation(action, target);
      }
      
      this.updateHistoryDisplay();
    }
    
    showActiveOperation(action, target) {
      this.activeOperation = { action, target, timestamp: new Date().toLocaleTimeString() };
      
      const activeOpEl = this.container.querySelector('.neo4j-active-operation');
      if (activeOpEl) {
        activeOpEl.innerHTML = `
          <div style="
            padding: 6px;
            background: #e3f2fd;
            border-radius: 4px;
            font-size: 10px;
          ">
            <div style="font-weight: 600; color: #1976d2;">${action}</div>
            <div style="color: #666;">${target}</div>
          </div>
        `;
      }
      
      // Clear after 3 seconds
      setTimeout(() => {
        this.activeOperation = null;
        if (activeOpEl) {
          activeOpEl.innerHTML = '<div style="font-size: 10px; color: #999; font-style: italic;">No active operations</div>';
        }
      }, 3000);
    }
    
    updateHistoryDisplay() {
      const historyEl = this.container.querySelector('.neo4j-history-list');
      if (!historyEl) return;
      
      if (this.actionHistory.length === 0) {
        historyEl.innerHTML = '<div style="font-style: italic; color: #999;">No actions yet</div>';
      } else {
        historyEl.innerHTML = this.actionHistory.slice(0, 10).map((entry, index) => `
          <div style="
            padding: 4px 0;
            ${index < 9 ? 'border-bottom: 1px solid #f0f0f0;' : ''}
          ">
            <div style="color: #999; font-size: 9px;">[${entry.timestamp}]</div>
            <div><strong>${entry.action}:</strong> ${entry.target}</div>
          </div>
        `).join('');
      }
    }
    
    handleNodeClick(node) {
      this.selectedNode = node;
      this.selectedEdge = null;
      this.addToHistory('NODE', node.name || node.id);
      if (this.options.onNodeSelect) {
        this.options.onNodeSelect(node);
      }
    }
    
    handleEdgeClick(edge) {
      this.selectedEdge = edge;
      this.selectedNode = null;
      this.addToHistory('RELATIONSHIP', edge.label || 'Connection');
      if (this.options.onEdgeSelect) {
        this.options.onEdgeSelect(edge);
      }
    }
    
    handleNodeDelete(node) {
      this.addToHistory('DELETE NODE', node.name || node.id);
      if (this.options.onNodeDelete) {
        this.options.onNodeDelete(node);
      }
    }
    
    handleNodeCreate(node) {
      this.addToHistory('CREATE NODE', node.name || node.id);
      if (this.options.onNodeCreate) {
        this.options.onNodeCreate(node);
      }
    }
    
    handleNodeUpdate(node) {
      this.addToHistory('UPDATE NODE', node.name || node.id);
      if (this.options.onNodeUpdate) {
        this.options.onNodeUpdate(node);
      }
    }
    
    handleEdgeCreate(edge) {
      this.addToHistory('CREATE RELATIONSHIP', edge.label || 'Connection');
      if (this.options.onEdgeCreate) {
        this.options.onEdgeCreate(edge);
      }
    }
    
    // Public API methods
    highlightNodes(nodeIds) {
      if (this.diagram) {
        this.diagram.highlightNodes(nodeIds);
      }
    }
    
    clearHighlights() {
      if (this.diagram) {
        this.diagram.clearHighlights();
      }
    }
    
    applyFilters(nodeTypes) {
      if (this.diagram) {
        this.diagram.applyFilters(nodeTypes);
      }
    }
    
    destroy() {
      if (this.diagram) {
        this.diagram.destroy();
      }
      this.container.innerHTML = '';
    }
    
    // Additional methods for compatibility with existing code
    loadData(data) {
      this.setData(data);
    }
    
    updateVisualization(data) {
      this.setData(data);
    }
  }

  /**
   * D3Visualization - Core D3.js visualization logic
   * This is a simplified version that uses the same logic as D3DiagramProduction
   */
  class D3Visualization {
    constructor(svgElement, options = {}) {
      this.svg = d3.select(svgElement);
      this.options = options;
      this.simulation = null;
      this.nodes = [];
      this.links = [];
      this.g = null;
      this.zoom = null;
      
      this.init();
    }
    
    init() {
      const width = this.options.width;
      const height = this.options.height;
      
      // Clear existing content
      this.svg.selectAll('*').remove();
      
      // Create main group
      this.g = this.svg.append('g');
      
      // Setup zoom
      this.zoom = d3.zoom()
        .scaleExtent([0.1, 4])
        .on('zoom', (event) => {
          this.g.attr('transform', event.transform);
        });
      
      this.svg.call(this.zoom);
      
      // Create arrow markers
      this.svg.append('defs').selectAll('marker')
        .data(['arrowhead'])
        .enter().append('marker')
        .attr('id', d => d)
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 25)
        .attr('refY', 0)
        .attr('markerWidth', 8)
        .attr('markerHeight', 8)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', '#999');
      
      // Initialize force simulation
      this.simulation = d3.forceSimulation()
        .force('link', d3.forceLink().id(d => d.id).distance(100))
        .force('charge', d3.forceManyBody().strength(-300))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide().radius(30));
    }
    
    updateData(data) {
      if (!data || !data.nodes || !data.edges) return;
      
      this.nodes = data.nodes.map(d => ({...d}));
      this.links = data.edges.map(d => ({...d}));
      
      // Update visualization
      this.render();
    }
    
    render() {
      // Clear existing elements
      this.g.selectAll('.link').remove();
      this.g.selectAll('.node').remove();
      
      // Add links
      const link = this.g.append('g')
        .attr('class', 'links')
        .selectAll('line')
        .data(this.links)
        .enter().append('line')
        .attr('class', 'link')
        .attr('stroke', '#999')
        .attr('stroke-width', 2)
        .attr('marker-end', 'url(#arrowhead)')
        .on('click', (event, d) => {
          if (this.options.onEdgeClick) {
            this.options.onEdgeClick(d);
          }
        });
      
      // Add link labels
      const linkLabel = this.g.append('g')
        .attr('class', 'link-labels')
        .selectAll('text')
        .data(this.links)
        .enter().append('text')
        .attr('class', 'link-label')
        .attr('font-size', '10px')
        .attr('text-anchor', 'middle')
        .text(d => d.label || '');
      
      // Add nodes
      const node = this.g.append('g')
        .attr('class', 'nodes')
        .selectAll('g')
        .data(this.nodes)
        .enter().append('g')
        .attr('class', 'node')
        .call(this.drag());
      
      // Add circles
      node.append('circle')
        .attr('r', 20)
        .attr('fill', d => this.getNodeColor(d.type))
        .attr('stroke', '#fff')
        .attr('stroke-width', 2)
        .on('click', (event, d) => {
          if (this.options.onNodeClick) {
            this.options.onNodeClick(d);
          }
        });
      
      // Add labels
      node.append('text')
        .attr('dy', 4)
        .attr('text-anchor', 'middle')
        .attr('font-size', '12px')
        .attr('fill', 'white')
        .text(d => this.getNodeLabel(d));
      
      // Update simulation
      this.simulation
        .nodes(this.nodes)
        .on('tick', () => this.ticked(link, linkLabel, node));
      
      this.simulation.force('link').links(this.links);
      this.simulation.alpha(1).restart();
    }
    
    ticked(link, linkLabel, node) {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);
      
      linkLabel
        .attr('x', d => (d.source.x + d.target.x) / 2)
        .attr('y', d => (d.source.y + d.target.y) / 2);
      
      node.attr('transform', d => `translate(${d.x},${d.y})`);
    }
    
    drag() {
      return d3.drag()
        .on('start', (event, d) => {
          if (!event.active) this.simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d) => {
          if (!event.active) this.simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        });
    }
    
    getNodeColor(type) {
      const colorMap = {
        'central': '#9C88FF',
        'family': '#9C88FF',
        'event': '#FF7675',
        'place': '#74B9FF',
        'memory': '#6BCF7F',
        'memory_challenge': '#FF7675',
        'memory_joy': '#FFA502'
      };
      return colorMap[type] || '#999';
    }
    
    getNodeLabel(node) {
      if (node.name) return node.name;
      if (node.label) return node.label;
      return node.id;
    }
    
    highlightNodes(nodeIds) {
      this.g.selectAll('.node')
        .classed('highlighted', d => nodeIds.includes(d.id))
        .selectAll('circle')
        .attr('stroke-width', d => nodeIds.includes(d.id) ? 4 : 2);
    }
    
    clearHighlights() {
      this.g.selectAll('.node')
        .classed('highlighted', false)
        .selectAll('circle')
        .attr('stroke-width', 2);
    }
    
    applyFilters(nodeTypes) {
      if (nodeTypes.length === 0) {
        this.g.selectAll('.node').style('opacity', 1);
        this.g.selectAll('.link').style('opacity', 1);
      } else {
        this.g.selectAll('.node')
          .style('opacity', d => nodeTypes.includes(d.type) ? 1 : 0.2);
        
        this.g.selectAll('.link')
          .style('opacity', d => {
            const sourceVisible = nodeTypes.includes(d.source.type);
            const targetVisible = nodeTypes.includes(d.target.type);
            return sourceVisible && targetVisible ? 1 : 0.2;
          });
      }
    }
    
    destroy() {
      if (this.simulation) {
        this.simulation.stop();
      }
      this.svg.selectAll('*').remove();
    }
  }

  // Export to global namespace
  window.Neo4jVisualization = Neo4jVisualization;
  window.initNeo4jVisualization = function(container, options) {
    return new Neo4jVisualization(container, options);
  };
  
  // Compatibility aliases
  window.Neo4jVisualizationUnified = Neo4jVisualization;
  
})(window);