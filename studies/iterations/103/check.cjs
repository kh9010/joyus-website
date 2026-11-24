// Study 103: a spine for each of the nine questions Divya picked from Study 102.
//  - the nine are exactly her picks, word for word as they stand in 102
//  - three types, three spines each
//  - each spine: one idea, five beats (what is said, what is shown), a close, one to three pictures
//  - no two spines share an idea, a close or an opening beat
//  - every quoted line is in the source material, word for word. The sources are kept out of the
//    public repo in .site-rebuild/agemo-figma; where that folder is missing this part is skipped.
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
say(Object.keys(by).join(' / ') === 'Product design / Product strategy / Storytelling' && Object.values(by).every(v => v.length === 3), 'three types, three each: ' + Object.entries(by).map(([k, v]) => k + ' ' + v.join(' ')).join(' / '));
say(S.every(s => s.beats.length === 5 && s.beats.every(b => b.say && b.show)), 'five beats each, every beat with what is said and what is shown');
say(S.every(s => s.imgs.length >= 1 && s.imgs.length <= 3 && s.imgs.every(([f]) => fs.existsSync(path.join(here, 'img', f)))), 'one to three pictures each, all present');
const uniq = (k, f) => { const v = S.map(f); const d = v.filter((x, i) => v.indexOf(x) !== i); say(!d.length, 'no two share ' + k + (d.length ? ': ' + d.join(' | ') : '')); };
uniq('an idea', s => s.idea); uniq('a close', s => s.close); uniq('an opening beat', s => s.beats[0].say);
say(S.every(s => s.idea.split(/\s+/).length <= 40), 'each idea is 40 words at most');

const dec = (t) => t.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const page = dec(html);
say(S.every(s => page.includes(s.q) && page.includes(s.idea) && s.beats.every(b => page.includes(b.say) && page.includes(b.show))), 'everything in the list is on the page');
say((html.match(/class="item"/g) || []).length === S.length, 'one tick box per spine');
say(!/class="(eyebrow|lede)"/.test(html), 'the title, then the spines: nothing above or under the title');
const rows = html.split('<div class="v">').slice(1).map(r => (r.split('</div>')[0].match(/<figure>/g) || []).length);
say(rows.every(n => n <= 3), 'pictures at most three to a row');

function quotes(t) {
  const out = []; let depth = 0, start = -1;
  for (let i = 0; i < t.length; i++) {
    if (t[i] === '“') { if (depth === 0) start = i + 1; depth++; }
    else if (t[i] === '”' && depth > 0) { depth--; if (depth === 0) out.push(t.slice(start, i)); }
  }
  return out;
}
const all = S.flatMap(s => s.beats.flatMap(b => quotes(b.say + ' ' + b.show)).map(q => ({ q, n: s.n })));
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
