import fs from 'fs';
import path from 'path';

// Let's create an HTML/canvas-free standard PNG or SVG for PWA
const svgContent = fs.readFileSync(path.resolve('./public/favicon.svg'), 'utf-8');
fs.writeFileSync(path.resolve('./public/icon.svg'), svgContent);
console.log('Icons generated successfully.');
