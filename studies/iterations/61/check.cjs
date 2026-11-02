// Study 61: uses the live page's worker and look; tells both Abouts from Study 59's words; pictures exist.
const fs = require('node:fs');
const path = require('node:path');
let bad = 0;
const say = (ok, m) => { console.log((ok ? '  ok   ' : '  FAIL ') + m); if (!ok) bad++; };
const read = f => fs.readFileSync(path.join(__dirname, f), 'utf8');
const js = read('two.js');
say(js.includes("new Worker('../41/jbuilder.js'") && js.includes("from '../41/looks/gummy.js'"), 'the real worker and the real look');
say(js.includes("fetch('../59/words.json')"), 'their words, from one place');
for (const f of ['about-letters.html', 'about-carved.html']) say(read(f).includes('<script type="module" src="two.js">'), f);
const html = read('index.html');
const refs = [...html.matchAll(/(?:href|src)="((?:img\/|about-)[^"]+)"/g)].map(m => m[1]);
const lost = refs.filter(r => !fs.existsSync(path.join(__dirname, r)));
say(!lost.length, refs.length + ' links and pictures exist' + (lost.length ? ': not ' + lost.join() : ''));
const words = html.replace(/<head>[\s\S]*?<\/head>/, '').replace(/<[^>]+>/g, ' ').trim().split(/\s+/).length;
say(words < 100, 'under 100 words (' + words + ')');
process.exitCode = bad ? 1 : 0;
