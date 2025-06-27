# Infitwin Website Prototype

A comprehensive web application for Infitwin - a platform that helps people create interactive biographies and living archives of their life stories with AI-powered face detection and metadata processing.

## 🚨 IMPORTANT: AI ASSISTANTS START HERE 🚨

**👋 New AI Session?** You MUST read the [QUICKSTART.md](./QUICKSTART.md) file first! It contains:
- Server startup instructions and development setup
- Current project status and what's been completed
- Known issues and bugs
- Memory compression handoff (C1) for continuity
- Next steps and priorities

**DO NOT PROCEED WITHOUT READING [QUICKSTART.md](./QUICKSTART.md)**

### Quick Server Start
```bash
# Navigate to project directory
cd /home/tim/WebsitePrototype

# Start server (try port 8357 first, use 8358 if busy)
python3 -m http.server 8357
# OR if port 8357 is busy:
python3 -m http.server 8358

# Access main pages:
# http://localhost:8357/pages/sandbox.html
# http://localhost:8357/pages/my-files.html
# http://localhost:8357/pages/auth.html
```

## 🎯 Current Status (June 2025)

### ✅ What's Working:
- **Authentication**: Full auth flow with email verification
- **My Files Page**: Complete with face detection visualization
- **Face Detection**: AWS Rekognition integration via ArtifactProcessor
- **Face Display**: Extracted faces shown in modal with bounding boxes
- **Face Deletion**: Remove unwanted faces with hover-to-show delete buttons
- **File Rename**: Double-click to edit file names with custom display names
- **Vectorization**: Single and batch file processing
- **UI/UX**: Loading indicators, face count badges, modal improvements
- **Firebase Integration**: Face data properly saved and retrieved
- **Sandbox Page**: Full graph editing environment with 6 floating panels
- **Sandbox Artifacts**: Firebase-connected panel showing user's files as draggable thumbnails
- **Sandbox Faces**: Extracted faces from photos displayed as draggable thumbnails
- **Admin Test Data**: Development-only page for generating Neo4j test graphs
- **Neo4j Integration**: Centralized connection module with transaction support
- **Sandbox to Production**: Complete posting workflow with review process
- **Nexus Graph Control v17.0.0**: Updated to latest bundle with metadata editor support
- **Metadata Editor Integration**: External forms for rich entity editing (Person, Organization, Event, Place, Thing)
- **Refactored Architecture**: Sandbox.html reduced from 3,158 to ~2,200 lines with modular structure
- **Test Credentials**: weezer@yev.com / 123456

### 🆕 Recent Updates (June 2025):
- **Nexus Graph Control v17.0.0**: Upgraded from v16.3.0 to v17.0.0 with metadata save integration support
- **Metadata Editor**: Integrated external metadata forms for rich entity editing
  - Supports 5 entity types: Person (62 fields), Organization (73 fields), Event (39 fields), Place (45 fields), Thing (58 fields)
  - Schema.org compliant forms with validation
  - Modal and panel integration patterns
- **Code Refactoring**: Extracted modules from sandbox.html:
  - File handlers: `/js/sandbox/file-handlers.js` (41 lines saved)
  - Drag handlers: `/js/sandbox/drag-handlers.js` (135 lines saved)  
  - Neo4j services: `/js/services/neo4j-data-service.js` (228 lines saved)
  - Metadata integration: `/js/sandbox/metadata-editor-integration.js`
- **Bundle Management**: Centralized bundle versioning with proper v17.0.0 deployment

