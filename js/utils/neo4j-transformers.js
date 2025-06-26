/**
 * Neo4j Data Transformers
 * Utility functions for transforming data between Neo4j format and UI format
 */

/**
 * Transform Neo4j records to graph nodes format
 * @param {Array} records - Neo4j result records
 * @param {Function} getNodeColorFn - Function to get node color by type
 * @returns {Array} Array of nodes in graph format
 */
export function transformRecordsToNodes(records, getNodeColorFn = null) {
    return records.map((record, index) => {
        const id = record.get('id');
        const labels = record.get('labels');
        const props = record.get('props');
        const nodeType = labels[0] ? labels[0].toLowerCase() : 'person';
        
        // Use provided color function or fallback
        const nodeColor = getNodeColorFn ? getNodeColorFn(nodeType) : '#9CA3AF';
        
        return {
            id: id,
            position: { 
                x: 100 + (index % 5) * 150, 
                y: 100 + Math.floor(index / 5) * 150 
            },
            data: {
                label: props.name || props.firstName ? `${props.firstName || ''} ${props.lastName || ''}`.trim() : id,
                ...props
            },
            type: nodeType,
            style: {
                width: 60,
                height: 60,
                borderRadius: '50%',
                backgroundColor: nodeColor,
                border: '2px solid #333',
                color: '#fff',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }
        };
    });
}

/**
 * Transform Neo4j relationship records to graph edges format
 * @param {Array} records - Neo4j relationship records
 * @param {Set} nodeIds - Set of existing node IDs for validation
 * @param {Array} nodes - Array of nodes (will be modified if missing targets found)
 * @param {Function} getNodeColorFn - Function to get node color by type
 * @param {Function} logFn - Logging function
 * @returns {Array} Array of edges in graph format
 */
export function transformRecordsToEdges(records, nodeIds, nodes, getNodeColorFn = null, logFn = console.log) {
    return records.map((record, index) => {
        const sourceId = record.get('sourceId');
        const targetId = record.get('targetId');
        const targetProps = record.get('targetProps');
        const relType = record.get('relType');
        
        // If target node isn't in our nodes list, add it
        if (!nodeIds.has(targetId) && targetProps) {
            const nodeColor = getNodeColorFn ? getNodeColorFn('person') : '#9CA3AF';
            
            const targetNode = {
                id: targetId,
                position: { 
                    x: 300 + (nodes.length % 5) * 150, 
                    y: 300 + Math.floor(nodes.length / 5) * 150 
                },
                data: {
                    label: targetProps.name || targetProps.firstName || targetId,
                    ...targetProps
                },
                type: 'person', // Default type for connected nodes
                style: {
                    width: 60,
                    height: 60,
                    borderRadius: '50%',
                    backgroundColor: nodeColor,
                    border: '2px solid #333',
                    color: '#fff',
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }
            };
            nodes.push(targetNode);
            nodeIds.add(targetId);
            logFn(`➕ Added missing target node: ${targetId}`);
        }
        
        // React Flow edge format
        const edge = {
            id: `${sourceId}-${targetId}`,
            source: sourceId,
            target: targetId,
            label: relType.toLowerCase(),
            data: record.get('relProps'),
            type: 'default'
        };
        logFn(`🔗 Edge ${index}: ${edge.source} -> ${edge.target} (${edge.label})`);
        return edge;
    });
}

/**
 * Group nodes by type for UI display
 * @param {Array} records - Neo4j result records  
 * @returns {Object} Object with nodes grouped by type
 */
export function groupNodesByType(records) {
    const nodesByType = {};
    
    records.forEach(record => {
        const props = record.get('props');
        const labels = record.get('labels');
        const nodeType = labels[0] ? labels[0].toLowerCase() : 'node';
        
        if (!nodesByType[nodeType]) {
            nodesByType[nodeType] = [];
        }
        
        nodesByType[nodeType].push({
            id: record.get('id'),
            label: props.name || props.firstName ? `${props.firstName || ''} ${props.lastName || ''}`.trim() : record.get('id'),
            type: nodeType,
            props: props,
            // Add sorting keys for alphabetical order
            sortKey: nodeType === 'person' ? 
                (props.lastName || props.name || record.get('id')).toLowerCase() :
                (props.name || record.get('id')).toLowerCase()
        });
    });
    
    return nodesByType;
}

/**
 * Create display label for a node from its properties
 * @param {Object} props - Node properties from Neo4j
 * @param {string} id - Node ID as fallback
 * @returns {string} Display label for the node
 */
export function createNodeDisplayLabel(props, id) {
    if (props.name) {
        return props.name;
    }
    if (props.firstName) {
        return `${props.firstName || ''} ${props.lastName || ''}`.trim();
    }
    return id;
}