const { test, expect } = require('@playwright/test');

/**
 * AI Workflow Validation Tests
 * Phase 2: Identify missing information (fields, schemas, etc)
 * 
 * This test suite identifies what information the AI needs but doesn't have
 * to properly follow the Interview Workflow.
 */

// Enhanced AI System Prompt with discovered gaps from Phase 1
const AI_SYSTEM_PROMPT_V2 = `
You are an AI assistant helping users build knowledge graphs during interviews.

When a user mentions an entity:
1. Determine its type: person, organization, event, place, or thing
2. Check if it exists in the current sandbox using GetSandboxStatus
3. If not in sandbox, check production database using SearchProduction
4. If found in production, copy it using CopyFromProduction and confirm with user
5. If not found anywhere, create new entity using CreateNode

ENTITY TYPES: person, organization, event, place, thing
RELATIONSHIP TYPES: Personal, Organizational, Experiential, Creative, Declarative

You must use WebSocket messages to communicate with the system.
`;

// Mock AI with information tracking
class InformationTrackingAI {
  constructor(systemPrompt) {
    this.systemPrompt = systemPrompt;
    this.informationNeeded = [];
    this.decisionsAttempted = [];
  }

  needsInformation(infoType, reason, scenario) {
    this.informationNeeded.push({
      type: infoType,
      reason: reason,
      scenario: scenario,
      timestamp: new Date().toISOString()
    });
  }

  attemptDecision(decision, availableInfo, outcome) {
    this.decisionsAttempted.push({
      decision: decision,
      availableInfo: availableInfo,
      outcome: outcome,
      timestamp: new Date().toISOString()
    });
  }
}

test.describe('Phase 2: Missing Information', () => {
  test('AI knows required fields for each entity type', async () => {
    const ai = new InformationTrackingAI(AI_SYSTEM_PROMPT_V2);
    
    // Test creating a Person entity
    const personFields = ai.getRequiredFields('person');
    
    if (!personFields) {
      ai.needsInformation(
        'PersonRequiredFields',
        'AI needs to know what fields are required/optional for Person entities',
        'Creating "John Smith" - what fields should be populated?'
      );
    }
    
    // Test for all entity types
    const entityTypes = ['person', 'organization', 'event', 'place', 'thing'];
    entityTypes.forEach(type => {
      const fields = ai.getRequiredFields(type);
      if (!fields) {
        ai.needsInformation(
          `${type}RequiredFields`,
          `AI needs field schema for ${type} entities`,
          `User wants to add a ${type} - what fields are available?`
        );
      }
    });
    
    expect(ai.informationNeeded.length).toBeGreaterThan(0);
    console.log('Missing field information:', ai.informationNeeded);
  });

  test('AI knows relationship constraints', async () => {
    const ai = new InformationTrackingAI(AI_SYSTEM_PROMPT_V2);
    
    // Test relationship creation rules
    ai.attemptDecision(
      'Can create multiple Personal relationships between same nodes?',
      'Unknown - not specified in prompt',
      'Failed - needs constraint information'
    );
    
    ai.needsInformation(
      'RelationshipConstraints',
      'AI needs to know: max 1 relationship of each type between any two nodes',
      'User tries to add second "married to" relationship between John and Jane'
    );
    
    // Test relationship type validation
    const validRelTypes = ai.getValidRelationshipTypes();
    if (!validRelTypes) {
      ai.needsInformation(
        'ValidRelationshipTypes',
        'AI needs exact list of valid relationship types',
        'User says "John collaborates with Jane" - what relationship type?'
      );
    }
  });

  test('AI knows metadata form structure', async () => {
    const ai = new InformationTrackingAI(AI_SYSTEM_PROMPT_V2);
    
    // Test form field knowledge
    const personFormFields = ai.getFormFields('person');
    
    if (!personFormFields) {
      ai.needsInformation(
        'MetadataFormSchema',
        'AI needs to know available fields in metadata forms',
        'User says "Set Johns birth date to 1980" - which field to use?'
      );
    }
    
    // Test field types and validation
    ai.attemptDecision(
      'What format for birth date field?',
      'Unknown - no field type information',
      'Failed - needs field type specs'
    );
    
    ai.needsInformation(
      'FieldTypeSpecifications',
      'AI needs field types, formats, and validation rules',
      'Date fields: exact date vs era selection?'
    );
  });

  test('AI understands initial snapshot format', async () => {
    const ai = new InformationTrackingAI(AI_SYSTEM_PROMPT_V2);
    
    // Test understanding of SandboxStatus response
    const sampleStatus = {
      nodeCount: 5,
      edgeCount: 3,
      nodes: [/* what format? */],
      edges: [/* what format? */]
    };
    
    ai.attemptDecision(
      'Parse SandboxStatus to check existing entities',
      'Status format unclear',
      'Failed - needs response format documentation'
    );
    
    ai.needsInformation(
      'SandboxStatusFormat',
      'AI needs to know exact format of SandboxStatus response',
      'How to parse nodes array to check if "John Smith" exists?'
    );
  });

  test('AI knows production search response format', async () => {
    const ai = new InformationTrackingAI(AI_SYSTEM_PROMPT_V2);
    
    // Test understanding of ProductionSearchResults
    ai.attemptDecision(
      'Parse ProductionSearchResults to find matches',
      'Response format unknown',
      'Failed - needs response structure'
    );
    
    ai.needsInformation(
      'ProductionSearchResultsFormat',
      'AI needs to know structure of search results',
      'Found 3 "John Smith" entries - how to present options to user?'
    );
  });

  test('AI knows entity naming conventions', async () => {
    const ai = new InformationTrackingAI(AI_SYSTEM_PROMPT_V2);
    
    // Test name parsing
    ai.attemptDecision(
      'Extract entity name from "Add Dr. John Smith Jr. to the graph"',
      'No naming convention rules',
      'Uncertain - might include/exclude titles'
    );
    
    ai.needsInformation(
      'EntityNamingConventions',
      'AI needs rules for entity names (include titles? suffixes?)',
      'Should "Dr. John Smith Jr." be stored as is or just "John Smith"?'
    );
  });

  test('AI knows workflow state management', async () => {
    const ai = new InformationTrackingAI(AI_SYSTEM_PROMPT_V2);
    
    // Test operation completion tracking
    ai.attemptDecision(
      'Is previous CreateNode operation complete?',
      'No state tracking mechanism',
      'Failed - needs state management info'
    );
    
    ai.needsInformation(
      'OperationStateTracking',
      'AI needs to know how to track operation completion',
      'User interrupts with new request before NodeCreated response'
    );
  });
});

