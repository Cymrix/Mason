const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const logs = [];
  page.on('console', msg => logs.push(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', err => logs.push(`[PAGE ERROR] ${err.toString()}`));
  await page.goto('http://localhost:3000/modules/sprites/index.html', { waitUntil: 'networkidle' });
  console.log(logs.join('\n'));
  await browser.close();
})();
