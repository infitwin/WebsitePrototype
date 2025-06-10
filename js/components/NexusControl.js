/**
 * Nexus Control - Interview Mode
 * Vanilla JavaScript version of the Neo4j Compact Control for WebsitePrototype
 * Optimized for interview page integration
 */

class NexusControl {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      width: options.width || 800,
      height: options.height || 340,
      mode: options.mode || 'interview',
      showHistory: options.showHistory !== false,
      showControls: options.showControls !== false,
      ...options
    };
    
    // State management
    this.data = { nodes: [], edges: [] };
    this.selectedNode = null;
    this.selectedEdge = null;
    this.searchTerm = '';
    this.actionHistory = [];
    this.activeFilters = new Set();
    this.stickyMode = false;
    
    // D3 references
    this.svg = null;
    this.simulation = null;
    this.graphContainer = null;
    
    this.init();
  }
  
  init() {
    console.log('🎯 Initializing Nexus Control for interview mode...');
    this.createContainer();
    this.loadD3();
  }
  
  createContainer() {
    this.container.innerHTML = `
      <div class="nexus-control" style="
        width: ${this.options.mode === 'dashboard' ? '100%' : this.options.width + 'px'};
        height: ${this.options.mode === 'dashboard' ? '100%' : this.options.height + 'px'};
        margin: ${this.options.mode === 'dashboard' ? '0' : '0 auto'};
        background: white;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.08);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        overflow: hidden;
        display: flex;
        flex-direction: column;
      ">
        <!-- Compact Header -->
        <div class="nexus-header" style="
          background: white;
          border-bottom: 1px solid #dee2e6;
          padding: 12px 16px;
        ">
          <!-- Title and Controls Row -->
          <div style="
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
          ">
            <h2 style="margin: 0; color: #333; font-size: 1.2rem;">
              Nexus - Interview Mode
            </h2>
            
            <!-- Compact Control Buttons -->
            <div class="control-buttons" style="display: flex; gap: 4px;">
              <span class="control-btn" data-action="center" style="
                padding: 4px 8px;
                border: 1px solid #ddd;
                background: white;
                color: #333;
                border-radius: 3px;
                fontSize: 10px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s;
              " title="Center graph">Center</span>
              
              <span class="control-btn" data-action="fit" style="
                padding: 4px 8px;
                border: 1px solid #ddd;
                background: white;
                color: #333;
                border-radius: 3px;
                fontSize: 10px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s;
              " title="Fit graph to view">Fit</span>
              
              <span class="control-btn" data-action="reset" style="
                padding: 4px 8px;
                border: 1px solid #ddd;
                background: white;
                color: #333;
                border-radius: 3px;
                fontSize: 10px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s;
              " title="Reset node positions">Reset</span>
              
              <span class="control-btn" data-action="beautify" style="
                padding: 4px 8px;
                border: 1px solid #ddd;
                background: white;
                color: #333;
                border-radius: 3px;
                fontSize: 10px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s;
              " title="Optimize layout">✨ Beautify</span>
              
              <span class="control-btn sticky-toggle" data-action="sticky" style="
                padding: 4px 8px;
                border: 1px solid #ddd;
                background: white;
                color: #333;
                border-radius: 3px;
                fontSize: 10px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s;
              " title="Lock nodes in place">📌 Lock</span>
            </div>
          </div>
          
          <!-- Search and Filters Row -->
          <div style="display: flex; gap: 10px; align-items: center;">
            <input type="text" class="search-input" placeholder="Search..." style="
              padding: 6px 10px;
              flex: 1;
              border: 1px solid #ddd;
              border-radius: 4px;
              font-size: 12px;
              outline: none;
            " />
            
            <!-- Compact Filter Buttons -->
            <button class="filter-btn" data-type="person" style="
              width: 28px;
              height: 28px;
              border: 1px solid #ddd;
              border-radius: 6px;
              background: white;
              color: #333;
              font-size: 12px;
              cursor: pointer;
              display: flex;
              align-items: center;
              justify-content: center;
              transition: all 0.2s;
            " title="Toggle person nodes">👤</button>
            
            <button class="filter-btn" data-type="event" style="
              width: 28px;
              height: 28px;
              border: 1px solid #ddd;
              border-radius: 6px;
              background: white;
              color: #333;
              font-size: 12px;
              cursor: pointer;
              display: flex;
              align-items: center;
              justify-content: center;
              transition: all 0.2s;
            " title="Toggle event nodes">📅</button>
            
            <button class="filter-btn" data-type="place" style="
              width: 28px;
              height: 28px;
              border: 1px solid #ddd;
              border-radius: 6px;
              background: white;
              color: #333;
              font-size: 12px;
              cursor: pointer;
              display: flex;
              align-items: center;
              justify-content: center;
              transition: all 0.2s;
            " title="Toggle place nodes">📍</button>
            
            <button class="filter-btn" data-type="memory" style="
              width: 28px;
              height: 28px;
              border: 1px solid #ddd;
              border-radius: 6px;
              background: white;
              color: #333;
              font-size: 12px;
              cursor: pointer;
              display: flex;
              align-items: center;
              justify-content: center;
              transition: all 0.2s;
            " title="Toggle memory nodes">📷</button>
            
            <!-- Clear Filters Button -->
            <button class="clear-filters" style="
              padding: 4px 8px;
              border: 1px solid #dc3545;
              border-radius: 4px;
              background: #dc3545;
              color: white;
              font-size: 10px;
              cursor: pointer;
              font-weight: 500;
              display: none;
            " title="Clear all filters">Clear</button>
          </div>
        </div>

        <!-- Main Content Area -->
        <div style="
          flex: 1;
          display: flex;
          position: relative;
        ">
          <!-- Graph Visualization -->
          <div class="graph-area" style="
            flex: ${this.options.showHistory ? '0.7' : '1'};
            position: relative;
          ">
            <svg width="100%" height="100%"></svg>
          </div>
          
          ${this.options.showHistory ? this.createActivityPanel() : ''}
        </div>

        <!-- Compact Status Bar -->
        <div class="status-bar" style="
          padding: 8px 12px;
          background: #f8f9fa;
          border-top: 1px solid #dee2e6;
          font-size: 10px;
          color: #666;
          display: flex;
          justify-content: space-between;
        ">
          <span class="node-count">
            <strong>Nodes:</strong> 0 • <strong>Edges:</strong> 0
          </span>
          <span>
            Drag • Zoom • Click to select
          </span>
        </div>
      </div>
    `;
    
    this.setupEventHandlers();
  }
  
  createActivityPanel() {
    return `
      <!-- Compact Activity Panel -->
      <div class="activity-panel" style="
        width: ${this.options.width * 0.3}px;
        background: #f8f9fa;
        border-left: 1px solid #dee2e6;
        padding: 12px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      ">
        <!-- Active Selection Details -->
        <div style="
          background: white;
          border-radius: 6px;
          padding: 10px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
          min-height: 120px;
        ">
          <h4 style="
            margin: 0 0 8px 0;
            font-size: 12px;
            font-weight: 600;
            color: #333;
          ">ACTIVE</h4>
          <div class="selection-details" style="font-size: 11px;">
            <div style="font-size: 10px; color: #999; font-style: italic;">
              Click on a node or edge to see details
            </div>
          </div>
        </div>
        
        <!-- History -->
        <div style="
          background: white;
          border-radius: 6px;
          padding: 10px;
          flex: 1;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
          display: flex;
          flex-direction: column;
        ">
          <h4 style="
            margin: 0 0 8px 0;
            font-size: 12px;
            font-weight: 600;
            color: #333;
          ">HISTORY</h4>
          <div class="history-list" style="
            flex: 1;
            overflow-y: auto;
            font-size: 10px;
            color: #666;
          ">
            <div style="font-style: italic; color: #999;">
              No actions yet
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  setupEventHandlers() {
    // Control buttons
    this.container.querySelectorAll('.control-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = e.target.dataset.action;
        this.handleControlAction(action);
      });
    });
    
    // Filter buttons
    this.container.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const type = e.target.dataset.type;
        this.toggleFilter(type);
      });
    });
    
    // Clear filters
    const clearBtn = this.container.querySelector('.clear-filters');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        this.clearFilters();
      });
    }
    
    // Search
    const searchInput = this.container.querySelector('.search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.handleSearch(e.target.value);
      });
    }
  }
  
  loadD3() {
    if (window.d3) {
      this.initializeVisualization();
      return;
    }

    // Load D3.js from CDN
    const script = document.createElement('script');
    script.src = 'https://d3js.org/d3.v7.min.js';
    script.onload = () => {
      console.log('✅ D3.js loaded successfully');
      this.initializeVisualization();
    };
    script.onerror = () => {
      this.showError('Failed to load D3.js library');
    };
    document.head.appendChild(script);
  }
  
  initializeVisualization() {
    console.log('🎨 Setting up D3 visualization...');
    
    this.svg = d3.select(this.container.querySelector('svg'));
    this.setupVisualization();
    this.loadSampleData();
  }
  
  setupVisualization() {
    const width = this.options.showHistory ? this.options.width * 0.7 : this.options.width;
    const height = this.options.height - 120;

    // Setup zoom
    this.zoom = d3.zoom()
      .scaleExtent([0.1, 10])
      .on('zoom', (event) => {
        this.graphContainer.attr('transform', event.transform);
      });

    this.svg.call(this.zoom);

    // Create main container
    this.graphContainer = this.svg.append('g')
      .attr('class', 'graph-container');

    // Create groups for links and nodes
    this.linkGroup = this.graphContainer.append('g').attr('class', 'links');
    this.nodeGroup = this.graphContainer.append('g').attr('class', 'nodes');

    // Create simulation
    this.simulation = d3.forceSimulation()
      .force('link', d3.forceLink().id(d => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(25));
  }
  
  loadSampleData() {
    console.log('📊 Loading interview sample data...');
    // Interview-focused sample data
    this.data = {
      nodes: [
        { id: 'interviewer', name: 'Winston', type: 'central', description: 'AI Interviewer' },
        { id: 'interviewee', name: 'You', type: 'central', description: 'Interview Subject' },
        { id: 'childhood', name: 'Childhood Memories', type: 'memory', description: 'Early Life Stories' },
        { id: 'hometown', name: 'Hometown', type: 'place', description: 'Where you grew up' },
        { id: 'family', name: 'Family', type: 'family', description: 'Family Members' },
        { id: 'school', name: 'Elementary School', type: 'place', description: 'Early Education' },
        { id: 'graduation', name: 'High School Graduation', type: 'event', description: 'Milestone Event' }
      ],
      edges: [
        { source: 'interviewer', target: 'interviewee', label: 'interviews' },
        { source: 'interviewee', target: 'childhood', label: 'remembers' },
        { source: 'childhood', target: 'hometown', label: 'happened in' },
        { source: 'interviewee', target: 'family', label: 'member of' },
        { source: 'interviewee', target: 'school', label: 'attended' },
        { source: 'interviewee', target: 'graduation', label: 'participated in' },
        { source: 'graduation', target: 'school', label: 'at' }
      ]
    };

    this.updateVisualization();
  }
  
  updateVisualization() {
    console.log('🔄 Updating visualization...');
    const width = this.options.showHistory ? this.options.width * 0.7 : this.options.width;
    const height = this.options.height - 120;

    // Update status
    this.updateStatus();

    // Prepare data
    const nodes = this.data.nodes.map(d => ({ ...d }));
    const links = this.data.edges.map(d => ({ 
      source: d.source, 
      target: d.target, 
      label: d.label 
    }));

    // Update simulation
    this.simulation.nodes(nodes);
    this.simulation.force('link').links(links);

    // Create links
    const link = this.linkGroup
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', '#6B7280')
      .attr('stroke-width', 2)
      .attr('stroke-opacity', 0.6)
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        event.stopPropagation();
        this.handleEdgeClick(d);
      })
      .on('mouseover', function() {
        d3.select(this)
          .attr('stroke-width', 4)
          .attr('stroke', '#6B46C1');
      })
      .on('mouseout', function() {
        d3.select(this)
          .attr('stroke-width', 2)
          .attr('stroke', '#6B7280');
      });

    // Create nodes
    const node = this.nodeGroup
      .selectAll('g')
      .data(nodes)
      .join('g')
      .attr('class', 'node')
      .style('cursor', 'pointer')
      .call(this.createDragBehavior());

    // Add circles
    node.selectAll('circle').remove();
    node.append('circle')
      .attr('r', 20)
      .attr('fill', d => this.getNodeColor(d.type))
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 3)
      .on('click', (event, d) => {
        event.stopPropagation();
        this.handleNodeClick(d);
      });

    // Add labels
    node.selectAll('text').remove();
    node.append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('fill', 'white')
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .style('pointer-events', 'none')
      .text(d => this.getNodeLabel(d));

    // Update positions on tick
    this.simulation.on('tick', () => {
      // Apply boundaries
      nodes.forEach(d => {
        d.x = Math.max(25, Math.min(width - 25, d.x));
        d.y = Math.max(25, Math.min(height - 25, d.y));
      });

      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

      node
        .attr('transform', d => `translate(${d.x},${d.y})`);
    });

    this.simulation.alpha(1).restart();
    console.log('✅ Visualization updated successfully');
  }
  
  getNodeColor(type) {
    const colors = {
      'central': '#9C88FF',
      'family': '#9C88FF', 
      'event': '#FF7675',
      'place': '#74B9FF',
      'memory': '#6BCF7F'
    };
    return colors[type] || '#6B7280';
  }
  
  getNodeLabel(node) {
    if (node.type === 'central' || node.type === 'family') {
      return node.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    }
    
    const icons = {
      'event': '📅',
      'place': '📍', 
      'memory': '📷'
    };
    
    return icons[node.type] || '⚫';
  }
  
  createDragBehavior() {
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
        if (!this.stickyMode) {
          d.fx = null;
          d.fy = null;
        }
      });
  }
  
  handleControlAction(action) {
    switch (action) {
      case 'center':
        this.centerGraph();
        break;
      case 'fit':
        this.fitToView();
        break;
      case 'reset':
        this.resetLayout();
        break;
      case 'beautify':
        this.beautifyLayout();
        break;
      case 'sticky':
        this.toggleStickyMode();
        break;
    }
    this.addToHistory(action.toUpperCase(), 'Control action');
  }
  
  centerGraph() {
    const width = this.options.showHistory ? this.options.width * 0.7 : this.options.width;
    const height = this.options.height - 120;
    
    this.svg.transition().duration(750).call(
      this.zoom.transform,
      d3.zoomIdentity.translate(width / 2, height / 2).scale(1)
    );
  }
  
  fitToView() {
    const bounds = this.graphContainer.node().getBBox();
    const width = this.options.showHistory ? this.options.width * 0.7 : this.options.width;
    const height = this.options.height - 120;
    const fullWidth = bounds.width;
    const fullHeight = bounds.height;
    const midX = bounds.x + fullWidth / 2;
    const midY = bounds.y + fullHeight / 2;
    if (fullWidth == 0 || fullHeight == 0) return;
    const scale = 0.8 / Math.max(fullWidth / width, fullHeight / height);
    const translate = [width / 2 - scale * midX, height / 2 - scale * midY];
    
    this.svg.transition().duration(750).call(
      this.zoom.transform,
      d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale)
    );
  }
  
  resetLayout() {
    this.simulation.nodes().forEach(d => {
      d.fx = null;
      d.fy = null;
    });
    this.simulation.alpha(1).restart();
  }
  
  beautifyLayout() {
    this.simulation
      .force('charge', d3.forceManyBody().strength(-400))
      .force('link', d3.forceLink().id(d => d.id).distance(80))
      .alpha(0.3)
      .restart();
      
    setTimeout(() => {
      this.simulation
        .force('charge', d3.forceManyBody().strength(-300))
        .force('link', d3.forceLink().id(d => d.id).distance(100));
    }, 2000);
  }
  
  toggleStickyMode() {
    this.stickyMode = !this.stickyMode;
    const btn = this.container.querySelector('.sticky-toggle');
    if (this.stickyMode) {
      btn.style.background = '#007bff';
      btn.style.color = 'white';
      btn.textContent = '📌 Locked';
      btn.title = 'Unlock nodes';
    } else {
      btn.style.background = 'white';
      btn.style.color = '#333';
      btn.textContent = '📌 Lock';
      btn.title = 'Lock nodes in place';
      // Release all fixed positions
      this.simulation.nodes().forEach(d => {
        d.fx = null;
        d.fy = null;
      });
      this.simulation.alpha(0.3).restart();
    }
  }
  
  toggleFilter(type) {
    const btn = this.container.querySelector(`[data-type="${type}"]`);
    const colors = {
      'person': '#9C88FF',
      'event': '#FF7675', 
      'place': '#74B9FF',
      'memory': '#6BCF7F'
    };
    
    if (this.activeFilters.has(type)) {
      this.activeFilters.delete(type);
      btn.style.background = 'white';
      btn.style.color = '#333';
    } else {
      this.activeFilters.add(type);
      btn.style.background = colors[type];
      btn.style.color = 'white';
    }
    
    this.updateFilterVisibility();
    this.addToHistory('FILTER', `${this.activeFilters.has(type) ? 'Show' : 'Hide'} ${type}`);
  }
  
  updateFilterVisibility() {
    const clearBtn = this.container.querySelector('.clear-filters');
    clearBtn.style.display = this.activeFilters.size > 0 ? 'block' : 'none';
    
    // Apply filters
    this.nodeGroup.selectAll('.node')
      .style('display', d => {
        if (this.activeFilters.size === 0) return 'block';
        
        // Map filter types to node types
        const typeMap = {
          'person': ['central', 'family'],
          'event': ['event'],
          'place': ['place'],
          'memory': ['memory']
        };
        
        for (let filterType of this.activeFilters) {
          if (typeMap[filterType] && typeMap[filterType].includes(d.type)) {
            return 'block';
          }
        }
        return 'none';
      });
  }
  
  clearFilters() {
    this.activeFilters.clear();
    this.container.querySelectorAll('.filter-btn').forEach(btn => {
      btn.style.background = 'white';
      btn.style.color = '#333';
    });
    this.updateFilterVisibility();
    this.addToHistory('CLEAR FILTERS', 'All filters removed');
  }
  
  handleSearch(term) {
    this.searchTerm = term;
    
    if (!term) {
      this.nodeGroup.selectAll('.node').style('opacity', 1);
      return;
    }
    
    this.nodeGroup.selectAll('.node')
      .style('opacity', d => {
        return d.name.toLowerCase().includes(term.toLowerCase()) ? 1 : 0.3;
      });
      
    this.addToHistory('SEARCH', term);
  }
  
  handleNodeClick(node) {
    console.log('Node clicked:', node);
    this.selectedNode = node;
    this.selectedEdge = null;
    this.updateSelectionDisplay();
    this.addToHistory('NODE', node.name || node.id);
  }
  
  handleEdgeClick(edge) {
    console.log('Edge clicked:', edge);
    this.selectedEdge = edge;
    this.selectedNode = null;
    this.updateSelectionDisplay();
    this.addToHistory('EDGE', edge.label || 'Connection');
  }
  
  updateSelectionDisplay() {
    const detailsContainer = this.container.querySelector('.selection-details');
    if (!detailsContainer) return;
    
    if (this.selectedNode) {
      detailsContainer.innerHTML = `
        <div style="
          padding: 8px;
          background: #f0f7ff;
          border-radius: 4px;
          border: 1px solid #cce5ff;
        ">
          <div style="font-weight: 600; color: #004085; margin-bottom: 4px;">
            ${this.selectedNode.name || this.selectedNode.id}
          </div>
          <div style="color: #666; margin-bottom: 3px;">
            <strong>Type:</strong> ${this.selectedNode.type}
          </div>
          ${this.selectedNode.description ? `
            <div style="color: #666; margin-bottom: 3px;">
              <strong>Description:</strong> ${this.selectedNode.description}
            </div>
          ` : ''}
          <div style="color: #666;">
            <strong>ID:</strong> ${this.selectedNode.id}
          </div>
        </div>
      `;
    } else if (this.selectedEdge) {
      detailsContainer.innerHTML = `
        <div style="
          padding: 8px;
          background: #fff3cd;
          border-radius: 4px;
          border: 1px solid #ffeeba;
        ">
          <div style="font-weight: 600; color: #856404; margin-bottom: 4px;">
            ${this.selectedEdge.label || 'Connection'}
          </div>
          <div style="color: #666; margin-bottom: 3px;">
            <strong>From:</strong> ${this.selectedEdge.source?.name || this.selectedEdge.source}
          </div>
          <div style="color: #666;">
            <strong>To:</strong> ${this.selectedEdge.target?.name || this.selectedEdge.target}
          </div>
        </div>
      `;
    } else {
      detailsContainer.innerHTML = `
        <div style="font-size: 10px; color: #999; font-style: italic;">
          Click on a node or edge to see details
        </div>
      `;
    }
  }
  
  addToHistory(action, target) {
    const entry = {
      timestamp: new Date().toLocaleTimeString(),
      action,
      target
    };
    this.actionHistory.unshift(entry);
    if (this.actionHistory.length > 10) {
      this.actionHistory.pop();
    }
    
    this.updateHistoryDisplay();
  }
  
  updateHistoryDisplay() {
    const historyContainer = this.container.querySelector('.history-list');
    if (!historyContainer) return;
    
    if (this.actionHistory.length === 0) {
      historyContainer.innerHTML = `
        <div style="font-style: italic; color: #999;">
          No actions yet
        </div>
      `;
      return;
    }
    
    historyContainer.innerHTML = this.actionHistory.slice(0, 6).map((entry, index) => `
      <div style="
        padding: 4px 0;
        border-bottom: ${index < 5 ? '1px solid #f0f0f0' : 'none'};
      ">
        <div style="color: #999; font-size: 9px;">
          [${entry.timestamp}]
        </div>
        <div style="color: #666;">
          <strong>${entry.action}:</strong> ${entry.target}
        </div>
      </div>
    `).join('');
  }
  
  updateStatus() {
    const statusElement = this.container.querySelector('.node-count');
    if (statusElement) {
      statusElement.innerHTML = `
        <strong>Nodes:</strong> ${this.data.nodes.length} • 
        <strong>Edges:</strong> ${this.data.edges.length}
      `;
    }
  }
  
  showError(message) {
    const graphArea = this.container.querySelector('.graph-area');
    graphArea.innerHTML = `
      <div style="
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        color: #EF4444;
        font-size: 14px;
      ">
        Error: ${message}
      </div>
    `;
  }
  
  // Public API methods
  setData(data) {
    this.data = data;
    if (this.simulation) {
      this.updateVisualization();
    }
  }
  
  addNode(node) {
    this.data.nodes.push(node);
    this.updateVisualization();
    this.addToHistory('ADD NODE', node.name || node.id);
  }
  
  addEdge(edge) {
    this.data.edges.push(edge);
    this.updateVisualization();
    this.addToHistory('ADD EDGE', edge.label || 'Connection');
  }
  
  destroy() {
    if (this.simulation) {
      this.simulation.stop();
    }
    this.container.innerHTML = '';
  }
}

// Global initialization for interview page
window.NexusControl = NexusControl;