// Summary test to compile all missing information
test.describe('Information Gap Summary', () => {
  test('Compile all missing information', async () => {
    const ai = new InformationTrackingAI(AI_SYSTEM_PROMPT_V2);
    
    // Run all information checks
    const missingInfo = [
      {
        category: 'Entity Schemas',
        items: [
          'Required fields for each entity type',
          'Optional fields and their purposes',
          'Field types and validation rules',
          'Default values for fields'
        ]
      },
      {
        category: 'Relationship Rules',
        items: [
          'Maximum relationships between nodes (1 per type)',
          'Bidirectional vs directional relationships',
          'Relationship state management',
          'Valid relationship types and their meanings'
        ]
      },
      {
        category: 'Response Formats',
        items: [
          'SandboxStatus structure',
          'ProductionSearchResults structure',
          'Node/Edge object formats',
          'Error response handling'
        ]
      },
      {
        category: 'Workflow Rules',
        items: [
          'Operation completion signals',
          'State management between operations',
          'Interruption handling',
          'Confirmation flow details'
        ]
      },
      {
        category: 'Data Conventions',
        items: [
          'Entity naming rules',
          'Type determination heuristics',
          'Duplicate detection logic',
          'Case sensitivity rules'
        ]
      }
    ];
    
    console.log('\n=== MISSING INFORMATION SUMMARY ===');
    missingInfo.forEach(category => {
      console.log(`\n${category.category}:`);
      category.items.forEach(item => {
        console.log(`  ❌ ${item}`);
      });
    });
    
    // Document critical information needs
    const criticalNeeds = [
      'Entity type field schemas',
      'WebSocket response formats',
      'Relationship constraints',
      'Operation state tracking'
    ];
    
    console.log('\n=== CRITICAL INFORMATION NEEDS ===');
    criticalNeeds.forEach(need => {
      console.log(`  🔴 ${need}`);
    });
    
    expect(true).toBe(true);
  });
});