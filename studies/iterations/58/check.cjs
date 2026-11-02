// Study 58: the sanctity of the label. labels.log is what Blender printed while building: for every label, the file's
// width/height and the width/height it was built at. They must match to within half a percent. Renders real; few words.
const fs = require('node:fs');
const path = require('node:path');
let bad = 0;
const say = (ok, m) => { console.log((ok ? '  ok   ' : '  FAIL ') + m); if (!ok) bad++; };
const log = fs.readFileSync(path.join(__dirname, 'labels.log'), 'utf8').split(/\r?\n/).filter(l => l.startsWith('LABEL'));
const rows = log.map(l => { const m = /LABEL (.+) file ([\d.]+) built ([\d.]+)/.exec(l); return { name: m[1], file: +m[2], built: +m[3] }; });
const wrong = rows.filter(r => Math.abs(r.built / r.file - 1) > .005);
say(rows.length === 14 && !wrong.length, rows.length + ' labels built, none squished' + (wrong.length ? ': ' + wrong.map(r => r.name).join() : ''));
const scene = fs.readFileSync(path.join(__dirname, 'scene.py'), 'utf8');
say(scene.includes("exact_label('oil.png', r, 8.15"), 'the oil has its wide label, on the pump bottle');
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const pics = [...html.matchAll(/<a class="zoom" href="(img\/[^"]+)"/g)].map(m => m[1]);
say(pics.length === 6 && pics.every(p => fs.existsSync(path.join(__dirname, p)) && fs.statSync(path.join(__dirname, p)).size > 40000), '6 real renders');
const words = html.replace(/<head>[\s\S]*?<\/head>/, '').replace(/<[^>]+>/g, ' ').trim().split(/\s+/).length;
say(words < 100, 'under 100 words (' + words + ')');
say(!fs.readdirSync(__dirname).some(f => /\.(ai|psd)$/i.test(f)), 'no source artwork in the folder');
process.exitCode = bad ? 1 : 0;
