// Study 75: the set is the tutorials' set; the research carries its sources; pictures exist; short page.
const fs = require('node:fs');
const path = require('node:path');
let bad = 0;
const say = (ok, m) => { console.log((ok ? '  ok   ' : '  FAIL ') + m); if (!ok) bad++; };
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const s = fs.readFileSync(path.join(__dirname, 'studio.py'), 'utf8');
const r = fs.readFileSync(path.join(__dirname, 'research.md'), 'utf8');
say(['def card(', 'def flag(', "'acrylic'", 'caustics_refractive = True'].every(x => s.includes(x)), 'gradient cards, flags, a black floor, real caustics');
say((r.match(/https?:\/\//g) || []).length >= 6, 'the research links its sources');
say(r.includes('could not watch the videos'), 'it says what was not seen');
const refs = [...html.matchAll(/(?:href|src)="((?:img\/|\.\.\/73\/|research)[^"]+)"/g)].map(m => m[1]);
const lost = refs.filter(x => !fs.existsSync(path.join(__dirname, x)));
say(refs.length >= 6 && !lost.length, refs.length + ' links and pictures exist' + (lost.length ? ': not ' + lost : ''));
const words = html.replace(/<head>[\s\S]*?<\/head>/, '').replace(/<[^>]+>/g, ' ').trim().split(/\s+/).length;
say(words < 100, 'under 100 words (' + words + ')');
say(html.includes('noindex'), 'noindex');
process.exitCode = bad ? 1 : 0;
