// Study 74: the bottle is derived from the label's print size; pictures exist; downloaded assets stay out of the repo; short page.
const fs = require('node:fs');
const path = require('node:path');
let bad = 0;
const say = (ok, m) => { console.log((ok ? '  ok   ' : '  FAIL ') + m); if (!ok) bad++; };
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const a = fs.readFileSync(path.join(__dirname, 'atmos.py'), 'utf8');
say(a.includes('LW, LH = 102 / 72 * 2.54, 224 / 72 * 2.54') && a.includes('STRAIGHT = Z0 + LH'), "the body's height is set from the label's print size");
const w = 102 / 72 * 2.54, h = 224 / 72 * 2.54;
say(Math.abs(w - 3.6) < .01 && Math.abs(h - 7.9) < .01, 'the print size is 3.6 x 7.9 cm');
const refs = [...html.matchAll(/(?:href|src)="(img\/[^"]+)"/g)].map(m => m[1]);
const lost = refs.filter(r => !fs.existsSync(path.join(__dirname, r)));
say(refs.length === 6 && !lost.length, '3 pictures, each linking to its file' + (lost.length ? ': not ' + lost : ''));
const all = fs.readdirSync(__dirname);
say(!all.some(f => /\.(hdr|exr|gltf|bin)$/i.test(f)), 'the environment and scans are not in the repo');
const words = html.replace(/<head>[\s\S]*?<\/head>/, '').replace(/<[^>]+>/g, ' ').trim().split(/\s+/).length;
say(words < 100, 'under 100 words (' + words + ')');
say(html.includes('noindex'), 'noindex');
process.exitCode = bad ? 1 : 0;