### ⚠️ Known Issues:
- **Batch Vectorization Bug**: Second file in batch returns 0 faces (Issue #133)
- See [QUICKSTART.md](./QUICKSTART.md) for complete bug list

### Architecture Overview:
```
Image → Artifact Processor → AWS Rekognition → Firebase
                ↓
      CLIP Embeddings → Pinecone (mocked)
                ↓  
      Graph Data → Neo4j (mocked)
```

## 🔑 Twin ID Format

Twin IDs in the Infitwin system follow a specific pattern:
- **Format**: `{userId}-1`
- **Example**: If Firebase user ID is `abc123def456`, the twin ID is `abc123def456-1`
- **Location**: Generated in frontend code when creating user's default twin
- **Storage**: Used as document ID in Firestore `twins` collection

## 🏗️ Project Structure

```
WebsitePrototype/
├── README.md                          # This file
├── QUICKSTART.md                      # AI handoff guide
├── index.html                         # Main landing page
├── css/
│   └── styles.css                     # Van Gogh-inspired styling
├── js/
│   └── main.js                        # Frontend functionality
├── pages/                             # Application pages
│   ├── auth.html                      # Login/registration
│   ├── dashboard.html                 # Main dashboard
│   ├── file-browser.html              # File management (My Files)
│   ├── sandbox.html                   # Graph editing environment
│   └── ... (other pages)
├── test-scripts/                      # Testing infrastructure
│   ├── test-debug-flow.py             # Main test script
│   ├── check-debug-user.py            # Firebase verification
│   └── start-artifact-with-proper-imports.sh
└── artifact-processor-fixed.log       # Debug logs
```

## 🧠 Artifact Processor Integration

### Key Components:
- **Location**: `/home/tim/current-projects/ArtifactProcessor/`
- **Virtual Environment**: `venv-aws-py311` (with ML dependencies)
- **Main Module**: `content_router.py` (handles image/text routing)
- **Face Detection**: AWS Rekognition with full metadata extraction
- **Storage**: Firebase Firestore for metadata, Pinecone for vectors, Neo4j for graph data

### Test Credentials:
- **Firebase**: Service account at `/home/tim/credentials/infitwin-e18a0d2082de.json`
- **AWS**: Credentials in `/home/tim/credentials/.env`
- **Test User**: `weezer@yev.com` / `123456`

## 🎨 Design Philosophy

- **Van Gogh-inspired**: Golden wheat fields with daylight colors
- **Warm & Inviting**: Like a cozy log cabin looking out at an inspiring vista
- **Living & Breathing**: Subtle animations that make the site feel alive
- **Clean Typography**: Modern, readable fonts that are approachable

## 🔧 Development Setup

### Prerequisites:
1. Python 3.11+ with virtual environment
2. Firebase service account credentials
3. AWS credentials with Rekognition access
4. Node.js for frontend development (optional)

### Quick Setup:
```bash
# 1. Start the artifact processor
cd /home/tim/WebsitePrototype
./start-artifact-with-proper-imports.sh

# 2. Start web server (separate terminal)
python3 -m http.server 8357

# 3. Test the integration
python3 test-debug-flow.py

# 4. Verify Firebase save
python3 check-debug-user.py
```

## 🧪 Testing

### Artifact Processor Tests:
- **test-debug-flow.py**: End-to-end image processing test
- **check-debug-user.py**: Firebase document verification
- **Test Image**: `/home/tim/wsl-test-images/test-image1.jpg` (2 faces)

### Expected Results:
- HTTP 200 response with face embeddings
- Firebase document created at `users/debug_user_123/files/{fileId}`
- 2 faces detected with 99.99% confidence
- Complete metadata: bounding boxes, emotions, age, landmarks

## 🐛 Debugging

### Recent Fixes Applied:
1. **Firebase Document Creation**: Changed from `update()` to `set(merge=True)`
2. **Firebase Client**: Use proper `get_db()` function instead of direct imports
3. **Virtual Environment**: Ensure venv-aws-py311 for ML dependencies
4. **Error Handling**: Comprehensive debug logging with 🔥 and ✅ markers

### Debug Logs:
Check `artifact-processor-fixed.log` for detailed flow tracing:
```bash
grep -E "🔥|✅|❌|FIREBASE_DEBUG" artifact-processor-fixed.log
```

## 🚀 Next Steps

### Priority 1: Frontend Integration ✅
- ✅ Connect My Files page to Firebase face metadata
- ✅ Implement face thumbnail generation from bounding boxes
- ✅ Add face deletion capability
- 🔄 Add face tagging and recognition features

### Priority 2: User Experience
- Complete authentication flow
- Add user onboarding
- Implement twin management interface

### Priority 3: Advanced Features
- Real-time processing status
- Batch file uploads
- Advanced search and filtering

## 🧪 Sandbox Feature

The Sandbox page provides a safe environment for editing family graph data during interviews:

### Features:
- **Dual Graph Views**: Sandbox (editable) and Production (read-only)
- **6 Floating Panels**:
  - 📋 Node List - Drag nodes to add to graph
  - 👤 Faces - Face recognition and mapping
  - 📎 Artifacts - Shows user's actual files from Firebase as draggable thumbnails
  - 🔵 Production Graph - Read-only production view
  - 🤖 AI Assistant - Interactive help
  - 🛠️ Tools - Utility functions
- **Smart Context Bar**: Tracks changes before committing to production
- **Firebase Integration**: 
  - Authentication with test credentials (weezer@yev.com / 123456)
  - Real-time loading of user's files in Artifacts panel
  - Drag-and-drop files from Artifacts to graph
  - Save/load sessions functionality
- **Nexus Graph Control**: Full graph visualization and editing
- **Post to Production Workflow**:
  - "Review & Post" button (disabled when no changes)
  - Two-stage review process before posting
  - Automatic Neo4j database updates
  - Changes tracked and displayed in context bar

### Access:
- Navigate to Sandbox from the purple sidebar (🧪 icon)
- URL: `/pages/sandbox.html`
- All panels are draggable and resizable
- Press ESC to hide all panels

## 🗄️ Neo4j Integration

### Centralized Connection:
- **Module**: `/js/neo4j-connection.js`
- **Pattern**: Singleton connection manager
- **Features**:
  - Automatic connection management
  - Transaction support with rollback
  - MERGE operations for idempotent saves
  - Detailed logging for debugging

### Database Configuration:
- **URI**: `neo4j+s://80dc1193.databases.neo4j.io`
- **Authentication**: Credentials stored in connection module
- **Node Format**: All nodes include `userId` and `twinId` properties
- **Twin ID Format**: `{userId}-1` (e.g., `abc123def456-1`)

### Post to Production Flow:
1. Make changes in sandbox graph
2. Click "Review & Post" button (turns green when changes exist)
3. Review changes in modal with optional notes
4. Click "Post to Production" to save to Neo4j
5. Sandbox clears after successful post
6. Production panel refreshes automatically

### Data Structure:
```javascript
// Nodes saved with:
{
  id: "unique_node_id",
  userId: "firebase_user_id",
  twinId: "firebase_user_id-1",
  name: "Node Name",
  label: "Display Label",
  type: "person|event|place",
  lastModified: timestamp
}

// Relationships saved with:
{
  id: "unique_edge_id",
  source: "source_node_id",
  target: "target_node_id",
  type: "RELATIONSHIP_TYPE",
  lastModified: timestamp
}

## 🎨 Color Palette

- **Primary Purple**: `#6B46C1` (sidebar, primary actions)
- **Background**: `#F3F4F6` (light gray)
- **Cards**: `#FFFFFF` (white with shadows)
- **Success**: `#10B981` (green)
- **Warning**: `#FFD700` (golden yellow)
- **Error**: `#EF4444` (red)
- **Text**: `#374151` (dark gray)

## 📝 Typography

- **Font**: Inter (Google Fonts)
- **Weights**: 300, 400, 500, 600, 700
- **Hero**: 64px
- **Headings**: 32px-48px
- **Body**: 16px-18px

## 🔒 Security & Credentials

**IMPORTANT**: All sensitive credentials are stored in `/home/tim/credentials/`:
- Firebase service account: `infitwin-e18a0d2082de.json`
- AWS keys: `.env` file
- Never commit credentials to Git

## 📚 Documentation

- **Build Process**: See QUICKSTART.md for complete setup
- **API Integration**: Artifact processor documentation in `/current-projects/ArtifactProcessor/`
- **Firebase Schema**: User documents structure in `users/{userId}/files/{fileId}`

---

**Last Updated**: June 2025 - Nexus Graph Control v17.0.0 deployed with metadata editor integration
**Status**: ✅ Ready for production with enhanced metadata editing capabilities
**Next AI**: Read QUICKSTART.md for immediate context