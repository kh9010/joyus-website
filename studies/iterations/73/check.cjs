// Study 73: every shot defined in combos.py has its picture on the page; nothing lifted from her references goes in the repo; short page.
const fs = require('node:fs');
const path = require('node:path');
let bad = 0;
const say = (ok, m) => { console.log((ok ? '  ok   ' : '  FAIL ') + m); if (!ok) bad++; };
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const combos = fs.readFileSync(path.join(__dirname, 'combos.py'), 'utf8');
const shots = [...combos.matchAll(/@shot\ndef (\w+)\(\)/g)].map(m => m[1]);
say(shots.length === 25, '25 shots defined (' + shots.length + ')');
const lost = shots.filter(s => !html.includes('img/' + s + '.jpg') || !fs.existsSync(path.join(__dirname, 'img', s + '.jpg')));
say(!lost.length, 'each has its picture on the page' + (lost.length ? ': not ' + lost : ''));
const extra = fs.readdirSync(path.join(__dirname, 'img')).filter(f => !shots.includes(f.replace('.jpg', '')));
say(!extra.length, "only this study's own renders in img" + (extra.length ? ': ' + extra : ''));
const words = html.replace(/<head>[\s\S]*?<\/head>/, '').replace(/<[^>]+>/g, ' ').trim().split(/\s+/).length;
say(words < 120, 'under 120 words (' + words + ')');
say(html.includes('noindex'), 'noindex');
process.exitCode = bad ? 1 : 0;
