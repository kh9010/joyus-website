// Study 82: bevel and subdivision on the metal and plastic; every step on the page; short page.
const fs = require('node:fs');
const path = require('node:path');
let bad = 0;
const say = (ok, m) => { console.log((ok ? '  ok   ' : '  FAIL ') + m); if (!ok) bad++; };
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const s = fs.readFileSync(path.join(__dirname, 'geometry.py'), 'utf8');
say(s.includes("'BEVEL'") && s.includes("'SUBSURF'"), 'bevel, then subdivision');
const refs = [...html.matchAll(/(?:href|src)="(img\/[^"]+)"/g)].map(m => m[1]);
const lost = refs.filter(x => !fs.existsSync(path.join(__dirname, x)));
say(refs.length === 18 && !lost.length, refs.length + ' links and pictures exist' + (lost.length ? ': not ' + lost : ''));
const words = html.replace(/<head>[\s\S]*?<\/head>/, '').replace(/<[^>]+>/g, ' ').trim().split(/\s+/).length;
say(words < 100, 'under 100 words (' + words + ')');
say(html.includes('noindex'), 'noindex');
process.exitCode = bad ? 1 : 0;
