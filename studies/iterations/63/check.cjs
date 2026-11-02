// Study 63: five wireframes, each with both stones and a place for the story; pictures exist; few words.
const fs = require('node:fs');
const path = require('node:path');
let bad = 0;
const say = (ok, m) => { console.log((ok ? '  ok   ' : '  FAIL ') + m); if (!ok) bad++; };
const read = f => fs.readFileSync(path.join(__dirname, f), 'utf8');
for (const v of ['a', 'b', 'c', 'd', 'e']) {
  const h = read('wire-' + v + '.html');
  say(h.includes('data-pick="D"') && h.includes('data-pick="K"') && h.includes('data-story') && h.includes('wire.js'), v.toUpperCase() + ': both stones, a story, the shared picking');
}
const html = read('index.html');
const refs = [...html.matchAll(/(?:href|src)="((?:img\/|wire-)[^"]+)"/g)].map(m => m[1]);
const lost = refs.filter(r => !fs.existsSync(path.join(__dirname, r)));
say(!lost.length, refs.length + ' links and pictures exist' + (lost.length ? ': not ' + lost.join() : ''));
const words = html.replace(/<head>[\s\S]*?<\/head>/, '').replace(/<[^>]+>/g, ' ').trim().split(/\s+/).length;
say(words < 100, 'under 100 words (' + words + ')');
process.exitCode = bad ? 1 : 0;
