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
  
  const groupsContainerHTML = await page.evaluate(() => document.getElementById('groupsContainer')?.innerHTML?.substring(0, 50));
  
  console.log('groupsContainer HTML:', groupsContainerHTML);
  
  await browser.close();
})();
