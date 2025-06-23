/**
 * Test AWS Rekognition directly to debug face detection
 */

const AWS = require('aws-sdk');
const fs = require('fs');

// Configure AWS
AWS.config.update({ region: 'us-east-1' });
const rekognition = new AWS.Rekognition();

async function testAWSRekognitionDirectly() {
  console.log('🚀 Testing AWS Rekognition directly...');
  
  try {
    // Read test image
    const imagePath = '/home/tim/wsl-test-images/test-image1.jpg';
    const imageBytes = fs.readFileSync(imagePath);
    
    console.log('📷 Testing with:', imagePath);
    console.log('📊 Image size:', imageBytes.length, 'bytes');
    
    // Call AWS Rekognition
    console.log('🔍 Calling AWS Rekognition detectFaces...');
    
    const params = {
      Image: {
        Bytes: imageBytes
      },
      Attributes: ['ALL']
    };
    
    const result = await rekognition.detectFaces(params).promise();
    
    console.log('✅ AWS Response received');
    console.log('🎯 Faces detected:', result.FaceDetails.length);
    
    if (result.FaceDetails.length > 0) {
      console.log('\n👤 Face details:');
      result.FaceDetails.forEach((face, i) => {
        console.log(`\nFace ${i + 1}:`);
        console.log('  Confidence:', face.Confidence);
        console.log('  BoundingBox:', face.BoundingBox);
        console.log('  Age Range:', face.AgeRange);
        console.log('  Gender:', face.Gender);
        console.log('  Emotions:', face.Emotions.slice(0, 3));
      });
    }
    
  } catch (error) {
    console.log('❌ AWS Rekognition error:', error.message);
    console.log('❌ Error code:', error.code);
    console.log('❌ Stack:', error.stack);
  }
}

testAWSRekognitionDirectly().catch(console.error);