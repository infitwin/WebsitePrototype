# CLAUDE.md - AI Assistant Instructions

## PROJECT COLOR SCHEME

The Infitwin website uses a consistent color palette across all pages:

- **Primary Purple (Sidebar)**: #6B46C1 (deep purple)
- **Background**: #F3F4F6 (light gray)
- **Card Background**: #FFFFFF (white) with subtle shadows
- **Success/Progress Green**: #10B981
- **Warning/Accent Yellow**: #FFD700 (golden yellow)
- **Info/Action Blue**: #3B82F6
- **Error Red**: #EF4444
- **Text Primary**: #374151 (dark gray)
- **Text Secondary**: #6B7280 (medium gray)
- **Border Color**: #E5E7EB (light gray)

Always use these colors when implementing new features to maintain visual consistency.

## UI COMPONENT ARCHITECTURE

### Unified Component System (December 2024)

The website has been restructured with a unified component architecture to prevent duplicate UI implementations and ensure consistency. All components use the design system tokens exclusively.

**Architecture Location**: `/js/components/` and `/css/components/`

**Core Principles**:
- **Single Source of Truth**: Each component type can only be defined once
- **Prevention-First**: ComponentRegistry prevents duplicate component types
- **Design System Integration**: All components use CSS custom properties exclusively
- **Consistent Patterns**: All components extend BaseComponent

**Available Components**:

1. **Modal System** (`/js/components/ui/modal.js`)
   - Unified modal with customizable content, actions, and types
   - Replaces 5+ different modal implementations
   - Static methods: `Modal.confirm()`, `Modal.alert()`, `Modal.loading()`

2. **Button System** (`/js/components/ui/button.js`)
   - Comprehensive button component with all variants
   - Replaces 10+ different button implementations
   - Supports icons, loading states, sizes, and full-width variants

3. **Form System** (`/js/components/ui/form.js`)
   - Unified input component with built-in validation
   - Replaces 5+ different form input patterns
   - Includes FormValidator with common validation functions

4. **Avatar System** (`/js/components/ui/avatar.js`)
   - Profile pictures with image, initials, and icon fallbacks
   - Replaces 6+ different avatar implementations
   - Supports status indicators, sizes, shapes, and lazy loading

5. **Search System** (`/js/components/ui/search.js`)
   - Search input with suggestions, debouncing, and filters
   - Replaces 4+ different search implementations
   - Includes SearchWithFilters for complex search interfaces

**Prevention Mechanisms**:
- **ComponentRegistry**: Throws errors if duplicate component types are registered
- **BaseComponent**: Enforces consistent patterns across all components
- **Design Token Validator**: Warns in development when hardcoded values are used

**Usage Example**:
```javascript
import { Button, Modal } from './js/components/ui/button.js';

const saveButton = Button.primary({
  text: 'Save Changes',
  onClick: async () => {
    const confirmed = await Modal.confirm({
      title: 'Save Changes',
      message: 'Are you sure?'
    });
    if (confirmed) saveData();
  }
});
```

**Developer Guidelines**:
1. Always check for existing components before creating new ones
2. All new components MUST extend BaseComponent
3. Register components with ComponentRegistry to prevent duplicates
4. Use design system tokens exclusively (no hardcoded values)
5. Follow the patterns documented in `/js/components/README.md`

This architecture ensures that future development cannot accidentally create duplicate components, maintaining consistency and reducing technical debt.

## COMPRESSION INSTRUCTIONS

### Code: C1 (Coding Handoff)
To get this command, say: "Create the full /compact command with C1 instructions text"

When I use `/compact C1`, use these compression instructions:

Focus on: current build plan status with verification results, exact current step and next command to run, working file:line and function, last attempt and result, all credential locations, service ports with start commands, test/verification commands, tools/dashboard URLs, test data examples, rollback commit/version, warnings about critical operations. CRITICAL: Include all uncommitted code changes, unpushed commits, and pending deployments (Firebase, Cloud Build, etc.) to prevent losing work between compressions. Preserve the problem-solving position, not just project description.

