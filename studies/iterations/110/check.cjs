// Study 110: TomboyX, the thesis page.
//  - four steps (had, asked for, found, built), then the thesis, in that order
//  - pictures at most three to a row, every one a link to its full file
//  - every quoted line is in the Joyus work deck's TomboyX pages, word for word (typed out in
//    work-deck-tomboyx.txt from the PDF in this repo)
const fs = require('node:fs');
const path = require('node:path');
const here = __dirname;
let bad = 0;
const say = (ok, msg) => { if (!ok) bad++; console.log((ok ? '  ok   ' : '  FAIL ') + msg); };
const html = fs.readFileSync(path.join(here, 'index.html'), 'utf8');
const heads = [...html.matchAll(/<h2>([^<]+)<\/h2>/g)].map(m => m[1]);
say(heads.join(' / ') === 'They had / They asked for / We found / We built', 'four steps in order: ' + heads.join(' / '));
say(html.indexOf('class="thesis"') > html.lastIndexOf('<h2>'), 'the thesis comes last');
const rows = html.split('<div class="v">').slice(1).map(r => (r.split('</div>')[0].match(/<figure>/g) || []).length);
say(rows.every(n => n >= 1 && n <= 3), 'pictures at most three to a row (' + rows.join(', ') + ')');
const figs = [...html.matchAll(/<figure><a class="zoom" href="([^"]+)"><img src="([^"]+)"/g)];
say(figs.length === 5 && figs.every(m => m[1] === m[2] && fs.existsSync(path.join(here, m[1]))), figs.length + ' pictures, each a link to its own full file');
const body = html.slice(html.indexOf('<main>')).replace(/<[^>]+>/g, ' ');
const qs = [...body.matchAll(/“([^”]+)”/g)].map(m => m[1]);
const norm = (t) => t.replace(/[“”"]/g, '"').replace(/[‘’']/g, "'").replace(/\s+/g, ' ').replace(/\.$/, '');
const hay = norm(fs.readFileSync(path.join(here, 'work-deck-tomboyx.txt'), 'utf8'));
const lost = qs.filter(q => !hay.includes(norm(q)));
say(qs.length === 6 && !lost.length, qs.length + ' quoted lines, all in the work deck word for word' + (lost.length ? ': ' + lost.join(' | ') : ''));
say(!/class="(eyebrow|lede)"/.test(html) && /<meta name="robots" content="noindex/.test(html), 'nothing above the title; noindex');
process.exitCode = bad ? 1 : 0;
