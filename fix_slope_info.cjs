const fs = require('fs');
let file = fs.readFileSync('src/components/RefinedBiomeEditor.tsx', 'utf8');

file = file.replace(/<span className="text-xs font-semibold text-neutral-200">Slope Overlay<\/span>/g, '<span className="text-xs font-semibold text-neutral-200">Slope Overlay <span className="text-neutral-500 font-normal">(Auto-Rotates)</span></span>');

file = file.replace(/badge="Slope"/g, 'badge="Slope"\n                          sublabel="Upload a 45° Up-Right slope (◢). The engine will automatically rotate/flip it for all other slope angles."');

fs.writeFileSync('src/components/RefinedBiomeEditor.tsx', file);
