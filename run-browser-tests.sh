#!/bin/bash

echo "🌐 Cross-Browser Compatibility Testing Suite"
echo "=========================================="
echo ""

# Check if web server is running
if ! curl -s http://localhost:8765 > /dev/null; then
    echo "⚠️  Web server not running. Starting server..."
    echo "Please run in another terminal: cd ~/WebsitePrototype && python3 -m http.server 8765"
    echo ""
    read -p "Press Enter when the server is running..."
fi

# Create results directory
mkdir -p cross-browser-results

echo "📊 Generating browser compatibility matrix..."
node generate-browser-matrix.js

echo ""
echo "🧪 Running cross-browser tests..."
echo "This will test your website in:"
echo "  • Chromium/Chrome"
echo "  • Firefox"
echo "  • WebKit (Safari)"
echo ""

# Run the cross-browser tests
node cross-browser-test.js

echo ""
echo "✅ Testing complete!"
echo ""
echo "📋 View results:"
echo "  • HTML Report: cross-browser-results/compatibility-report.html"
echo "  • Compatibility Matrix: cross-browser-results/browser-compatibility-matrix.html"
echo "  • Raw Data: cross-browser-results/raw-results.json"
echo ""
echo "🖼️  Screenshots saved in: cross-browser-results/{browser}/{viewport}/"
echo ""

# Open the report if on a system with a browser
if command -v xdg-open &> /dev/null; then
    echo "Opening report in browser..."
    xdg-open cross-browser-results/compatibility-report.html
elif command -v open &> /dev/null; then
    echo "Opening report in browser..."
    open cross-browser-results/compatibility-report.html
fi