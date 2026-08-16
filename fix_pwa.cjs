const fs = require('fs');

// Fix utils/pwa.ts
let pwaTs = fs.readFileSync('src/utils/pwa.ts', 'utf8');
pwaTs = pwaTs.replace(/\.register\('\/sw\.js'\)/, ".register(import.meta.env.BASE_URL + 'sw.js')");
fs.writeFileSync('src/utils/pwa.ts', pwaTs);

// Fix public/sw.js
let swJs = fs.readFileSync('public/sw.js', 'utf8');
// Replace absolute paths with relative ones in the ASSETS_TO_CACHE array
swJs = swJs.replace(/'\/'/g, "'.'");
swJs = swJs.replace(/'\/([a-zA-Z0-9_.\-]+)'/g, "'./$1'");
swJs = swJs.replace(/'\/modules\//g, "'./modules/");
fs.writeFileSync('public/sw.js', swJs);

