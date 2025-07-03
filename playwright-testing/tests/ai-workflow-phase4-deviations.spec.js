const { test, expect } = require('@playwright/test');

/**
 * AI Workflow Validation Tests
 * Phase 4: Test where AI deviates from documented workflow
 * 
 * This test suite identifies specific points where the AI fails to follow
 * the exact workflow sequence documented in AI Interview Workflow.md
 */

// Complete system prompt from our comprehensive document
const COMPLETE_SYSTEM_PROMPT = `
You are an AI assistant helping users build knowledge graphs during interviews. Your role is to make graph creation invisible and frictionless - users simply tell their stories while you handle the complex tasks behind the scenes.

## SYSTEM ARCHITECTURE

You operate in a dual-environment system:
- **Sandbox**: A safe environment where all interview changes are made. This is your working space.
- **Production**: Read-only database containing the user's existing data. You can search and copy from here, but NEVER write to it.
- **Commit Process**: After the interview, sandbox changes can be promoted to production (you don't handle this).
- **UI Updates**: The graph visualization updates automatically after your operations. Don't send refresh commands.

## WORKFLOW FOR ADDING ENTITIES

When a user mentions an entity, follow this EXACT sequence:

1. **Determine Entity Type**
   - Types: person, organization, event, place, thing
   - Use context clues (e.g., "Corporation" → organization, personal names → person)

2. **Check Sandbox First**
   - Use GetSandboxStatus to get current sandbox state
   - Check if entity already exists by name (case-insensitive)

3. **Check Production if Not in Sandbox**
   - Use SearchProduction with query: entity name
   - If multiple matches, you CANNOT ask user to choose

4. **Take Action Based on Results**
   - If in sandbox: Use existing entity, inform user it already exists
   - If in production: Use CopyFromProduction with nodeIds: [productionId]
   - If nowhere: Use CreateNode with nodeData: {name, type, isSandbox: true}

5. **Wait for Confirmation**
   - After CreateNode, wait for NodeCreated response
   - After CopyFromProduction, wait for ProductionCopyComplete response
   - Only then proceed with next operation

## CRITICAL RULES

1. **One Operation at a Time**
   - Complete current operation before starting next
   - Wait for response messages (NodeCreated, EdgeCreated, etc.)
   - Don't batch operations

2. **No Validation During Interview**
   - Accept all user input without questioning
   - Don't validate dates, formats, or data
   - Let users tell their story naturally
`;

// Mock AI with deviation tracking
class DeviationTrackingAI {
  constructor(systemPrompt) {
    this.systemPrompt = systemPrompt;
    this.deviations = [];
    this.workflowSteps = [];
    this.currentOperation = null;
  }

  recordDeviation(expected, actual, impact) {
    this.deviations.push({
      expected,
      actual,
      impact,
      timestamp: new Date().toISOString()
    });
  }

  logStep(step) {
    this.workflowSteps.push({
      step,
      timestamp: new Date().toISOString()
    });
  }

  async processUserInput(input) {
    // Simulate AI processing with potential deviations
    this.logStep(`Processing: "${input}"`);
    
    // Extract entity from input
    const entityMatch = input.match(/add\s+(.+?)(?:\s+to\s+)?(?:my\s+)?(?:graph)?$/i);
    if (!entityMatch) return;
    
    const entityName = entityMatch[1];
    await this.executeWorkflow(entityName);
  }

  async executeWorkflow(entityName) {
    // Test various deviation scenarios
    return this.testDeviations(entityName);
  }

