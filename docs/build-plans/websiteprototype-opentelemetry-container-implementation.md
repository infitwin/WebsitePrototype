# WebsitePrototype OpenTelemetry Container Implementation Build Plan

**Version:** 1.0.0  
**Created:** 2025-06-10T16:30:00.000Z  
**Repository:** https://github.com/infitwin/WebsitePrototype.git  
**Status:** 🚧 IN PROGRESS

## Overview

This build plan implements OpenTelemetry container-based distributed tracing for the WebsitePrototype frontend application, using the same versions and architecture as the working InterviewSessionManager implementation.

## OpenTelemetry Architecture

**Container Approach:** Using official OpenTelemetry Collector container (`otel/opentelemetry-collector-contrib:0.91.0`)  
**Target Endpoint:** `https://otel-collector-service-833139648849.us-central1.run.app`  
**Span Naming:** Following documented conventions from `otel-spans-dual-websocket.md`

## Version Specifications

Based on working InterviewSessionManager implementation:
- **OpenTelemetry API:** `1.33.0`
- **OpenTelemetry SDK:** `1.33.0` 
- **OpenTelemetry Exporter OTLP HTTP:** `0.54.0` (web version)
- **OpenTelemetry Instrumentation:** `0.54.0`
- **Protobuf:** `5.26.0`
- **OpenTelemetry Collector:** `otel/opentelemetry-collector-contrib:0.91.0`

## Implementation Phases

### Phase 1: Container Infrastructure Setup ✅
**Status:** COMPLETED  
**Tasks:**
- [x] Create Dockerfile with Node.js base
- [x] Create package.json with OpenTelemetry web dependencies
- [x] Set up environment variables for OTEL configuration
- [x] Configure health check endpoint

**Files Created:**
- `Dockerfile` - Node.js 18 Alpine with OTEL environment variables
- `package.json` - Updated with OpenTelemetry 1.33.0 dependencies
- `server.js` - Express server with health check and route handling

### Phase 2: Frontend OpenTelemetry Implementation ✅
**Status:** COMPLETED  
**Tasks:**
- [x] Create OpenTelemetry configuration module (simplified version)
- [x] Implement UI interaction spans service
- [x] Create WebSocket instrumentation
- [x] Add fire-and-forget span tracking

**Target Spans (Priority 1) - IMPLEMENTED:**
- `WF-001: UI_interaction:StartButton_Clicked`
- `WF-002: UI_sending_to_Orchestrator:StartInterview`  
- `WF-020: UI_interaction:RecordButton_Pressed`
- `WF-021: UI_sending_to_AudioProcessingService:SendAudioChunk`
- `WF-044: UI_sending_to_AudioProcessingService:RequestTextToSpeech`

**Files Created:**
- `js/otel-config-simple.js` - Simplified OTEL config using fetch API
- `js/services/ui-tracing-service-simple.js` - UI spans service
- `js/services/orchestrator-websocket-instrumented.js` - WebSocket instrumentation

### Phase 3: Cloud Run Deployment Configuration ⏳
**Status:** PENDING  
**Tasks:**
- [ ] Create Cloud Build configuration
- [ ] Create service deployment YAML
- [ ] Configure environment variables
- [ ] Set up resource limits and scaling

**Files to Create:**
- `cloudbuild.yaml`
- `service.yaml`

### Phase 4: Express Server Setup ⏳
**Status:** PENDING  
**Tasks:**
- [ ] Create Express server with OpenTelemetry initialization
- [ ] Add health check endpoint
- [ ] Configure static file serving
- [ ] Set up proper OTEL environment integration

**Files to Update:**
- `server.js` (new file)
- Update existing HTML pages to load OTEL

### Phase 5: Integration with Existing WebSocket Code ⏳
**Status:** PENDING  
**Tasks:**
- [ ] Update orchestrator-websocket.js with instrumentation
- [ ] Update audio-websocket.js with instrumentation  
- [ ] Add span tracking to existing UI interactions
- [ ] Test WebSocket message correlation

**Files to Update:**
- `js/services/orchestrator-websocket.js`
- `js/services/audio-websocket.js`
- Various UI component files

### Phase 6: Deployment Automation ⏳
**Status:** PENDING  
**Tasks:**
- [ ] Create deployment script
- [ ] Add health check verification
- [ ] Create rollback procedures
- [ ] Document deployment process

**Files to Create:**
- `deploy-website-prototype.sh`
- `scripts/health-check.sh`

## Progress Tracking

