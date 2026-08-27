const puppeteer = require('playwright').chromium;

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
  page.on('console', msg => {
    console.log(`[${msg.type()}] ${msg.text()}`);
  });

  await page.goto('http://localhost:3000/modules/sprites/index.html');
  await page.waitForTimeout(1000);

  const result = await page.evaluate(async () => {
    return new Promise(resolve => {
      window.postMessage({ type: 'LOAD_PROJECT', projectData: {
        width: 32, height: 32, layers: [{ name: 'TestLayer', data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAUSURBVFhH7cExAQAAAMKg9U9tDQ8gAAEAASz4vQAAAABJRU5ErkJggg==' }]
      } }, '*');
      
      setTimeout(() => {
        resolve({
          layerCount: window.SpriteEditor && window.SpriteEditor.layers ? window.SpriteEditor.layers.length : null,
          palette: window.globalPalette ? window.globalPalette.length : null,
          test: typeof window.SpriteEditor
        });
      }, 500);
    });
  });

  console.log('Result:', result);
  await browser.close();
})();
