const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const logs = [];
  page.on('console', msg => logs.push(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', err => logs.push(`[PAGE ERROR] ${err.toString()}`));
  
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('http://localhost:3000/', { waitUntil: 'networkidle' });
  
  // Click "New Sprite" or something similar? Let's check the DOM to see how to create a new project.
  // Wait, let's just log what we can do.
  // We can evaluate code to create a project and open a sprite.
  await page.evaluate(() => {
    // There is probably a way to interact with the UI.
    const btns = Array.from(document.querySelectorAll('button'));
    const createBtn = btns.find(b => b.textContent.includes('New Project'));
    if (createBtn) createBtn.click();
  });
  
  await page.waitForTimeout(1000);
  
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const newSpriteBtn = btns.find(b => b.textContent.includes('Image Editor'));
    if (newSpriteBtn) newSpriteBtn.click();
  });
  
  await page.waitForTimeout(2000);
  
  await page.screenshot({ path: 'screenshot_test_sprite.png' });
  console.log(logs.join('\n'));
  
  await browser.close();
})();
