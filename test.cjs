const fs = require('fs');
console.log(fs.readFileSync('src/engine/tileMaterialRenderer.ts', 'utf8').substring(25000));
