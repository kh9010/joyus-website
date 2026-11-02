// Study 57: two real renders, linked to themselves; motifs keep their painted sizes; no source artwork in the folder.
const fs = require('node:fs');
const path = require('node:path');
let bad = 0;
const say = (ok, m) => { console.log((ok ? '  ok   ' : '  FAIL ') + m); if (!ok) bad++; };
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
for (const f of ['img/flower.jpg', 'img/hand.jpg']) say(html.includes('href="' + f + '"') && fs.existsSync(path.join(__dirname, f)) && fs.statSync(path.join(__dirname, f)).size > 50000, f);
const scene = fs.readFileSync(path.join(__dirname, 'scene.py'), 'utf8');
say(/def true_size\(i, k\):\s+d = M\[i\]\s+return max\(d\['w'\], d\['h'\]\) \* k/.test(scene), 'a motif\'s size comes from its pixels in the scan, one scale for all');
const words = html.replace(/<head>[\s\S]*?<\/head>/, '').replace(/<[^>]+>/g, ' ').trim().split(/\s+/).length;
say(words < 100, 'under 100 words (' + words + ')');
say(!fs.readdirSync(__dirname).some(f => /\.(ai|psd)$/i.test(f)), 'no source artwork in the folder');
process.exitCode = bad ? 1 : 0;
