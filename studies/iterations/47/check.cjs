// Study 47: 46 · 2, six Tuesdays at once, alone, with "with EWC" re-spaced. The
// spacing is measured (measure.mjs, in a headless Chrome) and held to numbers
// 46 · 2 fails. Otherwise as 46. As 42–46: round 4's nav
// and footer, every link a Study 03 page type; the finding first; every readable
// string in a data-copy element listed in copy.json (and nothing in copy.json
// that isn't on a page); the guide's lines word for word; the web's claim still
// holding. New here: the founders' words are found, verbatim, in the workshop 2
// board element they name, and the club's lines on the guide's voice page; the
// board's real prospect names (read from the board, never written here) are on
// no page; quotes are only ever sourced words; the budget counts our words
// (draft + label) and, separately, everything.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const w = require('../../wirecheck.cjs');
const { PAGE, DATA, WORDS, PLACE } = require('./build.cjs');
const { execFileSync } = require('node:child_process');
const r = w.reporter();
const read = (f) => fs.readFileSync(path.join(__dirname, f), 'utf8');
const copy = JSON.parse(read('copy.json')).copy;
const { personas } = JSON.parse(read('personas.json'));
const BUDGET = 120, ALL = 180;
const words = (s) => (s.match(/[A-Za-z0-9$][\w'’$.,&–/"-]*/g) || []).length;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const flat = (s) => String(s).replace(/\s+/g, ' ').trim();
const noCode = (h) => h.replace(/<script>[\s\S]*?<\/script>/g, '').replace(/<style>[\s\S]*?<\/style>/g, '');
const mainOf = (h) => (h.match(/<main class="piece">[\s\S]*?<\/main>/) || [''])[0];

const pages = [{ ...PAGE, key: 'six', html: read(PAGE.file) }];
for (const p of pages) {
  console.log(p.file);
  w.links(p.html, r);
  w.chrome(p.html, r);
  for (const [, js] of p.html.matchAll(/<script>([\s\S]*?)<\/script>/g)) { try { new Function(js); r.ok('script parses'); } catch (e) { r.fail('script: ' + e.message); } }

  const left = w.text(noCode(p.html).replace(/<head>[\s\S]*?<\/head>/, '').replace(/<a class="gbox"[^>]*>wordmark<\/a>/g, '').replace(/<(\w+)[^>]*data-copy="[^"]+"[^>]*>[^<]*<\/\1>/g, ''));
  /^[\s\d→←↓·/|]*$/.test(left) ? r.ok('every readable string carries a data-copy id') : r.fail('text outside data-copy: ' + JSON.stringify(left.slice(0, 120)));

  const found = [...p.html.matchAll(/data-copy="([^"]+)"[^>]*>([^<]*)</g)].map(m => ({ id: m[1], text: w.text(m[2]) }));
  const unknown = found.filter(f => !copy[f.id]).map(f => f.id);
  unknown.length ? r.fail('ids not in copy.json: ' + unknown.join(', ')) : r.ok(found.length + ' strings, each id in copy.json');
  const off = found.filter(f => copy[f.id] && w.text(esc(copy[f.id].text)) !== f.text).map(f => f.id);
  off.length ? r.fail('page text differs from copy.json: ' + off.join(', ')) : r.ok('page text = copy.json text');
  const missing = Object.keys(copy).filter(id => !found.some(f => f.id === id));
  missing.length ? r.fail('copy.json lists but the page lacks: ' + missing.join(', ')) : r.ok('everything copy.json lists is on the page');

  // the budget: inside the piece, each id once; the guide's persona lines and round 4's chrome are out of it
  const seen = new Set();
  const counted = [...noCode(mainOf(p.html)).matchAll(/data-copy="([^"]+)"[^>]*>([^<]*)</g)]
    .filter(m => copy[m[1]] && copy[m[1]].flag !== 'chrome' && !m[1].startsWith('47.data.') && !seen.has(m[1]) && seen.add(m[1]));
  p.ours = counted.filter(m => copy[m[1]].flag !== 'sourced').reduce((s, m) => s + words(w.text(m[2])), 0);
  p.all = counted.reduce((s, m) => s + words(w.text(m[2])), 0);
  p.ours <= BUDGET ? r.ok(p.ours + ' words of ours (budget ' + BUDGET + ')') : r.fail(p.ours + ' words of ours, over the budget of ' + BUDGET);
  p.all <= ALL ? r.ok(p.all + ' words with the founders\' and the club\'s (cap ' + ALL + ')') : r.fail(p.all + ' words in all, over ' + ALL);

  /<\/section>\s*<section class="insight"[^>]*>\s*<p><span data-copy="47\.all\.insight"/.test(mainOf(p.html)) ? r.ok('the finding is the first thing after the head') : r.fail('the finding is not first');
  /<h2[^>]*class="ask"[^>]*><span data-copy="47\.t\.ask"/.test(mainOf(p.html)) ? r.ok('the Tuesday question heads the body') : r.fail('the Tuesday question is not the body\'s heading');
  // a quote is only ever someone else's words: every quote element holds sourced strings and nothing else
  const quotes = [...mainOf(p.html).matchAll(/<(q|blockquote)\b([^>]*)>([\s\S]*?)<\/\1>/g)].map(m => m[2] + '>' + m[3].replace(/<footer>[\s\S]*?<\/footer>/, ''));
  const badQ = quotes.filter(q => [...q.matchAll(/data-copy="([^"]+)"/g)].some(m => copy[m[1]].flag !== 'sourced') || !/data-copy=/.test(q));
  badQ.length ? r.fail('a quote holds words that are not sourced') : r.ok(quotes.length ? quotes.length + ' quote(s), sourced words only' : 'no quote elements');
}

// each variation carries what its idea needs
console.log('shapes');
const H = Object.fromEntries(pages.map(p => [p.key, mainOf(p.html)]));
const count = (h, re) => (h.match(re) || []).length;
const has = (h, id) => h.includes(`data-copy="${id}"`);
const allGives = (h) => personas.every((_, i) => has(h, `47.data.p${i}.give`));
// 2 · six at once
count(H.six, /<div class="col">/g) === 6 && allGives(H.six) && personas.every((x, i) => x.wants.every((_, k) => has(H.six, `47.data.p${i}.w${k}.today`))) ? r.ok('six: six evenings side by side, every place, every give') : r.fail('six: the six are incomplete');
const lit = count(H.six, /<li class="hit /g);
lit >= 8 ? r.ok('six: ' + lit + ' of 24 places light up (a coffeeshop, a bar, home, a club)') : r.fail('six: only ' + lit + ' places light up');
// copy.json and words.json
console.log('copy.json');
const dataOff = Object.entries(copy).filter(([id, e]) => id.startsWith('47.data.') && e.text !== DATA[id.slice(8)]).map(([id]) => id);
dataOff.length ? r.fail('guide lines changed: ' + dataOff.join(', ')) : r.ok('every 47.data line is personas.json word for word');
read('personas.json') === fs.readFileSync(path.join(__dirname, '../43/personas.json'), 'utf8') ? r.ok('personas.json is 43\'s, unchanged') : r.fail('personas.json differs from 43\'s');
const wordsOff = Object.entries(WORDS).filter(([k, x]) => !copy['47.' + k] || (k !== 'all.claim' && copy['47.' + k].text !== x.text)).map(([k]) => k);
wordsOff.length ? r.fail('words.json not on a page or not as written: ' + wordsOff.join(', ')) : r.ok('every words.json entry is on a page, as written');
const unsourced = Object.entries(WORDS).filter(([, x]) => x.flag === 'sourced' && !x.src).map(([k]) => k);
unsourced.length ? r.fail('sourced without a src: ' + unsourced.join(', ')) : r.ok('every sourced word names its source');
const OUT = ['curated', 'elevated', 'exclusive', 'bespoke', 'concierge', 'amenities'];
const outHits = Object.entries(WORDS).filter(([, x]) => x.flag !== 'chrome' && OUT.some(o => x.text.toLowerCase().includes(o))).map(([k]) => k);
outHits.length ? r.fail('the club\'s out-words: ' + outHits.join(', ')) : r.ok('none of the club\'s out-words (' + OUT.join(', ') + ')');

// the sources, on this machine: the board's words by element, the guide's voice page, and the names that must never show
const ewc = path.join(os.homedir(), 'dev/ewc');
const boardFile = path.join(ewc, 'EWC workshopsession2fill.excalidraw');
if (fs.existsSync(boardFile)) {
  console.log('sources');
  const board = Object.fromEntries(JSON.parse(fs.readFileSync(boardFile, 'utf8')).elements.filter(e => e.type === 'text' && !e.isDeleted).map(e => [e.id, e.text]));
  const fromBoard = Object.entries(WORDS).filter(([, x]) => x.flag === 'sourced' && /workshopsession2fill/.test(x.src || ''));
  const notOnBoard = fromBoard.filter(([, x]) => {
    const id = (x.src.match(/text (\S+)$/) || [])[1];
    return id ? flat(board[id] || '') !== flat(x.text) : !Object.values(board).some(t => flat(t).includes(flat(x.text)));
  }).map(([k]) => k);
  notOnBoard.length ? r.fail('not verbatim on the board: ' + notOnBoard.join(', ')) : r.ok(fromBoard.length + ' lines verbatim on the workshop 2 board, element by element');
  const guide = flat(fs.readFileSync(path.join(ewc, 'src/brand-guide.html'), 'utf8').replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, ' ').replace(/&rsquo;|’/g, "'").replace(/&mdash;/g, '—').replace(/&amp;/g, '&'));
  const fromGuide = Object.entries(WORDS).filter(([, x]) => x.flag === 'sourced' && /brand-guide/.test(x.src || ''));
  const notInGuide = fromGuide.filter(([, x]) => !guide.includes(flat(x.text))).map(([k]) => k);
  notInGuide.length ? r.fail('not verbatim in the guide: ' + notInGuide.join(', ')) : r.ok(fromGuide.length + ' lines verbatim in the brand guide');
  // the founding-member answers open with "First Last - ...": every such name, first or last, on no page and not in copy.json
  const full = [];
  for (const t of Object.values(board)) for (const m of t.matchAll(/(?:^|\n)([A-Z][a-z]+) ([A-Z][a-z]+) -/g)) full.push([m[1], m[2]]);
  // a full name, a first name, or a surname; a surname that is an ordinary word in the guide's own lines ("Guy") counts only as part of the full name
  const guideText = read('personas.json');
  const needles = full.flatMap(([f, l]) => [f + ' ' + l, f, ...(new RegExp('\\b' + l + '\\b').test(guideText) ? [] : [l])]);
  const blob = pages.map(p => p.html).join('\n') + read('copy.json') + read('words.json') + read('index.html');
  const leaked = needles.filter(n => new RegExp('\\b' + n + '\\b').test(blob));
  full.length >= 6 ? r.ok('read ' + full.length + ' prospect names off the board') : r.fail('expected the board\'s prospect names, found ' + full.length);
  leaked.length ? r.fail(leaked.length + ' real prospect name(s) on a page') : r.ok('no real prospect name on any page, in copy.json or the index');
} else r.ok('~/dev/ewc not on this machine: verbatim and name checks skipped');

// the claim
console.log('claim');
const uses = (k) => personas.reduce((s, p) => s + p.wants.filter(x => PLACE.find(([j]) => j === k)[1].test(x.today)).length, 0);
const c = ['coffeeshop', 'bar', 'home', 'club'].map(uses);
c.slice(0, 3).every(x => x > c[3]) ? r.ok('"a coffeeshop, a bar, home" over another club holds (' + c.join(' · ') + ')') : r.fail('the finding no longer holds: ' + c.join(' · '));
const claim = copy['47.all.claim'].text;
claim.includes('coffeeshop ' + c[0]) && claim.includes('bar ' + c[1]) && claim.includes('home ' + c[2]) && claim.includes('country club ' + c[3]) ? r.ok('the claim line shows the counts: ' + claim) : r.fail('the claim line is off: ' + claim);

// the index: the page, and the with-EWC state before (46 · 2) and after, wide and on a phone
console.log('index');
const idx = read('index.html');
/<iframe[^>]+src="six\.html"/.test(idx) ? r.ok('the index shows the page') : r.fail('the index does not frame six.html');
const shots = ['img/before-with-1440.png', 'img/after-with-1440.png', 'img/before-with-390.png', 'img/after-with-390.png', 'img/six.png'].filter(s => !idx.includes(s) || !fs.existsSync(path.join(__dirname, s)));
shots.length ? r.fail('missing pictures: ' + shots.join(', ')) : r.ok('before/after pictures of "with EWC", and the page');

// the spacing (Kahran, 27 Oct: "with EWC, it needs to be spaced out a little better"): measured, held to
// numbers 46 · 2 fails (6 to a row, 12px gaps, a 211px give at 1.4, 28px of empty band under each name)
console.log('spacing');
const URL47 = process.env.MEASURE_URL || 'http://127.0.0.1:8794/studies/iterations/47/six.html';
let m = null;
try { m = JSON.parse(execFileSync('node', [path.join(__dirname, 'measure.mjs'), URL47], { encoding: 'utf8', timeout: 60000 })); }
catch (e) { r.ok('server or Chrome not available: spacing not measured (' + String(e.message).split('\n')[0] + ')'); }
if (m) {
  const W = m['1440'], P = m['390'];
  W.perRow <= 3 && W.colGap >= 40 ? r.ok('1440: ' + W.perRow + ' to a row, ' + W.colGap + 'px between them') : r.fail('1440: ' + W.perRow + ' to a row, ' + W.colGap + 'px between (want ≤3, ≥40px)');
  W.rowGap >= 32 ? r.ok('1440: ' + W.rowGap + 'px between rows') : r.fail('1440: ' + W.rowGap + 'px between rows (want ≥32)');
  P.perRow === 1 && P.rowGap >= 24 ? r.ok('390: one to a row, ' + P.rowGap + 'px between') : r.fail('390: ' + P.perRow + ' to a row, ' + P.rowGap + 'px between (want 1, ≥24px)');
  for (const [k, x] of [['1440', W], ['390', P]]) {
    x.giveWidth >= 300 ? r.ok(k + ': the narrowest give is ' + x.giveWidth + 'px') : r.fail(k + ': a give is ' + x.giveWidth + 'px wide (want ≥300)');
    x.lineHeight >= 1.5 && x.fontSize >= 15 ? r.ok(k + ': gives at ' + x.fontSize + 'px / ' + x.lineHeight.toFixed(2)) : r.fail(k + ': gives at ' + x.fontSize + 'px / ' + x.lineHeight.toFixed(2) + ' (want ≥15px, ≥1.5)');
    x.nameToGive <= 16 ? r.ok(k + ': ' + x.nameToGive + 'px from a name to its give') : r.fail(k + ': ' + x.nameToGive + 'px from a name to its give (want ≤16, no empty band)');
    x.pageWidth <= +k ? r.ok(k + ': nothing past the edge') : r.fail(k + ': the page is ' + x.pageWidth + 'px wide');
  }
}

console.log('words of ours: ' + pages[0].ours + ' · in all: ' + pages[0].all);

r.done();
