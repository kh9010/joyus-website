// Study 77: three different metals in code; the blown-out scan is not used; pictures exist; short page.
const fs = require('node:fs');
const path = require('node:path');
let bad = 0;
const say = (ok, m) => { console.log((ok ? '  ok   ' : '  FAIL ') + m); if (!ok) bad++; };
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const s = fs.readFileSync(path.join(__dirname, 'texture.py'), 'utf8');
say(["METAL == 'brushed'", "METAL == 'blasted'", 'ShaderNodeTexVoronoi'].every(x => s.includes(x)), 'brushed, blasted and beaten are different surfaces');
say(!s.includes("paper-tooth.png"), 'the JPEG-noise paper from the scan stays out');
const refs = [...html.matchAll(/(?:href|src)="(img\/[^"]+)"/g)].map(m => m[1]);
const lost = refs.filter(x => !fs.existsSync(path.join(__dirname, x)));
say(refs.length === 18 && !lost.length, refs.length + ' links and pictures exist' + (lost.length ? ': not ' + lost : ''));
const words = html.replace(/<head>[\s\S]*?<\/head>/, '').replace(/<[^>]+>/g, ' ').trim().split(/\s+/).length;
say(words < 100, 'under 100 words (' + words + ')');
say(html.includes('noindex'), 'noindex');
process.exitCode = bad ? 1 : 0;
