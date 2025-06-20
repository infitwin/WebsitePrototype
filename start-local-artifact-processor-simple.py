#!/usr/bin/env python3
"""
Simple Local Artifact Processor for Vectorization Testing
No deployment needed - runs immediately!
"""

import os
import sys
import json
import time
import threading
from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import tempfile
from datetime import datetime

# Create Flask app with CORS enabled
app = Flask(__name__)
CORS(app, origins="*")  # Allow all origins for local testing

print("🚀 Starting Simple Local Artifact Processor")
print("=" * 50)

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'artifact-processor-local',
        'timestamp': datetime.now().isoformat()
    })

@app.route('/process-webhook', methods=['POST', 'OPTIONS'])
def process_webhook():
    """
    Webhook endpoint that mimics the production ArtifactProcessor.
    Accepts image files and returns mock face extraction data.
    """
    # Handle CORS preflight
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        # Get request data
        data = request.get_json()
        print(f"\n📥 Received vectorization request for: {data.get('fileName', 'unknown')}")
        
        # Validate required fields
        required = ['fileId', 'fileName', 'fileUrl']
        missing = [f for f in required if not data.get(f)]
        if missing:
            return jsonify({
                'error': f'Missing required fields: {", ".join(missing)}'
            }), 400
        
        file_id = data['fileId']
        file_name = data['fileName']
        file_url = data['fileUrl']
        content_type = data.get('contentType', 'image/jpeg')
        
        # Start processing in background
        def process_async():
            time.sleep(2)  # Simulate processing time
            print(f"✅ Processed {file_name} successfully!")
        
        threading.Thread(target=process_async, daemon=True).start()
        
        # Return immediate response
        response = {
            'status': 'processing_started',
            'fileId': file_id,
            'message': f'Processing started for {file_name}',
            'estimatedTime': '2-5 seconds',
            'success': True,
            'results': [
                {
                    'success': True,
                    'faces': [
                        {
                            'confidence': 0.98,
                            'boundingBox': {
                                'x': 120,
                                'y': 80,
                                'width': 150,
                                'height': 180
                            },
                            'thumbnail': file_url,  # Use original as thumbnail for demo
                            'embedding': [0.1] * 512  # Mock 512D vector
                        },
                        {
                            'confidence': 0.95,
                            'boundingBox': {
                                'x': 300,
                                'y': 90,
                                'width': 140,
                                'height': 170
                            },
                            'thumbnail': file_url,
                            'embedding': [0.2] * 512
                        }
                    ]
                }
            ]
        }
        
        print(f"📤 Returning mock face data: {len(response['results'][0]['faces'])} faces")
        return jsonify(response), 200
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return jsonify({
            'error': str(e),
            'status': 'error'
        }), 500

@app.route('/process-artifact', methods=['POST'])
def process_artifact():
    """Alternate endpoint for compatibility"""
    return process_webhook()

if __name__ == '__main__':
    print("\n✅ Local Artifact Processor Ready!")
    print("📍 Endpoints:")
    print("   - http://localhost:8000/health")
    print("   - http://localhost:8000/process-webhook")
    print("\n🔧 CORS: Enabled for all origins")
    print("📊 Mock Response: Returns 2 detected faces per image")
    print("\n⚡ Starting server on port 8000...")
    print("Press Ctrl+C to stop\n")
    
    # Run the server
    app.run(host='0.0.0.0', port=8000, debug=True)