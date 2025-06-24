# 🚀 QUICKSTART Guide - AI Handoff

**Current Date**: June 24, 2025  
**Status**: ✅ Sandbox Integration COMPLETE with Neo4j, Node List, Face Detection, and v15.5.0 Nexus Controls
**Test Login**: weezer@yev.com / 123456

## 🖥️ SERVER STARTUP - ESSENTIAL FIRST STEP

### Start Development Server
```bash
# Navigate to project directory
cd /home/tim/WebsitePrototype

# Start HTTP server - try port 8357 first
python3 -m http.server 8357

# If port 8357 is busy (Address already in use), use 8358:
python3 -m http.server 8358

# Server will start and show:
# "Serving HTTP on 0.0.0.0 port 8357 ..."
```

### Access Key Pages
```bash
# Main sandbox environment (graph editor)
http://localhost:8357/pages/sandbox.html

# File management with face detection
http://localhost:8357/pages/my-files.html

# Authentication page
http://localhost:8357/pages/auth.html

# Admin test data generator (development only)
http://localhost:8357/pages/admin-test-data.html
```

### Server Management
```bash
# Check if server is running
curl http://localhost:8357

# Stop server
Ctrl+C

# Check what's using a port
lsof -i :8357

# Kill process on port if needed
pkill -f "python3.*8357"
```

## 🎯 TODAY'S SESSION SUMMARY (Dec 22, 2024)

### ✅ COMPLETED TODAY:
1. **Face Detection UI**: Faces now display properly in My Files page
2. **Face Modal**: Fixed z-index issue - face details appear above image viewer
3. **UI Improvements**: Moved Face Details button to header, removed redundant text
4. **Cleanup**: Removed unused processing indicator feature
5. **Debugging**: Added extensive logging for batch vectorization issue
6. **Face Deletion**: Added ability to delete unwanted faces from vectorized images
7. **File Rename**: Added double-click to rename files with custom display names
8. **Sandbox Integration**: Added Sandbox page from infitwin-sandbox project
9. **Sandbox Artifacts**: Connected Artifacts panel to Firebase - shows user's actual files as draggable thumbnails

### ⚠️ KNOWN ISSUES:

#### 1. BATCH VECTORIZATION BUG
- **GitHub Issue #133**: Second file in batch returns 0 faces from API
- **Symptoms**: test-image3.jpg works alone but fails as 2nd file in batch
- **Workaround**: Vectorize files individually
- **Status**: API issue, not frontend - needs ArtifactProcessor fix

#### 2. ARTIFACT PROCESSOR CONNECTION
- **Issue**: Vectorization requires local ArtifactProcessor running on port 8080
- **Error**: "Failed to fetch" when ArtifactProcessor not running
- **Fix**: Start artifact processor with `/home/tim/WebsitePrototype/start-artifact-with-proper-imports.sh`

## 🔧 WHAT WAS FIXED

### Root Cause Identified:
- Firebase `update()` method was failing because documents didn't exist
- Changed to `set(data, merge=True)` to create documents when needed
- Fixed Firebase client initialization to use proper `get_db()` function

### Files Modified:
- `/home/tim/current-projects/ArtifactProcessor/artifact_processor/content_router.py` (lines 482, 511)

### Key Changes:
```python
# BEFORE (broken):
file_ref.update(update_data)  # ❌ 404 error

# AFTER (working):
file_ref.set(update_data, merge=True)  # ✅ Creates document
```

## 🆕 FILE RENAME FEATURE

### What's New:
- **Custom Display Names**: Double-click any file name in image modal to rename
- **Non-destructive**: Original filename preserved, only display name changes
- **Persistent**: Names saved to Firebase and sync across all views
- **Intuitive UI**: Text cursor on hover, inline editing with auto-select

### How to Use:
1. Click on any image to open the modal
2. Double-click on the file name in the modal header
3. Type your new custom name
4. Press Enter or click outside to save
5. Press Escape to cancel

