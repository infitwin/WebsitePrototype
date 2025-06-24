/**
 * Neo4j Test Data Generator Module
 * Generates test graph data for development and testing
 */

// Test data templates
const firstNames = ['John', 'Jane', 'Robert', 'Mary', 'Michael', 'Sarah', 'David', 'Emma', 'James', 'Lisa'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
const relationships = ['parent_of', 'spouse_of', 'sibling_of', 'child_of', 'friend_of', 'colleague_of'];
const organizations = ['TechCorp', 'MediCare Inc', 'EduFirst', 'Global Finance', 'Creative Studios'];
const locations = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia'];

/**
 * Generate test data configuration based on size
 */
export function getDataConfig(size) {
    const configs = {
        small: {
            persons: 10,
            organizations: 3,
            locations: 2,
            minRelationships: 15,
            maxRelationships: 20
        },
        medium: {
            persons: 50,
            organizations: 15,
            locations: 10,
            minRelationships: 100,
            maxRelationships: 150
        },
        large: {
            persons: 200,
            organizations: 50,
            locations: 50,
            minRelationships: 500,
            maxRelationships: 750
        }
    };
    
    return configs[size] || configs.small;
}

/**
 * Generate random person node
 */
export function generatePerson(id) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const birthYear = 1940 + Math.floor(Math.random() * 60);
    
    return {
        id: `person_${id}`,
        type: 'person',
        properties: {
            name: `${firstName} ${lastName}`,
            firstName: firstName,
            lastName: lastName,
            birthYear: birthYear,
            age: new Date().getFullYear() - birthYear,
            email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
            phone: `+1-555-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`
        }
    };
}

/**
 * Generate random organization node
 */
export function generateOrganization(id) {
    const name = organizations[Math.floor(Math.random() * organizations.length)] + ' ' + id;
    const founded = 1950 + Math.floor(Math.random() * 70);
    
    return {
        id: `org_${id}`,
        type: 'organization',
        properties: {
            name: name,
            founded: founded,
            industry: ['Technology', 'Healthcare', 'Finance', 'Education', 'Manufacturing'][Math.floor(Math.random() * 5)],
            employees: Math.floor(Math.random() * 10000) + 100
        }
    };
}

/**
 * Generate random location node
 */
export function generateLocation(id) {
    const city = locations[Math.floor(Math.random() * locations.length)];
    
    return {
        id: `location_${id}`,
        type: 'location',
        properties: {
            name: city,
            country: 'USA',
            population: Math.floor(Math.random() * 5000000) + 100000,
            timezone: 'America/New_York'
        }
    };
}

/**
 * Generate relationship between nodes
 */
export function generateRelationship(sourceId, targetId, type) {
    const relationshipTypes = {
        'person-person': ['parent_of', 'child_of', 'spouse_of', 'sibling_of', 'friend_of'],
        'person-organization': ['works_at', 'founded', 'member_of', 'volunteer_at'],
        'person-location': ['lives_in', 'born_in', 'visited'],
        'organization-location': ['headquartered_in', 'has_office_in']
    };
    
    // Determine relationship category
    let category = 'person-person';
    if (sourceId.includes('person') && targetId.includes('org')) {
        category = 'person-organization';
    } else if (sourceId.includes('person') && targetId.includes('location')) {
        category = 'person-location';
    } else if (sourceId.includes('org') && targetId.includes('location')) {
        category = 'organization-location';
    }
    
    const availableTypes = relationshipTypes[category];
    const relType = type || availableTypes[Math.floor(Math.random() * availableTypes.length)];
    
    return {
        id: `rel_${sourceId}_${targetId}_${Date.now()}`,
        source: sourceId,
        target: targetId,
        type: relType,
        properties: {
            since: 1990 + Math.floor(Math.random() * 30),
            strength: Math.random()
        }
    };
}

/**
 * Generate complete test dataset
 */
export function generateTestDataset(size, userId, twinId) {
    const config = getDataConfig(size);
    const nodes = [];
    const relationships = [];
    
    // Generate person nodes
    for (let i = 0; i < config.persons; i++) {
        nodes.push(generatePerson(i));
    }
    
    // Generate organization nodes
    for (let i = 0; i < config.organizations; i++) {
        nodes.push(generateOrganization(i));
    }
    
    // Generate location nodes
    for (let i = 0; i < config.locations; i++) {
        nodes.push(generateLocation(i));
    }
    
    // Generate relationships
    const totalRelationships = config.minRelationships + 
        Math.floor(Math.random() * (config.maxRelationships - config.minRelationships));
    
    for (let i = 0; i < totalRelationships; i++) {
        const sourceNode = nodes[Math.floor(Math.random() * nodes.length)];
        const targetNode = nodes[Math.floor(Math.random() * nodes.length)];
        
        // Avoid self-relationships
        if (sourceNode.id !== targetNode.id) {
            relationships.push(generateRelationship(sourceNode.id, targetNode.id));
        }
    }
    
    return {
        userId: userId,
        twinId: twinId,
        nodes: nodes,
        relationships: relationships,
        metadata: {
            generatedAt: new Date().toISOString(),
            size: size,
            nodeCount: nodes.length,
            relationshipCount: relationships.length
        }
    };
}

/**
 * Create Cypher queries for Neo4j
 */
export function generateCypherQueries(dataset) {
    const queries = [];
    
    // Create constraint queries
    queries.push('CREATE CONSTRAINT IF NOT EXISTS FOR (p:Person) REQUIRE p.id IS UNIQUE');
    queries.push('CREATE CONSTRAINT IF NOT EXISTS FOR (o:Organization) REQUIRE o.id IS UNIQUE');
    queries.push('CREATE CONSTRAINT IF NOT EXISTS FOR (l:Location) REQUIRE l.id IS UNIQUE');
    
    // Create node queries
    dataset.nodes.forEach(node => {
        const label = node.type.charAt(0).toUpperCase() + node.type.slice(1);
        const props = Object.entries(node.properties)
            .map(([key, value]) => `${key}: "${value}"`)
            .join(', ');
        
        queries.push(
            `CREATE (n:${label} {id: "${node.id}", userId: "${dataset.userId}", twinId: "${dataset.twinId}", ${props}})`
        );
    });
    
    // Create relationship queries
    dataset.relationships.forEach(rel => {
        queries.push(
            `MATCH (a {id: "${rel.source}"}), (b {id: "${rel.target}"})
             CREATE (a)-[:${rel.type.toUpperCase()} {since: ${rel.properties.since}, strength: ${rel.properties.strength}}]->(b)`
        );
    });
    
    return queries;
}

/**
 * Clear all test data for a user/twin
 */
export function generateClearQueries(userId, twinId) {
    return [
        `MATCH (n {userId: "${userId}", twinId: "${twinId}"}) DETACH DELETE n`,
        `MATCH ()-[r]->() WHERE r.userId = "${userId}" AND r.twinId = "${twinId}" DELETE r`
    ];
}