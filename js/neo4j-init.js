/**
 * Neo4j Initialization - Standalone Script
 * Loads before Firebase modules to avoid conflicts
 */

// Create Neo4j class directly in global scope
class Neo4jVisualization {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      width: options.width || 800,
      height: options.height || 300,
      showFilters: options.showFilters !== false,
      showSearch: options.showSearch !== false,
      nodeColors: {
        person: '#6B46C1',    // WebsitePrototype purple
        event: '#10B981',     // WebsitePrototype green
        place: '#3B82F6',     // WebsitePrototype blue
        memory: '#FFD700',    // WebsitePrototype yellow
        organization: '#6B46C1',
        education: '#6B46C1'
      },
      ...options
    };
    
    this.data = { nodes: [], edges: [] };
    this.selectedElements = new Set();
    this.simulation = null;
    this.svg = null;
    this.zoom = null;
    
    this.init();
  }

  init() {
    console.log('🚀 Initializing Neo4j visualization...');
    this.createContainer();
    this.loadD3();
  }

  createContainer() {
    // Create the main structure
    this.container.innerHTML = `
      <div class="neo4j-visualization" style="
        width: 100%;
        height: ${this.options.height}px;
        display: flex;
        flex-direction: column;
        border: 2px solid #6B46C1;
        border-radius: 12px;
        background: white;
        overflow: hidden;
        font-family: Inter, -apple-system, BlinkMacSystemFont, sans-serif;
        position: relative;
        z-index: 10;
      ">
        ${this.options.showSearch ? this.createSearchBar() : ''}
        ${this.options.showFilters ? this.createFilterBar() : ''}
        <div class="graph-area" style="
          flex: 1;
          position: relative;
          background: #F8FAFB;
        ">
          <div class="loading-indicator" style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: #6B46C1;
            font-size: 16px;
            font-weight: bold;
            background: rgba(255,255,255,0.9);
            padding: 10px 20px;
            border-radius: 6px;
            border: 1px solid #6B46C1;
          ">🔄 Loading Neo4j Graph...</div>
        </div>
        <div class="status-bar" style="
          padding: 8px 16px;
          background: #F3F4F6;
          border-top: 1px solid #E5E7EB;
          font-size: 12px;
          color: #6B7280;
          display: flex;
          justify-content: space-between;
        ">
          <span class="node-count">Nodes: 0 • Edges: 0</span>
          <span>Drag to pan • Scroll to zoom • Click to select</span>
        </div>
      </div>
    `;
  }

  createSearchBar() {
    return `
      <div class="search-bar" style="
        padding: 12px 16px;
        border-bottom: 1px solid #E5E7EB;
        background: white;
      ">
        <input type="text" placeholder="Search nodes..." style="
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #D1D5DB;
          border-radius: 6px;
          font-size: 14px;
          outline: none;
        " />
      </div>
    `;
  }

  createFilterBar() {
    return `
      <div class="filter-bar" style="
        padding: 12px 16px;
        border-bottom: 1px solid #E5E7EB;
        background: #F9FAFB;
        display: flex;
        gap: 8px;
        align-items: center;
        flex-wrap: wrap;
      ">
        <span style="font-size: 12px; font-weight: 600; color: #374151; margin-right: 8px;">
          Filters:
        </span>
        <button class="filter-btn" data-type="person" style="
          padding: 4px 12px;
          border: 1px solid #D1D5DB;
          border-radius: 16px;
          background: white;
          color: #374151;
          font-size: 12px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 4px;
        ">
          <span>👤</span> Person
        </button>
        <button class="filter-btn" data-type="event" style="
          padding: 4px 12px;
          border: 1px solid #D1D5DB;
          border-radius: 16px;
          background: white;
          color: #374151;
          font-size: 12px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 4px;
        ">
          <span>📅</span> Event
        </button>
        <button class="filter-btn" data-type="place" style="
          padding: 4px 12px;
          border: 1px solid #D1D5DB;
          border-radius: 16px;
          background: white;
          color: #374151;
          font-size: 12px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 4px;
        ">
          <span>📍</span> Place
        </button>
        <button class="filter-btn" data-type="memory" style="
          padding: 4px 12px;
          border: 1px solid #D1D5DB;
          border-radius: 16px;
          background: white;
          color: #374151;
          font-size: 12px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 4px;
        ">
          <span>📷</span> Memory
        </button>
        <button class="clear-filters" style="
          padding: 4px 12px;
          border: 1px solid #D1D5DB;
          border-radius: 16px;
          background: #F3F4F6;
          color: #6B7280;
          font-size: 12px;
          cursor: pointer;
          margin-left: 8px;
        ">
          Clear All
        </button>
      </div>
    `;
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
    const graphArea = this.container.querySelector('.graph-area');
    graphArea.innerHTML = '<svg width="100%" height="100%"></svg>';
    
    this.svg = d3.select(graphArea).select('svg');
    this.setupVisualization();
    this.setupEventHandlers();
    this.loadSampleData();
  }

  setupVisualization() {
    const width = this.options.width;
    const height = this.options.height - 140; // Account for controls in taller container

    // Setup zoom
    this.zoom = d3.zoom()
      .scaleExtent([0.1, 10])
      .on('zoom', (event) => {
        this.svg.select('.graph-container')
          .attr('transform', event.transform);
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

  setupEventHandlers() {
    // Filter buttons
    const filterBtns = this.container.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.toggleFilter(e.target.closest('.filter-btn').dataset.type);
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
    const searchInput = this.container.querySelector('input[type="text"]');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.handleSearch(e.target.value);
      });
    }
  }

  loadSampleData() {
    console.log('📊 Loading sample data...');
    // Sample data for WebsitePrototype
    this.data = {
      nodes: [
        { id: 'user', name: 'You', type: 'person', description: 'Current User' },
        { id: 'project1', name: 'Website Project', type: 'event', description: 'Main Project' },
        { id: 'file1', name: 'Important Document', type: 'memory', description: 'Key File' },
        { id: 'office', name: 'Home Office', type: 'place', description: 'Work Location' },
        { id: 'team', name: 'Development Team', type: 'organization', description: 'Project Team' }
      ],
      edges: [
        { source: 'user', target: 'project1', label: 'manages' },
        { source: 'user', target: 'file1', label: 'created' },
        { source: 'project1', target: 'office', label: 'developed at' },
        { source: 'user', target: 'team', label: 'member of' },
        { source: 'team', target: 'project1', label: 'works on' }
      ]
    };

    this.updateVisualization();
  }

  updateVisualization() {
    console.log('🔄 Updating visualization...');
    const width = this.options.width;
    const height = this.options.height - 140; // More space for controls with taller container

    // Update status
    this.updateStatus();

    // Prepare data - Fix D3 link format
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
      .attr('stroke-opacity', 0.6);

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
      .attr('fill', d => this.options.nodeColors[d.type] || '#6B7280')
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

  getNodeLabel(node) {
    if (node.type === 'person') {
      return node.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    }
    
    const icons = {
      event: '📅',
      place: '📍', 
      memory: '📷',
      organization: '🏢',
      education: '🎓'
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
      });
  }

  handleNodeClick(node) {
    console.log('Node clicked:', node);
  }

  toggleFilter(type) {
    const btn = this.container.querySelector(`[data-type="${type}"]`);
    const isActive = btn.style.backgroundColor === this.options.nodeColors[type];
    
    if (isActive) {
      btn.style.backgroundColor = 'white';
      btn.style.color = '#374151';
    } else {
      btn.style.backgroundColor = this.options.nodeColors[type];
      btn.style.color = 'white';
    }
    
    this.applyFilters();
  }

  clearFilters() {
    const filterBtns = this.container.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
      btn.style.backgroundColor = 'white';
      btn.style.color = '#374151';
    });
    this.applyFilters();
  }

  applyFilters() {
    const activeFilters = Array.from(this.container.querySelectorAll('.filter-btn'))
      .filter(btn => btn.style.backgroundColor !== 'white' && btn.style.backgroundColor !== '')
      .map(btn => btn.dataset.type);
    
    this.nodeGroup.selectAll('.node')
      .style('display', d => {
        return activeFilters.length === 0 || activeFilters.includes(d.type) ? 'block' : 'none';
      });
  }

  handleSearch(term) {
    if (!term) {
      this.nodeGroup.selectAll('.node').style('opacity', 1);
      return;
    }
    
    this.nodeGroup.selectAll('.node')
      .style('opacity', d => {
        return d.name.toLowerCase().includes(term.toLowerCase()) ? 1 : 0.3;
      });
  }

  updateStatus() {
    const statusBar = this.container.querySelector('.node-count');
    if (statusBar) {
      statusBar.textContent = `Nodes: ${this.data.nodes.length} • Edges: ${this.data.edges.length}`;
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
}

// Global initialization function
window.initializeNeo4jVisualization = function() {
  console.log('🔍 Looking for Neo4j container...');
  const graphContainer = document.getElementById('neo4j-graph-container');
  
  if (graphContainer) {
    console.log('✅ Container found:', graphContainer);
    console.log('📏 Container dimensions:', graphContainer.offsetWidth, 'x', graphContainer.offsetHeight);
    
    try {
      console.log('🚀 Initializing Neo4j visualization...');
      const neo4jViz = new Neo4jVisualization(graphContainer, {
        width: graphContainer.offsetWidth || 800,
        height: 450,
        showFilters: true,
        showSearch: true
      });
      console.log('✅ Neo4j visualization created successfully');
      
      // Store globally for debugging
      window.neo4jViz = neo4jViz;
      
    } catch (error) {
      console.error('❌ Failed to initialize Neo4j visualization:', error);
    }
  } else {
    console.error('❌ Neo4j container not found!');
  }
};

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', window.initializeNeo4jVisualization);
} else {
  window.initializeNeo4jVisualization();
}