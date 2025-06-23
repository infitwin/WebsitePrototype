#!/bin/bash
# Start artifact processor with proper virtual environment

# Kill any existing process
pkill -f "local-artifact-processor.py" 2>/dev/null || true
sleep 2

# Activate the proper virtual environment
source /home/tim/current-projects/ArtifactProcessor/local_dev/venv-aws-py311/bin/activate

# Start the artifact processor
echo "Starting artifact processor with proper ML environment..."
nohup python local-artifact-processor.py > artifact-processor.log 2>&1 &

echo "Artifact processor started. Check artifact-processor.log for output."
echo "Server running on http://localhost:8080"