const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({width: 1920, height: 1080});
  
  await page.goto('http://localhost:8357/pages/my-files.html');
  await page.waitForTimeout(3000);
  
  await page.screenshot({path: 'current-broken-state.png', fullPage: true});
  console.log('Screenshot saved: current-broken-state.png');
  
  await browser.close();
})();