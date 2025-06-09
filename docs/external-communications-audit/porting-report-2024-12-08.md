# External Communications Porting Report

**Document Version**: 1.0  
**Created**: December 8, 2024  
**Project**: WebsitePrototype - React to Vanilla JS Migration

## 1. Audit Summary

**Total Files with External Communications**: 55
- **WebSocket files**: 25 (real-time communication)
- **Audio-related files**: 15 (recording, streaming, TTS/STT)  
- **Firebase files**: 22 (auth, database, storage)
- **API/HTTP files**: 8 (REST endpoints, webhooks)
- **Other services**: 5 (telemetry, logging)

## 2. Page Requirements Matrix

Based on analysis of prototype pages and corresponding React components:

| Page               | WebSocket | Audio | Storage | Database | Auth | APIs | Status    |
|--------------------|-----------|-------|---------|----------|------|------|-----------|
| interview.html     |     ✓     |   ✓   |    ✓    |    ✓     |  ✓   |  ✓   | **HIGH PRIORITY** |
| explore.html       |     ?     |   ?   |         |    ✓     |  ✓   |      | Needs Analysis |
| talk-to-twin.html  |     ✓     |   ✓   |         |    ✓     |  ✓   |  ✓   | **HIGH PRIORITY** |
| file-browser.html  |           |       |    ✓    |    ✓     |  ✓   |  ✓   | Medium Priority |
| dashboard.html     |           |       |         |    ✓     |  ✓   |      | Low Priority |
| settings.html      |           |       |         |    ✓     |  ✓   |      | Low Priority |
| auth.html          |           |       |         |          |  ✓   |      | Medium Priority |
| twin-management.html|          |       |         |    ✓     |  ✓   |      | Medium Priority |

**Legend:**
- ✓ = Required functionality
- ? = Needs investigation
- (blank) = Not required

## 3. Core Services Identified

### 3.1 **WebSocket Services** (CRITICAL)

#### **Orchestrator WebSocket** - `app/src/hooks/useOrchestratorWebSocket.js`
- **Purpose**: Interview lifecycle management, AI communication
- **Endpoints**: 
  - Production: `wss://intervieworchestrationservice-833139648849.us-central1.run.app/ws`
  - Development: `ws://localhost:8000/ws`
- **Key Messages**: `StartInterview`, `AI_RESPONSE`, `TranscriptResult`, `STATE_UPDATE`
- **Used by**: interview.html, talk-to-twin.html

#### **Audio WebSocket** - `app/src/components/audio/AudioWebSocketManager.js`
- **Purpose**: Real-time audio streaming, STT/TTS processing
- **Endpoints**:
  - Production: `wss://audioprocessingservice-833139648849.us-central1.run.app/audio/ws`
  - Development: `ws://localhost:8001/audio/ws`
- **Key Messages**: Audio chunks, `TranscriptResult`, `ReturnAudioChunks`
- **Used by**: interview.html, talk-to-twin.html

#### **Safe WebSocket Manager** - `app/src/utils/safeWebSocketManager.js`
- **Purpose**: Resilient connection wrapper with auto-reconnect
- **Features**: Exponential backoff, message queuing, heartbeat
- **Used by**: Foundation for other WebSocket services

### 3.2 **Firebase Services** (ESSENTIAL)

#### **Authentication** - `app/src/firebaseConfig.js`, `app/src/contexts/AuthContext.js`
- **Purpose**: User login, session management
- **Used by**: All authenticated pages
- **Key Features**: Email auth, session persistence

#### **Firestore Database** - Multiple files (22 total)
- **Purpose**: User data, interview records, file metadata
- **Used by**: Most pages for data persistence
- **Key Operations**: CRUD operations, real-time listeners

#### **Firebase Storage** - `app/src/services/StatsService.js`
- **Purpose**: File upload/download, media storage
- **Used by**: file-browser.html, interview.html

### 3.3 **Audio Processing** (COMPLEX)

#### **Audio Recording** - `app/src/components/audio/AudioRecorder.js`
- **Purpose**: Microphone access, audio capture
- **Features**: Real-time recording, audio context management
- **Used by**: interview.html, talk-to-twin.html