### Technical Details:
- New field `displayName` added to Firebase documents
- Original `fileName` preserved for reference
- Display name used throughout UI (file cards, modals, search)
- Character limit: 100 characters
- Empty names not allowed

## 🆕 FACE DELETION FEATURE

### What's New:
- **Delete Unwanted Faces**: Remove incorrectly detected or unwanted faces from vectorized images
- **UI Enhancement**: Red delete button (X) appears on hover over each face thumbnail
- **Confirmation Dialog**: Prevents accidental deletion with confirmation prompt
- **Firebase Integration**: Deletions are permanently saved to Firebase
- **Real-time Updates**: UI updates immediately after deletion

### How to Use:
1. Click on face count indicator on any vectorized image
2. In the face modal, hover over any face thumbnail
3. Click the red X button that appears
4. Confirm deletion in the dialog
5. Face is permanently removed from Firebase

### Technical Details:
- Faces stored at: `users/{userId}/files/{fileId}/extractedFaces`
- Deleted faces are removed from the array (not soft-deleted)
- `faceCount` and `faceLastModified` fields are updated
- Other systems reading Firebase will NOT see deleted faces

## 🧪 VERIFICATION PROOF

### Test Results:
```bash
# Test command:
python3 test-debug-flow.py

# Results:
✅ HTTP 200 response
✅ 2 faces detected with 99.99% confidence
✅ Firebase document created at users/debug_user_123/files/{fileId}
✅ Complete face metadata saved with bounding boxes
```

### Firebase Document Structure:
```json
{
  "extractedFaces": [
    {
      "faceId": "face_0",
      "confidence": 99.99984741210938,
      "boundingBox": {
        "Width": 0.3982006907463074,
        "Height": 0.4403437077999115,
        "Left": 0.5932247638702393,
        "Top": 0.28265267610549927
      },
      "emotions": [...],
      "ageRange": {"Low": 20, "High": 26},
      "landmarks": [...],
      // ... complete face metadata
    }
  ],
  "faceCount": 2,
  "faceProcessingCompletedAt": "2024-12-22T...",
  "processedByUserId": "debug_user_123",
  "artifactProcessorVersion": "v2.0-aws-rekognition"
}
```

## 🧪 SANDBOX FEATURE INTEGRATION

### What Was Added:
- **Complete Sandbox Page**: Ported from infitwin-sandbox project
- **6 Floating Panels**: All draggable and resizable
- **Firebase Integration**: Artifacts panel connects to user's actual files
- **Drag-and-Drop**: Files can be dragged from Artifacts panel to graph

### How It Works:
1. Navigate to Sandbox via purple sidebar (🧪 icon)
2. Click "Artifacts" button in toolbar to open panel
3. Panel automatically loads user's files from Firebase
4. Files appear as draggable thumbnails (images show preview, documents show icons)
5. Drag files from Artifacts panel to graph for linking

### Technical Details:
- Uses Firebase v8 SDK (compat mode) for consistency with existing sandbox code
- Authenticates with test credentials: weezer@yev.com / 123456
- Queries Firestore path: `users/{userId}/files`
- Handles missing indexes gracefully with retry logic

### Twin ID System:
- **Format**: `{userId}-1` (e.g., if user ID is `abc123`, twin ID is `abc123-1`)
- **Source**: Analyzed from ui-studio project's `twinService.js`
- **Usage**: Used in admin test data generation for Neo4j graph scoping

## 🚀 IMMEDIATE NEXT STEPS

### Priority 1: Frontend Integration (READY TO START)

**GOAL**: Connect the My Files page to display extracted faces from Firebase

**Files to work on**:
- `pages/file-browser.html` (My Files page)
- JavaScript to read from Firebase path: `users/{userId}/files/{fileId}/extractedFaces`
- CSS for face thumbnail display

**Implementation Plan**:
1. Add Firebase SDK to My Files page
2. Query user files: `db.collection('users').doc(userId).collection('files')`
3. For each file with `extractedFaces`, generate thumbnails using bounding boxes
4. Display faces in grid layout with metadata (confidence, emotions)

