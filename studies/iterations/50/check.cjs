// Study 50: 46 · 2's columns, measured against 46 · 2 itself and held equal (Kahran, 27 Oct: "You cannot
// move the columns"); inside them, with EWC, each give one sentence to a paragraph, the sentences the
// guide's line word for word, with a measured gap between them. From 49: New: exactly six cards, one per member, each that member's profile line
// from the guide word for word (48's option a) and nothing else; driven in a headless Chrome
// (hovers.mjs) at 1440 and 390, without and with EWC, every card floats over its column just
// under the name (T-a), only one opens at a time, and none runs off the screen. As 42–48: round 4's nav
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
const { PAGE, DATA, WORDS, PLACE, MEMBERS, sentences } = require('./build.cjs');
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
  const missing = Object.entries(copy).filter(([id, e]) => e.pages.includes('six') && !found.some(f => f.id === id)).map(([id]) => id);
  missing.length ? r.fail('copy.json lists but the page lacks: ' + missing.join(', ')) : r.ok('everything copy.json lists is on the page');

  // the budget: inside the piece, each id once; the guide's persona lines and round 4's chrome are out of it
  const seen = new Set();
  const counted = [...noCode(mainOf(p.html)).matchAll(/data-copy="([^"]+)"[^>]*>([^<]*)</g)]
    .filter(m => copy[m[1]] && copy[m[1]].flag !== 'chrome' && !m[1].startsWith('50.data.') && !seen.has(m[1]) && seen.add(m[1]));
  p.ours = counted.filter(m => copy[m[1]].flag !== 'sourced').reduce((s, m) => s + words(w.text(m[2])), 0);
  p.all = counted.reduce((s, m) => s + words(w.text(m[2])), 0);
  p.ours <= BUDGET ? r.ok(p.ours + ' words of ours (budget ' + BUDGET + ')') : r.fail(p.ours + ' words of ours, over the budget of ' + BUDGET);
  p.all <= ALL ? r.ok(p.all + ' words with the founders\' and the club\'s (cap ' + ALL + ')') : r.fail(p.all + ' words in all, over ' + ALL);

  /<\/section>\s*<section class="insight"[^>]*>\s*<p><span data-copy="50\.all\.insight"/.test(mainOf(p.html)) ? r.ok('the finding is the first thing after the head') : r.fail('the finding is not first');
  /<h2[^>]*class="ask"[^>]*><span data-copy="50\.t\.ask"/.test(mainOf(p.html)) ? r.ok('the Tuesday question heads the body') : r.fail('the Tuesday question is not the body\'s heading');
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
const allGives = (h) => personas.every((p, i) => sentences(p.give).length >= 2 && sentences(p.give).every((_, n) => has(h, `50.data.p${i}.give.s${n}`)));
// the paragraph breaks cut the guide's line, they don't reword it
personas.every((p, i) => sentences(p.give).map((_, n) => DATA[`p${i}.give.s${n}`]).join(' ') === p.give) ? r.ok('every give, its paragraphs joined, is the guide\'s line word for word') : r.fail('a give\'s paragraphs do not join back into the guide\'s line');
// 2 · six at once
count(H.six, /<div class="col" data-m="/g) === 6 && allGives(H.six) && personas.every((x, i) => x.wants.every((_, k) => has(H.six, `50.data.p${i}.w${k}.today`))) ? r.ok('six: six evenings side by side, every place, every give') : r.fail('six: the six are incomplete');
const lit = count(H.six, /<li class="hit /g);
lit >= 8 ? r.ok('six: ' + lit + ' of 24 places light up (a coffeeshop, a bar, home, a club)') : r.fail('six: only ' + lit + ' places light up');
// copy.json and words.json
console.log('copy.json');
const dataOff = Object.entries(copy).filter(([id, e]) => id.startsWith('50.data.') && e.text !== DATA[id.slice(8)]).map(([id]) => id);
dataOff.length ? r.fail('guide lines changed: ' + dataOff.join(', ')) : r.ok('every 50.data line is personas.json word for word');
read('personas.json') === fs.readFileSync(path.join(__dirname, '../43/personas.json'), 'utf8') ? r.ok('personas.json is 43\'s, unchanged') : r.fail('personas.json differs from 43\'s');
const wordsOff = Object.entries(WORDS).filter(([k, x]) => !copy['50.' + k] || (k !== 'all.claim' && copy['50.' + k].text !== x.text)).map(([k]) => k);
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
const claim = copy['50.all.claim'].text;
claim.includes('coffeeshop ' + c[0]) && claim.includes('bar ' + c[1]) && claim.includes('home ' + c[2]) && claim.includes('country club ' + c[3]) ? r.ok('the claim line shows the counts: ' + claim) : r.fail('the claim line is off: ' + claim);

// the cards (Kahran, 27 Oct, on 48: "Let's just go the A for all of them"): one per member, who they
// are, the guide's profile line word for word; T-a: a card over the column, under the name; on screen
console.log('cards');
const sixHtml = pages[0].html;
const hovs = [...sixHtml.matchAll(/<div class="hov" id="hov-(\w+)"[^>]*>([\s\S]*?)<\/div>/g)];
JSON.stringify(hovs.map(m => m[1])) === JSON.stringify(MEMBERS) ? r.ok('six cards, one per member, in order: ' + MEMBERS.join(' ')) : r.fail('the cards are not the six members: ' + hovs.map(m => m[1]).join(' '));
const optsIn = hovs.map(m => [...m[2].matchAll(/data-opt="([^"]+)"/g)].map(x => x[1]));
optsIn.every((o, i) => o.length === 1 && o[0] === MEMBERS[i] + '-a') ? r.ok('each card holds exactly its member\'s option a, nothing else') : r.fail('a card holds other options: ' + JSON.stringify(optsIn));
hovs.every((m, i) => new RegExp('^<p data-copy="50\\.data\\.p' + i + '\\.profile" class="opt"[^>]*>' + esc(personas[i].profile).replace(/[.*+?^${}()|[\]\\$]/g, '\\$&') + '</p>$').test(m[2])) ? r.ok('each card is that member\'s profile line, word for word') : r.fail('a card is not its member\'s profile line');
!/applyPicks|class="card"|class="dock"|id="copy"|\bt-[bc]\b/.test(sixHtml) ? r.ok('no picking sheet, no dock, no other treatment') : r.fail('the picking sheet or another treatment is still here');
let hv = null;
try { hv = JSON.parse(execFileSync('node', [path.join(__dirname, 'hovers.mjs')], { encoding: 'utf8', timeout: 90000 })); }
catch (e) { r.ok('server or Chrome not available: cards not driven (' + String(e.message).split('\n')[0] + ')'); }
if (hv) for (const [k, x] of Object.entries(hv)) {
  const off = x.cards.filter(c => c.left < 0 || c.right > x.vw).map(c => c.m + ' ' + c.left + '–' + c.right);
  x.cards.length === 6 && x.cards.every(c => c.display === 'block') ? r.ok(k + ': a tap opens every member\'s card') : r.fail(k + ': a card does not open');
  x.cards.every(c => c.position === 'absolute' && c.belowName >= 0 && c.belowName <= 16) ? r.ok(k + ': T-a, each card floats over its column, just under the name') : r.fail(k + ': not T-a: ' + JSON.stringify(x.cards.map(c => [c.m, c.position, c.belowName])));
  off.length ? r.fail(k + ': off the screen (' + x.vw + 'px): ' + off.join(', ')) : r.ok(k + ': every card on the screen (' + Math.min(...x.cards.map(c => c.left)) + '–' + Math.max(...x.cards.map(c => c.right)) + ' of ' + x.vw + ')');
  x.cards.every(c => c.othersShut) ? r.ok(k + ': one card open at a time') : r.fail(k + ': more than one card open');
  x.cards.every((c, i) => c.text === personas[i].profile) ? r.ok(k + ': each card reads as its member\'s profile') : r.fail(k + ': a card reads wrong');
  x.allOpen ? r.ok(k + ': "show all" opens all six') : r.fail(k + ': "show all" does not open all six');
  x.pageWidth <= x.vw ? r.ok(k + ': nothing past the edge') : r.fail(k + ': the page is ' + x.pageWidth + 'px wide');
  x.errors.length ? r.fail(k + ': page errors: ' + x.errors.join(' | ')) : r.ok(k + ': no page errors');
}
for (const f of ['card-1440', 'card-390', 'with-46-1440', 'with-50-1440', 'with-46-390', 'with-50-390']) (read('index.html').includes('img/' + f + '.png') && fs.existsSync(path.join(__dirname, 'img', f + '.png'))) ? r.ok('picture ' + f) : r.fail('missing picture ' + f);

// the columns (Kahran, 27 Oct: "I don't want you to change the columns. I just wanted you to make it more
// readable within the columns"): 46 · 2 and 50 measured live, in both states, at 1440 and 390; every
// column's left and width must match to the pixel. Inside them, with EWC: at least two paragraphs to a
// give and at least 10px between paragraphs (46 · 2 has one paragraph, so no gap at all).
console.log('columns');
const base = process.env.MEASURE_BASE || 'http://127.0.0.1:8794/studies/iterations/';
const URL46 = process.env.MEASURE_46 || base + '46/tue-2-six.html', URL50 = process.env.MEASURE_URL || base + '50/six.html';
const measure = (u) => JSON.parse(execFileSync('node', [path.join(__dirname, 'measure.mjs'), u], { encoding: 'utf8', timeout: 90000 }));
let m46 = null, m50 = null;
try { m46 = measure(URL46); m50 = measure(URL50); }
catch (e) { r.ok('server or Chrome not available: columns not measured (' + String(e.message).split('\n')[0] + ')'); }
if (m46 && m50) {
  for (const k of Object.keys(m46)) {
    const a = m46[k], b = m50[k];
    a.perRow === b.perRow && JSON.stringify(a.cols) === JSON.stringify(b.cols)
      ? r.ok(k + ': the columns are 46 · 2\'s (' + b.perRow + ' to a row, ' + b.cols[0][1] + 'px wide)')
      : r.fail(k + ': the columns moved: 46 · 2 ' + JSON.stringify(a.cols) + ' vs 50 ' + JSON.stringify(b.cols));
    b.pageWidth <= +k.split('-')[1] ? r.ok(k + ': nothing past the edge') : r.fail(k + ': the page is ' + b.pageWidth + 'px wide');
  }
  for (const k of ['with-1440', 'with-390']) {
    const b = m50[k];
    b.fewestParas >= 2 && b.paraGap >= 10 ? r.ok(k + ': every give in ' + b.fewestParas + '+ paragraphs, ' + b.paraGap + 'px between') : r.fail(k + ': gives not broken up (' + b.fewestParas + ' paragraph(s), ' + b.paraGap + 'px between; want ≥2, ≥10px)');
  }
}

console.log('words of ours: ' + pages[0].ours + ' · in all: ' + pages[0].all);

r.done();
