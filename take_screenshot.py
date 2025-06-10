#!/usr/bin/env python3
import sys
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
import time

if len(sys.argv) != 3:
    print("Usage: python3 take_screenshot.py <url> <output_file>")
    sys.exit(1)

url = sys.argv[1]
output_file = sys.argv[2]

# Set up Chrome options
chrome_options = Options()
chrome_options.add_argument('--headless')
chrome_options.add_argument('--no-sandbox')
chrome_options.add_argument('--disable-dev-shm-usage')
chrome_options.add_argument('--window-size=1920,1080')

# Create driver
driver = webdriver.Chrome(options=chrome_options)

try:
    # Load the page
    driver.get(url)
    
    # Wait for page to load
    time.sleep(3)
    
    # Take screenshot
    driver.save_screenshot(output_file)
    print(f"Screenshot saved to {output_file}")
    
finally:
    driver.quit()