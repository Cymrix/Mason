const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    try {
        const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
        const page = await browser.newPage();
        
        await page.setViewport({ width: 1280, height: 800 });
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
        
        await new Promise(r => setTimeout(r, 2000));
        
        await page.screenshot({ path: 'main_page.png' });
        
        // Wait, what if I can extract the text from the page to see if ErrorBoundary is showing?
        const text = await page.evaluate(() => document.body.innerText);
        console.log("TEXT ON SCREEN:", text.slice(0, 500));
        
        await browser.close();
        process.exit(0);
    } catch (e) {
        process.exit(1);
    }
})();
