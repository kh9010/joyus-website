// Study 66: labels still exact; five finishes plus family and box are real renders; every research claim has a link; short page.
const fs = require('node:fs');
const path = require('node:path');
let bad = 0;
const say = (ok, m) => { console.log((ok ? '  ok   ' : '  FAIL ') + m); if (!ok) bad++; };
const log = fs.readFileSync(path.join(__dirname, 'labels.log'), 'utf8').split(/\r?\n/).filter(l => l.startsWith('LABEL'));
const rows = log.map(l => { const m = /LABEL (.+) file ([\d.]+) built ([\d.]+)/.exec(l); return { name: m[1], file: +m[2], built: +m[3] }; });
const wrong = rows.filter(r => Math.abs(r.built / r.file - 1) > .005);
say(rows.length >= 6 && !wrong.length, rows.length + ' labels built, none squished' + (wrong.length ? ': ' + wrong.map(r => r.name).join() : ''));
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const pics = [...html.matchAll(/<a class="zoom" href="(img\/[^"]+)"/g)].map(m => m[1]);
say(pics.length === 8 && pics.every(p => fs.existsSync(path.join(__dirname, p)) && fs.statSync(path.join(__dirname, p)).size > 20000), pics.length + ' real renders');
const words = html.replace(/<head>[\s\S]*?<\/head>/, '').replace(/<[^>]+>/g, ' ').trim().split(/\s+/).length;
say(words < 100, 'under 100 words (' + words + ')');
const r = fs.readFileSync(path.join(__dirname, 'research.md'), 'utf8');
say((r.match(/\]\(https?:\/\//g) || []).length >= 8, 'the research carries its links');
process.exitCode = bad ? 1 : 0;
