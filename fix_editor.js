const fs = require('fs');
let file = fs.readFileSync('src/components/RefinedBiomeEditor.tsx', 'utf8');

// Replace the incorrect ones
file = file.replace(/                      isDestructible: true,\n      materialType: 'hard',\n      bevelProbability: 0,/g, "                      isDestructible: true,");

fs.writeFileSync('src/components/RefinedBiomeEditor.tsx', file);
