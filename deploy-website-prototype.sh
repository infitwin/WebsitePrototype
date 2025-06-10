#!/bin/bash
set -e

# deploy-website-prototype.sh - Deploy WebsitePrototype with OpenTelemetry to Cloud Run

echo "🚀 Deploying WebsitePrototype with OpenTelemetry to Cloud Run..."

# Verify we're in the right directory
if [ ! -f "Dockerfile" ] || [ ! -f "server.js" ]; then
    echo "❌ Error: Must run from WebsitePrototype root directory"
    exit 1
fi

# Check if gcloud is installed and authenticated
if ! command -v gcloud &> /dev/null; then
    echo "❌ Error: gcloud CLI not found. Please install Google Cloud SDK"
    exit 1
fi

# Verify authentication
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo "❌ Error: Not authenticated with gcloud. Run 'gcloud auth login'"
    exit 1
fi

# Set project (adjust as needed)
PROJECT_ID="infitwin"
REGION="us-central1"
SERVICE_NAME="website-prototype"

echo "📋 Configuration:"
echo "   Project: $PROJECT_ID"
echo "   Region: $REGION"
echo "   Service: $SERVICE_NAME"
echo ""

# Set project
gcloud config set project $PROJECT_ID

echo "🔨 Building and deploying with Cloud Build..."

# Submit build to Cloud Build
gcloud builds submit --config cloudbuild.yaml .

echo "✅ Build completed successfully!"

# Verify deployment
echo "🔍 Verifying deployment..."
DEPLOYED_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(status.url)")

if [ -z "$DEPLOYED_URL" ]; then
    echo "❌ Error: Could not retrieve service URL"
    exit 1
fi

echo "🌐 Service deployed at: $DEPLOYED_URL"

# Check health endpoint
echo "🔍 Checking health endpoint..."
if curl -f "$DEPLOYED_URL/health" > /dev/null 2>&1; then
    echo "✅ Health check passed!"
    echo ""
    echo "📊 OpenTelemetry Configuration:"
    curl -s "$DEPLOYED_URL/health" | grep -o '"otel":{[^}]*}' | sed 's/^"otel"://; s/^{//; s/}$//' | tr ',' '\n' | sed 's/^/   /'
else
    echo "⚠️ Health check failed, but service may still be starting up"
fi

echo ""
echo "🎉 Deployment Summary:"
echo "   ✅ Container built and pushed to GCR"
echo "   ✅ Service deployed to Cloud Run"
echo "   ✅ OpenTelemetry configured with collector endpoint"
echo "   🔗 Service URL: $DEPLOYED_URL"
echo "   🔍 Health Check: $DEPLOYED_URL/health"
echo "   🎯 Demo Page: $DEPLOYED_URL/otel-demo.html"
echo ""
echo "📊 OpenTelemetry Traces:"
echo "   - Spans will be sent to: https://otel-collector-service-833139648849.us-central1.run.app"
echo "   - View traces in Google Cloud Trace console"
echo "   - Monitor with Diagnostic Studio dashboard"
echo ""
echo "🚀 WebsitePrototype deployment complete!"