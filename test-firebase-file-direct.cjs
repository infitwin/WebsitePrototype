/**
 * Test face detection by getting real file data from Firebase
 * and sending it to our local processor
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, where, limit } = require('firebase/firestore');
const fetch = require('node-fetch');

// Firebase config
const firebaseConfig = {
  apiKey: 'AIzaSyC-p66SWt_jtmtIKOWdaS8wb0dNEhBGPHs',
  authDomain: 'infitwin.firebaseapp.com',
  projectId: 'infitwin',
  storageBucket: 'infitwin.appspot.com',
  messagingSenderId: '833139648849',
  appId: '1:833139648849:web:6e3c2c41cea56abc7df495'
};

async function testWithRealFirebaseFile() {
  console.log('🚀 Testing face detection with real Firebase file...');

  try {
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    // Get a real uploaded file
    console.log('📁 Fetching uploaded files from Firebase...');
    const filesQuery = query(
      collection(db, 'files'),
      where('fileType', '>=', 'image/'),
      where('fileType', '<', 'image/z'),
      limit(1)
    );

    const snapshot = await getDocs(filesQuery);
    
    if (snapshot.empty) {
      throw new Error('No image files found in Firebase');
    }

    const fileDoc = snapshot.docs[0];
    const fileData = fileDoc.data();
    console.log('📷 Found image file:', fileDoc.id);
    console.log('📋 File data:', {
      fileName: fileData.fileName,
      fileType: fileData.fileType,
      size: fileData.size,
      hasDownloadURL: !!fileData.downloadURL
    });

    // Prepare payload for our local processor
    const payload = {
      fileId: fileDoc.id,
      fileName: fileData.fileName,
      fileUrl: fileData.downloadURL,
      contentType: fileData.fileType,
      userId: fileData.userId || 'test_user',
      twinId: fileData.twinId || 'test_twin'
    };

    console.log('📤 Sending to local processor...');
    console.log('📋 Payload:', JSON.stringify(payload, null, 2));

    // Send to our local processor
    const response = await fetch('http://localhost:8080/process-artifact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    console.log('📡 Response status:', response.status);
    console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

    const responseData = await response.json();
    console.log('📥 Response data:', JSON.stringify(responseData, null, 2));

    if (response.ok && responseData.result.success) {
      console.log('✅ SUCCESS: Face detection processing completed');
      
      // Check if faces were found
      const faces = responseData.result.data?.analysis?.faces || [];
      console.log(`🎯 Faces detected: ${faces.length}`);
      
      if (faces.length > 0) {
        console.log('👤 Face details:', faces.map(f => ({
          faceId: f.faceId,
          confidence: f.confidence,
          boundingBox: f.boundingBox
        })));
      }
      
      // Check if Firebase was updated
      console.log('🔥 Check server logs for Firebase update messages');
      
    } else {
      console.log('❌ FAILED: Processing failed');
      console.log('❌ Error:', responseData.result.error);
    }

  } catch (error) {
    console.log('❌ Test failed:', error.message);
    console.log('❌ Stack:', error.stack);
  }
}

testWithRealFirebaseFile().catch(console.error);