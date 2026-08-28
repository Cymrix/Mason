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
  
  // Click on the canvas
  await page.mouse.move(256, 256);
  await page.mouse.down();
  await new Promise(r => setTimeout(r, 100));
  await page.mouse.move(300, 300);
  await page.mouse.up();
  
  await new Promise(r => setTimeout(r, 500));
  await browser.close();
})();
