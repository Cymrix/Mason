import fs from 'fs';
import { JSDOM } from 'jsdom';
const html = fs.readFileSync('public/modules/sprites/index.html', 'utf-8');
const dom = new JSDOM(html, { runScripts: "dangerously", resources: "usable" });
dom.window.console.log = (...args) => console.log(...args);
dom.window.console.warn = (...args) => console.warn(...args);
dom.window.console.error = (...args) => console.error(...args);
dom.window.onerror = function (message, source, lineno, colno, error) {
  console.log('JSDOM ERROR:', message, error);
};
setTimeout(() => {
  console.log('JSDOM timeout reached.');
}, 2000);
