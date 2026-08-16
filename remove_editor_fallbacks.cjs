const fs = require('fs');
let file = fs.readFileSync('src/components/RefinedBiomeEditor.tsx', 'utf8');

// Replace fallbackColor and fallbackText for overlays
const overlays = ['Top', 'Bottom', 'Left', 'Right', 'Slope', 'Inner'];

overlays.forEach(o => {
  file = file.replace(new RegExp(`fallbackColor="[^"]*"\\s*fallbackText="${o}"`, 'g'), '');
});

fs.writeFileSync('src/components/RefinedBiomeEditor.tsx', file);
