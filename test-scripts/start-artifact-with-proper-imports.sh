#!/bin/bash

# Change to artifact processor directory first
cd /home/tim/current-projects/ArtifactProcessor/artifact_processor

# Activate virtual environment
source ../local_dev/venv-aws-py311/bin/activate

# Set Python path to include the artifact processor
export PYTHONPATH="/home/tim/current-projects/ArtifactProcessor:/home/tim/current-projects/ArtifactProcessor/artifact_processor:$PYTHONPATH"

# Start the server from WebsitePrototype but with proper environment
cd /home/tim/WebsitePrototype

echo "🚀 Starting artifact processor with proper imports..."
echo "📂 Working from: $(pwd)"
echo "🐍 Python: $(which python)"
echo "📍 PYTHONPATH: $PYTHONPATH"

nohup python local-artifact-processor.py > artifact-processor-fixed.log 2>&1 &

echo "✅ Server started. Check artifact-processor-fixed.log for output"
echo "🌐 Server running on http://localhost:8080"