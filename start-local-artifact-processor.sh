#!/bin/bash

echo "🚀 Starting Local Artifact Processor for Vectorization Testing"
echo "=================================================="

# Check if ArtifactProcessor directory exists
ARTIFACT_DIR="/home/tim/current-projects/ArtifactProcessor/local_dev"

if [ ! -d "$ARTIFACT_DIR" ]; then
    echo "❌ ArtifactProcessor directory not found at: $ARTIFACT_DIR"
    exit 1
fi

# Navigate to the directory
cd "$ARTIFACT_DIR"

# Check if virtual environment exists
if [ -d "venv" ]; then
    echo "✅ Found virtual environment"
    source venv/bin/activate
elif [ -d "venv-minimal" ]; then
    echo "✅ Found minimal virtual environment"
    source venv-minimal/bin/activate
else
    echo "⚠️  No virtual environment found, using system Python"
fi

# Check if main.py exists
if [ ! -f "src/main.py" ]; then
    echo "❌ main.py not found in src directory"
    exit 1
fi

# Set environment variables
export FLASK_ENV=development
export FLASK_DEBUG=1
export OTEL_SERVICE_NAME=artifact-processor-local
export OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317

echo ""
echo "📋 Configuration:"
echo "  - Port: 8000"
echo "  - CORS: Enabled for all origins"
echo "  - Endpoint: http://localhost:8000/process-webhook"
echo ""
echo "🔧 Starting server..."
echo ""

# Start the server
python src/main.py

# Note: The server will run until you stop it with Ctrl+C