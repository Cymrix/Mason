const puppeteer = require('puppeteer');
(async () => {
    try {
        const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 800 });
        await page.goto('http://localhost:3000/modules/sprites/index.html', { waitUntil: 'networkidle0' });
        
        await page.evaluate(() => {
            window.postMessage({
                type: 'LOAD_SPRITE',
                width: 32,
                height: 32,
                projectName: 'Test'
            }, '*');
        });
        
        await new Promise(r => setTimeout(r, 1000));
        
        const rects = await page.evaluate(() => {
            const els = ['.app', '.header', '.workspace', '#canvasWrap', '.toolbar-left'];
            const res = {};
            els.forEach(sel => {
                const el = document.querySelector(sel);
                if (el) {
                    const r = el.getBoundingClientRect();
                    res[sel] = { w: r.width, h: r.height, x: r.x, y: r.y };
                } else {
                    res[sel] = 'NOT FOUND';
                }
            });
            return res;
        });
        console.log("RECTS:", rects);
        
        await browser.close();
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
})();
