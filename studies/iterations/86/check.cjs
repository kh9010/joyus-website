// Study 86: the Prism (85 d) taken forward inside Divya's model, four variants on one page behind ?v=a|b|c|d.
// Pinned here: exactly four options, in the judge's order (a Refraction, the top scorer), one shown at a time;
// every option shows the bet against it: all 21 questions with the judge's score and the section answering each
// (none unanswered), the three moves with the sections that make them, and the sum test; the Tuesday in one
// section at most and never the title; no timeline (no month), one tag, time left to fill; every client line
// verbatim (the workshop 2 board by element, the brand guide); the home page only as a picture; the pride quote
// hidden; no client person's or prospect's name (read off the board, as 46/83/84/85); no money figure but
// $5–10K and 88%; no income on any card; no 'an easy weekday place'; no em dash in our words; noindex; and a
// phone-height ceiling per option, measured at 390 in headless Chrome, so a page can't silently grow.
//   node studies/iterations/86/check.cjs   (MEASURE_BASE=http://127.0.0.1:<port>/studies/iterations/ for the live part)
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const w = require('../../wirecheck.cjs');
const B = require('./build.cjs');
const { PAGE, N, DATA, WORDS, OPTIONS, CONCEPTS, QIDS, trayOf, count } = B;
const { execFileSync } = require('node:child_process');
const r = w.reporter();
const read = (f) => fs.readFileSync(path.join(__dirname, f), 'utf8');
const copy = JSON.parse(read('copy.json')).copy;
const wordsDoc = JSON.parse(read('words.json'));
const { personas } = JSON.parse(read('personas.json'));
const html = read(PAGE.file);
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const flat = (s) => String(s).replace(/\s+/g, ' ').trim();
const noCode = (h) => h.replace(/<script>[\s\S]*?<\/script>/g, '').replace(/<style>[\s\S]*?<\/style>/g, '');
const words = (s) => (s.match(/[A-Za-z0-9$][\w'’$.,&–/"-]*/g) || []).length;
const caseOf = (v) => (html.match(new RegExp(`<div class="case" data-opt="${v}"[\\s\\S]*?<aside class="bet"[\\s\\S]*?</aside>\\s*</div>`)) || [''])[0];
const sectionsOf = (v) => [...noCode(caseOf(v)).matchAll(/<section class="s [^"]*" data-s="(\w+)"[\s\S]*?<\/section>/g)].map(m => ({ n: m[1], h: m[0] }));

console.log('page');
w.links(html, r);
w.chrome(html, r);
for (const [, js] of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) { try { new Function(js); r.ok('script parses'); } catch (e) { r.fail('script: ' + e.message); } }
/<meta name="robots" content="noindex">/.test(html) && /<meta name="robots" content="noindex">/.test(read('index.html')) ? r.ok('case.html and index.html are noindex') : r.fail('noindex missing');
const left = w.text(noCode(html).replace(/<head>[\s\S]*?<\/head>/, '').replace(/<a class="gbox"[^>]*>wordmark<\/a>/g, '').replace(/<(\w+)[^>]*data-copy="[^"]+"[^>]*>[^<]*<\/\1>/g, '').replace(/<svg[\s\S]*?<\/svg>/g, '').replace(/<span class="sn"[^>]*>§\w+<\/span>/g, '').replace(/<span class="url">eastwestclub\.com<\/span>/g, ''));
/^[\s\d→←↓·/|§×–?"]*$/.test(left) ? r.ok('every readable string carries a data-copy id') : r.fail('text outside data-copy: ' + JSON.stringify(left.slice(0, 160)));
const found = [...html.matchAll(/data-copy="([^"]+)"[^>]*>([^<]*)</g)].map(m => ({ id: m[1], text: w.text(m[2]) }));
const unknown = [...new Set(found.filter(f => !copy[f.id]).map(f => f.id))];
unknown.length ? r.fail('ids not in copy.json: ' + unknown.join(', ')) : r.ok(found.length + ' strings, each id in copy.json');
const off = [...new Set(found.filter(f => copy[f.id] && w.text(esc(copy[f.id].text)) !== f.text).map(f => f.id))];
off.length ? r.fail('page text differs from copy.json: ' + off.join(', ')) : r.ok('page text = copy.json text');
const missing = Object.keys(copy).filter(id => !found.some(f => f.id === id));
missing.length ? r.fail('copy.json lists but the page lacks: ' + missing.join(', ')) : r.ok('everything copy.json lists is on the page');
const wordsOff = Object.keys(WORDS).filter(k => !copy[N + '.' + k] || copy[N + '.' + k].text !== WORDS[k].text);
wordsOff.length ? r.fail('words.json not on the page or not as written: ' + wordsOff.join(', ')) : r.ok('every words.json entry is on the page, as written');
const unsourced = Object.entries(WORDS).filter(([, x]) => x.flag === 'sourced' && !x.src).map(([k]) => k);
unsourced.length ? r.fail('sourced without a src: ' + unsourced.join(', ')) : r.ok('every sourced word names its source');
const OUT = ['curated', 'elevated', 'exclusive', 'bespoke', 'concierge', 'amenities'];
const outHits = Object.entries(WORDS).filter(([, x]) => x.flag !== 'chrome' && OUT.some(o => x.text.toLowerCase().includes(o))).map(([k]) => k);
outHits.length ? r.fail('the club\'s out-words: ' + outHits.join(', ')) : r.ok('none of the club\'s out-words');
const voiceBad = [...new Set(found.filter(f => copy[f.id]).map(f => f.id))].filter(id => {
  const cls = [...html.matchAll(new RegExp(`data-copy="${id.replace(/\./g, '\\.')}"(?: class="([^"]*)")?`, 'g'))].map(m => m[1] || '');
  const f = copy[id].flag;
  return (f === 'draft' && cls.some(c => !/\bit\b/.test(c))) || (f === 'sourced' && cls.some(c => !/\bup\b/.test(c)));
});
voiceBad.length ? r.fail('a string not in its voice: ' + voiceBad.slice(0, 8).join(', ')) : r.ok('two voices: every line of ours italic, every client line upright');

console.log('options');
const cases = [...html.matchAll(/<div class="case" data-opt="([a-z])"/g)].map(m => m[1]);
JSON.stringify(cases) === '["a","b","c","d"]' && JSON.stringify(OPTIONS) === JSON.stringify(cases) ? r.ok('four options: ' + cases.join(' ')) : r.fail('options are ' + cases.join(' '));
JSON.stringify(CONCEPTS.map(c => c.name)) === '["Refraction","Their Spectrum","Hold It Up","Their Light"]' && CONCEPTS.every((c, i) => i === 0 || c.total <= CONCEPTS[i - 1].total) ? r.ok('in the judge\'s order, best first (' + CONCEPTS.map(c => c.v + ' ' + c.name + ' ' + c.total).join(' · ') + ')') : r.fail('the order changed: ' + CONCEPTS.map(c => c.name).join(', '));
CONCEPTS.every(c => c.scores.length === 21 && c.scores.reduce((a, b) => a + b, 0) === c.bet && c.bet + c.moves + c.sum + c.prism + c.brevity === c.total && c.scores.every(s => s >= 0 && s <= 2)) ? r.ok('each option: 21 scores of 0-2 that sum to its bet score, and bet + moves + sum + prism + brevity = its total') : r.fail('a score list is off');
/document\.body\.dataset\.v = \/\^\[a-d\]\$\/\.test\(v \|\| ''\) \? v : 'a'/.test(html) && /c\.dataset\.opt !== document\.body\.dataset\.v\) c\.remove\(\)/.test(html) ? r.ok('?v picks the option, a by default; the other three leave the page') : r.fail('the ?v switch is not there');

console.log('the bet');
for (const c of CONCEPTS) {
  const h = caseOf(c.v);
  const rows = [...h.matchAll(/<li class="q" data-q="([^"]+)" data-score="(\d)">/g)].map(m => [m[1], +m[2]]);
  JSON.stringify(rows.map(x => x[0])) === JSON.stringify(QIDS) ? r.ok(c.v + ': all 21 bet rows, in order') : r.fail(c.v + ': bet rows are ' + rows.map(x => x[0]).join(' '));
  rows.every(([q, s]) => s === c.scores[QIDS.indexOf(q)]) ? r.ok(c.v + ': every row shows the judge\'s score (' + c.bet + ' of 42)') : r.fail(c.v + ': a row\'s score is not the judge\'s');
  const none = QIDS.filter(q => copy[`${N}.bet.${c.v}.where.${q}`].text === 'none');
  none.length ? r.fail(c.v + ': unanswered on the page: ' + none.join(' ')) : r.ok(c.v + ': every question answered by a section of the page');
  const secs = sectionsOf(c.v).map(s => s.n);
  JSON.stringify(secs) === JSON.stringify(c.sections.map(s => s.n)) ? r.ok(c.v + ': its sections, §' + secs.join(' §')) : r.fail(c.v + ': sections ' + secs.join(' ') + ' vs concept ' + c.sections.map(s => s.n).join(' '));
  QIDS.every(q => h.includes(`data-copy="${N}.bet.q.${q}"`)) ? r.ok(c.v + ': each row is the bet\'s own question') : r.fail(c.v + ': a question is missing');
  const mv = [...h.matchAll(/<li class="move" data-move="(\d)">/g)].map(m => m[1]);
  const secN = c.sections.map(s => s.n);
  JSON.stringify(mv) === '["1","2","3"]' && [1, 2, 3].every(i => h.includes(`data-copy="${N}.bet.move.${i}"`) && c.moveAt[i - 1].split(' ').every(n => secN.includes(n))) ? r.ok(c.v + ': the three moves, each at real sections (' + c.moveAt.join(' | ') + ')') : r.fail(c.v + ': the three moves are not all shown, or point at no section');
  h.includes(`data-copy="${N}.bet.sum"`) && h.includes(`<span class="sv"><b>${c.sum}</b>`) ? r.ok(c.v + ': the sum test, scored ' + c.sum) : r.fail(c.v + ': the sum test is missing');
  const m1 = secN[0], first = sectionsOf(c.v)[0];
  first && /class="slab /.test(first.h) && c.moveAt[0] === m1 ? r.ok(c.v + ': move 1 first: the page opens on the slab (the situation)') : r.fail(c.v + ': the page does not open on the situation');
}
const bm = B.BET.moves;
bm.every((m, i) => copy[N + '.bet.move.' + (i + 1)].text === m[0] && copy[N + '.bet.move.' + (i + 1) + '.gloss'].text === m[1]) && copy[N + '.bet.sum'].text === B.BET.sum ? r.ok('the moves and the sum are bet.json\'s, word for word') : r.fail('a move or the sum differs from bet.json');
const betQ = Object.fromEntries(B.BET.beliefs.flatMap((b, i) => ['f', 'e', 'i'].map(k => [`b${i + 1}.${k}`, b[k][0]])));
QIDS.every(q => copy[N + '.bet.q.' + q].text === betQ[q]) ? r.ok('the 21 questions are bet.json\'s, word for word') : r.fail('a bet question differs from bet.json');

// the spine (Kahran, 6 Nov, on 84): the value broken down; the Tuesday is one piece of evidence, one section at most
console.log('the spine and the scope');
for (const v of OPTIONS) {
  const secs = sectionsOf(v);
  const tue = secs.filter(s => /Tuesday|class="week|data-day="tue"/.test(s.h)).map(s => s.n);
  tue.length <= 1 ? r.ok(v + ': the Tuesday in ' + (tue.length ? 'one section, §' + tue[0] : 'no section')) : r.fail(v + ': the Tuesday is in ' + tue.length + ' sections: §' + tue.join(' §'));
  const h1 = (caseOf(v).match(/<h1[^>]*>([^<]*)</) || [, ''])[1];
  !/tuesday/i.test(h1) ? r.ok(v + ': its title is not the Tuesday (' + (h1 ? '"' + w.text(h1) + '"' : 'no title: it opens on the drawing') + ')') : r.fail(v + ': the title is about the Tuesday');
  ['class="slab ', 'class="beams"', 'class="ends"', 'class="pbar"', 'class="seats"', 'class="yours"'].every(k => caseOf(v).includes(k)) ? r.ok(v + ': the prism is drawn: slab, beams, six ends, the places bar, the seats, the reader\'s slab') : r.fail(v + ': a piece of the prism is missing');
}
const tags = OPTIONS.map(v => (caseOf(v).match(/<div class="tag" data-tag[\s\S]*?<\/span><\/div>/g) || []));
tags.every(t => t.length >= 1) && new Set(tags.flat()).size === 1 ? r.ok('one tag format on every option: ' + w.text(tags[0][0])) : r.fail('the tag differs between options or is missing');
WORDS['x.tag.kind'].text === 'the value, broken down' && /^\[.*to fill\]$/.test(WORDS['x.tag.time'].text) ? r.ok('the tag names this part of the work; its time is left to fill') : r.fail('the tag\'s kind or time slot changed');
const MONTH = /\b(January|February|March|April|May|June|July|August|September|October|November|December)\b/;
!MONTH.test(w.text(noCode(html).replace(/<head>[\s\S]*?<\/head>/, ''))) ? r.ok('no timeline: no month on the page') : r.fail('a month on the page (a timeline?)');
OPTIONS.every(v => caseOf(v).includes('data-to="client"')) ? r.ok('each option has a quiet "more from EWC"') : r.fail('an option has no "more from EWC"');

console.log('quotes and sources');
const quotes = [...html.matchAll(/<blockquote\b[^>]*>([\s\S]*?)<\/blockquote>/g)].map(m => m[1].replace(/<footer>[\s\S]*?<\/footer>/, ''));
const badQ = quotes.filter(q => !/data-copy=/.test(q) || [...q.matchAll(/data-copy="([^"]+)"/g)].some(m => copy[m[1]].flag !== 'sourced'));
badQ.length ? r.fail('a quote holds words that are not sourced') : r.ok(quotes.length + ' quotes, sourced words only');
const blob = html + read('copy.json') + read('words.json') + read('index.html') + read('concepts.json') + read('build.cjs');
!/an easy weekday place/i.test(blob) ? r.ok('no "an easy weekday place" (84\'s fix)') : r.fail('"an easy weekday place" is back');
!/Designed to become part of your routine/.test(blob) ? r.ok('the home page line is shown as a picture, never transcribed (outside the 46-50 sources)') : r.fail('the home page line is transcribed');
const pend = wordsDoc.pending.quote;
pend && pend.text === '' && !/data-copy="86\.quote"|class="[^"]*quote-slot/.test(html) ? r.ok('the pride quote: slot hidden, nothing invented') : r.fail('the pride quote slot is rendered or filled');
Object.entries(copy).filter(([id]) => id.startsWith(N + '.data.')).every(([id, e]) => e.text === DATA[id.slice(N.length + 6)]) ? r.ok('every guide line is personas.json word for word') : r.fail('a guide line changed');
read('personas.json') === fs.readFileSync(path.join(__dirname, '../43/personas.json'), 'utf8') ? r.ok('personas.json is 43\'s, unchanged') : r.fail('personas.json differs from 43\'s');
!Object.keys(copy).some(id => /\.(profile|life)$/.test(id)) && !personas.some(p => html.includes(esc(p.profile.split('. ')[0]))) ? r.ok('no income on any card: name and wants only, no profile line') : r.fail('a card carries income');
const counts = ['coffeeshop', 'bar', 'home', 'club', 'charity', 'fof', 'one'].map(count);
JSON.stringify(counts) === '[4,3,3,2,2,2,8]' ? r.ok('our count, one place per want: coffeeshop 4 · bar 3 · home 3 · country club 2 · charity 2 · friends of friends 2 · eight of one (24)') : r.fail('the trays count ' + counts.join(' · '));
OPTIONS.filter(v => /class="pseg"/.test(caseOf(v))).every(v => caseOf(v).includes(`data-copy="${N}.x.ourcount"`)) ? r.ok('every count on a page is marked "our count"') : r.fail('a count is not marked as ours');
const ewc = path.join(os.homedir(), 'dev/ewc');
const boardFile = path.join(ewc, 'EWC workshopsession2fill.excalidraw');
if (fs.existsSync(boardFile)) {
  const board = Object.fromEntries(JSON.parse(fs.readFileSync(boardFile, 'utf8')).elements.filter(e => e.type === 'text' && !e.isDeleted).map(e => [e.id, e.text]));
  const fromBoard = Object.entries(WORDS).filter(([, x]) => x.flag === 'sourced' && /workshopsession2fill/.test(x.src || ''));
  const notOnBoard = fromBoard.filter(([, x]) => { const id = (x.src.match(/text (\S+)/) || [])[1]; return !(id && board[id] && flat(board[id]).includes(flat(x.text))); }).map(([k]) => k);
  notOnBoard.length ? r.fail('not verbatim on the board element named: ' + notOnBoard.join(', ')) : r.ok(fromBoard.length + ' lines verbatim on the workshop 2 board, each in the element its src names');
  const page = (f) => flat(fs.readFileSync(f, 'utf8').replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, ' ').replace(/&rsquo;|’/g, "'").replace(/&mdash;/g, '—').replace(/&amp;/g, '&').replace(/&eacute;/g, 'é'));
  const guide = page(path.join(ewc, 'src/brand-guide.html'));
  const fromGuide = Object.entries(WORDS).filter(([, x]) => x.flag === 'sourced' && /brand-guide/.test(x.src || ''));
  const notInGuide = fromGuide.filter(([, x]) => !guide.includes(flat(x.text))).map(([k]) => k);
  notInGuide.length ? r.fail('not verbatim in the guide: ' + notInGuide.join(', ')) : r.ok(fromGuide.length + ' lines verbatim in the brand guide');
  const full = [];
  for (const t of Object.values(board)) for (const m of t.matchAll(/(?:^|\n)([A-Z][a-z]+) ([A-Z][a-z]+) -/g)) full.push([m[1], m[2]]);
  const guideText = read('personas.json');
  const needles = full.flatMap(([f, l]) => [f + ' ' + l, f, ...(new RegExp('\\b' + l + '\\b').test(guideText) ? [] : [l])]);
  const leaked = needles.filter(n => new RegExp('\\b' + n + '\\b').test(blob));
  full.length >= 6 ? r.ok('read ' + full.length + ' prospect names off the board') : r.fail('expected the board\'s prospect names, found ' + full.length);
  leaked.length ? r.fail(leaked.length + ' real prospect name(s) in Study 86') : r.ok('no prospect name on the page, in copy.json, words.json, concepts.json or the index');
  const line = Object.values(board).find(t => /^\d+ min\s+·\s+/.test(t)) || '';
  const people = line.replace(/^\d+ min\s+·\s+/, '').split(/,\s*/).map(x => x.trim()).filter(x => x && !/^(Kahran|Divya)$/.test(x));
  const met = people.filter(n => new RegExp('\\b' + n + '\\b', 'i').test(blob + read('page.js') + read('page.css')));
  people.length >= 2 ? r.ok('read ' + people.length + ' client attendees off the board') : r.fail('expected the workshop\'s attendees, found ' + people.length);
  met.length ? r.fail(met.length + ' client person name(s) in Study 86') : r.ok('no client person\'s name in Study 86');
} else r.ok('~/dev/ewc not on this machine: verbatim and name checks skipped');

console.log('public repo');
const spaced = (h) => noCode(h).replace(/<head>[\s\S]*?<\/head>/, '').replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&');
const text = spaced(html) + ' ' + spaced(read('index.html'));
const ourText = [...Object.values(WORDS).filter(x => x.flag !== 'sourced').map(x => x.text), ...Object.values(copy).filter(x => x.flag === 'label' || x.flag === 'draft').map(x => x.text), read('concepts.json'), w.text(noCode(read('index.html')))].join(' ');
const money = [...(text + ' ' + read('copy.json') + ' ' + read('concepts.json')).matchAll(/\$\s?[\d.,]+(?:[–-]\d+)?\s?[KkMm]?\+?|\b\d+(?:[.,]\d+)?\s?(?:[kK]\b|dollars|USD)|\b\d+(?:\.\d+)?\s?%/g)].map(m => m[0].trim());
const badMoney = [...new Set(money.filter(m => !(/^\$5[–-]10K$/.test(m) || m === '88%')))];
badMoney.length ? r.fail('money or figures not allowed: ' + badMoney.join(', ')) : r.ok('the only figures: ' + [...new Set(money)].join(', '));
!/—/.test(ourText) ? r.ok('no em dash in our words (words.json, copy labels, concepts.json, the study page)') : r.fail('an em dash in our words');

console.log('words');
const WORDCAP = 130; // as 84 and 85; words minimal, the drawings carry it
const budget = {};
for (const v of OPTIONS) {
  const h = noCode(caseOf(v)).replace(/<aside class="bet"[\s\S]*?<\/aside>/, '');
  const seen = new Set();
  const counted = [...h.matchAll(new RegExp(`data-copy="${N}\\.([^"]+)"[^>]*>([^<]*)<`, 'g'))].filter(m => !m[1].startsWith('data.') && !seen.has(m[1]) && seen.add(m[1]));
  const sum = (fl) => counted.filter(m => fl(copy[N + '.' + m[1]].flag)).reduce((s, m) => s + words(w.text(m[2])), 0);
  budget[v] = [sum(f => f === 'draft'), sum(f => f === 'label'), sum(f => f === 'sourced')];
  budget[v][0] <= WORDCAP ? r.ok(v + ': ' + budget[v][0] + ' words in our sentences (cap ' + WORDCAP + ')') : r.fail(v + ': ' + budget[v][0] + ' words in our sentences, over ' + WORDCAP);
}

console.log('pictures');
for (const f of OPTIONS.flatMap(v => ['case-' + v + '-1440', 'case-' + v + '-390'])) read('index.html').includes('img/' + f + '.png') && fs.existsSync(path.join(__dirname, 'img', f + '.png')) ? r.ok('picture ' + f) : r.fail('missing picture ' + f);
fs.existsSync(path.join(__dirname, 'img/front.png')) ? r.ok('the front door: 85\'s crop of the live home page') : r.fail('img/front.png missing');

// live: each option loads alone with no errors and nothing past the edge (needs a server serving this study)
console.log('live');
// the phone ceilings (390 wide, nav to the last section, nothing tapped), set from what was built on 6 Nov
// (a 3681, b 3663, c 3592, d 3635) with about 3% room. Study 85's pages were 8000-9500px.
const CEIL = { a: 3800, b: 3780, c: 3700, d: 3750 }, CEIL_BET = 5000;
const base = process.env.MEASURE_BASE || 'http://127.0.0.1:8794/studies/iterations/';
try {
  const out = JSON.parse(execFileSync('node', [path.join(__dirname, 'measure.mjs'), base + '86/case.html'], { encoding: 'utf8', timeout: 180000, stdio: ['ignore', 'pipe', 'pipe'] }));
  if (!out.a || !out.a['1440'] || !out.a['1440'].shown.length) throw new Error('86 not served at ' + base);
  for (const v of OPTIONS) for (const k of ['1440', '390']) {
    const x = out[v][k];
    JSON.stringify(x.shown) === JSON.stringify([v]) ? r.ok('?v=' + v + ' ' + k + ': only option ' + v) : r.fail('?v=' + v + ' ' + k + ': shows ' + JSON.stringify(x.shown));
    x.pageWidth <= +k ? r.ok('?v=' + v + ' ' + k + ': nothing past the edge') : r.fail('?v=' + v + ' ' + k + ': the page is ' + x.pageWidth + 'px wide');
    x.errors.length ? r.fail('?v=' + v + ' ' + k + ': errors ' + x.errors.join(' | ')) : r.ok('?v=' + v + ' ' + k + ': no errors');
  }
  for (const v of OPTIONS) {
    const x = out[v]['390'];
    x.page <= CEIL[v] ? r.ok('?v=' + v + ' 390: ' + x.page + 'px to the last section, under its ceiling of ' + CEIL[v]) : r.fail('?v=' + v + ' 390: ' + x.page + 'px, over its ceiling of ' + CEIL[v]);
    x.withBet <= CEIL_BET ? r.ok('?v=' + v + ' 390: ' + x.withBet + 'px with the bet strip, under ' + CEIL_BET) : r.fail('?v=' + v + ' 390: ' + x.withBet + 'px with the bet strip, over ' + CEIL_BET);
  }
  ['1440', '390'].every(k => JSON.stringify(out[''][k].shown) === '["a"]') ? r.ok('no ?v: option a') : r.fail('no ?v shows ' + JSON.stringify(out['']));
} catch (e) { r.ok('server or Chrome not available: live part skipped (' + String(e.message).split('\n')[0].slice(0, 120) + ')'); }
console.log('words, our sentences / labels / the club\'s: ' + OPTIONS.map(v => v + ' ' + budget[v].join('/')).join(' · '));
r.done();
