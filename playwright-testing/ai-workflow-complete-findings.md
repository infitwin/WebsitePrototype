# AI Interview Workflow - Complete Testing Findings

## Executive Summary

Through 5 phases of testing, we've identified critical gaps in the AI system's ability to follow the documented Interview Workflow. The AI is missing essential WebSocket commands, lacks crucial information about entity schemas and response formats, misunderstands system architecture, deviates from the prescribed workflow, and faces ambiguous instructions.

## Phase 1: Missing WebSocket Commands

The AI needs but doesn't have access to:

1. **RequestClarification** - Cannot disambiguate entities like "Apple" (company vs person)
2. **ConfirmWithUser** - Cannot verify production matches before copying
3. **GetEntityTypes** - Must hardcode entity types instead of querying
4. **GetFormSchema** - Cannot determine required/optional fields
5. **SendUserMessage** - Cannot communicate status or errors to user

**Impact**: AI must make assumptions, leading to potential errors and poor UX.

## Phase 2: Missing Information

Critical information gaps include:

### Entity Schemas
- No knowledge of required vs optional fields
- No field validation rules or formats
- No default values
- No field type specifications

### Response Formats
- SandboxStatus structure unclear
- ProductionSearchResults format undocumented
- Node/Edge object structures missing
- Error response handling undefined

### Workflow Rules
- Operation completion signals unclear
- State management between operations missing
- Interruption handling undefined
- Confirmation flow details absent

**Impact**: AI cannot properly structure data or handle responses.

## Phase 3: System Knowledge Gaps

The AI misunderstands:

### Architecture
- Doesn't know sandbox is for safe experimentation
- Unclear that production is read-only
- Doesn't understand commit process
- Thinks it must manually update UI

### Session Management
- Unaware of session boundaries
- Doesn't utilize initial snapshot
- Re-checks entities unnecessarily
- No context persistence understanding

### Operation Mechanics
- No error recovery procedures
- Thinks forms need manual opening
- Tries to create bidirectional relationships
- Validates during interview (disrupts flow)

**Impact**: Inefficient operations and poor user experience.

## Phase 4: Workflow Deviations

Common deviations from documented workflow:

### Sequence Violations
- Skips sandbox check (creates duplicates)
- Doesn't check production before creation
- Doesn't wait for operation completion

### Rule Violations
- Validates during interview
- Attempts to write to production
- Batches operations

### System Misunderstandings
- Sends manual UI refresh commands
- Uses unavailable commands
- Creates bidirectional relationships manually

**Impact**: Data integrity issues and operation failures.

## Phase 5: Prompt Ambiguities & Conflicts

Critical ambiguities found:

### Entity Type Determination
- No rules for ambiguous names (Apple, Phoenix, Paris)
- No default type strategy
- No handling for non-entities

### Multiple Match Handling
- No selection criteria for multiple matches
- Cannot confirm correct match
- Risk of copying wrong entity

### Conflicting Instructions
- "Check sandbox first" vs "use cached context"
- "No validation" vs "determine entity type"
- "Inform user" but no messaging capability

**Impact**: Inconsistent AI behavior and decision-making.

## Comprehensive System Prompt Requirements

Based on all findings, the AI needs:

```
SYSTEM ARCHITECTURE:
- Sandbox: Write-enabled safe environment for interview changes
- Production: Read-only source of truth
- Commit: Post-interview process (not your responsibility)
- UI: Updates automatically via WebSocket events

SESSION MANAGEMENT:
- Interview has defined start/end
- Initial GetSandboxStatus provides starting context
- Cache entities within session to avoid re-checking
- Maintain operation state between messages

ENTITY WORKFLOW (STRICT SEQUENCE):
1. Parse user input for entity mentions
2. Determine type using these rules:
   - Names without context → person
   - "Inc/Corp/LLC" → organization  
   - "Conference/Summit/Meeting" → event
   - Geographic/location words → place
   - Physical objects → thing
   - When ambiguous, default to: person for names, organization for businesses
3. Check sandbox (use cached data if available)
4. If not in sandbox, search production
5. For multiple matches: select most recently modified
6. Copy from production OR create new
7. Wait for operation response before continuing

RESPONSE FORMATS:
GetSandboxStatus → {nodeCount, edgeCount, nodes: [{id, name, type}], edges: [...]}
SearchProduction → {results: [{id, name, type, properties, lastModified}], totalCount}
CreateNode → {success, nodeId, node: {id, name, type}}
CopyFromProduction → {copiedNodes: [{originalId, sandboxId, name}], copiedEdges: []}

OPERATION RULES:
- One WebSocket message at a time
- Wait for response before next operation
- Timeout: 5 seconds, then retry once
- Check operations (GetStatus, Search) can be concurrent
- Action operations (Create, Copy, Delete) must be sequential

ERROR HANDLING:
- On timeout: Retry once after 5 seconds
- On failure: Note internally, continue with next entity
- Cannot inform user directly (no messaging command)
- Log errors for post-interview review

CONSTRAINTS:
- NO validation during interview
- NO manual UI updates
- NO direct production writes
- NO user clarification requests
- NO bidirectional relationship creation (automatic)
- ACCEPT all user input as-is

MISSING CAPABILITIES (work around these):
- Cannot ask for clarification
- Cannot send status messages
- Cannot query schemas dynamically
- Cannot confirm production matches
- Must make reasonable assumptions
```

## Recommendations

1. **Immediate**: Update system prompt with complete requirements above
2. **Short-term**: Add missing WebSocket commands to the standard
3. **Medium-term**: Implement GetFormSchema and entity type queries
4. **Long-term**: Add RequestClarification and ConfirmWithUser for better UX

## Testing Status

- ✅ Phase 1: Missing commands identified
- ✅ Phase 2: Missing information documented  
- ✅ Phase 3: Knowledge gaps found
- ✅ Phase 4: Workflow deviations tested
- ✅ Phase 5: Ambiguities identified
- ⏳ Phase 6: Entity field testing (optional - we know AI lacks schema access)
- ✅ Phase 7: All findings documented (this document)
- ⏳ Phase 8: Fixes created (system prompt in ai-system-prompt-complete.md)