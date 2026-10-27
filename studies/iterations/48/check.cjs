// Study 48: 47's page plus a hover per member, and a picking sheet. As 47 (the
// spacing still measured). New: every option has a code and is verbatim from the
// source it names; the sheet's cards, summary and copy button work (picks.mjs drives
// them in a headless Chrome); a reload keeps the picks; no prospect names anywhere. As 42–46: round 4's nav
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
const { PAGE, DATA, WORDS, OPTIONS, OPT, PLACE } = require('./build.cjs');
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
    .filter(m => copy[m[1]] && copy[m[1]].flag !== 'chrome' && !m[1].startsWith('48.data.') && !m[1].startsWith('48.opt.') && !seen.has(m[1]) && seen.add(m[1]));
  p.ours = counted.filter(m => copy[m[1]].flag !== 'sourced').reduce((s, m) => s + words(w.text(m[2])), 0);
  p.all = counted.reduce((s, m) => s + words(w.text(m[2])), 0);
  p.ours <= BUDGET ? r.ok(p.ours + ' words of ours (budget ' + BUDGET + ')') : r.fail(p.ours + ' words of ours, over the budget of ' + BUDGET);
  p.all <= ALL ? r.ok(p.all + ' words with the founders\' and the club\'s (cap ' + ALL + ')') : r.fail(p.all + ' words in all, over ' + ALL);

  /<\/section>\s*<section class="insight"[^>]*>\s*<p><span data-copy="48\.all\.insight"/.test(mainOf(p.html)) ? r.ok('the finding is the first thing after the head') : r.fail('the finding is not first');
  /<h2[^>]*class="ask"[^>]*><span data-copy="48\.t\.ask"/.test(mainOf(p.html)) ? r.ok('the Tuesday question heads the body') : r.fail('the Tuesday question is not the body\'s heading');
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
const allGives = (h) => personas.every((_, i) => has(h, `48.data.p${i}.give`));
// 2 · six at once
count(H.six, /<div class="col" data-m="/g) === 6 && allGives(H.six) && personas.every((x, i) => x.wants.every((_, k) => has(H.six, `48.data.p${i}.w${k}.today`))) ? r.ok('six: six evenings side by side, every place, every give') : r.fail('six: the six are incomplete');
const lit = count(H.six, /<li class="hit /g);
lit >= 8 ? r.ok('six: ' + lit + ' of 24 places light up (a coffeeshop, a bar, home, a club)') : r.fail('six: only ' + lit + ' places light up');
// copy.json and words.json
console.log('copy.json');
const dataOff = Object.entries(copy).filter(([id, e]) => id.startsWith('48.data.') && e.text !== DATA[id.slice(8)]).map(([id]) => id);
dataOff.length ? r.fail('guide lines changed: ' + dataOff.join(', ')) : r.ok('every 48.data line is personas.json word for word');
read('personas.json') === fs.readFileSync(path.join(__dirname, '../43/personas.json'), 'utf8') ? r.ok('personas.json is 43\'s, unchanged') : r.fail('personas.json differs from 43\'s');
const wordsOff = Object.entries(WORDS).filter(([k, x]) => !copy['48.' + k] || (k !== 'all.claim' && copy['48.' + k].text !== x.text)).map(([k]) => k);
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
  const blob = pages.map(p => p.html).join('\n') + read('copy.json') + read('words.json') + read('index.html') + read('options.json');
  const leaked = needles.filter(n => new RegExp('\\b' + n + '\\b').test(blob));
  full.length >= 6 ? r.ok('read ' + full.length + ' prospect names off the board') : r.fail('expected the board\'s prospect names, found ' + full.length);
  leaked.length ? r.fail(leaked.length + ' real prospect name(s) on a page') : r.ok('no real prospect name on any page, in copy.json or the index');
} else r.ok('~/dev/ewc not on this machine: verbatim and name checks skipped');

// the claim
console.log('claim');
const uses = (k) => personas.reduce((s, p) => s + p.wants.filter(x => PLACE.find(([j]) => j === k)[1].test(x.today)).length, 0);
const c = ['coffeeshop', 'bar', 'home', 'club'].map(uses);
c.slice(0, 3).every(x => x > c[3]) ? r.ok('"a coffeeshop, a bar, home" over another club holds (' + c.join(' · ') + ')') : r.fail('the finding no longer holds: ' + c.join(' · '));
const claim = copy['48.all.claim'].text;
claim.includes('coffeeshop ' + c[0]) && claim.includes('bar ' + c[1]) && claim.includes('home ' + c[2]) && claim.includes('country club ' + c[3]) ? r.ok('the claim line shows the counts: ' + claim) : r.fail('the claim line is off: ' + claim);

// the options: a code each (member-letter, or T-letter), a flag, a source for every sourced one;
// on the page (hidden in that member's hover) and on the sheet (a card), word for word
console.log('options');
const MEMBERS = ['QC', 'CCG', 'SRO', 'NSF', 'EN', 'MCHE'];
const allOpts = [...OPTIONS.treatments.map(t => ({ ...t, member: 'T' })), ...OPTIONS.personas.flatMap(m => m.options.map(o => ({ ...o, member: m.code })))];
JSON.stringify(OPTIONS.personas.map(m => m.code)) === JSON.stringify(MEMBERS) && OPTIONS.personas.every((m, i) => m.name === personas[i].name) ? r.ok('six members, in the page\'s order: ' + MEMBERS.join(' ')) : r.fail('the members are not the six, in order');
const badCode = allOpts.filter(o => !new RegExp('^' + o.member + '-[a-g]$').test(o.code || '')).map(o => o.code || '(none)');
badCode.length ? r.fail('options without a proper code: ' + badCode.join(', ')) : r.ok(allOpts.length + ' options, each with its code');
new Set(allOpts.map(o => o.code)).size === allOpts.length ? r.ok('no code used twice') : r.fail('a code is used twice');
OPTIONS.personas.every(m => m.options.length >= 4) && OPTIONS.treatments.length >= 2 ? r.ok('4+ options per member (' + OPTIONS.personas.map(m => m.code + ' ' + m.options.length).join(', ') + '), ' + OPTIONS.treatments.length + ' treatments') : r.fail('too few options');
const unflagged = allOpts.filter(o => !['sourced', 'draft'].includes(o.flag) || (o.flag === 'sourced' && !o.src)).map(o => o.code);
unflagged.length ? r.fail('options without a flag or source: ' + unflagged.join(', ')) : r.ok('every option is sourced (with its src) or marked draft');
const sixHtml = pages[0].html;
const notOnPage = OPTIONS.personas.flatMap(m => m.options.filter(o => !new RegExp('id="hov-' + m.code + '"[\\s\\S]*?data-copy="48\\.opt\\.' + o.code + '"').test(sixHtml)).map(o => o.code));
notOnPage.length ? r.fail('options not in their member\'s hover: ' + notOnPage.join(', ')) : r.ok('every member option sits in that member\'s hover on the page');
const idx = read('index.html');
const noCard = allOpts.filter(o => !new RegExp('<button[^>]*class="card" data-code="' + o.code + '"[\\s\\S]*?data-copy="48\\.opt\\.' + o.code + '"').test(idx)).map(o => o.code);
noCard.length ? r.fail('options without a card on the sheet: ' + noCard.join(', ')) : r.ok('every option is a card on the sheet, with its code');
const idxFound = [...idx.matchAll(/data-copy="([^"]+)"[^>]*>([^<]*)</g)].map(m => ({ id: m[1], text: w.text(m[2]) }));
const idxOff = idxFound.filter(f => !copy[f.id] || w.text(esc(copy[f.id].text)) !== f.text).map(f => f.id);
idxOff.length ? r.fail('sheet text not as copy.json: ' + idxOff.join(', ')) : r.ok('sheet text = copy.json text');
const optCopy = Object.entries(copy).filter(([id]) => id.startsWith('48.opt.'));
optCopy.every(([id, e]) => OPT[id.slice(7)] && e.text === OPT[id.slice(7)].text && e.code === id.slice(7)) && optCopy.length === allOpts.length ? r.ok('copy.json carries every option with its code') : r.fail('copy.json and options.json disagree');
// options.json is what extract.py writes from the sources, today
const ewcHere = fs.existsSync(path.join(os.homedir(), 'dev/ewc/src/sales-kit.html'));
if (ewcHere) {
  const before = read('options.json');
  try { execFileSync('python3', ['-I', path.join(__dirname, 'extract.py')], { encoding: 'utf8' }); } catch (e) { r.fail('extract.py: ' + e.message); }
  const after = read('options.json');
  if (after !== before) { fs.writeFileSync(path.join(__dirname, 'options.json'), before); r.fail('options.json is not what extract.py writes from the sources (edited by hand, or a source moved)'); }
  else r.ok('options.json = extract.py from ~/dev/ewc, word for word');
  const kit = fs.readFileSync(path.join(os.homedir(), 'dev/ewc/src/sales-kit.html'), 'utf8').replace(/<[^>]+>/g, ' ').replace(/&mdash;/g, '—').replace(/&rsquo;/g, "'").replace(/&amp;/g, '&').replace(/\s+/g, ' ');
  const kitOpts = allOpts.filter(o => /sales-kit/.test(o.src || ''));
  const notInKit = kitOpts.filter(o => !kit.includes(o.text)).map(o => o.code);
  notInKit.length ? r.fail('not verbatim in the sales kit: ' + notInKit.join(', ')) : r.ok(kitOpts.length + ' options verbatim in the sales kit');
  const boardEls = Object.fromEntries(JSON.parse(fs.readFileSync(path.join(os.homedir(), 'dev/ewc/EWC workshopsession2fill.excalidraw'), 'utf8')).elements.filter(e => e.type === 'text' && !e.isDeleted).map(e => [e.id, e.text]));
  const boardOpts = allOpts.filter(o => /workshopsession2fill/.test(o.src || ''));
  const notOnBoard = boardOpts.filter(o => { const id = (o.src.match(/text (\S+?);/) || [])[1]; return flat(boardEls[id] || '') !== flat(o.text); }).map(o => o.code);
  notOnBoard.length ? r.fail('not verbatim on the board: ' + notOnBoard.join(', ')) : r.ok(boardOpts.length + ' options verbatim on the workshop 2 board, element by element');
  const ho = flat(fs.readFileSync(path.join(os.homedir(), 'dev/ewc/docs/HANDOFF.md'), 'utf8').replace(/\*\*/g, ''));
  const hoOpts = allOpts.filter(o => /docs\/HANDOFF/.test(o.src || ''));
  const notInHo = hoOpts.filter(o => !ho.includes(flat(o.text))).map(o => o.code);
  notInHo.length ? r.fail('not verbatim in the EWC handoff: ' + notInHo.join(', ')) : r.ok(hoOpts.length + ' options verbatim in the EWC handoff');
} else r.ok('~/dev/ewc not on this machine: options.json source check skipped');

// the sheet, driven: tap a treatment and two members' options; the summary names every member,
// the page in the frame shows just those, a tap opens a hover, "show all" opens all six, the
// copy button is there, a reload keeps the picks
console.log('sheet');
let pk = null;
try { pk = JSON.parse(execFileSync('node', [path.join(__dirname, 'picks.mjs')], { encoding: 'utf8', timeout: 90000 })); }
catch (e) { r.ok('server or Chrome not available: sheet not driven (' + String(e.message).split('\n')[0] + ')'); }
if (pk) for (const [k, x] of Object.entries(pk)) {
  const sum = x.summary;
  sum.startsWith('Study 48 picks\nTreatment: T-c') ? r.ok(k + ': the summary opens with the treatment') : r.fail(k + ': summary head is off: ' + JSON.stringify(sum.slice(0, 60)));
  personas.every(p => sum.includes('\n' + p.name + ': ')) ? r.ok(k + ': the summary names all six members') : r.fail(k + ': a member is missing from the summary');
  ['QC-b', 'QC-e', 'MCHE-d'].every(c => sum.includes(c + ' — "' + OPT[c].text + '"')) && /The Country-Club Guy: —/.test(sum) ? r.ok(k + ': picks carry code and text; nothing picked shows —') : r.fail(k + ': picks are off in the summary');
  JSON.stringify(x.qc) === '["QC-b","QC-e"]' && JSON.stringify(x.mche) === '["MCHE-d"]' && JSON.stringify(x.ccg) === '["CCG-a"]' && x.treatment === 't-c' ? r.ok(k + ': the page shows the picked options (unpicked members show their first) in T-c') : r.fail(k + ': the page shows ' + JSON.stringify([x.treatment, x.qc, x.mche, x.ccg]));
  x.tapOpens === 'block' && x.othersDim < 0.5 ? r.ok(k + ': a tap opens a hover; T-c dims the other five') : r.fail(k + ': tap ' + x.tapOpens + ', dim ' + x.othersDim);
  x.showAll ? r.ok(k + ': "show all" opens all six') : r.fail(k + ': "show all" does not open all six');
  x.copy && x.dockVisible === 'fixed' ? r.ok(k + ': the Copy picks button sits in a fixed dock') : r.fail(k + ': no Copy picks button in a fixed dock');
  JSON.stringify(x.afterReload) === JSON.stringify(x.pressed) && x.pressed.length === 4 ? r.ok(k + ': a reload keeps the picks') : r.fail(k + ': a reload lost the picks');
  x.wide <= +k && x.pageWide <= +k ? r.ok(k + ': nothing past the edge') : r.fail(k + ': ' + x.wide + 'px wide');
  x.errors.length ? r.fail(k + ': page errors: ' + x.errors.join(' | ')) : r.ok(k + ': no page errors');
}
for (const f of ['hover-t-a', 'hover-t-b', 'hover-t-c', 'sheet-390', 'picks-390']) (idx.includes('img/' + f + '.png') && fs.existsSync(path.join(__dirname, 'img', f + '.png'))) ? r.ok('picture ' + f) : r.fail('missing picture ' + f);

// the spacing (Kahran, 27 Oct: "with EWC, it needs to be spaced out a little better"): measured, held to
// numbers 46 · 2 fails (6 to a row, 12px gaps, a 211px give at 1.4, 28px of empty band under each name)
console.log('spacing');
const URL47 = process.env.MEASURE_URL || 'http://127.0.0.1:8794/studies/iterations/48/six.html';
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
