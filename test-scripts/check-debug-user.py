#!/usr/bin/env python3
"""Check Firebase for debug user"""

import os
from firebase_admin import firestore, initialize_app

os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = '/home/tim/credentials/infitwin-e18a0d2082de.json'

try:
    initialize_app()
except ValueError:
    pass

db = firestore.client()

# Check with correct path
user_id = "debug_user_123" 
doc_id = "debug_flow_1750557547"

print(f"🔍 Checking Firebase path: users/{user_id}/files/{doc_id}")

doc_ref = db.collection('users').document(user_id).collection('files').document(doc_id)
doc = doc_ref.get()

if doc.exists:
    data = doc.to_dict()
    print(f"✅ Document exists!")
    print(f"📋 Fields: {list(data.keys())}")
    
    if 'extractedFaces' in data:
        faces = data['extractedFaces']
        print(f"✅ extractedFaces field found with {len(faces)} faces!")
        for i, face in enumerate(faces):
            print(f"  Face {i+1}: {face.get('confidence')}% confidence")
            print(f"    Bounding Box: {face.get('boundingBox')}")
    else:
        print("❌ No extractedFaces field found")
else:
    print("❌ Document does not exist in Firebase") 
    print("\n🔧 This means the Firebase update code is not being executed")