# Playwright Tests for Infitwin WebsitePrototype

Comprehensive end-to-end tests for the Infitwin web application using Playwright.

## Test Structure

### Test Files
- `navigation.spec.js` - Tests for page navigation and routing
- `authentication.spec.js` - Authentication flow tests (login, signup, validation)
- `dashboard.spec.js` - Dashboard functionality and widgets
- `file-management.spec.js` - File browser, upload, and storage features
- `memory-twin.spec.js` - Memory archive and twin interaction features
- `responsive.spec.js` - Responsive design across different viewports
- `accessibility.spec.js` - Accessibility compliance tests
- `performance.spec.js` - Performance metrics and optimization tests
- `error-handling.spec.js` - Error scenarios and recovery
- `smoke.spec.js` - Basic smoke tests for critical functionality

### Features Tested

#### Core Features
- Landing page functionality
- User authentication (login/signup forms)
- Dashboard with widgets and navigation
- File browser with upload/download
- Memory archive and timeline
- Twin interaction (Winston chat)
- Settings and configuration

#### Quality Assurance
- Responsive design across devices
- Accessibility compliance (WCAG guidelines)
- Performance metrics (Core Web Vitals)
- Error handling and recovery
- Form validation
- Cross-browser compatibility

## Setup

1. Install dependencies:
```bash
cd /home/tim/WebsitePrototype/playwright-testing
npm install
npx playwright install
```

2. Start the web server:
```bash
python3 -m http.server 8357 --directory /home/tim/WebsitePrototype
```

3. Run tests:
```bash
npm test
```

## Running Tests

### All Tests
```bash
npm test
```

### Specific Test File
```bash
npx playwright test tests/smoke.spec.js
```

### With UI Mode
```bash
npm run test:ui
```

### Debug Mode
```bash
npm run test:debug
```

### Headed Mode (See Browser)
```bash
npm run test:headed
```

## Test Reports

HTML reports are generated in `playwright-report/` directory.
Screenshots and videos are saved in `test-results/` for failed tests.

## Configuration

The tests are configured in `playwright.config.js` with:
- Base URL: http://localhost:8357
- Multiple browsers: Chromium, Firefox, WebKit
- Mobile viewports: Pixel 5, iPhone 12
- Automatic server startup
- Screenshots/videos on failure
- Trace collection for debugging

## Test Coverage

The test suite covers:
- ✅ 17 main pages/features
- ✅ 5 different browsers/devices
- ✅ Responsive design (5 viewport sizes)
- ✅ Accessibility compliance
- ✅ Performance metrics
- ✅ Error scenarios
- ✅ Form validation
- ✅ File operations
- ✅ Authentication flows
- ✅ Interactive elements

Total test scenarios: 100+ individual test cases