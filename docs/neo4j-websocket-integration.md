# Neo4j WebSocket Integration Documentation

## Overview

The Neo4j graph visualization system is fully implemented and ready for backend integration. The frontend receives graph data through the existing Orchestrator WebSocket connection and displays it using the NexusControl component.

## Architecture

```
Backend Services → Orchestrator WebSocket → Frontend Interview Page → NexusControl
```

- **No direct Neo4j connection** from frontend
- **Uses existing WebSocket infrastructure** for data flow
- **Real-time updates** supported through GraphUpdate messages
- **Automatic data transformation** from Neo4j to visualization format

## Frontend Implementation Status

✅ **COMPLETED - Ready for backend integration**

### 1. WebSocket Message Handlers

**Location**: `/js/services/orchestrator-websocket.js`

```javascript
// Handles initial graph data response
this.messageHandlers.set('GraphDataResponse', (parsedMessage) => {
    console.log('Graph data received:', parsedMessage);
    if (window.updateInterviewGraph) {
        window.updateInterviewGraph(parsedMessage.data);
    }
});

// Handles real-time graph updates  
this.messageHandlers.set('GraphUpdate', (parsedMessage) => {
    console.log('Graph update received:', parsedMessage);
    if (window.addInterviewGraphData) {
        window.addInterviewGraphData(parsedMessage.data);
    }
});
```

### 2. Graph Update Functions

**Location**: `/js/pages/interview.js`

```javascript
// Updates entire graph with new data
window.updateInterviewGraph = function(graphData) {
    // Transforms Neo4j format to NexusControl format
    // Re-renders the visualization
    // Stores data globally
};

// Adds incremental updates for real-time changes
window.addInterviewGraphData = function(newData) {
    // Merges new nodes/edges with existing data
    // Avoids duplicates
    // Calls updateInterviewGraph to re-render
};
```

### 3. Data Format Transformation

**Input Format (from Neo4j)**:
```javascript
{
    "nodes": [
        {
            "id": "user_123",
            "labels": ["Person"],
            "properties": { "name": "John Doe", "age": 45 }
        }
    ],
    "edges": [
        {
            "startNode": "user_123",
            "endNode": "memory_456", 
            "type": "REMEMBERS"
        }
    ]
}
```

**Output Format (for NexusControl)**:
```javascript
{
    "nodes": [
        {
            "id": "user_123",
            "name": "John Doe",
            "type": "central",  // Mapped from "Person" label
            "age": 45
        }
    ],
    "edges": [
        {
            "source": "user_123",
            "target": "memory_456",
            "relationship": "REMEMBERS"
        }
    ]
}
```

### 4. Node Type Mapping

```javascript
const labelToTypeMapping = {
    'Person': 'central',
    'Family': 'family', 
    'Event': 'event',
    'Place': 'place',
    'Memory': 'memory',
    'Topic': 'memory',
    'Experience': 'memory',
    'Organization': 'place'
};
```

## Backend Integration Requirements

### 1. Message Types to Implement

#### GraphDataResponse
**When to send**: In response to RequestGraphData or when interview starts

```javascript
{
    "type": "GraphDataResponse",
    "payload": {
        "metadata": {
            "userId": "user-123",
            "twinId": "twin-456", 
            "interviewId": "interview-789",
            "correlationId": "corr-abc123",
            "timestamp": "2025-01-15T10:30:00Z"
        },
        "data": {
            "nodes": [ /* Neo4j nodes */ ],
            "edges": [ /* Neo4j edges */ ]
        }
    }
}
```

#### GraphUpdate
**When to send**: When new entities are extracted/created during interview

```javascript
{
    "type": "GraphUpdate", 
    "payload": {
        "metadata": {
            "userId": "user-123",
            "twinId": "twin-456",
            "interviewId": "interview-789", 
            "timestamp": "2025-01-15T10:31:00Z"
        },
        "data": {
            "nodes": [ /* New/updated nodes */ ],
            "edges": [ /* New/updated edges */ ]
        }
    }
}
```

### 2. When to Send Updates

#### Initial Graph Data
- **Trigger**: When interview starts (InterviewStarted response)
- **Scope**: All graph data for the current interview
- **Message**: GraphDataResponse

#### Real-time Updates
- **Trigger**: When IDIS extracts new entities/relationships
- **Trigger**: When Neo4j Bridge writes new data
- **Scope**: Only the new/changed nodes and edges
- **Message**: GraphUpdate

#### Scope Filtering
- **Interview scope**: Filter by `interviewId` - only show data from current interview
- **All scope**: Filter by `userId` and `twinId` - show all user data

### 3. Integration Points

#### A. Orchestrator Service
**Location**: The main orchestrator service that handles WebSocket connections

**Responsibilities**:
- Receive RequestGraphData messages from frontend
- Query Neo4j for graph data (via Neo4j Bridge or direct query)
- Send GraphDataResponse back to frontend
- Forward GraphUpdate messages when data changes

#### B. IDIS (Entity Extraction Service)
**Location**: The service that processes interview transcripts

