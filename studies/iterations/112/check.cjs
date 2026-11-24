// Study 112: a spine for each of the six TomboyX questions Divya picked from Study 111.
//  - the six are her picks, question and close unchanged from 111
//  - no two share a form, a subject, column heads, an ending or the same three pictures; the tables differ in size
//  - three real slides for each, all present, each a link to its full file
//  - every quoted line is either in the Joyus work deck's TomboyX pages (../110/work-deck-tomboyx.txt) or a title on
//    one of the real slides (slides.txt, typed from the pictures), word for word
//  - no amounts of money anywhere on the page
//  - measured: how many of the same words any two spines use, printed
const fs = require('node:fs');
const path = require('node:path');
const here = __dirname;
let bad = 0;
const say = (ok, msg) => { if (!ok) bad++; console.log((ok ? '  ok   ' : '  FAIL ') + msg); };
const S = JSON.parse(fs.readFileSync(path.join(here, 'spines.json'), 'utf8'));
const Q = JSON.parse(fs.readFileSync(path.join(here, '..', '111', 'questions.json'), 'utf8'));
const html = fs.readFileSync(path.join(here, 'index.html'), 'utf8');
const PICKS = ['01', '05', '06', '08', '10', '20'];
say(S.map(s => s.n).join() === PICKS.join(), 'the six are her picks: ' + S.map(s => s.n).join(' '));
const drift = S.filter(s => Q[+s.n - 1].q !== s.q || Q[+s.n - 1].close !== s.close).map(s => s.n);
say(!drift.length, 'each question and close is the one in Study 111, unchanged' + (drift.length ? ': ' + drift.join(', ') : ''));
const uniq = (k, f) => { const v = S.map(f); const d = v.filter((x, i) => v.indexOf(x) !== i); say(!d.length, 'no two share ' + k + (d.length ? ': ' + d.join(' | ') : '')); };
uniq('a form', s => s.form); uniq('a subject', s => s.subject); uniq('column heads', s => s.heads.join(' / ')); uniq('an ending', s => s.end); uniq('the same three pictures', s => s.frames.map(f => f[0]).sort().join());
say(new Set(S.map(s => s.rows.length + 'x' + s.heads.length)).size >= 3, 'the tables differ in size: ' + S.map(s => s.rows.length + 'x' + s.heads.length).join(' '));
say(S.every(s => s.rows.every(r => r.length === s.heads.length)), 'every row fits its own heads');
say(S.every(s => s.frames.length === 3 && s.frames.every(([f]) => fs.existsSync(path.join(here, 'img', f)))), 'three real slides for each, all present');
const figs = [...html.matchAll(/<a class="zoom" href="([^"]+)"><img src="([^"]+)"/g)];
say(figs.length === 18 && figs.every(m => m[1] === m[2]), 'every picture is a link to its own full file');
const dec = (t) => t.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
say(S.every(s => dec(html).includes(s.form) && dec(html).includes(s.end) && s.rows.flat().every(c => dec(html).includes(c))), 'everything in the list is on the page');
say((html.match(/class="item"/g) || []).length === 6 && !/class="(eyebrow|lede)"/.test(html), 'one tick box per spine; nothing above the title');
const body = (s) => [s.form, s.subject, ...s.heads, ...s.rows.flat(), s.end].join(' ');
const quotes = S.flatMap(s => [...body(s).matchAll(/“([^”]+)”/g)].map(m => ({ q: m[1], n: s.n })));
const norm = (t) => t.toLowerCase().replace(/[“”"]/g, '"').replace(/[‘’']/g, "'").replace(/\s+/g, ' ').replace(/\.$/, '');
const hay = norm(fs.readFileSync(path.join(here, '..', '110', 'work-deck-tomboyx.txt'), 'utf8') + ' ' + fs.readFileSync(path.join(here, 'slides.txt'), 'utf8'));
const lost = quotes.filter(a => !hay.includes(norm(a.q)));
say(!lost.length, 'all ' + quotes.length + ' quoted lines are in the work deck or on a real slide, word for word' + (lost.length ? ':\n' + lost.map(a => '         ' + a.n + ': ' + a.q).join('\n') : ''));
say(!/[$£€]\s?\d|\d\s?(million|k\b|m\b)/i.test(S.map(body).join(' ')), 'no amounts of money');
const STOP = new Set('the a an and or of to in on for with it its is was that this they them their you your we our what who how not no at from by be as one each than then so'.split(' '));
const words = (t) => new Set(t.toLowerCase().replace(/[^a-z\s]/g, ' ').split(/\s+/).filter(w => w.length > 2 && !STOP.has(w)));
const W = S.map(body).map(words); let sum = 0, n = 0, max = 0;
for (let i = 0; i < W.length; i++) for (let j = i + 1; j < W.length; j++) { const inter = [...W[i]].filter(w => W[j].has(w)).length; const v = inter / (W[i].size + W[j].size - inter); sum += v; n++; if (v > max) max = v; }
say(max < .2, 'words two spines share: ' + (sum / n * 100).toFixed(1) + '% on average, ' + (max * 100).toFixed(1) + '% at most');
process.exitCode = bad ? 1 : 0;