#### **TTS Audio Player** - `app/src/components/audio/TTSAudioPlayer.js`
- **Purpose**: AI voice response playback
- **Features**: Audio context, streaming playback
- **Used by**: interview.html, talk-to-twin.html

## 4. Service-to-Page Mapping

### 4.1 **interview.html** (Most Complex)
**React Source**: `app/src/components/user/InterviewComponent.js`
**Required Services**:
- ✅ Orchestrator WebSocket (interview management)
- ✅ Audio WebSocket (voice recording/playback)
- ✅ Firebase Auth (user verification)
- ✅ Firestore (session persistence) 
- ✅ Audio Recording (microphone access)
- ✅ TTS Player (AI voice responses)

**Current State**: Has UI elements (mic button, recording states) but no backend connectivity

### 4.2 **talk-to-twin.html** (Chat Interface)
**React Source**: `app/src/components/user/TwinChatComponent.js`
**Required Services**:
- ✅ Orchestrator WebSocket (chat communication)
- ✅ Audio WebSocket (voice chat option)
- ✅ Firebase Auth (user verification)
- ✅ Firestore (chat history)

**Current State**: Has chat UI and voice recording UI elements, no backend

### 4.3 **file-browser.html** (File Management)
**React Source**: `app/src/components/admin/FileManager/`
**Required Services**:
- ✅ Firebase Storage (file upload/download)
- ✅ Firestore (file metadata)
- ✅ Firebase Auth (user verification)

**Current State**: Has file listing UI, drag-drop elements, no actual file operations

### 4.4 **explore.html** (Memory Navigation)
**React Source**: `app/src/pages/Home.js` (needs verification)
**Required Services**:
- ❓ WebSocket (unclear if real-time updates needed)
- ✅ Firestore (memory/knowledge graph data)
- ✅ Firebase Auth (user verification)

**Current State**: Knowledge graph visualization placeholder, no data connectivity

## 5. Porting Plan Prioritization

### **Phase 1: Authentication Foundation** (1-2 days)
1. Port Firebase Auth to vanilla JS
2. Create auth check utilities
3. Test with auth.html page
4. **Verify**: Login/logout functionality works

### **Phase 2: WebSocket Core** (2-3 days)
1. Port SafeWebSocketManager (connection resilience)
2. Port Orchestrator WebSocket (basic messaging)
3. Create test page for WebSocket connectivity
4. **Verify**: Can connect and send/receive messages

### **Phase 3: Interview Functionality** (3-4 days)
1. Port Audio WebSocket Manager
2. Port Audio Recording service
3. Port TTS Audio Player
4. Integrate with interview.html
5. **Verify**: Full interview workflow functional

### **Phase 4: Chat Interface** (2-3 days)
1. Adapt WebSocket services for chat
2. Integrate with talk-to-twin.html
3. Add chat persistence via Firestore
4. **Verify**: Chat with voice functionality works

### **Phase 5: File Management** (2-3 days)
1. Port Firebase Storage operations
2. Port Firestore file metadata handling
3. Integrate with file-browser.html
4. **Verify**: File upload/download/listing works

### **Phase 6: Data Integration** (1-2 days)
1. Port remaining Firestore operations
2. Integrate with dashboard.html and other pages
3. **Verify**: All pages show real data

## 6. Services NOT to Port (Postponed)

### **Neo4j Connectivity** ❌
- **Reason**: WebSocket control not yet built in backend
- **Affected**: Knowledge graph visualization in explore.html
- **Action**: Keep placeholder UI, implement when backend ready

### **Complex Telemetry** ❌
- **Reason**: Development/debugging focused
- **Files**: `app/src/utils/telemetryHelper.js`, `app/src/utils/tracing.js`
- **Action**: Implement basic logging only

### **Advanced Audio Features** ❌
- **Reason**: Complex dependencies, MVP not needed
- **Files**: Advanced audio processing, complex audio analysis
- **Action**: Basic recording/playback only

## 7. Technical Architecture Recommendations

