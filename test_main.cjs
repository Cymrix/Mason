const puppeteer = require('puppeteer');

(async () => {
    try {
        const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
        const page = await browser.newPage();
        
        page.on('console', msg => console.log('LOG:', msg.text()));
        page.on('pageerror', error => {
            console.error('PAGE ERROR MSG:', error.message);
            console.error('PAGE ERROR STACK:', error.stack);
        });
        
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
        
        await new Promise(r => setTimeout(r, 2000));
        
        await browser.close();
        process.exit(0);
    } catch (e) {
        process.exit(1);
    }
})();
