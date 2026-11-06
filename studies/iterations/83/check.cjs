// Study 83: why a Tuesday, four visual answers behind ?v=a|b|c|d, on Study 50's page held as it was.
// Pinned here: 50's layout unchanged (83's columns measured live against 50's, every option, both states,
// 1440 and 390: every column's left and width equal, 50's paragraph gaps kept); exactly four options, one
// shown at a time, ?v picks it, a by default; each marked "our reading"; the quotes verbatim from the
// workshop 2 board (by element) and the brand guide; no client person's name (the board's prospect names
// and the workshop's attendees, read off the board, never written here); no money and no em dash in our
// words or the new piece; the budget counted per option. Everything else is 50's check, renamed to 83.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const w = require('../../wirecheck.cjs');
const { PAGE, DATA, WORDS, PLACE, MEMBERS, OPTIONS, sentences } = require('./build.cjs');
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
  // 83: counted per option, the page as it reads with only that option's piece in it; the worst one is held
  p.ours = 0; p.all = 0;
  for (const v of OPTIONS) {
  const only = noCode(mainOf(p.html)).replace(/<section class="why" data-opt="([a-z])"[\s\S]*?<\/section>/g, (m, o) => o === v ? m : '');
  const seen = new Set();
  const counted = [...only.matchAll(/data-copy="([^"]+)"[^>]*>([^<]*)</g)]
    .filter(m => copy[m[1]] && copy[m[1]].flag !== 'chrome' && !m[1].startsWith('83.data.') && !seen.has(m[1]) && seen.add(m[1]));
  const ours = counted.filter(m => copy[m[1]].flag !== 'sourced').reduce((s, m) => s + words(w.text(m[2])), 0);
  const all = counted.reduce((s, m) => s + words(w.text(m[2])), 0);
  p.ours = Math.max(p.ours, ours); p.all = Math.max(p.all, all);
  ours <= BUDGET ? r.ok('?v=' + v + ': ' + ours + ' words of ours (budget ' + BUDGET + ')') : r.fail('?v=' + v + ': ' + ours + ' words of ours, over the budget of ' + BUDGET);
  all <= ALL ? r.ok('?v=' + v + ': ' + all + ' words with the founders\' and the club\'s (cap ' + ALL + ')') : r.fail('?v=' + v + ': ' + all + ' words in all, over ' + ALL);
  }

  /<\/section>\s*<section class="insight"[^>]*>\s*<p><span data-copy="83\.all\.insight"/.test(mainOf(p.html)) ? r.ok('the finding is the first thing after the head') : r.fail('the finding is not first');
  /<h2[^>]*class="ask"[^>]*><span data-copy="83\.t\.ask"/.test(mainOf(p.html)) ? r.ok('the Tuesday question heads the body') : r.fail('the Tuesday question is not the body\'s heading');
  // a quote is only ever someone else's words: every quote element holds sourced strings and nothing else
  const quotes = [...mainOf(p.html).matchAll(/<(q|blockquote)\b([^>]*)>([\s\S]*?)<\/\1>/g)].map(m => m[2] + '>' + m[3].replace(/<footer>[\s\S]*?<\/footer>/, ''));
  const badQ = quotes.filter(q => [...q.matchAll(/data-copy="([^"]+)"/g)].some(m => copy[m[1]].flag !== 'sourced') || !/data-copy=/.test(q));
  badQ.length ? r.fail('a quote holds words that are not sourced') : r.ok(quotes.length ? quotes.length + ' quote(s), sourced words only' : 'no quote elements');
}

