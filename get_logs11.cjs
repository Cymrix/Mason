const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    console.log(`[BROWSER ${msg.type().toUpperCase()}] ${msg.text()}`);
  });
  page.on('pageerror', err => {
    console.log(`[BROWSER PAGE ERROR] ${err.toString()}`);
  });
  
  await page.goto('http://localhost:3000/modules/sprites/index.html', { waitUntil: 'networkidle2' });
  
  // Test LOAD_PROJECT
  await page.evaluate(() => {
    const projData = {
      version: 1,
      width: 32,
      height: 32,
      layers: [{ name: 'Layer 1', data: '' }],
      frames: [{ name: 'Frame 1', layers: [{ name: 'Layer 1', data: '' }], activeLayer: 0 }],
      currentFrameIndex: 0,
      groups: [{ id: 1, name: 'Main Palette', isMain: true, colors: [{id: 1, hex: '#ffffff'}], collapsed: false, columns: 9 }]
    };
    
    window.postMessage({ type: 'LOAD_PROJECT', projectData: projData, projectName: 'Test' }, '*');
  });
  
  await new Promise(r => setTimeout(r, 1000));
  
  await browser.close();
})();
