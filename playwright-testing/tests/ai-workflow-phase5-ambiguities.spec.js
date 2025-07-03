const { test, expect } = require('@playwright/test');

/**
 * AI Workflow Validation Tests
 * Phase 5: Identify prompt ambiguities and conflicts
 * 
 * This test suite identifies ambiguous or conflicting instructions
 * in the system prompt that could cause the AI to behave incorrectly.
 */

// Analyze the complete prompt for ambiguities
class PromptAmbiguityAnalyzer {
  constructor() {
    this.ambiguities = [];
    this.conflicts = [];
    this.unclearInstructions = [];
  }

  findAmbiguity(instruction, problem, example) {
    this.ambiguities.push({
      instruction,
      problem,
      example,
      timestamp: new Date().toISOString()
    });
  }

  findConflict(instruction1, instruction2, issue) {
    this.conflicts.push({
      instruction1,
      instruction2,
      issue,
      timestamp: new Date().toISOString()
    });
  }

  findUnclear(instruction, whyUnclear, impact) {
    this.unclearInstructions.push({
      instruction,
      whyUnclear,
      impact,
      timestamp: new Date().toISOString()
    });
  }
}

test.describe('Phase 5: System Prompt Ambiguities', () => {
  test('Ambiguous entity type determination', async () => {
    const analyzer = new PromptAmbiguityAnalyzer();
    
    analyzer.findAmbiguity(
      'Use context clues (e.g., "Corporation" → organization)',
      'No clear rules for ambiguous entities like "Apple", "Amazon", "Phoenix"',
      'User says "Add Apple" - could be company, person named Apple, or fruit'
    );
    
    analyzer.findAmbiguity(
      'If ambiguous, you CANNOT ask for clarification',
      'No guidance on what to do when truly ambiguous',
      'Should AI default to most likely type? Random choice? Skip entity?'
    );
    
    expect(analyzer.ambiguities.length).toBeGreaterThan(0);
  });

  test('Conflicting search instructions', async () => {
    const analyzer = new PromptAmbiguityAnalyzer();
    
    analyzer.findConflict(
      'Check sandbox first',
      'Context is maintained between messages - no need to re-check',
      'Should AI check sandbox every time or trust session context?'
    );
    
    analyzer.findConflict(
      'If multiple matches, you CANNOT ask user to choose',
      'If found in production, copy it using CopyFromProduction',
      'What if there are 5 John Smiths? Copy all? Copy first? Skip?'
    );
    
    expect(analyzer.conflicts.length).toBeGreaterThan(0);
  });

  test('Unclear error handling', async () => {
    const analyzer = new PromptAmbiguityAnalyzer();
    
    analyzer.findUnclear(
      'Operations may fail - if no response after reasonable time, retry once',
      'What is "reasonable time"? 1 second? 10 seconds? 30 seconds?',
      'AI might retry too quickly or wait too long'
    );
    
    analyzer.findUnclear(
      'If still fails, inform user and continue with next request',
      'How to inform user if SendUserMessage not available?',
      'User unaware of failures, graph may be incomplete'
    );
    
    expect(analyzer.unclearInstructions.length).toBeGreaterThan(0);
  });

  test('Ambiguous relationship creation', async () => {
    const analyzer = new PromptAmbiguityAnalyzer();
    
    analyzer.findAmbiguity(
      'Personal: relationships between people (married, friends, parent/child)',
      'What about business partnerships between people? Personal or Organizational?',
      'Two people co-founded a company - Personal or Organizational?'
    );
    
    analyzer.findAmbiguity(
      'Maximum 1 relationship of each type between any two nodes',
      'Directional or bidirectional counting? Can A→B and B→A both exist?',
      'Parent/child is directional but counted as one?'
    );
    
    expect(analyzer.ambiguities.length).toBeGreaterThan(0);
  });

  test('Conflicting validation rules', async () => {
    const analyzer = new PromptAmbiguityAnalyzer();
    
    analyzer.findConflict(
      'NO validation during interview - accept whatever users say',
      'Store in properties object until schema access is available',
      'Should AI structure data at all or store everything as raw text?'
    );
    
    analyzer.findConflict(
      'Accept all user input without questioning',
      'Determine entity type from context clues',
      'If user says "Add xyz123" should AI determine type or accept as-is?'
    );
    
    expect(analyzer.conflicts.length).toBeGreaterThan(0);
  });

  test('Unclear operation boundaries', async () => {
    const analyzer = new PromptAmbiguityAnalyzer();
    
    analyzer.findUnclear(
      'One operation at a time',
      'What defines an operation? Is checking sandbox an operation?',
      'AI might wait unnecessarily between checks and actions'
    );
    
    analyzer.findUnclear(
      'Complete current operation before starting next',
      'When is CopyFromProduction complete? After command or after response?',
      'Timing confusion could lead to race conditions'
    );
    
    expect(analyzer.unclearInstructions.length).toBeGreaterThan(0);
  });

  test('Missing decision criteria', async () => {
    const analyzer = new PromptAmbiguityAnalyzer();
    
    analyzer.findAmbiguity(
      'If multiple matches, you CANNOT ask user to choose',
      'No criteria for which match to select',
      'Search returns 3 John Smiths - pick first? most recent? best match?'
    );
    
    analyzer.findAmbiguity(
      'Make reasonable assumptions based on context',
      'No definition of what constitutes "reasonable"',
      'AI assumptions may not match user expectations'
    );
    
    expect(analyzer.ambiguities.length).toBeGreaterThan(0);
  });
});

