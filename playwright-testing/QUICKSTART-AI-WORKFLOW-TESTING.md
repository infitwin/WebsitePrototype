# AI Interview Workflow Testing - Quick Start Guide

## Overview
This guide provides everything needed to cold start the AI Interview Workflow testing environment and continue implementation of the todo list items.

### What We're Testing
The AI Interview Workflow is a system where an AI assistant helps users build knowledge graphs through natural conversation. Users mention entities (people, organizations, events) and the AI should automatically:
- Check if they exist in sandbox/production
- Create or copy them as needed
- Build relationships between entities
- All without interrupting the conversation flow

### What We Found
Through 5 phases of testing, we discovered the AI is missing critical WebSocket commands, doesn't have entity schemas, and lacks proper system knowledge. The comprehensive system prompt we created addresses these gaps.

## Key Files to Reference
- **Todo List**: Check current implementation status with `TodoRead` tool
- **System Prompt**: `/home/tim/WebsitePrototype/playwright-testing/ai-system-prompt-complete.md`
- **Complete Findings**: `/home/tim/WebsitePrototype/playwright-testing/ai-workflow-complete-findings.md`
- **Test Suite**: `/home/tim/WebsitePrototype/playwright-testing/tests/ai-workflow-*.spec.js`

## Step 1: Start Required Servers

### 1.1 WebsitePrototype Server (Port 8357)
```bash
cd /home/tim/WebsitePrototype
PORT=8357 npm start
```
- This serves the main website and test pages
- Keep this terminal open

### 1.2 Interview Service (Port 3003)
```bash
# Check if already running
curl http://localhost:3003

# NOTE: This service appears to be already running in the environment
# If you need to restart it, you'll need to find the service directory
# The service handles interview sessions and WebSocket connections
```

### 1.3 Orchestrator WebSocket Server
```bash
# IMPORTANT: We don't have the exact startup command for this
# The WebSocket server bridges AI and UI communication
# It should be running as part of the interview service on port 3003
# Check WebSocket connection in browser DevTools (see Step 3)
```

### 1.4 AI Server/Bridge
```bash
# CRITICAL: Location and startup command unknown
# This is where the system prompt needs to be updated (Todo item #1)
# You'll need to investigate where this service runs
# Look for AI/orchestrator configuration files or ask the team
```

## Step 2: Access Test Page

### Primary Test URL:
```
http://localhost:3003/?interviewId=test_interview_1751502691
```

### Alternative Test Pages:
- Interview Validation Page: `http://localhost:8357/pages/interview-validation.html`
- Neo4j Diagram Page: `http://localhost:8357/pages/neo4j-diagram.html`

### Test Credentials:
- Email: `weezer@yev.com`
- Password: `123456`
- Twin ID: `zsvLTeIPJUYGnZHzWX7hVtLJlJX2-1`

## Step 3: Verify WebSocket Connection

1. Open browser developer console (F12)
2. Go to Network tab → WS (WebSocket)
3. Look for active WebSocket connection
4. You should see messages like:
   - `InterviewStarted`
   - `GetSandboxStatus`
   - `SandboxStatus`

## Step 4: Test Current Functionality

### Manual Test:
1. Open the interview page
2. Try adding an entity: "Add John Smith to my graph"
3. Check if WebSocket messages are sent
4. Verify the AI response (or lack thereof)

### Automated Test:
```bash
cd /home/tim/WebsitePrototype/playwright-testing
npm test tests/ai-workflow-validation.spec.js
```

## Step 5: Continue Implementation

### Check Todo List:
```
Use TodoRead tool to see current implementation tasks
(This is a Claude AI tool - if not using Claude, the todo items are listed below)
```

### Todo List Items (if not using Claude):
1. Apply comprehensive system prompt to AI backend
2. Implement RequestClarification WebSocket command
3. Implement ConfirmWithUser WebSocket command
4. Implement GetEntityTypes WebSocket command
5. Implement GetFormSchema WebSocket command
6. Implement SendUserMessage WebSocket command
7. Document SandboxStatus response format
8. Document ProductionSearchResults format
9. Create Person entity schema
10. Create Organization entity schema
11. Create Event/Place/Thing entity schemas
12. Run validation tests on updated system
13. Create real interview test scenarios
14. Deploy to staging environment
15. Production deployment

### Current Focus Areas:
1. **Apply System Prompt** (Todo #1)
   - Find where AI system prompt is configured
   - Update with content from `ai-system-prompt-complete.md`

2. **Implement Missing Commands** (Todos #2-6)
   - RequestClarification
   - ConfirmWithUser  
   - GetEntityTypes
   - GetFormSchema
   - SendUserMessage

3. **Document Response Formats** (Todos #7-8)
   - Update WebSocket Message Standard

## Step 6: Testing Workflow

### For Each Implementation:
1. Make the change
2. Restart relevant service
3. Run specific test: `npm test tests/ai-workflow-[phase].spec.js`
4. Test manually on interview page
5. Update todo list status

### Key Test Scenarios:
- Add new person: "Add Sarah Johnson"
- Add ambiguous entity: "Add Apple" 
- Add existing entity: "Add John Smith" (if already in sandbox)
- Create relationship: "John works at Microsoft"

## Troubleshooting

### If WebSocket not connecting:
- Check all services are running
- Verify ports are correct
- Check browser console for errors

### If AI not responding:
- Verify AI service is running
- Check if system prompt is loaded
- Look for errors in AI service logs

### If tests fail:
- Ensure server on port 8357
- Check test credentials still valid
- Verify mock data setup

## Important Notes

1. **System Architecture**:
   - Sandbox = Working environment (write-enabled)
   - Production = Read-only data source
   - UI updates automatically via WebSocket

2. **Current Limitations**:
   - AI cannot ask for clarification (RequestClarification missing)
   - AI cannot confirm matches (ConfirmWithUser missing)
   - AI doesn't know entity schemas (GetFormSchema missing)

3. **Testing Best Practices**:
   - Always check WebSocket messages in browser console
   - Test one change at a time
   - Update todo list after each completed task

## Quick Commands Reference

```bash
# Start main server
cd /home/tim/WebsitePrototype && PORT=8357 npm start

# Run all workflow tests
cd /home/tim/WebsitePrototype/playwright-testing && npm test tests/ai-workflow-*.spec.js

# Check specific test phase
npm test tests/ai-workflow-phase1-commands.spec.js

# View test report
npx playwright show-report

# Git status check
git status

# View todo list (in Claude)
Use TodoRead tool
```

## Next Session Checklist

1. [ ] Start WebsitePrototype server (port 8357)
2. [ ] Verify Interview service running (port 3003)
3. [ ] Open test page: http://localhost:3003/?interviewId=test_interview_1751502691
4. [ ] Check WebSocket connection in browser
5. [ ] Read todo list for current task
6. [ ] Continue implementation from where you left off

---

**Remember**: The goal is to make the AI follow the Interview Workflow correctly by:
- Updating the system prompt
- Adding missing WebSocket commands
- Documenting response formats
- Creating entity schemas