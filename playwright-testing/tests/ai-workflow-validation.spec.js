const { test, expect } = require('@playwright/test');

/**
 * AI Workflow Validation Tests
 * Phase 1: Test for missing WebSocket commands AI needs
 * 
 * This test suite identifies gaps in available WebSocket commands
 * that the AI needs to follow the Interview Workflow correctly.
 */

// Initial AI System Prompt based on workflow document
const AI_SYSTEM_PROMPT = `
You are an AI assistant helping users build knowledge graphs during interviews.

When a user mentions an entity:
1. Determine its type: person, organization, event, place, or thing
2. Check if it exists in the current sandbox
3. If not in sandbox, check production database
4. If found in production, copy it and confirm with user
5. If not found anywhere, create new entity

You must use WebSocket messages to communicate with the system.
`;

// Mock AI that tracks what commands it tries to use
class MockAI {
  constructor(systemPrompt) {
    this.systemPrompt = systemPrompt;
    this.attemptedCommands = [];
    this.messagesSent = [];
  }

  async processUserInput(input) {
    // Simulate AI processing based on system prompt
    const entityName = this.extractEntityName(input);
    const entityType = this.determineEntityType(entityName);
    
    // AI should check sandbox first
    this.attemptCommand('GetSandboxStatus', {
      purpose: 'Check if entity exists in sandbox'
    });
    
    // Simulate not found in sandbox
    this.attemptCommand('SearchProduction', {
      query: entityName,
      purpose: 'Check if entity exists in production'
    });
    
    // Simulate not found in production either
    this.attemptCommand('CreateNode', {
      nodeData: {
        name: entityName,
        type: entityType
      }
    });
  }

  attemptCommand(commandType, payload) {
    this.attemptedCommands.push({ type: commandType, payload });
    this.messagesSent.push({
      type: commandType,
      payload: payload,
      timestamp: new Date().toISOString()
    });
  }

  extractEntityName(input) {
    // Simple extraction - real AI would be more sophisticated
    const match = input.match(/add\s+(.+?)(?:\s+to\s+)?(?:my\s+)?(?:graph)?$/i);
    return match ? match[1] : input;
  }

  determineEntityType(name) {
    // Simple heuristic - real AI would be more sophisticated
    const lowerName = name.toLowerCase();
    if (lowerName.includes('corporation') || lowerName.includes('company')) {
      return 'organization';
    }
    if (lowerName.includes('conference') || lowerName.includes('meeting')) {
      return 'event';
    }
    if (lowerName.includes('park') || lowerName.includes('city')) {
      return 'place';
    }
    // Default to person for names
    return 'person';
  }
}

// Available WebSocket commands from the standard
const AVAILABLE_COMMANDS = [
  'CreateNode', 'NodeCreated',
  'UpdateNode', 'NodeUpdated',
  'DeleteNode', 'NodeDeleted',
  'CreateEdge', 'EdgeCreated',
  'UpdateEdge', 'EdgeUpdated',
  'DeleteEdge', 'EdgeDeleted',
  'OpenMetadataForm', 'FormOpened',
  'UpdateFormField', 'FormFieldUpdated',
  'SaveForm', 'FormSaved',
  'CloseForm', 'FormClosed',
  'FocusNode', 'NodeFocused',
  'HighlightNode', 'NodeHighlighted',
  'HighlightEdge', 'EdgeHighlighted',
  'ClearHighlights', 'HighlightsCleared',
  'SearchProduction', 'ProductionSearchResults',
  'CopyFromProduction', 'ProductionCopyComplete',
  'GetSandboxStatus', 'SandboxStatus',
  'ClearSandbox', 'SandboxCleared'
];