## MEMORY COMPRESSION HANDOFF SUMMARY

When you are about to reach memory limits or need to compress context, create an inline summary using this exact format:

```
=== MEMORY COMPRESSION HANDOFF ===

TASK: Build Infitwin Phase 1 Alpha - 8 of 10 pages complete, starting Phase 4

BUILD PLAN:
[x] Step 1: Phase 1 Authentication Flow | VERIFIED: Email Verification & Alpha Welcome pages with corrective snapshots
[x] Step 2: Phase 2 Core Features | VERIFIED: File Browser, Twin Management, Settings all complete
[x] Step 3: Phase 3 Enhanced Experience | VERIFIED: Explore Screen & Talk to Twin with full functionality
[>] Step 4: [CURRENT: Phase 4 Sharing & Error Handling]
    Next: Create pages/shared-view.html with read-only twin viewer
    Verify: curl http://localhost:8080/pages/shared-view.html returns 200
    Expect: Limited navigation, read-only graph, owner attribution
    If fail: Check file paths and permissions
[ ] Step 5: General Error Page | Verify: Friendly error handling

CURRENT CONTEXT:
Working on: Phase 4, Task 4.1 Shared View
Function: Read-only twin viewing for shared access
Problem: None - Phase 3 complete and pushed
Last attempt: Successfully completed Talk to Twin screen with chat interface

CREDENTIALS:
- Service Account: None needed (local development)
- API Keys: Integration points documented for future
- Env vars needed: None currently
- Auth token: Not required for static pages

TOOLS/INTERFACES:
- Development Server: http://localhost:8080 (python3 -m http.server 8080)
- Explore Screen: http://localhost:8080/pages/explore.html ✅
- Talk to Twin: http://localhost:8080/pages/talk-to-twin.html ✅
- Master Work List: /docs/build-plans/master-work-list.md
- GitHub: github.com:infitwin/WebsitePrototype.git

VERIFICATION COMMANDS:
- Test page: curl http://localhost:8080/pages/[page].html
- Check responsive: Browser DevTools with corrective snapshots
- Git status: git status && git log --oneline -5
- Server check: ps aux | grep 'python.*8080'

SERVICES/PORTS:
- 8080: HTTP server - start: python3 -m http.server 8080
- Required external: None (all APIs marked for future integration)

TEST DATA:
- Twin name: "John's Digital Twin"
- Shared twins: Margaret Johnson, Robert Smith examples
- Storage: 3.5GB of 10GB used
- Files: Drag-drop with 50MB limit

UNCOMMITTED/UNPUSHED CODE:
- Modified files: None (all committed)
- New files created: None pending
- Git status: Clean working tree
- Latest commits: 827678c (Talk to Twin), 9b41e0b (Explore), dbf3334 (Phase 2)
- Firebase deploy needed: None (static files)
- Cloud Build needed: None

WARNINGS:
- 📸 CRITICAL: Mandatory corrective snapshot process must continue
- Test files exist but excluded from commits (dashboard-emotional-montecarlo.html, etc)
- Neo4j and Winston AI integrations are placeholders only
- All API endpoints marked but not implemented

ROLLBACK:
- Last working commit: 827678c (Phase 3 complete)
- Safe version: All phases tested and working
- Rollback command: git reset --hard 827678c

RESUME CHECKLIST:
1. cd /home/tim/WebsitePrototype
2. Ensure server running: python3 -m http.server 8080
3. export: No env vars needed
4. Verify Phase 3 complete: All pages loading correctly
5. Continue with Phase 4: Shared View (Read-Only)

=== END HANDOFF ===
```

**IMPORTANT**: Create this summary inline in the chat when memory is getting full. Do not save it as a file. This ensures the compressed AI can immediately see and use it.