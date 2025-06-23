/**
 * Test face detection with local images
 * Sends images directly to local artifact processor
 */

const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

async function testLocalImagesFaceDetection() {
  console.log('🚀 Testing face detection with local images...');

  const imageDir = '/home/tim/wsl-test-images';
  const imageFiles = [
    'test-image1.jpg',
    'test-image2.jpg', 
    'test-image3.jpg',
    'test-image4.jpg',
    'test-image5.jpg',
    'PXL_20230621_231143799.jpg',
    'PXL_20240415_194503653.jpg'
  ];

  for (const fileName of imageFiles) {
    const filePath = path.join(imageDir, fileName);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.log(`⏭️ Skipping ${fileName} - file not found`);
      continue;
    }

    console.log(`\n📷 Testing ${fileName}...`);
    console.log('='.repeat(50));

    try {
      // Read the image file
      const imageBuffer = fs.readFileSync(filePath);
      const fileStats = fs.statSync(filePath);
      
      console.log(`📊 File size: ${fileStats.size} bytes`);

      // Create a temporary file URL (simulate Firebase Storage URL)
      const mockFileUrl = `file://${filePath}`;

      // Prepare payload for local processor
      const payload = {
        fileId: `local_test_${fileName.replace(/\./g, '_')}`,
        fileName: fileName,
        fileUrl: mockFileUrl, // This won't work for download, but we'll handle it
        contentType: fileName.toLowerCase().endsWith('.jpg') || fileName.toLowerCase().endsWith('.jpeg') ? 'image/jpeg' : 'image/png',
        userId: 'local_test_user',
        twinId: 'local_test_twin'
      };

      console.log('📤 Sending to local processor...');
      console.log('📋 Payload:', JSON.stringify(payload, null, 2));

      // Instead of using the file URL, let's modify our local processor to accept base64
      const base64Image = imageBuffer.toString('base64');
      payload.imageData = base64Image; // Add base64 data directly
      delete payload.fileUrl; // Remove the file URL since we have the data

      console.log('📤 Payload includes base64 image data:', base64Image.length, 'characters');

      // Send to our local processor
      const response = await fetch('http://localhost:8080/process-artifact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      console.log('📡 Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log('❌ Error response:', errorText);
        continue;
      }

      const responseData = await response.json();
      console.log('📥 Response received');

      if (responseData.result && responseData.result.success) {
        console.log('✅ SUCCESS: Processing completed');
        
        // Check for faces
        const analysis = responseData.result.data?.analysis || {};
        const faces = analysis.faces || [];
        
        console.log(`🎯 Faces detected: ${faces.length}`);
        
        if (faces.length > 0) {
          console.log('👤 Face details:');
          faces.forEach((face, i) => {
            console.log(`  Face ${i + 1}:`);
            console.log(`    - faceId: ${face.faceId}`);
            console.log(`    - confidence: ${face.confidence}%`);
            console.log(`    - boundingBox:`, face.boundingBox);
            if (face.emotions && face.emotions.length > 0) {
              console.log(`    - top emotion: ${face.emotions[0].Type} (${face.emotions[0].Confidence}%)`);
            }
          });
        } else {
          console.log('😐 No faces detected in this image');
        }
        
        // Check embedding
        if (analysis.embedding) {
          console.log(`🧠 Embedding generated: ${analysis.embedding.length} dimensions`);
        }
        
      } else {
        console.log('❌ FAILED: Processing failed');
        if (responseData.result && responseData.result.error) {
          console.log('❌ Error:', responseData.result.error);
        }
      }

    } catch (error) {
      console.log('❌ Test failed for', fileName, ':', error.message);
    }

    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n🏁 All local image tests completed');
  console.log('📋 Check server logs for detailed processing information');
}

testLocalImagesFaceDetection().catch(console.error);