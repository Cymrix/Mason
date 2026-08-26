const puppeteer = require('puppeteer');
const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
    let p = path.join(__dirname, 'public', req.url);
    if (fs.existsSync(p) && fs.statSync(p).isFile()) {
        res.end(fs.readFileSync(p));
    } else {
        res.writeHead(404); res.end('Not found');
    }
});
server.listen(8081, async () => {
    try {
        const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
        const page = await browser.newPage();
        
        page.on('console', msg => console.log('LOG:', msg.text()));
        page.on('pageerror', error => {
            console.error('PAGE ERROR MSG:', error.message);
            console.error('PAGE ERROR STACK:', error.stack);
        });
        
        await page.goto('http://localhost:8081/modules/sprites/index.html', { waitUntil: 'networkidle0' });
        
        console.log("Sending LOAD_SPRITE...");
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
        server.close();
        process.exit(0);
    } catch (e) {
        server.close(); process.exit(1);
    }
});
