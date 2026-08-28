const { JSDOM } = require('jsdom');
const fs = require('fs');
const html = fs.readFileSync('public/modules/sprites/index.html', 'utf8');

const dom = new JSDOM(html);
const doc = dom.window.document;

console.log('App div:', !!doc.querySelector('.app'));
console.log('Main workspace:', !!doc.querySelector('.main-workspace'));
console.log('Timeline grid:', !!doc.getElementById('timelineGridWrap'));
console.log('Groups container:', !!doc.getElementById('groupsContainer'));
console.log('Side panel:', !!doc.querySelector('.side-panel'));
console.log('Tools panel:', !!doc.querySelector('.tools-panel'));
