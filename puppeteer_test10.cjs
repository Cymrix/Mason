const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('pageerror', err => console.log('[PAGE ERROR]', err.toString()));
  page.on('console', msg => {
    console.log(`[${msg.type()}] ${msg.text()}`);
  });

  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('http://localhost:3000/');
  await page.waitForTimeout(1000);

  // Click new project
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const createBtn = btns.find(b => b.textContent.includes('New Project'));
    if (createBtn) createBtn.click();
  });
  
  await page.waitForTimeout(500);

  // Open Image Editor
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const spriteBtn = btns.find(b => b.textContent.includes('Image Editor'));
    if (spriteBtn) spriteBtn.click();
  });

  await page.waitForTimeout(2000);

  await browser.close();
})();
