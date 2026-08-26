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
        
        const html = await page.evaluate(() => document.body.innerHTML.substring(0, 500));
        console.log("HTML START:", html);
        
        // Find visible elements
        const visible = await page.evaluate(() => {
            const els = document.querySelectorAll('*');
            return Array.from(els).filter(e => {
                const style = window.getComputedStyle(e);
                return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0' && e.tagName !== 'SCRIPT' && e.tagName !== 'STYLE';
            }).map(e => e.tagName + (e.id ? '#' + e.id : '') + (e.className ? '.' + e.className : '')).slice(0, 20);
        });
        console.log("VISIBLE ELEMENTS:", visible);
        
        await browser.close();
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
})();
