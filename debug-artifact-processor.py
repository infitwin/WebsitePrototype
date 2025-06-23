#!/usr/bin/env python3
"""Debug why faces aren't being returned"""

import requests
import base64
import json
import sys

# Test endpoint
url = "http://localhost:8080/process-artifact"

# Load test image
with open('/home/tim/wsl-test-images/test-image1.jpg', 'rb') as f:
    image_base64 = base64.b64encode(f.read()).decode('utf-8')

# Create payload
payload = {
    "fileId": "debug_test_123",
    "userId": "test_user_123", 
    "twinId": "test_twin_456",
    "imageData": image_base64,
    "contentType": "image/jpeg",
    "fileName": "test-image1.jpg"
}

print("Sending request...")
response = requests.post(url, json=payload)

print(f"\nStatus: {response.status_code}")
print(f"\nFull response:")
result = response.json()
print(json.dumps(result, indent=2))

# Deep dive into the response
if 'result' in result:
    if 'data' in result['result']:
        data = result['result']['data']
        print(f"\n\nKeys in data: {list(data.keys())}")
        
        if 'analysis' in data:
            print(f"Keys in analysis: {list(data['analysis'].keys())}")
            
            # Check if faces exist
            if 'faces' in data['analysis']:
                faces = data['analysis']['faces']
                print(f"\n✅ Found {len(faces)} faces!")
            else:
                print("\n❌ No 'faces' key in analysis")
                
        # Check for errors
        if 'errors' in data:
            print(f"\n❌ Errors found: {data['errors']}")
    else:
        print("\n❌ No 'data' in result")
        
    # Check success flag
    if 'success' in result['result']:
        print(f"\nSuccess flag: {result['result']['success']}")