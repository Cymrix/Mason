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
        
        const appRect = await page.evaluate(() => {
            const app = document.querySelector('.app');
            if (!app) return 'NO APP';
            const r = app.getBoundingClientRect();
            return { display: window.getComputedStyle(app).display, w: r.width, h: r.height, x: r.x, y: r.y };
        });
        console.log("APP RECT:", appRect);
        
        await browser.close();
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
})();