### Priority 2: Face Thumbnail Generation

**Technical Approach**:
```javascript
// Use Canvas API to crop faces from original image
function extractFaceFromImage(imageUrl, boundingBox) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  // Crop using bounding box coordinates
  // Return face thumbnail as blob/data URL
}
```

### Priority 3: User Authentication Integration

**Current Test User**: `weezer@yev.com` / `123456`  
**TODO**: Replace debug user with actual authenticated user ID

## 🔧 DEVELOPMENT SETUP

### 1. Start Artifact Processor:
```bash
cd /home/tim/WebsitePrototype
./start-artifact-with-proper-imports.sh
# Server starts on http://localhost:8080
```

### 2. Start Web Server:
```bash
# Separate terminal
python3 -m http.server 8357
# Web interface: http://localhost:8357
```

### 3. Test the System:
```bash
# Verify everything works
python3 test-debug-flow.py
python3 check-debug-user.py
```

## 📁 KEY FILES & LOCATIONS

### Artifact Processor:
- **Main Code**: `/home/tim/current-projects/ArtifactProcessor/artifact_processor/content_router.py`
- **Virtual Env**: `/home/tim/current-projects/ArtifactProcessor/local_dev/venv-aws-py311/`
- **Start Script**: `/home/tim/WebsitePrototype/start-artifact-with-proper-imports.sh`

### Frontend:
- **My Files Page**: `/home/tim/WebsitePrototype/pages/file-browser.html`
- **Test Scripts**: `/home/tim/WebsitePrototype/test-debug-flow.py`
- **Logs**: `/home/tim/WebsitePrototype/artifact-processor-fixed.log`

### Credentials:
- **Firebase**: `/home/tim/credentials/infitwin-e18a0d2082de.json`
- **AWS**: `/home/tim/credentials/.env`

## 🧪 TESTING COMMANDS

### Quick Health Check:
```bash
# 1. Verify artifact processor is running
curl http://localhost:8080/health

# 2. Test face detection
python3 test-debug-flow.py

# 3. Verify Firebase save
python3 check-debug-user.py

# 4. Check debug logs
grep -E "🔥|✅|❌" artifact-processor-fixed.log | tail -10
```

### Expected Results:
- ✅ 2 faces detected with 99.99% confidence
- ✅ Firebase document exists with `extractedFaces` array
- ✅ No 404 errors in logs
- ✅ Complete metadata including bounding boxes, emotions, landmarks

## 🎨 DESIGN SPECIFICATIONS

### My Files Page Integration:
- **Face Thumbnails**: 150x150px with rounded corners
- **Confidence Badge**: Show percentage in top-right corner
- **Emotion Indicator**: Color-coded based on primary emotion
- **Grid Layout**: 4 faces per row on desktop, 2 on mobile

### Color Scheme:
- **Primary**: `#6B46C1` (purple)
- **Success**: `#10B981` (green for high confidence)
- **Warning**: `#FFD700` (yellow for medium confidence)
- **Background**: `#F3F4F6` (light gray)

## 🔍 DEBUGGING GUIDE

### If Artifact Processor Fails:
```bash
# Check virtual environment
source /home/tim/current-projects/ArtifactProcessor/local_dev/venv-aws-py311/bin/activate
which python  # Should show venv path

# Check credentials
echo $GOOGLE_APPLICATION_CREDENTIALS  # Should show Firebase path
env | grep AWS  # Should show AWS keys
```

### If Firebase Saves Fail:
```bash
# Check debug logs
grep "FIREBASE_DEBUG" artifact-processor-fixed.log | tail -5

# Test Firebase connection
python3 -c "
from firebase_admin import firestore, initialize_app
initialize_app()
db = firestore.client()
print('Firebase connected successfully')
"
```

