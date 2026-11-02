// Study 53: five steps in story order, each a real render linked to itself; few words; the originals stay out of the repo.
const fs = require('node:fs');
const path = require('node:path');
let bad = 0;
const say = (ok, m) => { console.log((ok ? '  ok   ' : '  FAIL ') + m); if (!ok) bad++; };
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const pics = [...html.matchAll(/<a class="zoom" href="(img\/[^"]+)"><img src="(img\/[^"]+)"/g)].map(m => [m[1], m[2]]);
say(pics.map(p => path.basename(p[0], '.jpg')).join() === 'one,set,border,bottle,family', 'five steps, in order');
say(pics.every(p => p[0] === p[1]), 'each picture links to its full file');
const small = pics.filter(p => { const f = path.join(__dirname, p[0]); return !fs.existsSync(f) || fs.statSync(f).size < 60000; });
say(!small.length, 'every render exists and is a real picture' + (small.length ? ': not ' + small.join() : ''));
const words = html.replace(/<style[\s\S]*?<\/style>/, '').replace(/<head>[\s\S]*?<\/head>/, '').replace(/<[^>]+>/g, ' ').trim().split(/\s+/).length;
say(words < 100, 'under 100 words (' + words + ')');
const big = fs.readdirSync(__dirname).filter(f => /\.(ai|psd)$/i.test(f));
say(!big.length, 'no source artwork in the folder');
const scene = fs.readFileSync(path.join(__dirname, 'scene.py'), 'utf8');
for (const c of ['#55c2b4', '#b4d88f', '#d8e37b', '#fed767', '#ef4d4d']) say(scene.includes(c), c + ' from the brand guide');
process.exitCode = bad ? 1 : 0;
