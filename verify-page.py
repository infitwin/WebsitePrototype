#!/usr/bin/env python3
import subprocess
import time
import os

def take_screenshot():
    """Take a screenshot using a simple method"""
    try:
        # Check if page is accessible
        result = subprocess.run(['curl', '-s', 'http://localhost:8357/pages/my-files.html'], 
                              capture_output=True, text=True, timeout=5)
        
        if result.returncode == 0:
            print("✅ Page is accessible")
            print(f"📄 Page size: {len(result.stdout)} characters")
            
            # Check for key elements in the HTML
            html = result.stdout
            
            checks = [
                ("navigation container", ".sidebar-nav-container" in html),
                ("file container", "filesContainer" in html),
                ("loading state", "Loading your files" in html),
                ("empty state", "No files yet" in html),
                ("firebase import", "firebase/app" in html)
            ]
            
            print("\n🔍 Page element checks:")
            for name, found in checks:
                status = "✅" if found else "❌"
                print(f"{status} {name}: {'Found' if found else 'Missing'}")
            
            # Check for error indicators
            if "NOT LOADING" in html:
                print("⚠️  Found 'NOT LOADING' text in HTML")
            
            return True
        else:
            print(f"❌ Page not accessible: {result.returncode}")
            return False
            
    except Exception as e:
        print(f"❌ Error checking page: {e}")
        return False

def check_server():
    """Check if server is running"""
    try:
        result = subprocess.run(['curl', '-s', 'http://localhost:8357/'], 
                              capture_output=True, timeout=3)
        if result.returncode == 0:
            print("✅ Server is running on port 8357")
            return True
        else:
            print("❌ Server not responding")
            return False
    except:
        print("❌ Cannot reach server")
        return False

if __name__ == "__main__":
    print("🔍 Verifying My Files page...")
    
    if check_server():
        time.sleep(1)
        take_screenshot()
    else:
        print("Starting server...")
        subprocess.Popen(['python3', '-m', 'http.server', '8357'], 
                        cwd='/home/tim/WebsitePrototype')
        time.sleep(3)
        take_screenshot()