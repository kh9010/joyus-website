// Study 80: three lights and three cameras in the code; every combination on the page; short page.
const fs = require('node:fs');
const path = require('node:path');
let bad = 0;
const say = (ok, m) => { console.log((ok ? '  ok   ' : '  FAIL ') + m); if (!ok) bad++; };
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const s = fs.readFileSync(path.join(__dirname, 'lighting.py'), 'utf8');
say(["LIT == 'window'", "LIT == 'sun'", "'strip left'", "'three'", "'close'"].every(x => s.includes(x)), 'three lights and the cameras');
const refs = [...html.matchAll(/(?:href|src)="(img\/[^"]+)"/g)].map(m => m[1]);
const lost = refs.filter(x => !fs.existsSync(path.join(__dirname, x)));
say(refs.length === 28 && !lost.length, refs.length + ' links and pictures exist' + (lost.length ? ': not ' + lost : ''));
say(['window', 'sun', 'strips'].every(l => ['straight', 'three', 'close'].every(c => html.includes(`img/g-${l}-${c}.jpg`))), 'all nine combinations shown');
const words = html.replace(/<head>[\s\S]*?<\/head>/, '').replace(/<[^>]+>/g, ' ').trim().split(/\s+/).length;
say(words < 100, 'under 100 words (' + words + ')');
say(html.includes('noindex'), 'noindex');
process.exitCode = bad ? 1 : 0;
