const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', err => console.log('[PAGE ERROR]', err));
  
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('http://localhost:3000/modules/sprites/index.html');
  await page.waitForTimeout(1000);
  
  await page.evaluate(() => {
    window.postMessage({ type: 'LOAD_PROJECT', projectData: {
      width: 32, height: 32, layers: [{ name: 'Test', data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAUSURBVFhH7cExAQAAAMKg9U9tDQ8gAAEAASz4vQAAAABJRU5ErkJggg==' }]
    }, projectName: 'TestProject' }, '*');
  });

  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'screenshot_test13.png' });
  await browser.close();
})();