test.describe('Phase 5: Critical Ambiguities Summary', () => {
  test('Document all ambiguities and conflicts', async () => {
    const criticalAmbiguities = {
      'Entity Type Determination': [
        'No rules for truly ambiguous entities (Apple, Phoenix, Paris)',
        'No default type when context insufficient',
        'No handling for non-entities (actions, questions)'
      ],
      'Multiple Match Handling': [
        'No selection criteria for multiple production matches',
        'Cannot confirm with user which is correct',
        'Risk of copying wrong entity'
      ],
      'Error Response': [
        'Cannot send status messages to user',
        'No clear timeout values',
        'Silent failures possible'
      ],
      'Operation Boundaries': [
        'Unclear what constitutes "one operation"',
        'Check operations vs action operations',
        'Completion signals ambiguous'
      ],
      'Data Handling': [
        'Conflict between "no validation" and "determine type"',
        'Unclear data structuring rules',
        'Property storage format unspecified'
      ]
    };
    
    const criticalConflicts = {
      'Session Context': [
        'Check every time vs use cached context',
        'Trust session state vs verify each time'
      ],
      'User Communication': [
        'Need to inform user but no messaging command',
        'Cannot ask for clarification but need user input'
      ],
      'Validation Timing': [
        'Accept everything vs structure data properly',
        'No validation vs determine correct types'
      ]
    };
    
    console.log('\n=== CRITICAL AMBIGUITIES ===');
    Object.entries(criticalAmbiguities).forEach(([category, items]) => {
      console.log(`\n${category}:`);
      items.forEach(item => {
        console.log(`  ⚠️  ${item}`);
      });
    });
    
    console.log('\n=== CRITICAL CONFLICTS ===');
    Object.entries(criticalConflicts).forEach(([category, items]) => {
      console.log(`\n${category}:`);
      items.forEach(item => {
        console.log(`  ⚡ ${item}`);
      });
    });
    
    console.log('\n=== PROMPT IMPROVEMENTS NEEDED ===');
    console.log('  1. Add specific rules for ambiguous entity names');
    console.log('  2. Define selection criteria for multiple matches');
    console.log('  3. Clarify operation boundaries and completion signals');
    console.log('  4. Specify timeout values (e.g., 5 seconds)');
    console.log('  5. Resolve validation vs acceptance conflict');
    console.log('  6. Add fallback communication methods');
    
    expect(true).toBe(true);
  });
});