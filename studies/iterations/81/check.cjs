// Study 81: twelve rooms shown; maps stay out of the repo; pictures exist; short page.
const fs = require('node:fs');
const path = require('node:path');
let bad = 0;
const say = (ok, m) => { console.log((ok ? '  ok   ' : '  FAIL ') + m); if (!ok) bad++; };
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const n = [...html.matchAll(/src="img\/c-/g)].length;
say(n === 12, 'twelve rooms on the page (' + n + ')');
say(!fs.readdirSync(__dirname).some(f => /\.(hdr|exr)$/i.test(f)), 'no map files in the repo');
const refs = [...html.matchAll(/(?:href|src)="(img\/[^"]+)"/g)].map(m => m[1]);
const lost = refs.filter(x => !fs.existsSync(path.join(__dirname, x)));
say(!lost.length, refs.length + ' links and pictures exist' + (lost.length ? ': not ' + lost : ''));
const words = html.replace(/<head>[\s\S]*?<\/head>/, '').replace(/<[^>]+>/g, ' ').trim().split(/\s+/).length;
say(words < 100, 'under 100 words (' + words + ')');
say(html.includes('noindex'), 'noindex');
process.exitCode = bad ? 1 : 0;
