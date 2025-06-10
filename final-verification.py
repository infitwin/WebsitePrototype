#!/usr/bin/env python3
import subprocess
import time
import webbrowser
import os

def verify_page_state():
    """Final verification of the My Files page"""
    print("🔍 FINAL VERIFICATION: My Files Page")
    print("=" * 50)
    
    # Test 1: Server accessibility
    try:
        result = subprocess.run(['curl', '-s', '-o', '/dev/null', '-w', '%{http_code}', 
                               'http://localhost:8357/pages/my-files.html'], 
                              capture_output=True, text=True, timeout=5)
        
        if result.stdout.strip() == '200':
            print("✅ PASS: Page is accessible (HTTP 200)")
        else:
            print(f"❌ FAIL: Page returned HTTP {result.stdout.strip()}")
            return False
    except Exception as e:
        print(f"❌ FAIL: Cannot reach page - {e}")
        return False
    
    # Test 2: Page content verification
    try:
        result = subprocess.run(['curl', '-s', 'http://localhost:8357/pages/my-files.html'], 
                              capture_output=True, text=True, timeout=5)
        
        html = result.stdout
        
        content_checks = [
            ("Navigation container", ".sidebar-nav-container" in html),
            ("My Files title", "My Files" in html and "<title>" in html),
            ("Firebase imports", "firebase/app" in html),
            ("File loading logic", "initializeFileBrowser" in html),
            ("Authentication debug", "Firebase auth loaded" in html),
            ("Loading state", "Loading your files" in html),
            ("Empty state", "No files yet" in html),
            ("Navigation script", "navigation.js" in html)
        ]
        
        print("\n🔍 CONTENT VERIFICATION:")
        all_passed = True
        for name, passed in content_checks:
            status = "✅ PASS" if passed else "❌ FAIL"
            print(f"{status}: {name}")
            if not passed:
                all_passed = False
        
        if not all_passed:
            print("\n⚠️  Some content checks failed")
            
    except Exception as e:
        print(f"❌ FAIL: Content verification error - {e}")
        return False
    
    # Test 3: Navigation component accessibility
    try:
        result = subprocess.run(['curl', '-s', '-o', '/dev/null', '-w', '%{http_code}', 
                               'http://localhost:8357/components/shared-sidebar.html'], 
                              capture_output=True, text=True, timeout=5)
        
        if result.stdout.strip() == '200':
            print("✅ PASS: Navigation component accessible")
        else:
            print(f"❌ FAIL: Navigation component returned HTTP {result.stdout.strip()}")
            
    except Exception as e:
        print(f"❌ FAIL: Navigation component test error - {e}")
    
    # Test 4: JavaScript module accessibility
    js_modules = [
        'firebase-config.js',
        'file-service.js', 
        'auth-guard.js',
        'navigation.js'
    ]
    
    print("\n🔍 JAVASCRIPT MODULE VERIFICATION:")
    for module in js_modules:
        try:
            result = subprocess.run(['curl', '-s', '-o', '/dev/null', '-w', '%{http_code}', 
                                   f'http://localhost:8357/js/{module}'], 
                                  capture_output=True, text=True, timeout=3)
            
            if result.stdout.strip() == '200':
                print(f"✅ PASS: {module}")
            else:
                print(f"❌ FAIL: {module} (HTTP {result.stdout.strip()})")
                
        except Exception as e:
            print(f"❌ FAIL: {module} - {e}")
    
    print("\n" + "=" * 50)
    print("📱 VISUAL VERIFICATION:")
    print("Opening page in browser for manual inspection...")
    print("Please check:")
    print("1. ✅ Navigation sidebar is visible and contains icons")
    print("2. ✅ Page shows 'My Files' title")
    print("3. ✅ Loading spinner appears briefly, then shows appropriate state")
    print("4. ✅ Console shows debug messages (F12 > Console)")
    print("5. ✅ No 'NOT LOADING' text visible")
    
    # Open in browser for visual verification
    try:
        webbrowser.open('http://localhost:8357/pages/my-files.html')
    except:
        print("Could not open browser automatically")
        print("Please manually visit: http://localhost:8357/pages/my-files.html")
    
    return True

if __name__ == "__main__":
    verify_page_state()