// Study 100: the storylines hold together.
//  - 25 of them; no two share a name, a line, a picture, a first beat or a quoted line
//  - each has three beats and a picture that exists
//  - the page is built from the list (every name and line on it, in order)
//  - every quoted line is in the source material, word for word. The sources (the Figma pulls)
//    are kept out of the public repo in .site-rebuild/agemo-figma; where that folder is
//    missing this part is skipped and says so.
const fs = require('node:fs');
const path = require('node:path');
const here = __dirname;
const repo = path.resolve(here, '..', '..', '..');
let bad = 0;
const say = (ok, msg) => { if (!ok) bad++; console.log((ok ? '  ok   ' : '  FAIL ') + msg); };
const S = JSON.parse(fs.readFileSync(path.join(here, 'storylines.json'), 'utf8'));
const html = fs.readFileSync(path.join(here, 'index.html'), 'utf8');

say(S.length === 25, S.length + ' storylines');
const uniq = (k, f) => { const v = S.map(f); const d = v.filter((x, i) => v.indexOf(x) !== i); say(!d.length, 'no two share ' + k + (d.length ? ': ' + d.join(' | ') : '')); };
uniq('a name', s => s.name); uniq('a line', s => s.line); uniq('a picture', s => s.img); uniq('a first beat', s => s.beats[0]);
say(S.every(s => s.beats.length === 3), 'three beats each');
const missing = S.filter(s => !fs.existsSync(path.join(here, 'img', s.img))).map(s => s.img);
say(!missing.length, 'every picture exists' + (missing.length ? ': ' + missing.join(', ') : ''));
say(S.every(s => s.line.split(/\s+/).length <= 26), 'each line is one or two short sentences (26 words at most)');

// the page is the list
const dec = (t) => t.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const page = dec(html);
let at = 0, inOrder = true;
for (const s of S) { const i = page.indexOf(s.name, at); if (i < 0 || page.indexOf(s.line, i) < 0) { inOrder = false; console.log('       not on the page: ' + s.name); } else at = i; }
say(inOrder, 'every name and line is on the page, in order');
say((html.match(/class="item"/g) || []).length === S.length, 'one tick box per storyline');
say(!/class="(eyebrow|lede)"/.test(html), 'the title, then the list: nothing above or under the title');

// quotes: the outermost “…” spans in the beats
function quotes(t) {
  const out = []; let depth = 0, start = -1;
  for (let i = 0; i < t.length; i++) {
    if (t[i] === '“') { if (depth === 0) start = i + 1; depth++; }
    else if (t[i] === '”' && depth > 0) { depth--; if (depth === 0) out.push(t.slice(start, i)); }
  }
  return out;
}
const all = S.flatMap(s => s.beats.flatMap(quotes).map(q => ({ q, name: s.name })));
const dupQ = all.filter((a, i) => all.findIndex(b => b.q === a.q) !== i).map(a => a.q);
say(!dupQ.length, all.length + ' quoted lines, none used twice' + (dupQ.length ? ': ' + dupQ.join(' | ') : ''));

const src = path.join(repo, '.site-rebuild', 'agemo-figma');
if (!fs.existsSync(src)) console.log('  skip quotes against the sources: .site-rebuild/agemo-figma is not on this machine');
else {
  const norm = (t) => dec(dec(t)).replace(/&#39;/g, "'").replace(/[“”"]/g, '"').replace(/[‘’']/g, "'").replace(/\\n/g, ' ').replace(/\\"/g, '"').replace(/\s+/g, ' ');
  let hay = '';
  for (const f of ['deck.md', 'raw/board-user-journey.xml.txt', 'raw/board-codewords-ux.xml.txt', 'raw/ui-final-pages-metadata.json']) hay += ' ' + fs.readFileSync(path.join(src, f), 'utf8');
  hay = norm(hay);
  const lost = all.filter(a => !hay.includes(norm(a.q)));
  say(!lost.length, 'every quoted line is in the sources, word for word' + (lost.length ? ':\n' + lost.map(a => '         ' + a.name + ': ' + a.q).join('\n') : ''));
}
process.exitCode = bad ? 1 : 0;