**Responsibilities**:
- When new entities/relationships are extracted
- Send GraphUpdate via Orchestrator to frontend
- Include both the entities sent to Neo4j and any relationship updates

#### C. Neo4j Bridge Service
**Location**: `/current-projects/DiagnosticStudio/supporting services/schemas/Interview_Schema_2_Neo_Bridge_Service/`

**Current Status**: Write-only (createNode, updateNode, deleteNode, createEdge, updateEdge, deleteEdge)

**Needed Enhancement**: 
- Add read/query capabilities OR
- Emit events when data is written so Orchestrator can send updates

### 4. Neo4j Query Requirements

The backend needs to query Neo4j for visualization data. Required queries:

#### Get Interview Graph Data
```cypher
MATCH (n)-[r]-(m)
WHERE n.interviewId = $interviewId 
   OR m.interviewId = $interviewId
RETURN n, r, m
```

#### Get All User Graph Data  
```cypher
MATCH (n)-[r]-(m)
WHERE (n.userId = $userId AND n.twinId = $twinId)
   OR (m.userId = $userId AND m.twinId = $twinId)
RETURN n, r, m
```

#### Get Recent Updates (for incremental updates)
```cypher
MATCH (n)-[r]-(m)
WHERE n.lastModified > $since
   AND (n.interviewId = $interviewId OR m.interviewId = $interviewId)
RETURN n, r, m
```

## Testing

### Frontend Testing
✅ **Complete test suite available**

**Test Page**: `http://localhost:8765/neo4j-interview-test/websocket-graph-flow-test.html`

**Test Functions**:
- Send initial graph data
- Send incremental updates
- Test multiple sequential updates
- Test empty graph handling
- Verify data transformation

### Integration Testing
**Test the complete flow**:

1. Start interview
2. Send GraphDataResponse with sample data
3. Verify visualization displays correctly
4. Send GraphUpdate with new entity
5. Verify incremental update works
6. Check that filters and search work

### Sample Test Data
```javascript
// Use this sample data for testing
const testGraphData = {
    nodes: [
        {
            id: "user_1",
            labels: ["Person"], 
            properties: { name: "Test User", age: 45 }
        },
        {
            id: "memory_1",
            labels: ["Memory"],
            properties: { name: "Childhood Home", description: "My first house" }
        }
    ],
    edges: [
        {
            startNode: "user_1",
            endNode: "memory_1",
            type: "REMEMBERS"
        }
    ]
};
```

## Error Handling

### Frontend Error Handling
- **Missing data**: Gracefully handles empty nodes/edges arrays
- **Invalid format**: Logs errors and continues with valid data
- **Transform errors**: Falls back to raw data display

### Backend Error Handling
- **Neo4j connection errors**: Send empty graph with error status
- **Query timeouts**: Send partial results or cached data
- **Invalid requests**: Log error, continue without graph updates

## Performance Considerations

### Data Size Limits
- **Initial load**: Recommended max 100 nodes, 200 edges
- **Updates**: Recommended max 10 nodes/edges per update
- **Frequency**: Max 1 update per second

### Optimization Strategies
- **Pagination**: For large graphs, implement pagination
- **Caching**: Cache graph queries for common requests
- **Debouncing**: Batch multiple rapid updates into single message

## Future Enhancements

### Phase 2 Features
- **Graph editing**: Allow users to modify relationships
- **Advanced filtering**: Time-based, topic-based filters
- **Export options**: PDF, image export of graphs
- **Collaboration**: Multi-user graph viewing

### Integration Extensions
- **Other pages**: Extend to Explorer, Twin Management pages
- **Mobile support**: Responsive graph visualization
- **Real-time collaboration**: Share live graph updates between users

## Troubleshooting

### Common Issues

#### "No nodes displayed"
- Check WebSocket connection is established
- Verify GraphDataResponse/GraphUpdate messages are being sent
- Check browser console for transformation errors
- Ensure Neo4j data format matches expected structure

#### "Graph not updating" 
- Verify GraphUpdate messages include new data
- Check that addInterviewGraphData function is being called
- Ensure no duplicate node IDs causing merge issues

#### "Visualization errors"
- Check all dependencies loaded (D3, React, NexusControl)
- Verify container element exists and has proper dimensions
- Check console for React rendering errors

### Debug Tools

#### Browser Console Commands
```javascript
// Check if functions are available
console.log(typeof window.updateInterviewGraph);
console.log(typeof window.addInterviewGraphData);

// Test with sample data
window.updateInterviewGraph(sampleData);

// Check current graph data
console.log(window.currentGraphData);
```

#### WebSocket Message Logging
The WebSocket service logs all messages. Check console for:
- `GraphDataResponse received:`
- `GraphUpdate received:`
- `Graph data received:` 
- `Graph update received:`

## Support

For implementation questions or issues:
1. Check browser console for error messages
2. Test with sample data using test page
3. Verify WebSocket connection is active
4. Review this documentation for data format requirements

**Status**: ✅ Frontend implementation complete and ready for backend integration
**Next Step**: Backend team implements GraphDataResponse and GraphUpdate message sending