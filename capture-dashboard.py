#!/usr/bin/env python3
"""
Capture dashboard screenshot for color reference
"""

import time
from playwright.sync_api import sync_playwright

def capture_dashboard():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        context = browser.new_context(viewport={'width': 1920, 'height': 1080})
        page = context.new_page()
        
        try:
            print("Navigating to dashboard...")
            page.goto("http://localhost:8080/pages/dashboard.html")
            page.wait_for_load_state('networkidle')
            time.sleep(2)
            
            # Take screenshot
            page.screenshot(path="snapshots/dashboard-color-reference.png", full_page=True)
            print("✓ Dashboard screenshot captured")
            
        except Exception as e:
            print(f"Error: {e}")
            
        finally:
            browser.close()

if __name__ == "__main__":
    capture_dashboard()