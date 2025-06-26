/**
 * Neo4j Data Service for Sandbox
 * Handles data loading and transformation between Neo4j and the sandbox UI
 * Uses the centralized Neo4j connection from /js/neo4j-connection.js
 */

/**
 * Service class for Neo4j data operations
 */
export class Neo4jDataService {
    
    /**
     * Load production data from Neo4j for a specific user and twin
     * @param {string} userId - The user ID
     * @param {string} twinId - The twin ID
     * @param {Function} logFn - Logging function
     * @param {Function} getNodeColorFn - Function to get node colors by type
     * @returns {Promise<Object>} Graph data with nodes and edges
     */
    static async loadProductionData(userId, twinId, logFn = console.log, getNodeColorFn = null) {
        try {
            logFn(`🔍 Loading production data for user: ${userId}, twin: ${twinId}`);
            
            // Get centralized connection
            const connection = this.getConnection();
            
            // Connect to Neo4j if not already connected
            if (!connection.isConnected) {
                const connected = await connection.connect();
                if (!connected) {
                    throw new Error('Failed to connect to Neo4j');
                }
            }
            
            // Query nodes for this user/twin
            const nodesResult = await connection.run(`
                MATCH (n {userId: $userId, twinId: $twinId})
                RETURN n.id as id, labels(n) as labels, properties(n) as props
                LIMIT 50
            `, { userId, twinId });
            
            // First, let's see what relationships exist in the database
            const allRelsDebug = await connection.run(`
                MATCH (a)-[r]->(b)
                WHERE a.userId = $userId AND a.twinId = $twinId
                RETURN a.id as sourceId, b.id as targetId, type(r) as relType, 
                       a.userId as aUserId, a.twinId as aTwinId,
                       b.userId as bUserId, b.twinId as bTwinId
                LIMIT 10
            `, { userId, twinId });
            
            logFn(`🔍 Debug: Found ${allRelsDebug.records.length} relationships where source node matches user/twin`);
            allRelsDebug.records.forEach((record, i) => {
                logFn(`  Rel ${i}: ${record.get('sourceId')} -> ${record.get('targetId')} (${record.get('relType')})`);
                logFn(`    Source: userId=${record.get('aUserId')}, twinId=${record.get('aTwinId')}`);
                logFn(`    Target: userId=${record.get('bUserId')}, twinId=${record.get('bTwinId')}`);
            });
            
            // Try a more flexible query - just require source node to match
            const relsResult = await connection.run(`
                MATCH (a {userId: $userId, twinId: $twinId})-[r]-(b)
                RETURN a.id as sourceId, b.id as targetId, type(r) as relType, 
                       properties(r) as relProps, properties(b) as targetProps
                LIMIT 100
            `, { userId, twinId });
            
            logFn(`🔍 Flexible query found ${relsResult.records.length} relationships`);
            
            // Convert Neo4j results to NexusGraphControl format
            const nodes = nodesResult.records.map((record, index) => {
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
            
            // Create a set of existing node IDs for validation
            const nodeIds = new Set(nodes.map(n => n.id));
            
            const edges = relsResult.records.map((record, index) => {
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
            
            logFn(`✅ Loaded ${nodes.length} nodes and ${edges.length} relationships from Neo4j`);
            logFn(`📊 Node IDs: ${nodes.map(n => n.id).join(', ')}`);
            if (edges.length > 0) {
                logFn(`🔗 First edge example: ${JSON.stringify(edges[0], null, 2)}`);
            } else {
                logFn(`⚠️ No relationships found for user ${userId}, twin ${twinId}`);
            }
            
            return { nodes, edges };
            
        } catch (error) {
            logFn(`❌ Failed to load production data: ${error.message}`);
            // Return empty data on error
            return { nodes: [], edges: [] };
        }
    }
    
    /**
     * Load node list for UI display
     * @param {string} userId - The user ID  
     * @param {string} twinId - The twin ID
     * @param {Function} logFn - Logging function
     * @returns {Promise<Object>} Object with grouped nodes by type
     */
    static async loadNodeList(userId, twinId, logFn = console.log) {
        try {
            logFn('🔍 Loading node list from Neo4j...');
            
            // Get centralized connection
            const connection = this.getConnection();
            
            // Connect to Neo4j if not already connected
            if (!connection.isConnected) {
                const connected = await connection.connect();
                if (!connected) {
                    throw new Error('Failed to connect to Neo4j');
                }
            }
            
            // Query all nodes for this user/twin, grouped by type
            const nodesResult = await connection.run(`
                MATCH (n {userId: $userId, twinId: $twinId})
                RETURN n.id as id, labels(n) as labels, properties(n) as props
                ORDER BY labels(n)[0], n.name, n.firstName, n.id
                LIMIT 100
            `, { userId, twinId });
            
            if (nodesResult.records.length === 0) {
                logFn('📭 No nodes found in graph');
                return {};
            }
            
            // Group nodes by type
            const nodesByType = {};
            nodesResult.records.forEach(record => {
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
            
            logFn(`✅ Loaded ${nodesResult.records.length} nodes for node list`);
            return nodesByType;
            
        } catch (error) {
            logFn(`❌ Error loading node list: ${error.message}`);
            throw error;
        }
    }
    
    /**
     * Get the centralized Neo4j connection
     * @returns {Object} Neo4j connection instance
     */
    static getConnection() {
        if (!window.Neo4jConnection) {
            throw new Error('Neo4j connection not available. Make sure neo4j-connection.js is loaded.');
        }
        return window.Neo4jConnection;
    }
}