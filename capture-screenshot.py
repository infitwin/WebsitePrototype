#!/usr/bin/env python3
import subprocess
import time
import base64
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

def take_screenshot():
    options = Options()
    options.add_argument('--headless')
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    options.add_argument('--window-size=1920,1080')
    
    driver = webdriver.Chrome(options=options)
    
    try:
        # Navigate to My Files page
        print("📸 Navigating to My Files page...")
        driver.get('http://localhost:8357/pages/my-files.html')
        
        # Wait for page to load
        time.sleep(5)
        
        # Take screenshot
        driver.save_screenshot('my-files-current-state.png')
        print("✅ Screenshot saved: my-files-current-state.png")
        
        # Check for specific elements
        try:
            # Check if username is visible in nav
            nav_elements = driver.find_elements(By.CLASS_NAME, 'user-name')
            if nav_elements:
                for elem in nav_elements:
                    if elem.is_displayed():
                        print(f"⚠️ Username visible: {elem.text}")
            
            # Check loading state
            loading = driver.find_element(By.ID, 'loadingState')
            if loading.is_displayed():
                print("🔄 Loading spinner is still visible!")
            
            # Check empty state
            empty = driver.find_element(By.ID, 'emptyState')
            if empty.is_displayed():
                print("📂 Empty state is showing")
                
            # Get console logs
            logs = driver.get_log('browser')
            if logs:
                print("\n📋 Console logs:")
                for log in logs[-10:]:  # Last 10 logs
                    print(f"  {log['level']}: {log['message']}")
                    
        except Exception as e:
            print(f"Element check error: {e}")
            
    finally:
        driver.quit()

if __name__ == "__main__":
    take_screenshot()