### Common Issues & Solutions:
1. **404 Document Error**: Already fixed with `set(merge=True)`
2. **Import Errors**: Ensure using venv-aws-py311
3. **AWS Permission Error**: Check `.env` credentials
4. **Firebase Permission Error**: Check service account JSON

## 📊 CURRENT METRICS

### Performance:
- **Face Detection Time**: ~9 seconds per image
- **Accuracy**: 99.99% confidence on test images
- **Storage**: Firebase documents ~5KB per processed image
- **Throughput**: 1 image every 10 seconds

### Test Coverage:
- ✅ End-to-end image processing
- ✅ Firebase document creation
- ✅ Face metadata extraction
- ✅ Error handling and logging
- ❌ Frontend integration (NEXT STEP)

## 🎯 SUCCESS CRITERIA FOR NEXT PHASE

### Must Complete:
1. **Face Display**: Show extracted faces in My Files page
2. **User Integration**: Replace debug user with authenticated user
3. **Image Upload**: Allow users to upload images for processing
4. **Real-time Status**: Show processing progress to users

### Nice to Have:
1. **Face Tagging**: Let users name/tag detected faces
2. **Search**: Find images by detected faces
3. **Analytics**: Show face detection statistics
4. **Batch Processing**: Upload multiple images at once

## 🚨 CRITICAL NOTES

### DO NOT BREAK:
- The `content_router.py` Firebase fix (lines 482, 511)
- The virtual environment setup (venv-aws-py311)
- The test image path: `/home/tim/wsl-test-images/test-image1.jpg`

### PRESERVE:
- All debug logging with 🔥 and ✅ markers
- Test scripts for regression testing
- Credential paths and environment setup

### REMEMBER:
- Always test with `python3 test-debug-flow.py` before major changes
- Check Firebase documents with `python3 check-debug-user.py`
- Monitor logs for any regression in face detection

---

## 📝 MEMORY COMPRESSION HANDOFF (C1)

**IMPORTANT**: When continuing work or starting a new session, use this compression handoff to maintain context:

```
=== MEMORY COMPRESSION HANDOFF ===

TASK: Maintain and improve face detection features in WebsitePrototype

BUILD PLAN:
[x] Step 1: Frontend face detection integration | VERIFIED: Faces display in My Files
[x] Step 2: Fix UI issues (z-index, button placement) | VERIFIED: All UI fixes applied  
[x] Step 3: Remove unused features | VERIFIED: Processing indicator removed
[x] Step 4: Debug batch vectorization | VERIFIED: Issue identified and logged
[ ] Step 5: Fix batch vectorization bug | GitHub Issue #133

CURRENT CONTEXT:
Working on: /home/tim/WebsitePrototype
Function: My Files page with face detection
Problem: Batch vectorization - 2nd file gets 0 faces
Last attempt: Added debugging, increased delay to 3s

CREDENTIALS:
- Test user: weezer@yev.com / 123456
- Service Account: /home/tim/credentials/infitwin-e18a0d2082de.json
- API endpoint: http://localhost:8080/process-artifact

TOOLS/INTERFACES:
- Dev Server: python3 -m http.server 8357
- My Files: http://localhost:8357/pages/my-files.html
- ArtifactProcessor: http://localhost:8080
- GitHub: github.com:infitwin/WebsitePrototype.git

VERIFICATION COMMANDS:
- Test server: curl http://localhost:8357
- Check API: ps aux | grep 8080
- Git status: git status
- Run tests: cd playwright-testing && npx playwright test

SERVICES/PORTS:
- 8357: WebsitePrototype dev server
- 8080: ArtifactProcessor API
- Required: Firebase Auth, Firestore, Storage

TEST DATA:
- Images: test-image1.jpg through test-image5.jpg
- Face detection: Works individually, fails in batch for 2nd file
- Console logs: Extensive debugging added

UNCOMMITTED/UNPUSHED CODE:
- All changes committed and pushed
- Latest commit: a18aad6
- Clean working directory

WARNINGS:
- Don't modify ArtifactProcessor without permission
- Batch vectorization has known issue (#133)
- Always test with real uploads

ROLLBACK:
- Last stable: a18aad6
- Rollback command: git reset --hard a18aad6

=== END HANDOFF ===
```

