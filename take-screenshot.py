#!/usr/bin/env python3
import subprocess
import time
import os

# Simple screenshot using headless browser simulation
def take_screenshot():
    print("📸 Taking screenshot of My Files page...")
    
    # Check current state
    try:
        result = subprocess.run(['curl', '-s', 'http://localhost:8357/pages/my-files.html'], 
                              capture_output=True, text=True, timeout=5)
        
        if result.returncode == 0:
            html = result.stdout
            print("✅ Page accessible")
            
            # Check what's actually in the page
            if "Loading your files" in html:
                print("🔄 Loading state element found in HTML")
            if "No files yet" in html:
                print("📂 Empty state element found in HTML")
            if "sidebar-nav-container" in html:
                print("🧭 Navigation container found in HTML")
            else:
                print("❌ Navigation container NOT found in HTML")
                
        # Create a simple HTML page that captures the state
        screenshot_html = f"""
<!DOCTYPE html>
<html>
<head>
    <title>My Files Screenshot</title>
    <style>
        body {{ font-family: Arial; margin: 20px; }}
        .frame {{ width: 100%; height: 800px; border: 2px solid #333; }}
        .info {{ background: #f0f0f0; padding: 15px; margin: 10px 0; }}
    </style>
</head>
<body>
    <h1>📸 My Files Page Screenshot - {time.strftime('%Y-%m-%d %H:%M:%S')}</h1>
    <div class="info">
        <strong>Status:</strong> Capturing current state of My Files page<br>
        <strong>URL:</strong> http://localhost:8357/pages/my-files.html<br>
        <strong>Expected:</strong> Navigation + File loading state
    </div>
    <iframe src="/pages/my-files.html" class="frame"></iframe>
</body>
</html>
"""
        
        with open('/home/tim/WebsitePrototype/screenshot-capture.html', 'w') as f:
            f.write(screenshot_html)
            
        print("📱 Screenshot capture page created: http://localhost:8357/screenshot-capture.html")
        print("🔍 Open this in your browser to see the current state")
        
    except Exception as e:
        print(f"❌ Error taking screenshot: {e}")

if __name__ == "__main__":
    take_screenshot()