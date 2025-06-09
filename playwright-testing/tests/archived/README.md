# Archived Playwright Tests

This directory contains Playwright tests that have been archived due to feature removal or design changes.

## Archived Tests

### memory-archive.spec.js
- **Reason for archival**: Memory Archive page was removed from navigation per design decision
- **Date archived**: As documented in CLAUDE.md
- **Original location**: Tests were scattered in memory-features.spec.js
- **Description**: Tests for the Memory Archive page functionality including:
  - Page display and navigation
  - Memory cards/items display
  - Date/time stamps on memories
  - Search and filter functionality
  - Navigation to individual memory details

### archive-button.spec.js
- **Reason for archival**: Archive functionality may have been removed or redesigned
- **Date archived**: Extracted from storage-dashboard.spec.js
- **Description**: Tests for Archive button functionality including:
  - Archive button in storage actions
  - File archiving functionality

## Notes

These tests are preserved for historical reference and in case features are re-implemented in the future. All tests are marked with `test.skip()` to prevent them from running during normal test execution.

If any of these features are re-implemented, the relevant tests can be moved back to the active test directory and updated as needed.