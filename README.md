# Infitwin Website Prototype

A comprehensive web application for Infitwin - a platform that helps people create interactive biographies and living archives of their life stories with AI-powered face detection and metadata processing.

## 🚨 IMPORTANT: AI ASSISTANTS START HERE 🚨

**👋 New AI Session?** You MUST read the [QUICKSTART.md](./QUICKSTART.md) file first! It contains:
- Current project status and what's been completed
- Known issues and bugs
- Memory compression handoff (C1) for continuity
- Next steps and priorities

**DO NOT PROCEED WITHOUT READING [QUICKSTART.md](./QUICKSTART.md)**

## 🎯 Current Status (December 2024)

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
- **Test Credentials**: weezer@yev.com / 123456

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

### Access:
- Navigate to Sandbox from the purple sidebar (🧪 icon)
- URL: `/pages/sandbox.html`
- All panels are draggable and resizable
- Press ESC to hide all panels

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

**Last Updated**: December 2024 - Face detection and Firebase integration completed
**Status**: ✅ Ready for frontend integration
**Next AI**: Read QUICKSTART.md for immediate context