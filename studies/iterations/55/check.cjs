// Study 55: five named variants, each a real render linked to itself; few words; no source artwork in the folder.
const fs = require('node:fs');
const path = require('node:path');
let bad = 0;
const say = (ok, m) => { console.log((ok ? '  ok   ' : '  FAIL ') + m); if (!ok) bad++; };
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const pics = [...html.matchAll(/<a class="zoom" href="(img\/[^"]+)"><img src="(img\/[^"]+)"/g)].map(m => [m[1], m[2]]);
say(pics.map(p => path.basename(p[0], '.jpg')).join() === 'noir,atelier,teal,apothecary,infused', 'five variants');
say(pics.every(p => p[0] === p[1]), 'each picture links to its full file');
const small = pics.filter(p => { const f = path.join(__dirname, p[0]); return !fs.existsSync(f) || fs.statSync(f).size < 50000; });
say(!small.length, 'every render exists' + (small.length ? ': not ' + small.join() : ''));
const words = html.replace(/<head>[\s\S]*?<\/head>/, '').replace(/<[^>]+>/g, ' ').trim().split(/\s+/).length;
say(words < 100, 'under 100 words (' + words + ')');
say(!fs.readdirSync(__dirname).some(f => /\.(ai|psd)$/i.test(f)), 'no source artwork in the folder');
process.exitCode = bad ? 1 : 0;
