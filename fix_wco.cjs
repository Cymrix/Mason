const fs = require('fs');
const path = 'public/manifest.json';
const manifest = JSON.parse(fs.readFileSync(path, 'utf8'));

if (manifest.display_override) {
  manifest.display_override = manifest.display_override.filter(d => d !== 'window-controls-overlay');
  if (manifest.display_override.length === 0) {
    delete manifest.display_override;
  }
}

fs.writeFileSync(path, JSON.stringify(manifest, null, 2));
