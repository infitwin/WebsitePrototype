#!/usr/bin/env python3
"""Check if document was created in Firebase"""

import os
from firebase_admin import firestore, initialize_app

# Set up Firebase credentials
os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = '/home/tim/credentials/infitwin-e18a0d2082de.json'

try:
    initialize_app()
except ValueError:
    pass

db = firestore.client()

# Check the last test document
doc_id = "firebase_test_1750556359"
print(f"🔍 Checking Firebase for document: {doc_id}")

doc_ref = db.collection('files').document(doc_id)
doc = doc_ref.get()

if doc.exists:
    data = doc.to_dict()
    print(f"✅ Document exists!")
    print(f"📋 Fields: {list(data.keys())}")
    
    if 'extractedFaces' in data:
        faces = data['extractedFaces']
        print(f"✅ extractedFaces field found with {len(faces)} faces")
        for i, face in enumerate(faces):
            print(f"  Face {i+1}: {face.get('confidence')}% confidence")
            print(f"    Bounding Box: {face.get('boundingBox')}")
    else:
        print("❌ No extractedFaces field found")
        print(f"Available fields: {list(data.keys())}")
else:
    print("❌ Document does not exist in Firebase")
    
    # List recent documents to see what's there
    print("\n📋 Recent documents in 'files' collection:")
    docs = db.collection('files').order_by('__name__', direction=firestore.Query.DESCENDING).limit(5).stream()
    for doc in docs:
        print(f"  - {doc.id}")