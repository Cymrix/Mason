const fs = require('fs');
let file = fs.readFileSync('index.html', 'utf8');
file = file.replace(/href="\/manifest\.json"/g, 'href="./manifest.json"');
file = file.replace(/href="\/favicon\.svg"/g, 'href="./favicon.svg"');
file = file.replace(/href="\/icon-192\.png"/g, 'href="./icon-192.png"');
file = file.replace(/href="\/icon-512\.png"/g, 'href="./icon-512.png"');
fs.writeFileSync('index.html', file);
