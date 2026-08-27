const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', err => console.log('[PAGE ERROR]', err));
  
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('http://localhost:3000/modules/sprites/index.html');
  await page.waitForTimeout(1000);
  
  const savedData = await page.evaluate(async () => {
    return new Promise(resolve => {
      window.addEventListener('message', (e) => {
        if (e.data.type === 'SAVE_PROJECT_DATA') {
           resolve(e.data.data);
        }
      });
      window.postMessage({ type: 'REQUEST_SAVE', saveId: 'test_save' }, '*');
    });
  });

  console.log("Saved data generated.");

  await page.evaluate((data) => {
    window.postMessage({ type: 'LOAD_PROJECT', projectData: data, projectName: 'TestLoad' }, '*');
  }, savedData);

  await page.waitForTimeout(2000);
  console.log("Reloaded successfully.");
  await browser.close();
})();
