const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3000/modules/sprites/index.html', { waitUntil: 'networkidle2' });
  
  const groupsContainerHTML = await page.evaluate(() => document.getElementById('groupsContainer')?.innerHTML);
  
  console.log('groupsContainer HTML:', groupsContainerHTML);
  
  await browser.close();
})();
