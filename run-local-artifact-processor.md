# Running Local ArtifactProcessor for Vectorization

## Overview
The local ArtifactProcessor runs on **port 5000** and provides face extraction and vectorization functionality without CORS restrictions.

## Quick Start

### 1. Start the Local ArtifactProcessor

```bash
cd /home/tim/current-projects/ArtifactProcessor/local_dev
source venv/bin/activate  # or venv-minimal/bin/activate if venv doesn't exist
python src/main.py
```

The server will start on `http://localhost:5000`

### 2. Verify the Server is Running

Open a new terminal and run:
```bash
curl http://localhost:5000/health
```

You should see a JSON response indicating the server is healthy.

### 3. Test Vectorization in the Browser

1. Start the WebsitePrototype server:
   ```bash
   cd /home/tim/WebsitePrototype
   python3 -m http.server 8357
   ```

2. Open the test tool:
   ```
   http://localhost:8357/test-vectorization-complete.html
   ```

3. Click "Check Endpoints" - the local server should show as "Online"

4. Click "Test Real Vectorization" to test with your actual files

## Key Endpoints

- **Health Check**: `http://localhost:5000/health`
- **Process Webhook**: `http://localhost:5000/process-webhook`
- **Logs**: `http://localhost:5000/logs`
- **Features**: `http://localhost:5000/features`

## Configuration

The local server is configured with:
- **CORS**: Enabled for all origins (`*`)
- **Port**: 5000 (configured in `/home/tim/current-projects/ArtifactProcessor/local_dev/config/local_settings.py`)
- **Face Detection**: Using AWS Rekognition (configured in the local environment)
- **OpenTelemetry**: Traces sent to `http://localhost:4317`

## Troubleshooting

### Server Won't Start
- Check if port 5000 is already in use: `lsof -i :5000`
- Check virtual environment: Try `venv-minimal` if `venv` doesn't work
- Check logs in `/home/tim/current-projects/ArtifactProcessor/local_dev/logs/`

### CORS Issues
- The local server has CORS enabled by default
- Check that you're using `http://localhost:5000` (not 8000)
- Verify in browser DevTools Network tab that requests go to port 5000

### Face Extraction Not Working
- Check that AWS credentials are configured
- Verify image files are accessible from Firebase Storage
- Check server logs for specific errors

## Testing the Integration

1. Log in to the website at `http://localhost:8357/pages/auth.html`
   - Use test credentials: `weezer@yev.com` / `123456`

2. Go to My Files: `http://localhost:8357/pages/my-files.html`

3. Upload some photos or use existing ones

4. Select photos and click "Vectorize Selected"

5. Check the server logs to see processing details

## Expected Behavior

When vectorization works correctly:
1. Selected files show "processing" status
2. Server logs show face detection progress
3. Files update to "completed" status
4. Face count appears in file details
5. Faces view shows extracted face thumbnails

## Notes

- The local server is for development/testing only
- Processing takes ~2-5 seconds per image
- Face data is stored in Firestore under the file document
- Extracted faces can be viewed by selecting "Faces" from the file type dropdown