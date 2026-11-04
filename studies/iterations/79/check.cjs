// Study 79: the map is seen only by reflections; maps stay out of the repo; pictures exist; short page.
const fs = require('node:fs');
const path = require('node:path');
let bad = 0;
const say = (ok, m) => { console.log((ok ? '  ok   ' : '  FAIL ') + m); if (!ok) bad++; };
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const s = fs.readFileSync(path.join(__dirname, 'skymap.py'), 'utf8');
say(s.includes("'Is Glossy Ray'"), 'the map shows only in reflections');
say(!fs.readdirSync(__dirname).some(f => /\.(hdr|exr)$/i.test(f)), 'no map files in the repo');
const refs = [...html.matchAll(/(?:href|src)="(img\/[^"]+)"/g)].map(m => m[1]);
const lost = refs.filter(x => !fs.existsSync(path.join(__dirname, x)));
say(refs.length === 16 && !lost.length, refs.length + ' links and pictures exist' + (lost.length ? ': not ' + lost : ''));
const words = html.replace(/<head>[\s\S]*?<\/head>/, '').replace(/<[^>]+>/g, ' ').trim().split(/\s+/).length;
say(words < 100, 'under 100 words (' + words + ')');
say(html.includes('noindex'), 'noindex');
process.exitCode = bad ? 1 : 0;