### ✅ Completed Tasks
- [x] **2025-06-10 16:30** - Created build plan document
- [x] **2025-06-10 16:30** - Analyzed InterviewSessionManager OpenTelemetry implementation
- [x] **2025-06-10 16:30** - Identified exact version requirements
- [x] **2025-06-10 16:45** - Created Dockerfile with Node.js 18 Alpine base
- [x] **2025-06-10 16:45** - Updated package.json with Express dependencies  
- [x] **2025-06-10 16:45** - Created Express server with health check endpoint
- [x] **2025-06-10 17:00** - Created simplified OpenTelemetry config using fetch API
- [x] **2025-06-10 17:00** - Implemented UI tracing service with all priority 1 spans
- [x] **2025-06-10 17:00** - Created WebSocket instrumentation for existing services

### 🚧 Current Task
**Phase 3: Cloud Run Deployment Configuration**
- Working on: Cloud Build YAML configuration
- Next: Service deployment configuration

### ⏳ Pending Tasks
- Phase 2: Frontend OpenTelemetry Implementation
- Phase 3: Cloud Run Deployment Configuration  
- Phase 4: Express Server Setup
- Phase 5: Integration with Existing WebSocket Code
- Phase 6: Deployment Automation

## Technical Specifications

### Container Configuration
```dockerfile
FROM node:18-alpine
WORKDIR /app
ENV OTEL_SERVICE_NAME=website-prototype
ENV OTEL_SERVICE_VERSION=1.0.0
ENV OTEL_EXPORTER_OTLP_ENDPOINT=https://otel-collector-service-833139648849.us-central1.run.app
ENV OTEL_EXPORTER_OTLP_PROTOCOL=http/protobuf
EXPOSE 8080
```

### OpenTelemetry Web Dependencies
```json
{
  "@opentelemetry/api": "1.33.0",
  "@opentelemetry/sdk-web": "1.33.0",
  "@opentelemetry/exporter-otlp-http": "0.54.0",
  "@opentelemetry/instrumentation": "0.54.0",
  "@opentelemetry/instrumentation-document-load": "0.54.0",
  "@opentelemetry/instrumentation-user-interaction": "0.54.0",
  "@opentelemetry/instrumentation-fetch": "0.54.0"
}
```

### Target Span Implementation
Following span naming conventions from `architecture/otel-spans-dual-websocket.md`:

1. **UI Interactions:** `UI_interaction:{Component}_{Action}`
2. **WebSocket Sends:** `UI_sending_to_{Service}:{Action}`
3. **Local Processing:** `UI_local:{Action}`

## Testing Strategy

### Unit Testing
- OpenTelemetry configuration initialization
- Span creation and attributes validation
- WebSocket instrumentation functionality

### Integration Testing  
- End-to-end span flow from UI to Orchestrator
- Span correlation across WebSocket boundaries
- Cloud OTEL collector connectivity

### Deployment Testing
- Health check endpoint validation
- Container startup and OTEL initialization
- Cloud Run scaling and resource usage

## Risk Mitigation

### High Risk Items
1. **Browser CORS Issues:** OTEL collector already configured for cross-origin requests
2. **Performance Impact:** Using fire-and-forget pattern to minimize UI blocking
3. **Deployment Complexity:** Following proven InterviewSessionManager patterns

### Rollback Plan
- Keep existing WebsitePrototype functionality intact during implementation
- Gradual rollout with feature flags for OTEL instrumentation
- Immediate rollback to previous commit if deployment issues

## Success Criteria

### Phase Completion Criteria
- [ ] **Phase 1:** Container builds and starts successfully with OTEL configured
- [ ] **Phase 2:** UI spans appear in Diagnostic Studio with correct attributes
- [ ] **Phase 3:** Successful Cloud Run deployment with auto-scaling
- [ ] **Phase 4:** Express server serves existing pages with OTEL instrumentation  
- [ ] **Phase 5:** WebSocket messages create correlated spans
- [ ] **Phase 6:** Automated deployment works end-to-end

### Final Success Metrics
- All priority 1 spans (WF-001, WF-002, WF-020, WF-021, WF-044) implemented
- Spans appear in Google Cloud Trace via OTEL collector
- Zero performance degradation in UI responsiveness
- 100% existing functionality preserved

## Documentation References

- **Span Architecture:** `/home/tim/current-projects/Documentation/architecture/otel-spans-dual-websocket.md`
- **WebSocket Messages:** `/home/tim/current-projects/Documentation/architecture/websocket-messages.md`  
- **OTEL Collector:** `/home/tim/current-projects/Documentation/services/otel-collector/README.md`
- **InterviewSessionManager Reference:** `/home/tim/current-projects/InterviewSessionManager/app/config/otel_config.py`

---

**Last Updated:** 2025-06-10T16:30:00.000Z  
**Next Update:** After Phase 1 completion