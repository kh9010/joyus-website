// Study 104: the nine spines again, made unlike each other (Divya on 103: "all of these seem too
// similar to each other").
//  - the nine are her picks, question and close unchanged from Study 102
//  - three types, three each
//  - no two share a form, a shape, a subject, the same column heads, a picture or a quoted line
//  - the nine do not all have the same number of rows or columns
//  - measured: how many of the same words any two spines use (their rows, form and ending, with the
//    question and close left out). It has to be lower than Study 103's, and the number is printed.
//  - every quoted line is in the source material, word for word (skipped where the sources, kept
//    out of the public repo in .site-rebuild/agemo-figma, are not on the machine)
const fs = require('node:fs');
const path = require('node:path');
const here = __dirname;
const repo = path.resolve(here, '..', '..', '..');
let bad = 0;
const say = (ok, msg) => { if (!ok) bad++; console.log((ok ? '  ok   ' : '  FAIL ') + msg); };
const S = JSON.parse(fs.readFileSync(path.join(here, 'spines.json'), 'utf8'));
const Q = JSON.parse(fs.readFileSync(path.join(here, '..', '102', 'questions.json'), 'utf8'));
const html = fs.readFileSync(path.join(here, 'index.html'), 'utf8');

const PICKS = ['04', '05', '10', '12', '13', '14', '17', '21', '25'];
say(S.map(s => s.n).sort().join() === PICKS.join(), 'the nine are her picks: ' + S.map(s => s.n).sort().join(' '));
const drift = S.filter(s => Q[+s.n - 1].q !== s.q || Q[+s.n - 1].close !== s.close).map(s => s.n);
say(!drift.length, 'each question and close is the one in Study 102, unchanged' + (drift.length ? ': ' + drift.join(', ') : ''));
const by = {}; for (const s of S) (by[s.type] = by[s.type] || []).push(s.n);
say(Object.keys(by).join(' / ') === 'Product design / Product strategy / Storytelling' && Object.values(by).every(v => v.length === 3), 'three types, three each');

const uniq = (k, f) => { const v = S.flatMap(f); const d = v.filter((x, i) => v.indexOf(x) !== i); say(!d.length, 'no two share ' + k + (d.length ? ': ' + [...new Set(d)].join(' | ') : '')); };
uniq('a form', s => [s.form]); uniq('a shape', s => [s.shape]); uniq('a subject', s => [s.subject]);
uniq('the same column heads', s => [s.heads.join(' / ')]); uniq('a picture', s => s.imgs.map(i => i[0]));
say(new Set(S.map(s => s.rows.length + 'x' + s.heads.length)).size >= 4, 'the tables differ in size: ' + S.map(s => s.rows.length + 'x' + s.heads.length).join(' '));
say(S.every(s => s.rows.every(r => r.length === s.heads.length)), 'every row fits its own heads');
say(S.every(s => s.imgs.every(([f]) => fs.existsSync(path.join(here, 'img', f)))), 'every picture exists');

function quotes(t) {
  const out = []; let depth = 0, start = -1;
  for (let i = 0; i < t.length; i++) {
    if (t[i] === '“') { if (depth === 0) start = i + 1; depth++; }
    else if (t[i] === '”' && depth > 0) { depth--; if (depth === 0) out.push(t.slice(start, i)); }
  }
  return out;
}
const body = (s) => [s.form, s.subject, ...s.heads, ...s.rows.flat(), s.end].join(' ');
const all = S.flatMap(s => quotes(body(s)).map(q => ({ q, n: s.n })));
const dupQ = all.filter((a, i) => all.findIndex(b => b.q === a.q) !== i).map(a => a.q);
say(!dupQ.length, all.length + ' quoted lines, none used in two spines' + (dupQ.length ? ': ' + dupQ.join(' | ') : ''));

// how alike are two spines? shared words over all words, small words left out
const STOP = new Set('the a an and or of to in on for with it its is was that this they them their you your we our what who how not no at from by be as one each than then so'.split(' '));
const words = (t) => new Set(t.toLowerCase().replace(/[^a-z\s]/g, ' ').split(/\s+/).filter(w => w.length > 2 && !STOP.has(w)));
const alike = (texts) => { const W = texts.map(words); let sum = 0, n = 0, max = 0; for (let i = 0; i < W.length; i++) for (let j = i + 1; j < W.length; j++) { const inter = [...W[i]].filter(w => W[j].has(w)).length; const v = inter / (W[i].size + W[j].size - inter); sum += v; n++; if (v > max) max = v; } return { mean: sum / n, max }; };
const now = alike(S.map(body));
const before = JSON.parse(fs.readFileSync(path.join(here, '..', '103', 'spines.json'), 'utf8'));
const then = alike(before.map(s => [s.idea, ...s.beats.flatMap(b => [b.say, b.show])].join(' ')));
const pc = (v) => (v * 100).toFixed(1) + '%';
say(now.mean < then.mean && now.max < then.max, 'words two spines share: ' + pc(now.mean) + ' on average, ' + pc(now.max) + ' at most (Study 103: ' + pc(then.mean) + ', ' + pc(then.max) + ')');

const dec = (t) => t.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const page = dec(html);
say(S.every(s => page.includes(s.q) && page.includes(s.form) && page.includes(s.end) && s.rows.flat().every(c => page.includes(c))), 'everything in the list is on the page');
say((html.match(/class="item"/g) || []).length === S.length && (html.match(/<svg class="shape"/g) || []).length === S.length, 'one tick box and one drawing per spine');
say(!/class="(eyebrow|lede)"/.test(html), 'the title, then the spines: nothing above or under the title');

const src = path.join(repo, '.site-rebuild', 'agemo-figma');
if (!fs.existsSync(src)) console.log('  skip ' + all.length + ' quotes against the sources: .site-rebuild/agemo-figma is not on this machine');
else {
  const norm = (t) => dec(dec(t)).replace(/&#39;/g, "'").replace(/[“”"]/g, '"').replace(/[‘’']/g, "'").replace(/\\n/g, ' ').replace(/\\"/g, '"').replace(/\s+/g, ' ');
  let hay = '';
  for (const f of ['deck.md', 'proposal-finalised.txt', 'raw/board-user-journey.xml.txt', 'raw/board-codewords-ux.xml.txt', 'raw/ui-final-pages-metadata.json']) hay += ' ' + fs.readFileSync(path.join(src, f), 'utf8');
  hay = norm(hay);
  const lost = all.filter(a => !hay.includes(norm(a.q)));
  say(!lost.length, 'all ' + all.length + ' quoted lines are in the sources, word for word' + (lost.length ? ':\n' + lost.map(a => '         ' + a.n + ': ' + a.q).join('\n') : ''));
}
process.exitCode = bad ? 1 : 0;
