const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const logs = [];
  page.on('console', msg => logs.push(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', err => logs.push(`[PAGE ERROR] ${err.toString()}`));
  
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
  
  await page.waitForTimeout(1000);
  
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const newSpriteBtn = btns.find(b => b.textContent.includes('Image Editor'));
    if (newSpriteBtn) newSpriteBtn.click();
  });
  
  await page.waitForTimeout(2000);
  
  console.log(logs.join('\n'));
  await browser.close();
})();
