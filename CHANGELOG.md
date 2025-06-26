# Changelog

All notable changes to the WebsitePrototype project will be documented in this file.

## [1.1.0] - 2025-06-26 - Neo4j Production Posting

### Added
- Centralized Neo4j connection module (`/js/neo4j-connection.js`)
- "Review & Post" button in sandbox header for production posting workflow
- Two-stage review process with modal confirmation
- Transaction-based Neo4j saves with proper error handling
- Automatic button state management (disabled when no changes)
- MERGE operations for idempotent node/relationship creation
- Post-success sandbox clearing and production refresh

### Changed
- Renamed "Post to Production" header button to "Review & Post" for clarity
- Modal action handlers now use correct `action` property instead of `onClick`
- Improved modal management to prevent duplicate review modals

### Fixed
- Review modal now properly closes after posting to production
- Modal button clicks now work correctly on first attempt
- Transaction handling ensures data integrity during saves

### Technical Details
- All nodes saved with `userId` and `twinId` properties
- Twin ID format: `{userId}-1` (e.g., `abc123def456-1`)
- Neo4j URI: `neo4j+s://80dc1193.databases.neo4j.io`
- Uses Neo4j driver v5.15.0 with transaction support

### Security
- Neo4j credentials stored in centralized connection module
- Firebase authentication required for all operations
- User data properly scoped by userId and twinId

## [1.0.0] - 2024-12-22 - Initial Sandbox Integration

### Added
- Complete sandbox page with graph editing capabilities
- Six floating panels (Node List, Faces, Artifacts, Production, AI Assistant, Tools)
- Firebase integration for user files and faces
- Drag-and-drop functionality from panels to graph
- Face detection and display in My Files page
- File rename capability with custom display names
- Face deletion feature for unwanted detections
- Admin test data page for Neo4j development

### Known Issues
- Batch vectorization bug (Issue #133) - second file returns 0 faces
- Requires local ArtifactProcessor on port 8080

---

This changelog follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) format.