const fs = require('fs');
let file = fs.readFileSync('src/components/RefinedBiomeEditor.tsx', 'utf8');

file = file.replace(/enabled: true,/g, "");
file = file.replace(/enabled: false,/g, "");
file = file.replace(/enabled: true/g, "");
file = file.replace(/enabled: false/g, "");

fs.writeFileSync('src/components/RefinedBiomeEditor.tsx', file);
