const playwright = require('playwright');

(async () => {
  const browser = await playwright.chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG [' + msg.type() + ']:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
  
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  
  // Click "Start New Project" or "Create Project" or existing demo project
  const newProjBtn = await page.locator('button:has-text("Start New Project"), button:has-text("Create New Project"), button:has-text("New Project"), button:has-text("Demo Project"), button:has-text("Sample Project")').first();
  if (await newProjBtn.count() > 0) {
    console.log('Clicking new/demo project button:', await newProjBtn.innerText());
    await newProjBtn.click();
    await page.waitForTimeout(1000);
  }
  
  // Look for "Create" button if in modal
  const confirmBtn = await page.locator('button:has-text("Create Project"), button:has-text("Create"), button:has-text("Start")').first();
  if (await confirmBtn.count() > 0 && await confirmBtn.isVisible()) {
    console.log('Clicking confirm button in modal...');
    await confirmBtn.click();
    await page.waitForTimeout(1000);
  }
  
  // Now we should be in EditorLayout. Let's switch to Sprites tab or open Sprite Editor
  const spriteTab = await page.locator('button:has-text("Sprites"), button:has-text("Sprite Studio"), button:has-text("Sprite Editor")').first();
  if (await spriteTab.count() > 0) {
    console.log('Clicking Sprites tab:', await spriteTab.innerText());
    await spriteTab.click();
    await page.waitForTimeout(2000);
  }
  
  // Check frames
  const frames = page.frames();
  console.log('Frame count after entering Sprites:', frames.length);
  for (let i = 0; i < frames.length; i++) {
    const f = frames[i];
    console.log('Frame', i, 'url:', f.url());
    try {
      const evalRes = await f.evaluate(() => {
        return {
          title: document.title,
          hasLayersVar: typeof layers !== 'undefined',
          layerCount: typeof layers !== 'undefined' && Array.isArray(layers) ? layers.length : null,
          layers: typeof layers !== 'undefined' && Array.isArray(layers) ? layers.map(l => ({ name: l.name, visible: l.visible })) : null,
          hasFramesVar: typeof frames !== 'undefined',
          framesCount: typeof frames !== 'undefined' && Array.isArray(frames) ? frames.length : null,
          currentFrameIdx: typeof currentFrameIndex !== 'undefined' ? currentFrameIndex : null,
          W: typeof W !== 'undefined' ? W : null,
          H: typeof H !== 'undefined' ? H : null,
          displayCanvas: !!document.getElementById('displayCanvas'),
          layerListElem: !!document.getElementById('layerList'),
          layerListChildrenCount: document.getElementById('layerList')?.children?.length,
          layerListHTML: document.getElementById('layerList')?.innerHTML?.substring(0, 300)
        };
      });
      console.log('Frame', i, 'state:', evalRes);
    } catch(e) {
      console.log('Frame', i, 'eval error:', e.message);
    }
  }

  await page.screenshot({ path: 'test_sprite_active.png' });
  await browser.close();
})();
