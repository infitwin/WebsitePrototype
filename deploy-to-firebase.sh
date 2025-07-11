#!/bin/bash
# Deploy WebsitePrototype to Firebase Hosting

echo "🚀 Deploying WebsitePrototype to Firebase Hosting..."

# Exit on error
set -e

# Check if firebase-tools is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found. Installing..."
    npm install -g firebase-tools
fi

# Use service account for authentication
export GOOGLE_APPLICATION_CREDENTIALS="/home/tim/credentials/firebase-credentials.json"

# Check if credentials file exists
if [ ! -f "$GOOGLE_APPLICATION_CREDENTIALS" ]; then
    echo "❌ Error: Firebase credentials not found at $GOOGLE_APPLICATION_CREDENTIALS"
    exit 1
fi

# Initialize Firebase if not already done
if [ ! -f "firebase.json" ]; then
    echo "📋 Initializing Firebase..."
    cat > firebase.json << EOF
{
  "hosting": {
    "public": ".",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**",
      "deploy-*.sh",
      "test-*.html",
      "debug-*.html",
      "docs/**"
    ]
  }
}
EOF
fi

# Create .firebaserc if not exists
if [ ! -f ".firebaserc" ]; then
    echo "📋 Creating Firebase project configuration..."
    cat > .firebaserc << EOF
{
  "projects": {
    "default": "infitwin"
  }
}
EOF
fi

echo "📦 Project: infitwin"
echo "📂 Deploying all files in current directory..."

# Deploy using service account
echo "🔄 Starting deployment..."
firebase deploy --only hosting --project infitwin

echo ""
echo "✅ Deployment complete!"
echo "🌐 Your site is live at: https://infitwin.web.app"
echo "🌐 Alternative URL: https://infitwin.firebaseapp.com"
echo ""
echo "📊 To view deployment details:"
echo "   Visit: https://console.firebase.google.com/project/infitwin/hosting"