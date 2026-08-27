const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('pageerror', err => console.log('[PAGE ERROR]', err.toString()));
  page.on('console', msg => {
    if (msg.type() === 'error') console.log(`[${msg.type()}] ${msg.text()}`);
  });

  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('http://localhost:3000/');
  await page.waitForTimeout(1000);
  
  await page.screenshot({ path: 'screenshot_test11.png' });

  await browser.close();
})();
