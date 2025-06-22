# Infitwin Website Prototype

A comprehensive web application for Infitwin - a platform that helps people create interactive biographies and living archives of their life stories with AI-powered face detection and metadata processing.

## 🚀 Quick Start for AI Handoff

**👋 New AI? Start here:** Read the [QUICKSTART.md](./QUICKSTART.md) guide for immediate context on where we left off and what to do next.

## 🎯 Current Status

**✅ MAJOR MILESTONE ACHIEVED**: Artifact processor with AWS Rekognition face detection is fully working and saving metadata to Firebase!

### What's Working:
- **Image Processing Pipeline**: Complete artifact processor with AWS Rekognition integration
- **Face Detection**: 99.99% confidence face detection with bounding boxes, emotions, age, landmarks
- **Firebase Integration**: Face metadata properly saved to `users/{userId}/files/{fileId}/extractedFaces`
- **Virtual Environment**: Properly configured ML environment with all dependencies
- **Test Infrastructure**: Comprehensive testing scripts and debug logging

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

### Priority 1: Frontend Integration
- Connect My Files page to Firebase face metadata
- Implement face thumbnail generation from bounding boxes
- Add face tagging and recognition features

### Priority 2: User Experience
- Complete authentication flow
- Add user onboarding
- Implement twin management interface

### Priority 3: Advanced Features
- Real-time processing status
- Batch file uploads
- Advanced search and filtering

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