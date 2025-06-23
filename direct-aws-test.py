#!/usr/bin/env python3
"""Direct AWS Rekognition test to verify it works"""

import sys
import os
import boto3
import base64
import json

# Load environment
sys.path.insert(0, '/home/tim/current-projects/ArtifactProcessor')
import dotenv
dotenv.load_dotenv('/home/tim/credentials/.env')

# Initialize AWS
region = os.getenv('AWS_REGION', 'us-east-1')
access_key = os.getenv('AWS_ACCESS_KEY_ID')
secret_key = os.getenv('AWS_SECRET_ACCESS_KEY')

print(f"AWS credentials check - Access Key exists: {bool(access_key)}, Secret Key exists: {bool(secret_key)}")

rekognition = boto3.client(
    'rekognition',
    region_name=region,
    aws_access_key_id=access_key,
    aws_secret_access_key=secret_key
)

# Read test image
with open('/home/tim/wsl-test-images/test-image1.jpg', 'rb') as f:
    image_bytes = f.read()

print(f"Image size: {len(image_bytes)} bytes")

# Test face detection
try:
    response = rekognition.detect_faces(
        Image={'Bytes': image_bytes},
        Attributes=['ALL']
    )
    
    faces = response.get('FaceDetails', [])
    print(f"\n✅ AWS Rekognition detected {len(faces)} faces")
    
    if faces:
        print("\nFirst face details:")
        face = faces[0]
        print(f"  Confidence: {face.get('Confidence', 0):.2f}%")
        print(f"  Age Range: {face.get('AgeRange', {}).get('Low', 0)}-{face.get('AgeRange', {}).get('High', 0)}")
        print(f"  Gender: {face.get('Gender', {}).get('Value', 'Unknown')} ({face.get('Gender', {}).get('Confidence', 0):.2f}%)")
        print(f"  Emotions: {[f'{e['Type']} ({e['Confidence']:.1f}%)' for e in face.get('Emotions', [])[:3]]}")
        
except Exception as e:
    print(f"\n❌ Error: {e}")
    
# Now test through the artifact processor pipeline
print("\n\nTesting through artifact processor pipeline...")

# We need to fix the import issue first. Let's see what happens when we import with full env setup
os.environ['PYTHONPATH'] = '/home/tim/current-projects/ArtifactProcessor:/home/tim/current-projects/ArtifactProcessor/artifact_processor'

try:
    # Try direct import with all dependencies
    sys.path.insert(0, '/home/tim/current-projects/ArtifactProcessor/artifact_processor/image_processing')
    from visual_analysis_orchestrator import process_photo
    
    print("✅ Successfully imported process_photo")
    
    # Test it
    result = process_photo(
        file_id="direct_test",
        image_data=image_bytes,
        metadata={
            'artifact_id': 'direct_test',
            'user_id': 'test_user',
            'twin_id': 'test_twin'
        }
    )
    
    print(f"\nprocess_photo result:")
    print(f"  Success: {result.get('success')}")
    if result.get('success'):
        faces = result.get('results', {}).get('analysis', {}).get('faces', [])
        print(f"  Faces detected: {len(faces)}")
    else:
        print(f"  Errors: {result.get('errors')}")
        
except Exception as e:
    print(f"❌ Error importing/running process_photo: {e}")
    import traceback
    traceback.print_exc()