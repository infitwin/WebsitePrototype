# AI Interview Workflow - Gap Analysis Summary

## Overview
This document summarizes the gaps identified in the AI system prompt and WebSocket infrastructure for the Interview Workflow system.

## Phase 1: Missing WebSocket Commands

### Commands the AI Needs but Don't Exist:

1. **RequestClarification**
   - Purpose: Ask user to clarify ambiguous entities
   - Example: "When you say 'Apple', do you mean the company or a person?"
   - Current workaround: None - AI cannot disambiguate

2. **ConfirmWithUser** 
   - Purpose: Confirm production matches before using
   - Example: "I found John Smith (Engineer at TechCorp) in our records. Is this the correct John Smith?"
   - Current workaround: AI copies without confirmation

3. **GetEntityTypes**
   - Purpose: Query valid entity types
   - Example: AI needs to know: person|organization|event|place|thing
   - Current workaround: Must be hardcoded in prompt

4. **GetFormSchema**
   - Purpose: Get available fields for entity type
   - Example: What fields does a Person entity support?
   - Current workaround: AI doesn't know field requirements

5. **SendUserMessage**
   - Purpose: Send informational messages to user
   - Example: "I'm checking if this entity already exists..."
   - Current workaround: AI operates silently

## Phase 2: Missing Information

### Critical Information Gaps:

#### 1. Entity Schemas
- ❌ Required fields for each entity type
- ❌ Optional fields and their purposes  
- ❌ Field types and validation rules
- ❌ Default values for fields

**Impact**: AI cannot properly populate entities or validate user input

#### 2. Relationship Rules
- ❌ Maximum relationships between nodes (1 per type)
- ❌ Bidirectional vs directional relationships
- ❌ Relationship state management
- ❌ Valid relationship types and their meanings

**Impact**: AI may create invalid relationships or duplicates

#### 3. Response Formats
- ❌ SandboxStatus structure
- ❌ ProductionSearchResults structure
- ❌ Node/Edge object formats
- ❌ Error response handling

**Impact**: AI cannot parse responses to make decisions

#### 4. Workflow Rules  
- ❌ Operation completion signals
- ❌ State management between operations
- ❌ Interruption handling
- ❌ Confirmation flow details

**Impact**: AI may start new operations before completing previous ones

#### 5. Data Conventions
- ❌ Entity naming rules
- ❌ Type determination heuristics
- ❌ Duplicate detection logic
- ❌ Case sensitivity rules

**Impact**: Inconsistent entity creation and duplicate detection failures

## Recommended System Prompt Additions

Based on gaps found, the AI system prompt needs:

```
MISSING COMMANDS YOU NEED (request these features):
- RequestClarification: When entity type is ambiguous
- ConfirmWithUser: After copying from production
- SendUserMessage: To inform user of actions

ENTITY SCHEMAS:
Person: Required fields (name), Optional (birthDate, occupation, etc.)
Organization: Required fields (name), Optional (founded, industry, etc.)
[... complete for all types ...]

RESPONSE FORMATS:
SandboxStatus: { nodeCount, edgeCount, nodes: [{id, name, type}...], edges: [...] }
ProductionSearchResults: { results: [{id, name, type, properties}...], totalCount }

WORKFLOW RULES:
- Wait for NodeCreated response before starting new operation
- One operation at a time - no parallel operations
- After CopyFromProduction, always confirm with user

RELATIONSHIP CONSTRAINTS:
- Maximum 1 relationship of each type between any two nodes
- Types: Personal, Organizational, Experiential, Creative, Declarative
- Relationships are bidirectional
```

## Phase 3: System Knowledge Gaps

### Architecture Understanding
- ❌ Sandbox is for safe experimentation
- ❌ Production is read-only for data integrity
- ❌ Changes commit from sandbox to production
- ❌ Graph visualization auto-updates

**Impact**: AI doesn't understand the purpose of the dual-environment system

### Session Management
- ❌ Interview sessions have boundaries
- ❌ Initial snapshot provided at start
- ❌ Sandbox persists within session
- ❌ Context maintained between messages

**Impact**: AI may not utilize session context effectively

### Operation Mechanics
- ❌ Operations may fail and need retry
- ❌ Forms open automatically on entity select
- ❌ Relationships are bidirectional by default
- ❌ Validation happens post-interview

**Impact**: AI makes incorrect assumptions about how operations work

### Critical Misunderstandings
- 🔴 Thinks it must validate during interview (disrupts flow)
- 🔴 Doesn't know about auto-UI updates (sends redundant commands)
- 🔴 Unaware of session context persistence (re-checks unnecessarily)
- 🔴 No error recovery procedures (operations fail silently)

## Complete System Prompt Requirements

Based on all gaps identified, the AI needs:

```
SYSTEM ARCHITECTURE:
- Sandbox: Safe environment for interview changes
- Production: Read-only source of existing data
- Commit Process: Sandbox changes promote to production after interview
- UI Updates: Graph visualization updates automatically

SESSION CONTEXT:
- You receive an initial snapshot at interview start
- Sandbox persists throughout the session
- No need to re-check entities within same session
- Context maintained between messages

OPERATION RULES:
- Wait for response before starting new operation
- Operations may fail - retry if needed
- Forms open automatically when entity selected
- Relationships are bidirectional by default
- NO validation during interview - let users tell their story

MISSING COMMANDS (not yet available):
- RequestClarification: For ambiguous entities
- ConfirmWithUser: After production copies
- SendUserMessage: For status updates
- GetEntityTypes: To query valid types
- GetFormSchema: To get field requirements

[Include all Phase 1 & 2 findings...]
```

## Next Steps

1. **Create comprehensive system prompt** with all findings
2. **Add missing WebSocket commands** to standard
3. **Document all response formats** with examples
4. **Create field schema documentation** for entities
5. **Build error handling procedures**
6. **Test with complete information**

## Testing Recommendations

- Test AI with enhanced prompt containing all system knowledge
- Validate AI doesn't interrupt interview flow
- Ensure AI utilizes session context properly
- Test error recovery scenarios
- Verify AI understands sandbox/production distinction