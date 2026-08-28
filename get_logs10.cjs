const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3000/modules/sprites/index.html', { waitUntil: 'networkidle2' });
  
  const styles = await page.evaluate(() => {
    function getStyle(id) {
      const el = document.getElementById(id) || document.querySelector(id);
      if(!el) return 'NOT FOUND';
      const st = window.getComputedStyle(el);
      return `display: ${st.display}, visibility: ${st.visibility}, width: ${st.width}, height: ${st.height}`;
    }
    return {
      sidePanel: getStyle('.side-panel'),
      groupsContainer: getStyle('#groupsContainer'),
      matrixTimelinePanel: getStyle('#matrixTimelinePanel'),
      layerList: getStyle('#layerList'),
      toolsPanel: getStyle('.tools-panel')
    };
  });
  
  console.log(styles);
  
  await browser.close();
})();