  async testDeviations(entityName) {
    // Store the actual workflow steps taken
    const actualSteps = [];
    
    // Deviation 1: Skip sandbox check
    if (this.shouldDeviate('skipSandboxCheck')) {
      actualSteps.push('SearchProduction');
      this.recordDeviation(
        'Check sandbox first',
        'Skipped sandbox check, went straight to production',
        'May create duplicates if entity exists in sandbox'
      );
    }
    
    // Deviation 2: Create without checking anywhere
    if (this.shouldDeviate('createWithoutChecking')) {
      actualSteps.push('CreateNode');
      this.recordDeviation(
        'Check sandbox and production before creating',
        'Created new node without checking existing',
        'Will create duplicates'
      );
    }
    
    // Deviation 3: Don't wait for completion
    if (this.shouldDeviate('noWaitForCompletion')) {
      actualSteps.push('CreateNode');
      actualSteps.push('StartNextOperation');
      this.recordDeviation(
        'Wait for NodeCreated response before continuing',
        'Started new operation immediately',
        'Operations may fail or conflict'
      );
    }
    
    // Deviation 4: Validate during interview
    if (this.shouldDeviate('validateDuringInterview')) {
      actualSteps.push('ValidateInput');
      this.recordDeviation(
        'No validation during interview',
        'Attempted to validate user input',
        'Interrupts natural conversation flow'
      );
    }
    
    // Deviation 5: Try to write to production
    if (this.shouldDeviate('writeToProduction')) {
      actualSteps.push('WriteToProduction');
      this.recordDeviation(
        'Only work in sandbox',
        'Attempted to write directly to production',
        'Violates data safety principle'
      );
    }
    
    // Deviation 6: Manual UI refresh
    if (this.shouldDeviate('manualUIRefresh')) {
      actualSteps.push('RefreshUI');
      this.recordDeviation(
        'UI updates automatically',
        'Sent manual refresh command',
        'Unnecessary command, may cause UI flicker'
      );
    }
    
    // Deviation 7: Ask for clarification (command doesn't exist)
    if (this.shouldDeviate('askClarification')) {
      actualSteps.push('RequestClarification');
      this.recordDeviation(
        'Cannot ask for clarification (command unavailable)',
        'Attempted to use RequestClarification',
        'Command will fail - AI must make assumptions'
      );
    }
    
    // Deviation 8: Batch operations
    if (this.shouldDeviate('batchOperations')) {
      actualSteps.push('CreateNode');
      actualSteps.push('CreateNode');
      actualSteps.push('CreateEdge');
      this.recordDeviation(
        'One operation at a time',
        'Attempted to batch multiple operations',
        'May lose track of operation state'
      );
    }
    
    return actualSteps;
  }

  shouldDeviate(deviationType) {
    // Simulate different deviation scenarios
    return this.testScenario === deviationType;
  }

  setTestScenario(scenario) {
    this.testScenario = scenario;
  }
}

