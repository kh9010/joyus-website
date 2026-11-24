// Study 108: five ways to build the story for one question (Divya on 107: liked the other two, "we should figure
// out a few more ways to architect this").
//  - the question and the close are the ones she picked (Study 102, no. 25), unchanged
//  - five ways; no two share a form, an idea, column heads or an ending; the tables differ in size
//  - three frames each, and the frames of any two ways are different
//  - every quoted line is one of the team's notes or one of their own labels on the board, word for word, and the
//    counts in "Counted in question marks" are recounted from the board. The board is kept out of the public repo
//    in .site-rebuild/agemo-figma; where it is missing these two parts are skipped and say so.
const fs = require('node:fs');
const path = require('node:path');
const here = __dirname;
const repo = path.resolve(here, '..', '..', '..');
let bad = 0;
const say = (ok, msg) => { if (!ok) bad++; console.log((ok ? '  ok   ' : '  FAIL ') + msg); };
const D = JSON.parse(fs.readFileSync(path.join(here, 'ways.json'), 'utf8')), W = D.ways;
const Q = JSON.parse(fs.readFileSync(path.join(here, '..', '102', 'questions.json'), 'utf8'))[24];
const html = fs.readFileSync(path.join(here, 'index.html'), 'utf8');
say(D.q === Q.q && D.close === Q.close, 'the question and the close are no. 25 from Study 102, unchanged');
say(W.length === 5, W.length + ' ways');
const uniq = (k, f) => { const v = W.map(f); const d = v.filter((x, i) => v.indexOf(x) !== i); say(!d.length, 'no two share ' + k + (d.length ? ': ' + d.join(' | ') : '')); };
uniq('a form', w => w.form); uniq('an idea', w => w.idea); uniq('column heads', w => w.heads.join(' / ')); uniq('an ending', w => w.end);
say(new Set(W.map(w => w.rows.length + 'x' + w.heads.length)).size >= 4, 'the tables differ in size: ' + W.map(w => w.rows.length + 'x' + w.heads.length).join(' '));
say(W.every(w => w.rows.every(r => r.length === w.heads.length)), 'every row fits its own heads');
const frames = html.split('<div class="frames">').slice(1).map(s => s.split('<table')[0]);
say(frames.length === 5 && frames.every(f => (f.match(/<div class="fr /g) || []).length === 3), 'three frames for each way');
say(new Set(frames).size === 5, 'no two ways have the same frames');
const dec = (t) => t.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
say(W.every(w => dec(html).includes(w.form) && dec(html).includes(w.idea) && dec(html).includes(w.end) && w.rows.flat().every(c => dec(html).includes(c))), 'everything in the list is on the page');
say((html.match(/class="item"/g) || []).length === 5 && !/class="(eyebrow|lede)"/.test(html), 'one tick box per way; nothing above the title');
const imgs = [...html.matchAll(/<a class="zoom" href="([^"]+)"><img src="([^"]+)"/g)];
say(imgs.length === 3 && imgs.every(m => m[1] === m[2] && fs.existsSync(path.join(here, m[1]))), imgs.length + ' real screen crops, each a link to its own full file');

function quotes(t) {
  const out = []; let depth = 0, start = -1;
  for (let i = 0; i < t.length; i++) { if (t[i] === '“') { if (depth === 0) start = i + 1; depth++; } else if (t[i] === '”' && depth > 0) { depth--; if (depth === 0) out.push(t.slice(start, i)); } }
  return out;
}
const text = W.map(w => [w.idea, ...w.rows.flat(), w.end].join(' ')).join(' ') + ' ' + frames.join(' ').replace(/<[^>]+>/g, ' ');
const all = [...new Set(quotes(dec(text)))];
const src = path.join(repo, '.site-rebuild', 'agemo-figma', 'raw', 'board-codewords-ux.xml.txt');
if (!fs.existsSync(src)) console.log('  skip ' + all.length + ' quotes and the counts against the board: .site-rebuild/agemo-figma is not on this machine');
else {
  const t = fs.readFileSync(src, 'utf8'), a = t.indexOf('name="Ideal flow"'), s1 = t.indexOf('<section', a + 10), sec = t.slice(t.lastIndexOf('<section', a), s1 < 0 ? undefined : s1);
  const un = (x) => { for (let i = 0; i < 2; i++) x = x.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&'); return x.replace(/\s+/g, ' ').trim(); };
  const norm = (x) => un(x).replace(/[“”"]/g, '"').replace(/[‘’']/g, "'");
  const hay = norm(sec);
  // frames shorten some notes with an ellipsis: each piece between ellipses has to be in the board
  const lost = all.filter(q => !q.split('…').map(s => s.trim()).filter(Boolean).every(piece => hay.includes(norm(piece))));
  say(!lost.length, 'all ' + all.length + ' quoted lines are the team\'s, word for word' + (lost.length ? ':\n' + lost.map(q => '         ' + q).join('\n') : ''));
  // recount: notes and question marks per step, a note belonging to the last lane label at or left of it
  const num = (tag, k) => { const m = tag.match(new RegExp(' ' + k + '="(-?[0-9.]+)"')); return m ? +m[1] : 0; };
  const lanes = [['Home', 304], ['A prompt', 2016], ['The build', 3535], ['The run', 5968]];
  const notes = [...sec.matchAll(/<sticky ([^>]*)>([\s\S]*?)<\/sticky>/g)].map(m => ({ x: num(' ' + m[1], 'x'), t: un(m[2]) })).filter(n => !/mental model$/.test(n.t));
  const got = lanes.map(([name], i) => { const g = notes.filter(n => n.x >= (i ? lanes[i][1] - 60 : -1e9) && n.x < (lanes[i + 1] ? lanes[i + 1][1] - 60 : 1e9)); return [name, String(g.length), String(g.reduce((s, n) => s + (n.t.match(/\?/g) || []).length, 0))]; });
  const want = W.find(w => w.k === 'count').rows;
  say(JSON.stringify(got) === JSON.stringify(want), 'the counts are the board\'s: ' + got.map(r => r[0] + ' ' + r[1] + ' notes, ' + r[2] + ' question marks').join('; '));
}
process.exitCode = bad ? 1 : 0;
