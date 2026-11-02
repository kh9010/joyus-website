// Study 67: real stones (the worker, Gummy), not Study 65's flat cut; their words from one place; pictures exist; short page.
const fs = require('node:fs');
const path = require('node:path');
let bad = 0;
const say = (ok, m) => { console.log((ok ? '  ok   ' : '  FAIL ') + m); if (!ok) bad++; };
const js = fs.readFileSync(path.join(__dirname, 'trail.js'), 'utf8');
say(js.includes("new Worker('../41/jbuilder.js'") && js.includes("'../41/looks/gummy.js'"), 'the live worker and the Gummy look');
say(!js.includes('voronoi.js'), 'not the flat cut from Study 59');
say(js.includes("fetch('../59/words.json')"), 'their words, from one place');
say(/build\('D', STORY\.D\.length/.test(js) && /build\('K', STORY\.K\.length/.test(js), 'one stone per line');
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const refs = [...html.matchAll(/(?:href|src)="(img\/[^"]+|trail\.html)"/g)].map(m => m[1]);
const lost = refs.filter(r => !fs.existsSync(path.join(__dirname, r)));
say(refs.length >= 11 && !lost.length, refs.length + ' links and pictures exist' + (lost.length ? ': not ' + lost : ''));
const words = html.replace(/<head>[\s\S]*?<\/head>/, '').replace(/<[^>]+>/g, ' ').trim().split(/\s+/).length;
say(words < 100, 'under 100 words (' + words + ')');
process.exitCode = bad ? 1 : 0;