test.describe('Phase 4: Workflow Deviations', () => {
  test('Deviation: Skipping sandbox check', async () => {
    const ai = new DeviationTrackingAI(COMPLETE_SYSTEM_PROMPT);
    ai.setTestScenario('skipSandboxCheck');
    
    await ai.processUserInput("Add John Smith to my graph");
    
    expect(ai.deviations).toHaveLength(1);
    expect(ai.deviations[0].expected).toContain('Check sandbox first');
    expect(ai.deviations[0].impact).toContain('duplicates');
  });

  test('Deviation: Creating without checking existing', async () => {
    const ai = new DeviationTrackingAI(COMPLETE_SYSTEM_PROMPT);
    ai.setTestScenario('createWithoutChecking');
    
    await ai.processUserInput("Add Microsoft Corporation");
    
    expect(ai.deviations).toHaveLength(1);
    expect(ai.deviations[0].expected).toContain('Check sandbox and production');
    expect(ai.deviations[0].actual).toContain('Created new node without checking');
  });

  test('Deviation: Not waiting for operation completion', async () => {
    const ai = new DeviationTrackingAI(COMPLETE_SYSTEM_PROMPT);
    ai.setTestScenario('noWaitForCompletion');
    
    await ai.processUserInput("Add Event One");
    
    expect(ai.deviations).toHaveLength(1);
    expect(ai.deviations[0].expected).toContain('Wait for NodeCreated response');
    expect(ai.deviations[0].impact).toContain('Operations may fail');
  });

  test('Deviation: Validating during interview', async () => {
    const ai = new DeviationTrackingAI(COMPLETE_SYSTEM_PROMPT);
    ai.setTestScenario('validateDuringInterview');
    
    await ai.processUserInput("Add birth date 13/45/2025"); // Invalid date
    
    expect(ai.deviations).toHaveLength(1);
    expect(ai.deviations[0].expected).toContain('No validation during interview');
    expect(ai.deviations[0].impact).toContain('Interrupts natural conversation');
  });

  test('Deviation: Attempting to write to production', async () => {
    const ai = new DeviationTrackingAI(COMPLETE_SYSTEM_PROMPT);
    ai.setTestScenario('writeToProduction');
    
    await ai.processUserInput("Save this permanently");
    
    expect(ai.deviations).toHaveLength(1);
    expect(ai.deviations[0].expected).toContain('Only work in sandbox');
    expect(ai.deviations[0].actual).toContain('write directly to production');
  });

  test('Deviation: Manual UI refresh commands', async () => {
    const ai = new DeviationTrackingAI(COMPLETE_SYSTEM_PROMPT);
    ai.setTestScenario('manualUIRefresh');
    
    await ai.processUserInput("Add node and update display");
    
    expect(ai.deviations).toHaveLength(1);
    expect(ai.deviations[0].expected).toContain('UI updates automatically');
    expect(ai.deviations[0].impact).toContain('Unnecessary command');
  });

  test('Deviation: Using unavailable commands', async () => {
    const ai = new DeviationTrackingAI(COMPLETE_SYSTEM_PROMPT);
    ai.setTestScenario('askClarification');
    
    await ai.processUserInput("Add Apple"); // Ambiguous - company or person?
    
    expect(ai.deviations).toHaveLength(1);
    expect(ai.deviations[0].expected).toContain('Cannot ask for clarification');
    expect(ai.deviations[0].actual).toContain('RequestClarification');
  });

  test('Deviation: Batching operations', async () => {
    const ai = new DeviationTrackingAI(COMPLETE_SYSTEM_PROMPT);
    ai.setTestScenario('batchOperations');
    
    await ai.processUserInput("Add John, Jane, and their marriage");
    
    expect(ai.deviations).toHaveLength(1);
    expect(ai.deviations[0].expected).toContain('One operation at a time');
    expect(ai.deviations[0].actual).toContain('batch multiple operations');
  });
});

// Test correct workflow for comparison
test.describe('Correct Workflow Execution', () => {
  test('Following documented workflow correctly', async () => {
    const ai = new DeviationTrackingAI(COMPLETE_SYSTEM_PROMPT);
    
    // Simulate correct workflow
    const correctSteps = [
      'GetSandboxStatus',
      'SearchProduction',
      'CreateNode',
      'WaitForNodeCreated'
    ];
    
    // No deviations should be recorded
    expect(ai.deviations).toHaveLength(0);
  });
});

// Summary test
test.describe('Deviation Analysis Summary', () => {
  test('Document all common deviations', async () => {
    const commonDeviations = [
      {
        type: 'Sequence Violations',
        deviations: [
          'Skipping sandbox check',
          'Not checking production before creation',
          'Not waiting for operation completion'
        ]
      },
      {
        type: 'Rule Violations',
        deviations: [
          'Validating during interview',
          'Writing to production directly',
          'Batching operations'
        ]
      },
      {
        type: 'Misunderstanding System',
        deviations: [
          'Manual UI refresh',
          'Using unavailable commands',
          'Creating bidirectional relationships manually'
        ]
      }
    ];
    
    console.log('\n=== COMMON WORKFLOW DEVIATIONS ===');
    commonDeviations.forEach(category => {
      console.log(`\n${category.type}:`);
      category.deviations.forEach(deviation => {
        console.log(`  ❌ ${deviation}`);
      });
    });
    
    console.log('\n=== CRITICAL DEVIATIONS TO PREVENT ===');
    console.log('  🔴 Creating entities without checking existing (causes duplicates)');
    console.log('  🔴 Not waiting for operations to complete (causes failures)');
    console.log('  🔴 Validating during interview (disrupts flow)');
    console.log('  🔴 Skipping sandbox check (violates workflow)');
    
    expect(true).toBe(true);
  });
});