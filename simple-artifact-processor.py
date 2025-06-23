#!/usr/bin/env python3
"""
Simple artifact processor for debugging face detection issue
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Enable CORS

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "service": "simple-artifact-processor-debug"
    })

@app.route('/process-artifact', methods=['POST'])
def process_artifact():
    """Debug endpoint to capture and log the vectorization request"""
    try:
        logger.info("🚀 Received process-artifact request")
        
        # Log request details
        logger.info(f"📍 Request method: {request.method}")
        logger.info(f"📍 Request headers: {dict(request.headers)}")
        logger.info(f"📍 Request content type: {request.content_type}")
        
        # Get request data
        data = request.get_json()
        logger.info(f"📤 Request payload: {json.dumps(data, indent=2)}")
        
        if not data:
            logger.error("❌ No JSON data received")
            return jsonify({
                "result": {
                    "success": False,
                    "error": "No data provided"
                }
            }), 400

        # Extract file info
        file_id = data.get('fileId')
        file_name = data.get('fileName')
        file_url = data.get('fileUrl')
        content_type = data.get('contentType')
        user_id = data.get('userId')
        twin_id = data.get('twinId')
        
        logger.info(f"🔍 Processing file: {file_name} (ID: {file_id})")
        logger.info(f"🔍 File URL: {file_url}")
        logger.info(f"🔍 Content type: {content_type}")
        logger.info(f"🔍 User ID: {user_id}")
        logger.info(f"🔍 Twin ID: {twin_id}")
        
        # Simulate processing
        logger.info("🔬 Simulating face detection processing...")
        
        # Mock face detection result
        mock_faces = [
            {
                "faceId": "face_0",
                "confidence": 99.5,
                "boundingBox": {
                    "Width": 0.23,
                    "Height": 0.30,
                    "Left": 0.35,
                    "Top": 0.20
                },
                "landmarks": [],
                "emotions": [{"Type": "HAPPY", "Confidence": 85.2}],
                "ageRange": {"Low": 25, "High": 35},
                "gender": {"Value": "Male", "Confidence": 96.1}
            }
        ]
        
        logger.info(f"🎯 Mock result: Found {len(mock_faces)} faces")
        logger.info(f"🎯 Face data: {json.dumps(mock_faces, indent=2)}")
        
        # Return success response
        response = {
            "result": {
                "success": True,
                "data": {
                    "analysis": {
                        "faces": mock_faces,
                        "embedding": [0.1] * 512,  # Mock embedding
                        "metadata": {
                            "processed_by": "simple-debug-processor",
                            "timestamp": "2025-06-21T22:30:00Z"
                        }
                    }
                }
            }
        }
        
        logger.info("✅ Returning success response")
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"❌ Error processing request: {str(e)}")
        import traceback
        logger.error(f"❌ Traceback: {traceback.format_exc()}")
        
        return jsonify({
            "result": {
                "success": False,
                "error": str(e)
            }
        }), 500

if __name__ == '__main__':
    logger.info("🚀 Starting simple artifact processor debug server...")
    logger.info("🌐 Will listen on http://localhost:8080")
    logger.info("🔧 CORS enabled for cross-origin requests")
    
    app.run(host='0.0.0.0', port=8080, debug=True)