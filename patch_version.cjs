const fs = require('fs');
let code = fs.readFileSync('src/version.ts', 'utf8');
code = code.replace(
  "export const MASON_VERSION = '0.189';",
  "export const MASON_VERSION = '0.190';"
).replace(
  "export const MASON_VERSION_DISPLAY = 'v0.189';",
  "export const MASON_VERSION_DISPLAY = 'v0.190';"
).replace(
  "export const MASON_FULL_VERSION = 'v0.189';",
  "export const MASON_FULL_VERSION = 'v0.190';"
).replace(
  "export const MASON_RELEASE_HISTORY = [\n  {",
  "export const MASON_RELEASE_HISTORY = [\n  {\n    version: 'v0.190',\n    date: '2026-08-28',\n    changes: [\n      'Fixed mouse-wheel zoom-to-cursor scaling on Map canvases by correctly configuring originMode for the Viewport module.'\n    ]\n  },\n  {"
);
fs.writeFileSync('src/version.ts', code);
let packageJson = fs.readFileSync('package.json', 'utf8');
packageJson = packageJson.replace('"version": "0.189"', '"version": "0.190"');
fs.writeFileSync('package.json', packageJson);
let lockJson = fs.readFileSync('package-lock.json', 'utf8');
lockJson = lockJson.replace('"version": "0.189"', '"version": "0.190"').replace('"version": "0.189"', '"version": "0.190"');
fs.writeFileSync('package-lock.json', lockJson);
