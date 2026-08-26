const puppeteer = require('puppeteer');

(async () => {
    try {
        const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
        const page = await browser.newPage();
        
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
        
        // Let's see if we are in the project view now, since it should be saved in localStorage
        const html = await page.evaluate(() => document.body.innerHTML);
        console.log(html.slice(0, 1000));
        
        const title = await page.evaluate(() => {
            const h1 = document.querySelector('h1');
            return h1 ? h1.innerText : 'NO H1';
        });
        console.log("H1:", title);
        
        await browser.close();
        process.exit(0);
    } catch (e) {
        process.exit(1);
    }
})();
