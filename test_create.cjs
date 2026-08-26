const puppeteer = require('puppeteer');

(async () => {
    try {
        const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
        const page = await browser.newPage();
        page.on('console', msg => console.log('LOG:', msg.text()));
        page.on('pageerror', err => console.error('PAGE ERROR:', err.message));
        
        await page.setViewport({ width: 1280, height: 800 });
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
        
        // click "Create New Project"
        console.log("Clicking Create New Project...");
        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('h2'));
            const btn = buttons.find(h => h.innerText.includes('Create New Project'));
            if (btn) btn.closest('button').click();
        });
        
        await new Promise(r => setTimeout(r, 1000));
        
        // Now there is a modal to name the project
        console.log("Typing name...");
        await page.evaluate(() => {
            const inputs = document.querySelectorAll('input');
            if (inputs.length > 0) {
                inputs[0].value = 'Test Project';
                const buttons = Array.from(document.querySelectorAll('button'));
                const saveBtn = buttons.find(b => b.innerText.includes('Create Sandbox'));
                if (saveBtn) saveBtn.click();
            }
        });
        
        await new Promise(r => setTimeout(r, 2000));
        
        const html = await page.evaluate(() => document.body.innerHTML);
        
        if (html.includes('Something went wrong')) {
            console.log("ERROR BOUNDARY IS VISIBLE!");
            const errText = await page.evaluate(() => document.querySelector('.whitespace-pre-wrap').innerText);
            console.log("ERROR TEXT:", errText);
        } else {
            console.log("NO ERROR BOUNDARY.");
        }
        
        await page.screenshot({ path: 'created.png' });
        
        await browser.close();
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
})();
