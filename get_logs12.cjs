const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3000/modules/sprites/index.html', { waitUntil: 'networkidle2' });
  
  const timelineHTML = await page.evaluate(() => document.getElementById('timelineGridWrap')?.innerHTML);
  
  console.log('timelineHTML:', timelineHTML);
  
  await browser.close();
})();
