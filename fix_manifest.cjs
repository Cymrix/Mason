const fs = require('fs');
let manifest = JSON.parse(fs.readFileSync('public/manifest.json', 'utf8'));

manifest.id = ".";
manifest.start_url = ".";
manifest.scope = ".";

if (manifest.icons) {
  manifest.icons.forEach(i => {
    if (i.src.startsWith('/')) i.src = '.' + i.src;
  });
}

if (manifest.screenshots) {
  manifest.screenshots.forEach(i => {
    if (i.src.startsWith('/')) i.src = '.' + i.src;
  });
}

if (manifest.shortcuts) {
  manifest.shortcuts.forEach(s => {
    if (s.url.startsWith('/')) s.url = '.' + s.url;
    if (s.icons) {
      s.icons.forEach(i => {
        if (i.src.startsWith('/')) i.src = '.' + i.src;
      });
    }
  });
}

fs.writeFileSync('public/manifest.json', JSON.stringify(manifest, null, 2));
