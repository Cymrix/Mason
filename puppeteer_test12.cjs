const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log(`[${msg.type()}] ${msg.text()} (${msg.location().url})`));
  page.on('pageerror', err => console.log('[PAGE ERROR]', err));
  
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('http://localhost:3000/modules/sprites/index.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  
  await browser.close();
})();
