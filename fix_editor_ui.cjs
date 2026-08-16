const fs = require('fs');
let file = fs.readFileSync('src/components/RefinedBiomeEditor.tsx', 'utf8');

const fields = [
  { key: 'top', label: 'Top Edge (Grass / Ridge Trim)' },
  { key: 'bottom', label: 'Bottom Overlay' },
  { key: 'leftSide', label: 'Left Side Overlay' },
  { key: 'rightSide', label: 'Right Side Overlay' },
  { key: 'slope', label: 'Slope Overlay' },
  { key: 'innerCorner', label: 'Inner Corner Overlay' }
];

fields.forEach(field => {
  // Regex to match the checkbox wrapper logic block
  // We want to replace the whole `<div className="flex items-center justify-between px-1">...</div>`
  // And remove `{selectedTileType.tileDetails.KEY.enabled && (` and `)}`
  
  const regexHeader = new RegExp(`<div className="flex items-center justify-between px-1">[\\s\\S]*?<span className="text-xs font-semibold text-neutral-200">${field.label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}<\\/span>[\\s\\S]*?<\\/div>`, 'g');
  file = file.replace(regexHeader, `<div className="flex items-center justify-between px-1"><span className="text-xs font-semibold text-neutral-200">${field.label}</span></div>`);
  
  if (field.key === 'slope' || field.key === 'innerCorner') {
    const regexCondStart = new RegExp(`{\\(selectedTileType\\.tileDetails as any\\)\\.${field.key}\\?\\.enabled && \\(`, 'g');
    file = file.replace(regexCondStart, '{true && (');
  } else {
    const regexCondStart = new RegExp(`{selectedTileType\\.tileDetails\\.${field.key}\\.enabled && \\(`, 'g');
    file = file.replace(regexCondStart, '{true && (');
  }
});

// Remove any lingering `enabled: true` and `enabled: false` from refinedBiomes.ts as well just to clean it up
let biomesFile = fs.readFileSync('src/engine/refinedBiomes.ts', 'utf8');
biomesFile = biomesFile.replace(/enabled: true,/g, "");
biomesFile = biomesFile.replace(/enabled: false,/g, "");
fs.writeFileSync('src/engine/refinedBiomes.ts', biomesFile);

fs.writeFileSync('src/components/RefinedBiomeEditor.tsx', file);
