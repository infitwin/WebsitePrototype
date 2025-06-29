/**
 * Centralized Neo4j Connection Module
 * 
 * Provides a single connection point for all pages to access Neo4j database.
 * Uses singleton pattern to ensure only one driver instance exists.
 * 
 * Data Type Handling:
 * - Neo4j can only store primitives and arrays of primitives as properties
 * - Complex objects (like stateMaps arrays of objects) are serialized to JSON strings
 * - Serialization happens transparently at the storage boundary
 * - All other layers work with native JavaScript data structures
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
     * Create a new node in sandbox
     * @param {object} nodeData - Node data including type, name, properties
     * @param {string} userId - User ID
     * @param {string} twinId - Twin ID
     * @param {string} interviewId - Interview/session ID
     * @returns {Promise<object>} Created node with Neo4j ID
     */
    async createSandboxNode(nodeData, userId, twinId, interviewId) {
        const session = this.getSession();
        try {
            const nodeType = nodeData.type || 'Person';
            const label = nodeType.charAt(0).toUpperCase() + nodeType.slice(1);
            
            const query = `
                CREATE (n:Sandbox:${label} {
                    id: $id,
                    userId: $userId,
                    twinId: $twinId,
                    interviewId: $interviewId,
                    sessionId: $interviewId,
                    _isSandbox: true,
                    name: $name,
                    label: $label,
                    createdAt: timestamp()
                })
                SET n += $properties
                RETURN n
            `;
            
            const result = await session.run(query, {
                id: nodeData.id || `${nodeType.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                userId,
                twinId,
                interviewId,
                name: nodeData.name || nodeData.label,
                label: nodeData.label || nodeData.name,
                properties: nodeData.properties || {}
            });
            
            return result.records[0].get('n').properties;
        } finally {
            await session.close();
        }
    }

    /**
     * Update a sandbox node (using MERGE to create if doesn't exist)
     * @param {string} nodeId - Node ID
     * @param {object} updates - Properties to update
     * @param {array} deletedFields - Fields to remove
     * @param {string} userId - User ID (required for creation)
     * @param {string} twinId - Twin ID (required for creation)
     * @param {string} interviewId - Interview ID (required for creation)
     * @returns {Promise<object>} Updated node
     */
    async updateSandboxNode(nodeId, updates, deletedFields = [], userId = null, twinId = null, interviewId = null) {
        const session = this.getSession();
        try {
            // v3.0.0: No Map conversion needed - NexusMetadataEditor returns JSON-safe data
            console.log('=== NEO4J NODE UPDATE ===');
            console.log('Updates received:', updates);
            console.log('JSON-safe test:', JSON.stringify(updates));
            
            // Neo4j property type constraint: Can only store primitives and arrays of primitives
            // stateMaps is an array of objects, so we serialize it to a JSON string for storage
            // This keeps the data model clean - all other layers work with native JS arrays
            const processedUpdates = { ...updates };
            if (processedUpdates.stateMaps) {
                if (!Array.isArray(processedUpdates.stateMaps)) {
                    throw new Error('stateMaps must be an array');
                }
                // Serialize to JSON string for Neo4j storage
                processedUpdates.stateMaps = JSON.stringify(processedUpdates.stateMaps);
                console.log('Serialized stateMaps for Neo4j storage');
            }
            
            // Determine node type from updates or default to Person
            const nodeType = updates.type || 'Person';
            const label = nodeType.charAt(0).toUpperCase() + nodeType.slice(1);
            
            // Use MERGE to create node if it doesn't exist
            let query = `
                MERGE (n:Sandbox {id: $nodeId})
                ON CREATE SET 
                    n:${label},
                    n.userId = $userId,
                    n.twinId = $twinId,
                    n.interviewId = $interviewId,
                    n.sessionId = $interviewId,
                    n._isSandbox = true,
                    n.createdAt = timestamp()
                SET n += $updates
                SET n.lastModified = timestamp()
            `;
            
            // Add REMOVE clauses for deleted fields
            if (deletedFields.length > 0) {
                const removeClause = deletedFields.map(field => `n.${field}`).join(', ');
                query += ` REMOVE ${removeClause}`;
            }
            
            query += ` RETURN n`;
            
            const result = await session.run(query, {
                nodeId,
                updates: processedUpdates,  // Use processed updates with stringified stateMaps
                userId,
                twinId,
                interviewId
            });
            
            const node = result.records[0].get('n').properties;
            // Deserialize stateMaps back to array when returning
            if (node.stateMaps && typeof node.stateMaps === 'string') {
                try {
                    node.stateMaps = JSON.parse(node.stateMaps);
                } catch (e) {
                    console.error('Failed to parse stateMaps:', e);
                    node.stateMaps = []; // Fallback to empty array
                }
            }
            return node;
        } finally {
            await session.close();
        }
    }

    /**
     * Delete a sandbox node
     * @param {string} nodeId - Node ID
     * @returns {Promise<boolean>} Success status
     */
    async deleteSandboxNode(nodeId) {
        const session = this.getSession();
        try {
            const result = await session.run(`
                MATCH (n:Sandbox {id: $nodeId})
                DETACH DELETE n
                RETURN COUNT(n) as deleted
            `, { nodeId });
            
            return result.records[0].get('deleted').toNumber() > 0;
        } finally {
            await session.close();
        }
    }

    /**
     * Delete a sandbox relationship
     * @param {string} relId - Relationship ID
     * @returns {Promise<boolean>} True if deleted
     */
    async deleteSandboxRelationship(relId) {
        const session = this.getSession();
        try {
            const result = await session.run(`
                MATCH ()-[r {id: $relId, _isSandbox: true}]->()
                DELETE r
                RETURN COUNT(r) as deleted
            `, { relId });
            
            return result.records[0].get('deleted').toNumber() > 0;
        } finally {
            await session.close();
        }
    }

    /**
     * Create a relationship in sandbox
     * @param {string} sourceId - Source node ID
     * @param {string} targetId - Target node ID
     * @param {string} relType - Relationship type
     * @param {object} properties - Relationship properties
     * @param {string} interviewId - Interview ID
     * @returns {Promise<object>} Created relationship
     */
    async createSandboxRelationship(sourceId, targetId, relType, properties = {}, interviewId) {
        const session = this.getSession();
        try {
            const query = `
                MATCH (source:Sandbox {id: $sourceId})
                MATCH (target:Sandbox {id: $targetId})
                CREATE (source)-[r:${relType} {
                    id: $relId,
                    _isSandbox: true,
                    interviewId: $interviewId,
                    createdAt: timestamp()
                }]->(target)
                SET r += $properties
                RETURN r
            `;
            
            const result = await session.run(query, {
                sourceId,
                targetId,
                relId: `rel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                interviewId,
                properties
            });
            
            if (result.records.length === 0) {
                throw new Error(`Could not create relationship: source or target node not found in sandbox`);
            }
            
            return result.records[0].get('r').properties;
        } finally {
            await session.close();
        }
    }

    /**
     * Update a sandbox relationship (using MERGE to create if doesn't exist)
     * @param {string} relId - Relationship ID
     * @param {object} updates - Properties to update
     * @param {string} sourceId - Source node ID
     * @param {string} targetId - Target node ID
     * @param {string} relType - Relationship type
     * @param {string} interviewId - Interview ID
     * @returns {Promise<object>} Updated relationship
     */
    async updateSandboxRelationship(relId, updates, sourceId, targetId, relType, interviewId) {
        const session = this.getSession();
        try {
            // v3.0.0: No Map conversion needed - NexusMetadataEditor returns JSON-safe data
            console.log('=== NEO4J RELATIONSHIP UPDATE ===');
            console.log('Updates received:', updates);
            console.log('JSON-safe test:', JSON.stringify(updates));
            
            // Neo4j property type constraint: Can only store primitives and arrays of primitives
            // stateMaps is an array of objects, so we serialize it to a JSON string for storage
            // This keeps the data model clean - all other layers work with native JS arrays
            const processedUpdates = { ...updates };
            if (processedUpdates.stateMaps) {
                if (!Array.isArray(processedUpdates.stateMaps)) {
                    throw new Error('stateMaps must be an array');
                }
                // Serialize to JSON string for Neo4j storage
                processedUpdates.stateMaps = JSON.stringify(processedUpdates.stateMaps);
                console.log('Serialized stateMaps for Neo4j storage');
            }
            
            // First try to update existing relationship
            const updateQuery = `
                MATCH ()-[r {id: $relId, _isSandbox: true}]-()
                SET r += $updates
                SET r.lastModified = timestamp()
                RETURN r
            `;
            
            const updateResult = await session.run(updateQuery, {
                relId,
                updates: processedUpdates  // Use processed updates with stringified stateMaps
            });
            
            if (updateResult.records.length > 0) {
                const rel = updateResult.records[0].get('r').properties;
                // Deserialize stateMaps back to array when returning
                if (rel.stateMaps && typeof rel.stateMaps === 'string') {
                    try {
                        rel.stateMaps = JSON.parse(rel.stateMaps);
                    } catch (e) {
                        console.error('Failed to parse stateMaps:', e);
                        rel.stateMaps = []; // Fallback to empty array
                    }
                }
                return rel;
            }
            
            // If not found, create new relationship
            console.log('Relationship not found, creating new one');
            const createQuery = `
                MATCH (source:Sandbox {id: $sourceId})
                MATCH (target:Sandbox {id: $targetId})
                CREATE (source)-[r:${relType} {
                    id: $relId,
                    _isSandbox: true,
                    interviewId: $interviewId,
                    createdAt: timestamp()
                }]->(target)
                SET r += $updates
                RETURN r
            `;
            
            const createResult = await session.run(createQuery, {
                sourceId,
                targetId,
                relId,
                interviewId,
                updates: processedUpdates  // Use processed updates with stringified stateMaps
            });
            
            if (createResult.records.length === 0) {
                throw new Error(`Could not create/update relationship: source or target node not found`);
            }
            
            const rel = createResult.records[0].get('r').properties;
            // Convert stateMaps back to array when returning
            if (rel.stateMaps && typeof rel.stateMaps === 'string') {
                rel.stateMaps = JSON.parse(rel.stateMaps);
            }
            return rel;
        } finally {
            await session.close();
        }
    }

    /**
     * Copy existing production node to sandbox
     * @param {string} productionNodeId - ID of production node to copy
     * @param {string} interviewId - Interview ID
     * @returns {Promise<object>} Copied sandbox node
     */
    async copyProductionNodeToSandbox(productionNodeId, interviewId) {
        const session = this.getSession();
        try {
            // First query: Get the production node and its labels
            const getNodeQuery = `
                MATCH (p {id: $productionNodeId})
                WHERE NOT p:Sandbox
                RETURN p, labels(p) as nodeLabels
            `;
            
            const nodeResult = await session.run(getNodeQuery, {
                productionNodeId
            });
            
            if (nodeResult.records.length === 0) {
                throw new Error(`Production node ${productionNodeId} not found`);
            }
            
            const productionNode = nodeResult.records[0].get('p');
            const labels = nodeResult.records[0].get('nodeLabels');
            
            // Build label string for CREATE statement (excluding 'Sandbox' which we'll add)
            const labelString = labels.filter(l => l !== 'Sandbox').join(':');
            const fullLabelString = labelString ? `:Sandbox:${labelString}` : ':Sandbox';
            
            // Second query: Create the sandbox node with all labels
            const createQuery = `
                CREATE (s${fullLabelString})
                SET s = $properties
                SET s._isSandbox = true
                SET s._originalId = $originalId
                SET s.interviewId = $interviewId
                SET s.sessionId = $interviewId
                SET s.copiedAt = timestamp()
                RETURN s
            `;
            
            const createResult = await session.run(createQuery, {
                properties: productionNode.properties,
                originalId: productionNodeId,
                interviewId
            });
            
            return createResult.records[0].get('s').properties;
        } finally {
            await session.close();
        }
    }

    /**
     * Save sandbox data to production by removing sandbox labels
     * @param {string} interviewId - Interview ID to commit
     * @param {string} userId - User ID
     * @param {string} twinId - Twin ID
     * @returns {Promise<object>} Commit summary
     */
    async commitSandboxToProduction(interviewId, userId, twinId) {
        if (!interviewId || !userId || !twinId) {
            throw new Error('Missing required parameters: interviewId, userId, or twinId');
        }

        const session = this.getSession();
        
        try {
            console.log(`📤 Committing sandbox to production for interview: ${interviewId}`);
            
            const tx = session.beginTransaction();
            console.log('✅ Transaction started');
            
            // First, handle nodes that reference existing production nodes (_originalId)
            const updateExistingResult = await tx.run(`
                MATCH (s:Sandbox {interviewId: $interviewId})
                WHERE exists(s._originalId)
                MATCH (p {id: s._originalId})
                WHERE NOT p:Sandbox
                SET p += properties(s)
                REMOVE p._isSandbox, p._originalId, p.interviewId, p.sessionId
                WITH s, p
                DETACH DELETE s
                RETURN COUNT(s) as updatedCount
            `, { interviewId });
            
            const updatedCount = updateExistingResult.records[0].get('updatedCount').toNumber();
            console.log(`✅ Updated ${updatedCount} existing production nodes`);
            
            // Then, convert new sandbox nodes to production (remove :Sandbox label)
            const convertNodesResult = await tx.run(`
                MATCH (n:Sandbox {interviewId: $interviewId})
                WHERE NOT exists(n._originalId)
                REMOVE n:Sandbox
                REMOVE n._isSandbox
                REMOVE n.interviewId
                REMOVE n.sessionId
                SET n.committedAt = timestamp()
                RETURN COUNT(n) as convertedCount, collect(n.id) as nodeIds
            `, { interviewId });
            
            const convertedCount = convertNodesResult.records[0].get('convertedCount').toNumber();
            const nodeIds = convertNodesResult.records[0].get('nodeIds');
            console.log(`✅ Converted ${convertedCount} sandbox nodes to production`);
            
            // Convert sandbox relationships to production
            const convertRelsResult = await tx.run(`
                MATCH ()-[r {_isSandbox: true, interviewId: $interviewId}]-()
                REMOVE r._isSandbox
                REMOVE r.interviewId
                SET r.committedAt = timestamp()
                RETURN COUNT(r) as convertedRelCount
            `, { interviewId });
            
            const convertedRelCount = convertRelsResult.records[0].get('convertedRelCount').toNumber();
            console.log(`✅ Converted ${convertedRelCount} sandbox relationships to production`);
            
            // Commit transaction
            console.log('📝 Committing transaction...');
            await tx.commit();
            console.log('✅ All sandbox changes committed to production');
            
            return {
                success: true,
                updatedNodes: updatedCount,
                newNodes: convertedCount,
                relationships: convertedRelCount,
                nodeIds: nodeIds
            };
            
        } catch (error) {
            console.error('❌ Neo4j commit error:', error);
            
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

    /**
     * Save sandbox data to production using MERGE operations
     * @deprecated Use commitSandboxToProduction instead
     * @param {object} sandboxData - Data containing nodes and edges
     * @param {string} userId - User ID
     * @param {string} twinId - Twin ID (usually userId-1)
     * @returns {Promise<boolean>} Success status
     */
    async saveSandboxToProduction(sandboxData, userId, twinId) {
        // This method is deprecated - keeping for backward compatibility
        // The new approach commits by removing :Sandbox label per data engineering standard
        console.warn('⚠️ saveSandboxToProduction is deprecated. Use commitSandboxToProduction instead.');
        
        // Extract interview ID from first node if available
        const interviewId = sandboxData.nodes[0]?.interviewId || sandboxData.nodes[0]?.sessionId;
        if (!interviewId) {
            throw new Error('No interviewId found in sandbox data');
        }
        
        const result = await this.commitSandboxToProduction(interviewId, userId, twinId);
        return result.success;
    }
}

// Create singleton instance
const neo4jConnection = new Neo4jConnection();

// Export for use in other modules
window.Neo4jConnection = neo4jConnection;