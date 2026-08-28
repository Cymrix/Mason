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
  
  const paletteHTML = await page.evaluate(() => document.getElementById('paletteGroups')?.innerHTML?.substring(0, 200));
  const layerHTML = await page.evaluate(() => document.getElementById('layerList')?.innerHTML?.substring(0, 200));
  
  console.log('Palette HTML:', paletteHTML);
  console.log('Layer HTML:', layerHTML);
  
  await browser.close();
})();
