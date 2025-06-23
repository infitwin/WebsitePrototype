/**
 * Test face detection with a single image
 */

const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

async function testSingleImage() {
  console.log('🚀 Testing face detection with single image...\n');
  
  const imagePath = '/home/tim/wsl-test-images/test-image1.jpg';
  
  try {
    const imageData = fs.readFileSync(imagePath);
    const base64Image = imageData.toString('base64');
    
    console.log('📷 Testing:', imagePath);
    console.log('📊 File size:', imageData.length, 'bytes');
    console.log('📤 Sending to local processor...\n');
    
    const payload = {
      fileId: 'single_test_image',
      fileName: 'test-image1.jpg',
      fileUrl: `file://${imagePath}`,
      contentType: 'image/jpeg',
      userId: 'test_user',
      twinId: 'test_twin',
      imageData: base64Image
    };
    
    const response = await fetch('http://localhost:8080/process-artifact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });
    
    console.log('📡 Response status:', response.status);
    
    const data = await response.json();
    console.log('📥 Response:', JSON.stringify(data, null, 2));
    
    // Check for faces
    const faces = data?.result?.data?.analysis?.faces || [];
    console.log('\n🎯 Faces detected:', faces.length);
    
    if (faces.length > 0) {
      console.log('\n👤 Face details:');
      faces.forEach((face, i) => {
        console.log(`\nFace ${i + 1}:`);
        console.log('  Confidence:', face.Confidence);
        console.log('  BoundingBox:', face.BoundingBox);
      });
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

testSingleImage().catch(console.error);