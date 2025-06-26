/**
 * Centralized Neo4j Connection Module
 * 
 * Provides a single connection point for all pages to access Neo4j database.
 * Uses singleton pattern to ensure only one driver instance exists.
 */

// Neo4j Configuration
const NEO4J_CONFIG = {
    uri: 'neo4j+s://80dc1193.databases.neo4j.io',
    username: 'neo4j',
    password: 'lCHngJO-NHNGSF5fcj7ApgdImgBA6qGUGWaKWxAY2eA'
};

class Neo4jConnection {
    constructor() {
        this.driver = null;
        this.isConnected = false;
    }

    /**
     * Initialize Neo4j connection
     * @returns {Promise<boolean>} Success status
     */
    async connect() {
        try {
            // Check if neo4j is available
            if (typeof neo4j === 'undefined') {
                throw new Error('Neo4j driver not loaded. Make sure to include the Neo4j driver script.');
            }
            
            if (!this.driver) {
                console.log('🔗 Connecting to Neo4j...');
                console.log(`URI: ${NEO4J_CONFIG.uri}`);
                
                this.driver = neo4j.driver(
                    NEO4J_CONFIG.uri,
                    neo4j.auth.basic(NEO4J_CONFIG.username, NEO4J_CONFIG.password)
                );
                
                // Test connection
                const session = this.driver.session();
                try {
                    const result = await session.run('RETURN 1 as test');
                    console.log(`✅ Neo4j connection established. Test result: ${result.records[0].get('test')}`);
                    this.isConnected = true;
                    return true;
                } finally {
                    await session.close();
                }
            }
            return this.isConnected;
        } catch (error) {
            console.error('❌ Neo4j connection error:', error);
            this.isConnected = false;
            return false;
        }
    }

    /**
     * Get a new session
     * @returns {Session} Neo4j session
     */
    getSession() {
        if (!this.driver || !this.isConnected) {
            throw new Error('Neo4j not connected. Call connect() first.');
        }
        return this.driver.session();
    }

    /**
     * Run a query with automatic session management
     * @param {string} query - Cypher query
     * @param {object} params - Query parameters
     * @returns {Promise<Result>} Query result
     */
    async run(query, params = {}) {
        const session = this.getSession();
        try {
            return await session.run(query, params);
        } finally {
            await session.close();
        }
    }

    /**
     * Run a transaction with automatic session management
     * @param {Function} work - Transaction work function
     * @returns {Promise<any>} Transaction result
     */
    async transaction(work) {
        const session = this.getSession();
        try {
            return await session.writeTransaction(work);
        } finally {
            await session.close();
        }
    }

    /**
     * Close the connection
     */
    async close() {
        if (this.driver) {
            await this.driver.close();
            this.driver = null;
            this.isConnected = false;
            console.log('🔌 Neo4j connection closed');
        }
    }

    /**
     * Save sandbox data to production using MERGE operations
     * @param {object} sandboxData - Data containing nodes and edges
     * @param {string} userId - User ID
     * @param {string} twinId - Twin ID (usually userId-1)
     * @returns {Promise<boolean>} Success status
     */
    async saveSandboxToProduction(sandboxData, userId, twinId) {
        if (!sandboxData || !userId || !twinId) {
            throw new Error('Missing required parameters: sandboxData, userId, or twinId');
        }

        const session = this.getSession();
        
        try {
            console.log(`📤 Saving to Neo4j for user: ${userId}, twin: ${twinId}`);
            console.log(`📊 Nodes to save: ${sandboxData.nodes.length}`);
            console.log(`🔗 Edges to save: ${sandboxData.edges.length}`);
            
            // Test if session works with simple query first
            const testResult = await session.run('RETURN 1 as test');
            console.log('✅ Session test successful:', testResult.records[0].get('test'));
            
            const tx = session.beginTransaction();
            console.log('✅ Transaction started');
            
            // MERGE nodes
            for (const node of sandboxData.nodes) {
                // Capitalize the type for Neo4j label (e.g., 'person' -> 'Person')
                const nodeType = node.type || 'Person';
                const label = nodeType.charAt(0).toUpperCase() + nodeType.slice(1);
                
                // Build properties for the node
                const nodeProps = {
                    id: node.id,
                    userId: userId,
                    twinId: twinId,
                    name: node.name || node.label || node.id,
                    label: node.label || node.name || node.id
                };
                
                // Add any additional properties from the node
                Object.keys(node).forEach(key => {
                    if (!['id', 'type', 'originalData'].includes(key) && node[key] !== undefined) {
                        nodeProps[key] = node[key];
                    }
                });
                
                // Use simpler query pattern that matches what worked in test
                const query = `
                    MERGE (n:${label} {id: $id})
                    SET n.userId = $userId
                    SET n.twinId = $twinId
                    SET n.name = $name
                    SET n.label = $nodeLabel
                    SET n.lastModified = timestamp()
                    RETURN n
                `;
                
                console.log(`🔍 Running MERGE for ${label} node ${node.id}`);
                console.log(`🔍 With params:`, { id: node.id, userId, twinId, name: nodeProps.name, nodeLabel: nodeProps.label });
                
                const result = await tx.run(query, {
                    id: node.id,
                    userId: userId,
                    twinId: twinId,
                    name: nodeProps.name,
                    nodeLabel: nodeProps.label
                });
                
                console.log(`✅ Merged node: ${node.id} (${nodeProps.name}) - Created: ${result.summary.counters.nodesCreated}, Updated: ${result.summary.counters.propertiesSet}`);
            }
            
            // MERGE relationships
            for (const edge of sandboxData.edges) {
                const relType = (edge.label || 'CONNECTED_TO').toUpperCase();
                
                // Build relationship properties
                const relProps = {};
                Object.keys(edge).forEach(key => {
                    if (!['source', 'target', 'label', 'id'].includes(key) && edge[key] !== undefined) {
                        relProps[key] = edge[key];
                    }
                });
                
                const query = `
                    MATCH (source {id: $sourceId})
                    MATCH (target {id: $targetId})
                    MERGE (source)-[r:${relType}]->(target)
                    SET r = $properties
                    SET r.id = $edgeId
                    SET r.lastModified = timestamp()
                    RETURN r
                `;
                
                console.log(`🔍 Running MERGE for relationship: ${edge.source} -[${relType}]-> ${edge.target}`);
                
                const result = await tx.run(query, {
                    sourceId: edge.source,
                    targetId: edge.target,
                    edgeId: edge.id,
                    properties: relProps
                });
                
                console.log(`✅ Merged edge: ${edge.source} -[${relType}]-> ${edge.target} - Created: ${result.summary.counters.relationshipsCreated}`);
            }
            
            // Commit transaction
            console.log('📝 Committing transaction...');
            await tx.commit();
            console.log('✅ All changes committed to Neo4j');
            return true;
            
        } catch (error) {
            console.error('❌ Neo4j transaction error:', error);
            console.error('Error details:', {
                message: error.message,
                code: error.code,
                name: error.name
            });
            
            if (tx) {
                try {
                    await tx.rollback();
                    console.log('🔙 Transaction rolled back');
                } catch (rollbackError) {
                    console.error('❌ Rollback error:', rollbackError);
                }
            }
            throw error;
        } finally {
            await session.close();
            console.log('🔌 Session closed');
        }
    }
}

// Create singleton instance
const neo4jConnection = new Neo4jConnection();

// Export for use in other modules
window.Neo4jConnection = neo4jConnection;