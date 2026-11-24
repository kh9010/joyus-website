// Study 101: the thesis page.
//  - four steps (had, asked for, found, built), then the thesis, in that order
//  - at most three pictures to a row, every one a link to its full file
//  - every quoted line is in the source material, word for word. The sources are kept out of the
//    public repo in .site-rebuild/agemo-figma; where that folder is missing this part is skipped.
const fs = require('node:fs');
const path = require('node:path');
const here = __dirname;
const repo = path.resolve(here, '..', '..', '..');
let bad = 0;
const say = (ok, msg) => { if (!ok) bad++; console.log((ok ? '  ok   ' : '  FAIL ') + msg); };
const html = fs.readFileSync(path.join(here, 'index.html'), 'utf8');
const heads = [...html.matchAll(/<h2>([^<]+)<\/h2>/g)].map(m => m[1]);
say(heads.join(' / ') === 'They had / They asked for / We found / We built', 'four steps in order: ' + heads.join(' / '));
say(html.indexOf('class="thesis"') > html.lastIndexOf('<h2>'), 'the thesis comes last');
const rows = html.split('<div class="v">').slice(1).map(r => (r.split('</div>')[0].match(/<figure>/g) || []).length);
say(rows.every(n => n >= 1 && n <= 3), 'pictures at most three to a row (' + rows.join(', ') + ')');
const figs = [...html.matchAll(/<figure><a class="zoom" href="([^"]+)"><img src="([^"]+)"/g)];
say(figs.length === rows.reduce((a, b) => a + b, 0) && figs.every(m => m[1] === m[2] && fs.existsSync(path.join(here, m[1]))), figs.length + ' pictures, each a link to its own full file');

function quotes(t) {
  const out = []; let depth = 0, start = -1;
  for (let i = 0; i < t.length; i++) {
    if (t[i] === '“') { if (depth === 0) start = i + 1; depth++; }
    else if (t[i] === '”' && depth > 0) { depth--; if (depth === 0) out.push(t.slice(start, i)); }
  }
  return out;
}
const body = html.slice(html.indexOf('<main>')).replace(/<[^>]+>/g, ' ');
const qs = quotes(body);
say(qs.length === 6,qs.length + ' quoted lines');
const src = path.join(repo, '.site-rebuild', 'agemo-figma');
if (!fs.existsSync(src)) console.log('  skip quotes against the sources: .site-rebuild/agemo-figma is not on this machine');
else {
  const dec = (t) => t.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
  const norm = (t) => dec(dec(t)).replace(/&#39;/g, "'").replace(/[“”"]/g, '"').replace(/[‘’']/g, "'").replace(/\\n/g, ' ').replace(/\\"/g, '"').replace(/\s+/g, ' ');
  let hay = '';
  for (const f of ['deck.md', 'proposal-finalised.txt', 'raw/board-user-journey.xml.txt', 'raw/board-codewords-ux.xml.txt']) hay += ' ' + fs.readFileSync(path.join(src, f), 'utf8');
  hay = norm(hay);
  const lost = qs.filter(q => !hay.includes(norm(q)));
  say(!lost.length, 'every quoted line is in the sources, word for word' + (lost.length ? ':\n' + lost.map(q => '         ' + q).join('\n') : ''));
}
process.exitCode = bad ? 1 : 0;