### **Directory Structure for Ported Services**
```
WebsitePrototype/
├── js/
│   ├── services/
│   │   ├── websocket.js          (SafeWebSocketManager port)
│   │   ├── orchestrator.js       (Orchestrator WebSocket)
│   │   ├── audio-websocket.js    (Audio WebSocket)
│   │   ├── audio-recorder.js     (Audio Recording)
│   │   ├── tts-player.js         (TTS Audio Player)
│   │   ├── firebase-auth.js      (Authentication)
│   │   ├── firestore.js          (Database operations)
│   │   └── firebase-storage.js   (File operations)
│   ├── config/
│   │   ├── endpoints.js          (API/WebSocket URLs)
│   │   ├── firebase-config.js    (Firebase configuration)
│   │   └── audio-config.js       (Audio settings)
│   └── utils/
│       ├── message-builder.js    (WebSocket message formatting)
│       └── auth-check.js         (Authentication utilities)
```

### **Service Integration Pattern**
```javascript
// Each page imports only needed services
import { OrchestratorWebSocket } from '../js/services/orchestrator.js';
import { AudioRecorder } from '../js/services/audio-recorder.js';
import { FirebaseAuth } from '../js/services/firebase-auth.js';

// Initialize and use
const orchestrator = new OrchestratorWebSocket();
const auth = new FirebaseAuth();
```

## 8. Next Steps - Immediate Actions

### **Step 1: Start with Authentication** ✅
1. Navigate to `~/current projects/ui-studio/app/src/firebaseConfig.js`
2. Analyze Firebase configuration and authentication setup
3. Create `~/WebsitePrototype/js/services/firebase-auth.js`
4. Test with auth.html page

### **Step 2: Create WebSocket Foundation** ⏳
1. Port `safeWebSocketManager.js` to vanilla JS
2. Create test page for WebSocket connectivity
3. Verify connection to development endpoints

### **Step 3: Interview Page Integration** ⏳
1. Focus on interview.html as primary use case
2. Integrate WebSocket + Audio services
3. End-to-end test of interview workflow

## 9. Success Criteria

### **Definition of "Working Service"**
- ✅ Connects to same endpoints as React app
- ✅ Sends/receives same message formats
- ✅ Handles errors gracefully
- ✅ Has test page demonstrating functionality
- ✅ Integrated into target prototype page(s)

### **Completion Milestones**
1. **Auth Working**: User can login to prototype pages
2. **WebSocket Working**: Can connect and communicate with backend
3. **Interview Working**: Full interview workflow functional
4. **Chat Working**: Talk-to-twin page functional
5. **Files Working**: File upload/download operational

## 10. Risk Assessment

### **High Risk Items** ⚠️
- **Audio WebSocket complexity**: Real-time audio streaming is complex
- **Dual WebSocket coordination**: Orchestrator + Audio working together
- **Firebase configuration**: Environment variables, API keys
- **Message format compatibility**: Ensuring vanilla JS sends identical messages

### **Medium Risk Items** ⚠️
- **Audio permissions**: Browser microphone access
- **WebSocket reconnection**: Handling connection drops gracefully
- **Error handling**: Matching React error handling behavior

### **Low Risk Items** ✅
- **Basic authentication**: Firebase auth is well-documented
- **File storage**: Firebase storage has good vanilla JS support
- **UI integration**: Existing prototype pages have good structure

## 11. Resource Requirements

### **Development Time Estimate**
- **Total**: 12-17 days
- **Phase 1 (Auth)**: 1-2 days
- **Phase 2 (WebSocket)**: 2-3 days  
- **Phase 3 (Interview)**: 3-4 days
- **Phase 4 (Chat)**: 2-3 days
- **Phase 5 (Files)**: 2-3 days
- **Phase 6 (Integration)**: 1-2 days

### **External Dependencies**
- Firebase project configuration
- Backend service endpoints (already deployed)
- Audio processing service access
- WebSocket endpoint availability

---

**Next Action**: Begin Phase 1 - Port Firebase Authentication service to vanilla JavaScript
**Recommended Start**: `~/current projects/ui-studio/app/src/firebaseConfig.js`