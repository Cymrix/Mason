const puppeteer = require('puppeteer');
(async () => {
    try {
        const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 800 });
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
                const saveBtn = buttons.find(b => b.innerText.includes('Create Project') && b.type === 'submit');
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
        
        await page.screenshot({ path: 'sprite_real.png' });
        
        await browser.close();
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
})();
