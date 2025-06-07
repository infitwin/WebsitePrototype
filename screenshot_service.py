#!/usr/bin/env python3
"""
Screenshot Service for Infitwin Testing
Based on SCREENSHOT-SERVICE-SETUP.md
"""

from playwright.async_api import async_playwright
from flask import Flask, request, jsonify
import base64
import asyncio
from datetime import datetime
import json

app = Flask(__name__)

@app.route('/screenshot', methods=['GET'])
def take_screenshot():
    """Take screenshot endpoint"""
    url = request.args.get('url')
    width = int(request.args.get('width', 1200))
    height = int(request.args.get('height', 800))
    mobile = request.args.get('mobile', 'false').lower() == 'true'
    full_page = request.args.get('fullPage', 'false').lower() == 'true'
    wait_for = request.args.get('waitFor', '2000')  # milliseconds
    
    if not url:
        return jsonify({'success': False, 'error': 'URL parameter required'})
    
    async def capture():
        try:
            async with async_playwright() as p:
                browser = await p.chromium.launch()
                
                if mobile:
                    context = await browser.new_context(**p.devices['iPhone 12'])
                else:
                    context = await browser.new_context(
                        viewport={'width': width, 'height': height}
                    )
                
                page = await context.new_page()
                await page.goto(url)
                await page.wait_for_timeout(int(wait_for))
                
                screenshot_bytes = await page.screenshot(full_page=full_page)
                screenshot_b64 = base64.b64encode(screenshot_bytes).decode('utf-8')
                
                await browser.close()
                
                return {
                    'success': True,
                    'screenshot': screenshot_b64,
                    'url': url,
                    'viewport': {'width': width, 'height': height},
                    'mobile': mobile,
                    'timestamp': datetime.now().isoformat()
                }
                
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    # Run async function
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    result = loop.run_until_complete(capture())
    loop.close()
    
    return jsonify(result)

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'service': 'screenshot-service'})

@app.route('/', methods=['GET'])
def root():
    """Root endpoint with service info"""
    return jsonify({
        'service': 'Infitwin Screenshot Service',
        'version': '1.0',
        'endpoints': {
            '/screenshot': 'Take screenshots of web pages',
            '/health': 'Service health check'
        },
        'usage': 'GET /screenshot?url=<target_url>&width=1200&height=800'
    })

if __name__ == '__main__':
    print("🚀 Starting Infitwin Screenshot Service on port 8081...")
    print("📸 Usage: curl 'http://localhost:8081/screenshot?url=http://localhost:8080/index.html'")
    app.run(host='0.0.0.0', port=8081, debug=False)