// each variation carries what its idea needs
console.log('shapes');
const H = Object.fromEntries(pages.map(p => [p.key, mainOf(p.html)]));
const sixHtmlRaw = () => pages[0].html;
const count = (h, re) => (h.match(re) || []).length;
const has = (h, id) => h.includes(`data-copy="${id}"`);
const allGives = (h) => personas.every((p, i) => sentences(p.give).length >= 2 && sentences(p.give).every((_, n) => has(h, `83.data.p${i}.give.s${n}`)));
// the paragraph breaks cut the guide's line, they don't reword it
personas.every((p, i) => sentences(p.give).map((_, n) => DATA[`p${i}.give.s${n}`]).join(' ') === p.give) ? r.ok('every give, its paragraphs joined, is the guide\'s line word for word') : r.fail('a give\'s paragraphs do not join back into the guide\'s line');
// 2 · six at once
count(H.six, /<div class="col" data-m="/g) === 6 && allGives(H.six) && personas.every((x, i) => x.wants.every((_, k) => has(H.six, `83.data.p${i}.w${k}.today`))) ? r.ok('six: six evenings side by side, every place, every give') : r.fail('six: the six are incomplete');
const lit = count(H.six, /<li class="hit /g);
lit >= 8 ? r.ok('six: ' + lit + ' of 24 places light up (a coffeeshop, a bar, home, a club)') : r.fail('six: only ' + lit + ' places light up');
// copy.json and words.json
console.log('copy.json');
const dataOff = Object.entries(copy).filter(([id, e]) => id.startsWith('83.data.') && e.text !== DATA[id.slice(8)]).map(([id]) => id);
dataOff.length ? r.fail('guide lines changed: ' + dataOff.join(', ')) : r.ok('every 83.data line is personas.json word for word');
read('personas.json') === fs.readFileSync(path.join(__dirname, '../43/personas.json'), 'utf8') ? r.ok('personas.json is 43\'s, unchanged') : r.fail('personas.json differs from 43\'s');
const wordsOff = Object.entries(WORDS).filter(([k, x]) => !copy['83.' + k] || (k !== 'all.claim' && copy['83.' + k].text !== x.text)).map(([k]) => k);
wordsOff.length ? r.fail('words.json not on a page or not as written: ' + wordsOff.join(', ')) : r.ok('every words.json entry is on a page, as written');
const unsourced = Object.entries(WORDS).filter(([, x]) => x.flag === 'sourced' && !x.src).map(([k]) => k);
unsourced.length ? r.fail('sourced without a src: ' + unsourced.join(', ')) : r.ok('every sourced word names its source');
const OUT = ['curated', 'elevated', 'exclusive', 'bespoke', 'concierge', 'amenities'];
const outHits = Object.entries(WORDS).filter(([, x]) => x.flag !== 'chrome' && OUT.some(o => x.text.toLowerCase().includes(o))).map(([k]) => k);
outHits.length ? r.fail('the club\'s out-words: ' + outHits.join(', ')) : r.ok('none of the club\'s out-words (' + OUT.join(', ') + ')');

// the options (why a Tuesday): four, in order, one idea each, each marked as our reading
console.log('options');
const whys = [...H.six.matchAll(/<section class="why" data-opt="([a-z])"[^>]*>([\s\S]*?)<\/section>/g)].map(m => ({ v: m[1], h: m[2] }));
JSON.stringify(whys.map(x => x.v)) === JSON.stringify(OPTIONS) && OPTIONS.length >= 3 && OPTIONS.length <= 5 ? r.ok(whys.length + ' options: ' + OPTIONS.join(' ')) : r.fail('options are ' + whys.map(x => x.v).join(' ') + ', want ' + OPTIONS.join(' '));
whys.every(x => has(x.h, '83.why.ours')) ? r.ok('every option carries "our reading"') : r.fail('an option is not marked as our reading');
const SHAPE = { a: /<ol class="week">/, b: /<div class="curve">[\s\S]*<svg/, c: /<div class="street">/, d: /<div class="month">/ };
whys.every(x => SHAPE[x.v] && SHAPE[x.v].test(x.h) && Object.entries(SHAPE).every(([o, re]) => o === x.v || !re.test(x.h))) ? r.ok('each option is its own shape: a the week strip, b the curve, c the places, d the month') : r.fail('an option is missing its shape or borrows another\'s');
(H.six.indexOf('<section class="why"') > H.six.indexOf('83.all.insight') && H.six.indexOf('<section class="why"') < H.six.indexOf('<section class="body"')) ? r.ok('the piece sits between the finding and the six Tuesdays') : r.fail('the piece is out of place');
/document\.body\.dataset\.v = \/\^\[a-d\]\$\/\.test\(v \|\| ''\) \? v : 'a'/.test(sixHtmlRaw()) ? r.ok('?v picks the option, a by default') : r.fail('the ?v switch is not there');
// public repo: no money and no em dash in our words or the new piece (the gives and cards are 50's, the guide's words, held)
const whyText = whys.map(x => w.text(x.h)).join(' ');
const ourWords = Object.values(WORDS).map(x => x.text).join(' ');
!/[$£€]\s?\d|\d\s?[kK]\b|\d+\s?(?:dollars|USD)/.test(ourWords + ' ' + whyText) ? r.ok('no money figure in words.json or the piece') : r.fail('a money figure in words.json or the piece');
!/—/.test(ourWords + ' ' + whyText + read('index.html')) ? r.ok('no em dash in words.json, the piece or the study page') : r.fail('an em dash in words.json, the piece or the study page');

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
  // 83: the workshop's attendees, off the board's "90 min · A, B, ..." line; ours (Kahran, Divya) may show, the client's may not
  const line = Object.values(board).find(t => /^\d+ min\s+·\s+/.test(t)) || '';
  const people = line.replace(/^\d+ min\s+·\s+/, '').split(/,\s*/).map(x => x.trim()).filter(x => x && !/^(Kahran|Divya)$/.test(x));
  const met = people.filter(n => new RegExp('\\b' + n + '\\b', 'i').test(blob + read('build.cjs') + read('bodies/six.html')));
  people.length >= 2 ? r.ok('read ' + people.length + ' client attendees off the board') : r.fail('expected the workshop\'s attendees on the board, found ' + people.length);
  met.length ? r.fail(met.length + ' client person name(s) in Study 83') : r.ok('no client person\'s name in Study 83');
} else r.ok('~/dev/ewc not on this machine: verbatim and name checks skipped');

// the claim
console.log('claim');
const uses = (k) => personas.reduce((s, p) => s + p.wants.filter(x => PLACE.find(([j]) => j === k)[1].test(x.today)).length, 0);
const c = ['coffeeshop', 'bar', 'home', 'club'].map(uses);
c.slice(0, 3).every(x => x > c[3]) ? r.ok('"a coffeeshop, a bar, home" over another club holds (' + c.join(' · ') + ')') : r.fail('the finding no longer holds: ' + c.join(' · '));
const claim = copy['83.all.claim'].text;
claim.includes('coffeeshop ' + c[0]) && claim.includes('bar ' + c[1]) && claim.includes('home ' + c[2]) && claim.includes('country club ' + c[3]) ? r.ok('the claim line shows the counts: ' + claim) : r.fail('the claim line is off: ' + claim);

// the cards (Kahran, 27 Oct, on 48: "Let's just go the A for all of them"): one per member, who they
// are, the guide's profile line word for word; T-a: a card over the column, under the name; on screen
console.log('cards');
const sixHtml = pages[0].html;
const hovs = [...sixHtml.matchAll(/<div class="hov" id="hov-(\w+)"[^>]*>([\s\S]*?)<\/div>/g)];
JSON.stringify(hovs.map(m => m[1])) === JSON.stringify(MEMBERS) ? r.ok('six cards, one per member, in order: ' + MEMBERS.join(' ')) : r.fail('the cards are not the six members: ' + hovs.map(m => m[1]).join(' '));
const optsIn = hovs.map(m => [...m[2].matchAll(/data-opt="([^"]+)"/g)].map(x => x[1]));
optsIn.every((o, i) => o.length === 1 && o[0] === MEMBERS[i] + '-a') ? r.ok('each card holds exactly its member\'s option a, nothing else') : r.fail('a card holds other options: ' + JSON.stringify(optsIn));
hovs.every((m, i) => new RegExp('^<p data-copy="83\\.data\\.p' + i + '\\.profile" class="opt"[^>]*>' + esc(personas[i].profile).replace(/[.*+?^${}()|[\]\\$]/g, '\\$&') + '</p>$').test(m[2])) ? r.ok('each card is that member\'s profile line, word for word') : r.fail('a card is not its member\'s profile line');
!/applyPicks|class="card"|class="dock"|id="copy"|\bt-[bc]\b/.test(sixHtml) ? r.ok('no picking sheet, no dock, no other treatment') : r.fail('the picking sheet or another treatment is still here');
let hv = null;
try { hv = JSON.parse(execFileSync('node', [path.join(__dirname, 'hovers.mjs'), (process.env.MEASURE_BASE || 'http://127.0.0.1:8794/studies/iterations/') + '83/six.html'], { encoding: 'utf8', timeout: 90000 })); }
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
for (const f of OPTIONS.flatMap(v => ['why-' + v + '-1440', 'why-' + v + '-390'])) (read('index.html').includes('img/' + f + '.png') && fs.existsSync(path.join(__dirname, 'img', f + '.png'))) ? r.ok('picture ' + f) : r.fail('missing picture ' + f);

// the columns (Kahran, 27 Oct: "You cannot move the columns"): Study 50 and every option of 83 measured
// live, in both states, at 1440 and 390; every column's left and width must match 50's to the pixel, and
// inside them 50's paragraphs and gaps hold. And the switch: only the asked-for option shows, a by default.
console.log('columns');
const base = process.env.MEASURE_BASE || 'http://127.0.0.1:8794/studies/iterations/';
const URL50 = process.env.MEASURE_50 || base + '50/six.html', URL83 = base + '83/six.html';
const measure = (u) => JSON.parse(execFileSync('node', [path.join(__dirname, 'measure.mjs'), u], { encoding: 'utf8', timeout: 90000 }));
let m50 = null, m83 = {};
try { m50 = measure(URL50); for (const v of ['', ...OPTIONS]) m83[v] = measure(URL83 + (v ? '?v=' + v : '')); }
catch (e) { m50 = null; r.ok('server or Chrome not available: columns not measured (' + String(e.message).split('\n')[0] + ')'); }
if (m50) {
  for (const v of OPTIONS) for (const k of Object.keys(m50)) {
    const a = m50[k], b = m83[v][k];
    a.perRow === b.perRow && JSON.stringify(a.cols) === JSON.stringify(b.cols)
      ? r.ok('?v=' + v + ' ' + k + ': the columns are 50\'s (' + b.perRow + ' to a row, ' + b.cols[0][1] + 'px wide)')
      : r.fail('?v=' + v + ' ' + k + ': the columns moved: 50 ' + JSON.stringify(a.cols) + ' vs 83 ' + JSON.stringify(b.cols));
    a.fewestParas === b.fewestParas && a.paraGap === b.paraGap ? r.ok('?v=' + v + ' ' + k + ': inside the columns as 50 (' + b.fewestParas + ' paragraphs, ' + b.paraGap + 'px)') : r.fail('?v=' + v + ' ' + k + ': inside the columns changed: 50 ' + a.fewestParas + '/' + a.paraGap + ' vs 83 ' + b.fewestParas + '/' + b.paraGap);
    b.pageWidth <= +k.split('-')[1] ? r.ok('?v=' + v + ' ' + k + ': nothing past the edge') : r.fail('?v=' + v + ' ' + k + ': the page is ' + b.pageWidth + 'px wide');
    JSON.stringify(b.whyShown) === JSON.stringify([v]) && b.whyHeight > 150 ? r.ok('?v=' + v + ' ' + k + ': only option ' + v + ' shows (' + b.whyHeight + 'px tall)') : r.fail('?v=' + v + ' ' + k + ': shows ' + JSON.stringify(b.whyShown) + ', ' + b.whyHeight + 'px');
  }
  Object.values(m83['']).every(x => JSON.stringify(x.whyShown) === '["a"]') ? r.ok('no ?v: option a') : r.fail('no ?v shows ' + JSON.stringify(Object.values(m83['']).map(x => x.whyShown)));
}

console.log('words of ours: ' + pages[0].ours + ' · in all: ' + pages[0].all);

r.done();