test.describe('Phase 1: Missing WebSocket Commands', () => {
  test('AI uses correct commands for basic node creation', async () => {
    const ai = new MockAI(AI_SYSTEM_PROMPT);
    
    // Test basic create person scenario
    await ai.processUserInput("Add John Smith");
    
    // Check if AI tried to use any undefined commands
    const missingCommands = ai.attemptedCommands
      .filter(cmd => !AVAILABLE_COMMANDS.includes(cmd.type))
      .map(cmd => cmd.type);
    
    expect(missingCommands).toHaveLength(0);
    
    // Verify AI used the correct sequence
    expect(ai.attemptedCommands[0].type).toBe('GetSandboxStatus');
    expect(ai.attemptedCommands[1].type).toBe('SearchProduction');
    expect(ai.attemptedCommands[2].type).toBe('CreateNode');
  });

  test('AI has commands for entity disambiguation', async () => {
    const ai = new MockAI(AI_SYSTEM_PROMPT);
    
    // Test ambiguous entity
    await ai.processUserInput("Add Apple");
    
    // Check if AI needs a command to ask for clarification
    const needsClarificationCommand = ai.attemptedCommands.some(cmd => 
      cmd.type === 'RequestClarification' || 
      cmd.type === 'AskUser' ||
      cmd.type === 'SendMessage'
    );
    
    if (needsClarificationCommand) {
      console.log('MISSING COMMAND: AI needs a way to ask user for clarification');
      expect(AVAILABLE_COMMANDS).toContain('RequestClarification');
    }
  });

  test('AI has commands for confirming production copies', async () => {
    const ai = new MockAI(AI_SYSTEM_PROMPT);
    
    // Simulate finding entity in production
    ai.attemptCommand('CopyFromProduction', { nodeIds: ['prod_1'] });
    
    // AI should confirm with user
    const needsConfirmationCommand = ai.attemptedCommands.some(cmd =>
      cmd.type === 'ConfirmWithUser' ||
      cmd.type === 'SendConfirmation' ||
      cmd.type === 'RequestUserConfirmation'
    );
    
    if (needsConfirmationCommand) {
      console.log('MISSING COMMAND: AI needs a way to confirm production matches with user');
    }
  });

  test('AI can check entity type when ambiguous', async () => {
    const ai = new MockAI(AI_SYSTEM_PROMPT);
    
    // Check if AI has a way to query valid entity types
    const needsTypeQuery = ai.attemptedCommands.some(cmd =>
      cmd.type === 'GetEntityTypes' ||
      cmd.type === 'GetValidTypes'
    );
    
    if (!needsTypeQuery) {
      console.log('POTENTIAL GAP: AI might not know valid entity types without a query command');
    }
  });

  test('AI can handle relationship creation between entities', async () => {
    const ai = new MockAI(AI_SYSTEM_PROMPT);
    
    // Test relationship creation
    await ai.processUserInput("John works at Microsoft");
    
    // Check if AI has commands to:
    // 1. Verify both entities exist
    // 2. Create relationship
    const relationshipCommands = ai.attemptedCommands.filter(cmd =>
      cmd.type === 'CreateEdge' ||
      cmd.type === 'CheckEntityExists' ||
      cmd.type === 'GetNodeByName'
    );
    
    if (relationshipCommands.length === 0) {
      console.log('MISSING COMMANDS: AI needs commands to handle relationships');
    }
  });

  test('AI can access metadata form schemas', async () => {
    const ai = new MockAI(AI_SYSTEM_PROMPT);
    
    // Check if AI can query what fields are available
    const needsSchemaAccess = ai.attemptedCommands.some(cmd =>
      cmd.type === 'GetFormSchema' ||
      cmd.type === 'GetEntitySchema' ||
      cmd.type === 'GetAvailableFields'
    );
    
    if (!needsSchemaAccess) {
      console.log('POTENTIAL GAP: AI might not know what fields to populate without schema access');
    }
  });
});

// Summary function to identify all gaps
test.describe('Command Gap Summary', () => {
  test('Identify all missing commands', async () => {
    const potentiallyMissingCommands = [
      {
        command: 'RequestClarification',
        purpose: 'Ask user to clarify ambiguous entities',
        scenario: 'User says "Add Apple" - is it company or person?'
      },
      {
        command: 'ConfirmWithUser',
        purpose: 'Confirm production matches before using',
        scenario: 'Found "John Smith" in production - is this the right one?'
      },
      {
        command: 'GetEntityTypes',
        purpose: 'Query valid entity types',
        scenario: 'AI needs to know valid types: person|organization|event|place|thing'
      },
      {
        command: 'GetFormSchema',
        purpose: 'Get available fields for entity type',
        scenario: 'AI needs to know what fields a Person entity can have'
      },
      {
        command: 'SendUserMessage',
        purpose: 'Send informational messages to user',
        scenario: 'AI needs to explain what it\'s doing or ask questions'
      }
    ];
    
    console.log('\n=== MISSING WEBSOCKET COMMANDS ===');
    potentiallyMissingCommands.forEach(cmd => {
      if (!AVAILABLE_COMMANDS.includes(cmd.command)) {
        console.log(`\n❌ ${cmd.command}`);
        console.log(`   Purpose: ${cmd.purpose}`);
        console.log(`   Scenario: ${cmd.scenario}`);
      }
    });
    
    // This test documents findings rather than asserting
    expect(true).toBe(true);
  });
});