**🎉 TODAY'S WINS**: Face detection UI is fully integrated and working (except batch issue)!

**🎯 NEXT FOCUS**: Fix batch vectorization bug or work on other My Files improvements.

**⚡ MOMENTUM**: High - all major features working, just need to polish and fix edge cases!

---

## 📝 ADDENDUM: MEMORY COMPRESSION SYSTEM

### C1 Compact Command Instructions

When you need to compress context or hand off to another AI session, use the **C1 Compact Command** from the CLAUDE.md instructions:

### Code: C1 (Coding Handoff)

When using `/compact C1`, focus on: current build plan status with verification results, exact current step and next command to run, working file:line and function, last attempt and result, all credential locations, service ports with start commands, test/verification commands, tools/dashboard URLs, test data examples, rollback commit/version, warnings about critical operations. 

**CRITICAL**: Include all uncommitted code changes, unpushed commits, and pending deployments (Firebase, Cloud Build, etc.) to prevent losing work between compressions. Preserve the problem-solving position, not just project description.

### Memory Compression Handoff Format

Create an inline summary using this exact format when memory gets full:

```
=== MEMORY COMPRESSION HANDOFF ===

TASK: [One line - what we're building/fixing]

BUILD PLAN:
[x] Step 1: [task] | VERIFIED: [test command] returned [expected result]
[x] Step 2: [task] | VERIFIED: [test command] returned [expected result]
[>] Step 3: [CURRENT: task description]
    Next: [exact command to run]
    Verify: [command to check if it worked]
    Expect: [what success looks like]
    If fail: [what to try next]
[ ] Step 4: [task] | Verify: [how to test]

CURRENT CONTEXT:
Working on: [file:line_number]
Function: [function_name]
Problem: [specific issue if any]
Last attempt: [what was just tried and result]

CREDENTIALS:
- Service Account: /path/to/service-account.json
- API Keys: /path/to/apikeys.txt (KEY_NAME=purpose)
- Env vars needed: VARIABLE=value
- Auth token: [where to get it or how to generate]

TOOLS/INTERFACES:
- Development Server: http://localhost:8357 (python3 -m http.server 8357)
- Sandbox: http://localhost:8357/pages/sandbox.html
- Admin Panel: http://localhost:8357/pages/admin-test-data.html
- GitHub: github.com:infitwin/WebsitePrototype.git

VERIFICATION COMMANDS:
- Test server: curl http://localhost:8357
- Check git: git status && git log --oneline -5
- Run tests: [specific test commands]

SERVICES/PORTS:
- 8357: HTTP server - start: python3 -m http.server 8357
- 8358: Backup HTTP server if 8357 busy
- Required external: [any external services needed]

TEST DATA:
- Test user: weezer@yev.com / 123456
- Neo4j test data: Generate via admin-test-data.html
- Test files: [relevant test files and their purposes]

UNCOMMITTED/UNPUSHED CODE:
- Modified files: [list files with changes]
- New files created: [list new files]
- Git status: [uncommitted changes summary]
- Unpushed commits: [git log origin/main..HEAD summary]

WARNINGS:
- [Any dangerous operations to avoid]
- [Critical systems not to break]
- [DO NOT commands]

ROLLBACK:
- Last working commit: [commit hash]
- Safe version: [version number]
- Rollback command: git reset --hard [commit-hash]

=== END HANDOFF ===
```

**IMPORTANT**: Create this summary inline in the chat when memory is getting full. Do not save it as a file. This ensures the compressed AI can immediately see and use it.

### When to Use Memory Compression

- Conversation getting long (approaching token limits)
- About to start a complex multi-step task
- Need to hand off to another AI session
- Major milestone completed and moving to next phase
- Context is getting cluttered with too much detail

This system ensures seamless continuity between AI sessions and prevents losing critical context about the current state of development.