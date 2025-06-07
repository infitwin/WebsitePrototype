#!/usr/bin/env python3
"""
Interactive Elements Test Script for Infitwin Website
Tests all interactive elements and captures before/after screenshots
"""

import asyncio
import base64
import json
import os
from datetime import datetime
from playwright.async_api import async_playwright
from pathlib import Path

class InteractiveElementsTester:
    def __init__(self):
        self.base_url = "http://localhost:8080"
        self.output_dir = Path("interactive-test-results")
        self.output_dir.mkdir(exist_ok=True)
        self.results = []
        
    async def take_screenshot(self, page, name):
        """Take a screenshot and save it"""
        screenshot = await page.screenshot(full_page=False)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{timestamp}_{name.replace(' ', '_')}.png"
        filepath = self.output_dir / filename
        
        with open(filepath, 'wb') as f:
            f.write(screenshot)
            
        # Also return base64 for HTML report
        return base64.b64encode(screenshot).decode('utf-8'), str(filepath)
    
    async def test_auth_page_tabs(self, browser):
        """Test login/signup tab switching on auth page"""
        print("\n🔍 Testing Auth Page - Tab Switching")
        context = await browser.new_context(viewport={'width': 1200, 'height': 800})
        page = await context.new_page()
        
        try:
            await page.goto(f"{self.base_url}/pages/auth.html")
            await page.wait_for_load_state('networkidle')
            
            # Screenshot 1: Default state (login tab active)
            before_b64, before_path = await self.take_screenshot(page, "auth_tabs_before")
            print("  ✅ Captured default state (login tab)")
            
            # Click signup tab
            await page.click('[data-tab="signup"]')
            await page.wait_for_timeout(500)  # Wait for animation
            
            # Screenshot 2: After clicking signup tab
            after_b64, after_path = await self.take_screenshot(page, "auth_tabs_after")
            print("  ✅ Captured after clicking signup tab")
            
            # Verify the change
            signup_visible = await page.is_visible('#signup-form')
            login_hidden = await page.is_hidden('#login-form')
            
            self.results.append({
                'test': 'Auth Page - Tab Switching',
                'status': 'success' if signup_visible and login_hidden else 'failed',
                'before': before_b64,
                'after': after_b64,
                'details': 'Successfully switched from login to signup tab' if signup_visible else 'Tab switch failed'
            })
            
        except Exception as e:
            print(f"  ❌ Error: {str(e)}")
            self.results.append({
                'test': 'Auth Page - Tab Switching',
                'status': 'error',
                'error': str(e)
            })
        finally:
            await context.close()
    
    async def test_auth_form_focus(self, browser):
        """Test form field focus states"""
        print("\n🔍 Testing Auth Page - Form Field Focus")
        context = await browser.new_context(viewport={'width': 1200, 'height': 800})
        page = await context.new_page()
        
        try:
            await page.goto(f"{self.base_url}/pages/auth.html")
            await page.wait_for_load_state('networkidle')
            
            # Screenshot 1: No field focused
            before_b64, before_path = await self.take_screenshot(page, "auth_focus_before")
            print("  ✅ Captured default state (no focus)")
            
            # Focus email field
            await page.focus('#email')
            await page.wait_for_timeout(300)
            
            # Screenshot 2: Email field focused
            after_b64, after_path = await self.take_screenshot(page, "auth_focus_after")
            print("  ✅ Captured with email field focused")
            
            self.results.append({
                'test': 'Auth Page - Form Field Focus',
                'status': 'success',
                'before': before_b64,
                'after': after_b64,
                'details': 'Email field focus state captured'
            })
            
        except Exception as e:
            print(f"  ❌ Error: {str(e)}")
            self.results.append({
                'test': 'Auth Page - Form Field Focus',
                'status': 'error',
                'error': str(e)
            })
        finally:
            await context.close()
    
    async def test_dashboard_hover(self, browser):
        """Test hover states on dashboard"""
        print("\n🔍 Testing Dashboard - Hover States")
        context = await browser.new_context(viewport={'width': 1200, 'height': 800})
        page = await context.new_page()
        
        try:
            await page.goto(f"{self.base_url}/pages/dashboard.html")
            await page.wait_for_load_state('networkidle')
            
            # Screenshot 1: Default state
            before_b64, before_path = await self.take_screenshot(page, "dashboard_hover_before")
            print("  ✅ Captured default state")
            
            # Hover over navigation item
            nav_item = page.locator('.nav-item').first
            await nav_item.hover()
            await page.wait_for_timeout(300)
            
            # Screenshot 2: With hover
            after_b64, after_path = await self.take_screenshot(page, "dashboard_hover_after")
            print("  ✅ Captured hover state on navigation")
            
            self.results.append({
                'test': 'Dashboard - Navigation Hover',
                'status': 'success',
                'before': before_b64,
                'after': after_b64,
                'details': 'Navigation item hover state captured'
            })
            
        except Exception as e:
            print(f"  ❌ Error: {str(e)}")
            self.results.append({
                'test': 'Dashboard - Navigation Hover',
                'status': 'error',
                'error': str(e)
            })
        finally:
            await context.close()
    
    async def test_memory_archive_dropdown(self, browser):
        """Test dropdown in memory archive"""
        print("\n🔍 Testing Memory Archive - Filter Dropdown")
        context = await browser.new_context(viewport={'width': 1200, 'height': 800})
        page = await context.new_page()
        
        try:
            await page.goto(f"{self.base_url}/pages/memory-archive.html")
            await page.wait_for_load_state('networkidle')
            
            # Screenshot 1: Dropdown closed
            before_b64, before_path = await self.take_screenshot(page, "archive_dropdown_before")
            print("  ✅ Captured default state (dropdown closed)")
            
            # Click filter button if it exists
            filter_button = page.locator('.filter-button, .filter-dropdown')
            if await filter_button.count() > 0:
                await filter_button.first.click()
                await page.wait_for_timeout(500)
                
                # Screenshot 2: Dropdown open
                after_b64, after_path = await self.take_screenshot(page, "archive_dropdown_after")
                print("  ✅ Captured dropdown open state")
                
                self.results.append({
                    'test': 'Memory Archive - Filter Dropdown',
                    'status': 'success',
                    'before': before_b64,
                    'after': after_b64,
                    'details': 'Filter dropdown interaction captured'
                })
            else:
                print("  ⚠️  No filter dropdown found, capturing page state only")
                self.results.append({
                    'test': 'Memory Archive - Filter Dropdown',
                    'status': 'warning',
                    'before': before_b64,
                    'after': before_b64,
                    'details': 'No dropdown element found on page'
                })
            
        except Exception as e:
            print(f"  ❌ Error: {str(e)}")
            self.results.append({
                'test': 'Memory Archive - Filter Dropdown',
                'status': 'error',
                'error': str(e)
            })
        finally:
            await context.close()
    
    async def test_settings_toggles(self, browser):
        """Test toggle switches in settings"""
        print("\n🔍 Testing Settings - Toggle Switches")
        context = await browser.new_context(viewport={'width': 1200, 'height': 800})
        page = await context.new_page()
        
        try:
            await page.goto(f"{self.base_url}/pages/settings.html")
            await page.wait_for_load_state('networkidle')
            
            # Screenshot 1: Default state
            before_b64, before_path = await self.take_screenshot(page, "settings_toggle_before")
            print("  ✅ Captured default toggle states")
            
            # Click toggle if exists
            toggle = page.locator('.toggle-switch, input[type="checkbox"]')
            if await toggle.count() > 0:
                await toggle.first.click()
                await page.wait_for_timeout(300)
                
                # Screenshot 2: After toggle
                after_b64, after_path = await self.take_screenshot(page, "settings_toggle_after")
                print("  ✅ Captured after toggle click")
                
                self.results.append({
                    'test': 'Settings - Toggle Switches',
                    'status': 'success',
                    'before': before_b64,
                    'after': after_b64,
                    'details': 'Toggle switch interaction captured'
                })
            else:
                print("  ⚠️  No toggle switches found")
                self.results.append({
                    'test': 'Settings - Toggle Switches',
                    'status': 'warning',
                    'before': before_b64,
                    'after': before_b64,
                    'details': 'No toggle elements found on page'
                })
            
        except Exception as e:
            print(f"  ❌ Error: {str(e)}")
            self.results.append({
                'test': 'Settings - Toggle Switches',
                'status': 'error',
                'error': str(e)
            })
        finally:
            await context.close()
    
    async def test_button_states(self, browser):
        """Test button hover and active states across pages"""
        print("\n🔍 Testing Button States")
        pages_to_test = [
            ('Dashboard', '/pages/dashboard.html', '.action-button'),
            ('Interview', '/pages/interview.html', '.control-button'),
            ('File Browser', '/pages/file-browser.html', '.file-item')
        ]
        
        for page_name, page_url, selector in pages_to_test:
            context = await browser.new_context(viewport={'width': 1200, 'height': 800})
            page = await context.new_page()
            
            try:
                await page.goto(f"{self.base_url}{page_url}")
                await page.wait_for_load_state('networkidle')
                
                # Check if elements exist
                elements = page.locator(selector)
                if await elements.count() > 0:
                    # Screenshot 1: Default
                    before_b64, _ = await self.take_screenshot(page, f"{page_name.lower()}_button_before")
                    
                    # Hover
                    await elements.first.hover()
                    await page.wait_for_timeout(300)
                    
                    # Screenshot 2: Hover state
                    after_b64, _ = await self.take_screenshot(page, f"{page_name.lower()}_button_hover")
                    
                    print(f"  ✅ {page_name} - Button hover captured")
                    
                    self.results.append({
                        'test': f'{page_name} - Button States',
                        'status': 'success',
                        'before': before_b64,
                        'after': after_b64,
                        'details': f'Button hover state captured for {selector}'
                    })
                else:
                    print(f"  ⚠️  {page_name} - No buttons found with selector {selector}")
                    
            except Exception as e:
                print(f"  ❌ {page_name} - Error: {str(e)}")
                self.results.append({
                    'test': f'{page_name} - Button States',
                    'status': 'error',
                    'error': str(e)
                })
            finally:
                await context.close()
    
    async def generate_html_report(self):
        """Generate HTML report with all test results"""
        html_content = """
<!DOCTYPE html>
<html>
<head>
    <title>Interactive Elements Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .header { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .test-result { background: white; padding: 20px; margin-bottom: 20px; border-radius: 8px; }
        .test-title { font-size: 18px; font-weight: bold; margin-bottom: 10px; }
        .status { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; margin-left: 10px; }
        .status.success { background: #28a745; color: white; }
        .status.warning { background: #ffc107; color: #856404; }
        .status.error { background: #dc3545; color: white; }
        .screenshots { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 15px; }
        .screenshot-box { border: 1px solid #ddd; border-radius: 4px; overflow: hidden; }
        .screenshot-label { background: #f8f9fa; padding: 8px; font-weight: 500; }
        .screenshot-img { width: 100%; height: auto; display: block; }
        .details { margin-top: 10px; color: #666; }
        .error-msg { color: #dc3545; margin-top: 10px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Interactive Elements Test Report</h1>
        <p>Generated: """ + datetime.now().strftime("%Y-%m-%d %H:%M:%S") + """</p>
        <p>Total Tests: """ + str(len(self.results)) + """</p>
    </div>
"""
        
        for result in self.results:
            status_class = result['status']
            html_content += f"""
    <div class="test-result">
        <div class="test-title">
            {result['test']}
            <span class="status {status_class}">{status_class.upper()}</span>
        </div>
"""
            
            if result['status'] == 'error':
                html_content += f"""
        <div class="error-msg">Error: {result.get('error', 'Unknown error')}</div>
"""
            else:
                html_content += f"""
        <div class="details">{result.get('details', '')}</div>
        <div class="screenshots">
            <div class="screenshot-box">
                <div class="screenshot-label">Before Interaction</div>
                <img class="screenshot-img" src="data:image/png;base64,{result.get('before', '')}" />
            </div>
            <div class="screenshot-box">
                <div class="screenshot-label">After Interaction</div>
                <img class="screenshot-img" src="data:image/png;base64,{result.get('after', '')}" />
            </div>
        </div>
"""
            
            html_content += """
    </div>
"""
        
        html_content += """
</body>
</html>
"""
        
        report_path = self.output_dir / f"test_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.html"
        with open(report_path, 'w') as f:
            f.write(html_content)
        
        print(f"\n📄 HTML report generated: {report_path}")
        return report_path
    
    async def run_all_tests(self):
        """Run all interactive element tests"""
        print("🚀 Starting Interactive Elements Test Suite")
        print("=" * 50)
        
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            
            try:
                # Run all test methods
                await self.test_auth_page_tabs(browser)
                await self.test_auth_form_focus(browser)
                await self.test_dashboard_hover(browser)
                await self.test_memory_archive_dropdown(browser)
                await self.test_settings_toggles(browser)
                await self.test_button_states(browser)
                
            finally:
                await browser.close()
        
        # Generate report
        report_path = await self.generate_html_report()
        
        # Summary
        print("\n" + "=" * 50)
        print("📊 Test Summary:")
        success_count = sum(1 for r in self.results if r['status'] == 'success')
        warning_count = sum(1 for r in self.results if r['status'] == 'warning')
        error_count = sum(1 for r in self.results if r['status'] == 'error')
        
        print(f"  ✅ Success: {success_count}")
        print(f"  ⚠️  Warning: {warning_count}")
        print(f"  ❌ Error: {error_count}")
        print(f"\n📁 Screenshots saved to: {self.output_dir}")
        print(f"📄 Report available at: {report_path}")

async def main():
    """Main entry point"""
    # Check if web server is running
    import requests
    try:
        response = requests.get("http://localhost:8080")
        if response.status_code != 200:
            print("⚠️  Warning: Web server might not be properly configured")
    except:
        print("❌ Error: Web server not running on port 8080")
        print("Please run: python3 -m http.server 8080")
        return
    
    # Run tests
    tester = InteractiveElementsTester()
    await tester.run_all_tests()

if __name__ == "__main__":
    asyncio.run(main())