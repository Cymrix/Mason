const puppeteer = require('puppeteer');
(async () => {
    try {
        const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
        const page = await browser.newPage();
        page.on('console', msg => console.log('LOG:', msg.text()));
        
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
        
        await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('h2'));
            const btn = buttons.find(h => h.innerText.includes('Create New Project'));
            if (btn) btn.closest('button').click();
        });
        await new Promise(r => setTimeout(r, 1000));
        
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
        
        await page.evaluate(() => {
            const divs = Array.from(document.querySelectorAll('div'));
            const spriteDiv = divs.find(d => d.innerText.includes('Image Editor') && d.getAttribute('title') === 'Image Editor (.png)');
            if (spriteDiv) {
                spriteDiv.click();
            }
        });
        await new Promise(r => setTimeout(r, 3000));
        
        const iframeElement = await page.$('iframe');
        if (iframeElement) {
            console.log("Found iframe");
            const frame = await iframeElement.contentFrame();
            if (frame) {
                const bodyHTML = await frame.evaluate(() => document.body.innerHTML);
                console.log("HTML length:", bodyHTML.length);
                const hasToolbar = await frame.evaluate(() => !!document.querySelector('.toolbar-left'));
                const hasCanvas = await frame.evaluate(() => !!document.getElementById('canvasLayerWrapper'));
                console.log("hasToolbar:", hasToolbar);
                console.log("hasCanvas:", hasCanvas);
                
                const errors = await frame.evaluate(() => {
                   return Array.from(document.querySelectorAll('.error, #error')).map(e => e.innerText);
                });
                console.log("Errors in dom?", errors);
            } else {
                console.log("No contentFrame");
            }
        } else {
            console.log("No iframe found");
        }
        await browser.close();
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
})();
