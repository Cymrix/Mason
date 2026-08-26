const puppeteer = require('puppeteer');
(async () => {
    try {
        const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
        const page = await browser.newPage();
        page.on('console', msg => console.log('LOG:', msg.text()));
        page.on('pageerror', err => console.log('PAGE_ERROR:', err.toString()));
        
        await page.goto('http://localhost:3000/modules/sprites/index.html', { waitUntil: 'networkidle0' });
        
        await page.evaluate(() => {
            window.postMessage({
                type: 'LOAD_SPRITE',
                width: 32,
                height: 32,
                projectName: 'Test'
            }, '*');
        });
        
        await new Promise(r => setTimeout(r, 2000));
        await browser.close();
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
})();
