const fs = require('fs');
let file = fs.readFileSync('src/engine/refinedBiomes.ts', 'utf8');

// Replace duplicate materialType and bevelProbability
file = file.replace(/materialType: 'hard',\s*bevelProbability: 0,\s*([\s\S]*?)materialType: 'soft',\s*(softness: [0-9.]+,\s*)?bevelProbability: 1\.0,/g, "materialType: 'soft',\n        bevelProbability: 1.0,\n        $1$2");

fs.writeFileSync('src/engine/refinedBiomes.ts', file);
