// Study 52: both Abouts appear whole, word for word, on all four layouts; none is edited or cut.
const fs = require('node:fs');
const path = require('node:path');
let bad = 0;
const say = (ok, m) => { console.log((ok ? '  ok   ' : '  FAIL ') + m); if (!ok) bad++; };
const W = JSON.parse(fs.readFileSync(path.join(__dirname, 'words.json'), 'utf8'));
const squash = s => s.replace(/\s+/g, ' ');
const astro = squash(fs.readFileSync(path.join(__dirname, 'source/divya-about.astro'), 'utf8'));
say(W.divya.paras.length === 2 && W.divya.paras.every(p => astro.includes(p)), 'Divya: two paragraphs, as on her site');
const kh = squash(fs.readFileSync(path.join(__dirname, 'source/kahran-about.html'), 'utf8').replace(/<[^>]+>/g, '').replace(/&rsquo;/g, '’'));
say(W.kahran.paras.length === 6 && W.kahran.paras.every(p => kh.includes(p)), 'Kahran: six paragraphs, as on his site');
say(W.kahran.years.length === 10, 'Kahran: his ten years');
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
for (const v of ['a', 'b', 'c', 'd']) {
  const h = fs.readFileSync(path.join(__dirname, 'about-' + v + '.html'), 'utf8');
  const all = [...W.divya.paras, ...W.kahran.paras, W.kahran.quote, ...W.kahran.years.map(y => y[1])];
  const lost = all.filter(t => !h.includes(esc(t)));
  say(!lost.length, 'layout ' + v.toUpperCase() + ': every paragraph whole' + (lost.length ? ': lost ' + lost[0].slice(0, 50) : ''));
}
process.exitCode = bad ? 1 : 0;
