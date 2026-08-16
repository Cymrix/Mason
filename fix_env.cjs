const fs = require('fs');
let file = fs.readFileSync('src/utils/pwa.ts', 'utf8');
file = file.replace(/import\.meta\.env\.BASE_URL \+ 'sw\.js'/g, "'./sw.js'");
fs.writeFileSync('src/utils/pwa.ts', file);
