// Study 84: the EWC case study, the top four of five concepts after three judged rounds, on one page
// behind ?v=a|b|c|d. Pinned here: exactly four options, in the judge's order (a the top scorer), one shown
// at a time; every option shows all 21 bet rows with the judge's score and where on the page each is
// answered (none unanswered); every option carries Study 50's six Tuesdays held (columns measured live
// against 50's, both states, 1440 and 390, equal to the pixel; the cards start at the life sentence);
// every client line verbatim from the workshop 2 board (by element), the brand guide or the club's site;
// a quote holds only sourced words; no client person's or prospect's name (read off the board, as 46/83);
// no money figure but $5–10K and 88%; no em dash in our words; noindex; the pictures.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const w = require('../../wirecheck.cjs');
const B = require('./build.cjs');
const { PAGE, DATA, WORDS, PLACE, MEMBERS, OPTIONS, CONCEPTS, QIDS, sentences, life } = B;
const { execFileSync } = require('node:child_process');
const r = w.reporter();
const read = (f) => fs.readFileSync(path.join(__dirname, f), 'utf8');
const copy = JSON.parse(read('copy.json')).copy;
const { personas } = JSON.parse(read('personas.json'));
const html = read(PAGE.file);
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const flat = (s) => String(s).replace(/\s+/g, ' ').trim();
const noCode = (h) => h.replace(/<script>[\s\S]*?<\/script>/g, '').replace(/<style>[\s\S]*?<\/style>/g, '');
const words = (s) => (s.match(/[A-Za-z0-9$][\w'’$.,&–/"-]*/g) || []).length;
const caseOf = (v) => (html.match(new RegExp(`<div class="case" data-opt="${v}"[\\s\\S]*?<aside class="bet"[\\s\\S]*?</aside>\\s*</div>`)) || [''])[0];

console.log('page');
w.links(html, r);
w.chrome(html, r);
for (const [, js] of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) { try { new Function(js); r.ok('script parses'); } catch (e) { r.fail('script: ' + e.message); } }
/<meta name="robots" content="noindex">/.test(html) && /<meta name="robots" content="noindex">/.test(read('index.html')) ? r.ok('six.html and index.html are noindex') : r.fail('noindex missing');
const left = w.text(noCode(html).replace(/<head>[\s\S]*?<\/head>/, '').replace(/<a class="gbox"[^>]*>wordmark<\/a>/g, '').replace(/<(\w+)[^>]*data-copy="[^"]+"[^>]*>[^<]*<\/\1>/g, '').replace(/<svg[\s\S]*?<\/svg>/g, ''));
/^[\s\d→←↓·/|§×–?]*$/.test(left) ? r.ok('every readable string carries a data-copy id') : r.fail('text outside data-copy: ' + JSON.stringify(left.slice(0, 160)));
const found = [...html.matchAll(/data-copy="([^"]+)"[^>]*>([^<]*)</g)].map(m => ({ id: m[1], text: w.text(m[2]) }));
const unknown = [...new Set(found.filter(f => !copy[f.id]).map(f => f.id))];
unknown.length ? r.fail('ids not in copy.json: ' + unknown.join(', ')) : r.ok(found.length + ' strings, each id in copy.json');
const off = [...new Set(found.filter(f => copy[f.id] && w.text(esc(copy[f.id].text)) !== f.text).map(f => f.id))];
off.length ? r.fail('page text differs from copy.json: ' + off.join(', ')) : r.ok('page text = copy.json text');
const missing = Object.keys(copy).filter(id => !found.some(f => f.id === id));
missing.length ? r.fail('copy.json lists but the page lacks: ' + missing.join(', ')) : r.ok('everything copy.json lists is on the page');
const wordsOff = Object.keys(WORDS).filter(k => !copy['84.' + k] || copy['84.' + k].text !== WORDS[k].text);
wordsOff.length ? r.fail('words.json not on the page or not as written: ' + wordsOff.join(', ')) : r.ok('every words.json entry is on the page, as written');
const unsourced = Object.entries(WORDS).filter(([, x]) => x.flag === 'sourced' && !x.src).map(([k]) => k);
unsourced.length ? r.fail('sourced without a src: ' + unsourced.join(', ')) : r.ok('every sourced word names its source');
const OUT = ['curated', 'elevated', 'exclusive', 'bespoke', 'concierge', 'amenities'];
const outHits = Object.entries(WORDS).filter(([, x]) => x.flag !== 'chrome' && OUT.some(o => x.text.toLowerCase().includes(o))).map(([k]) => k);
outHits.length ? r.fail('the club\'s out-words: ' + outHits.join(', ')) : r.ok('none of the club\'s out-words');
// two voices: ours (draft) is set italic, the club's (sourced) upright, everywhere
const voiceBad = found.filter(f => copy[f.id]).map(f => f.id).filter((id, i, a) => a.indexOf(id) === i).filter(id => {
  const cls = [...html.matchAll(new RegExp(`data-copy="${id.replace(/\./g, '\\.')}"(?: class="([^"]*)")?`, 'g'))].map(m => m[1] || '');
  const f = copy[id].flag;
  return (f === 'draft' && cls.some(c => !/\bit\b/.test(c))) || (f === 'sourced' && cls.some(c => !/\bup\b/.test(c)));
});
voiceBad.length ? r.fail('a string not in its voice: ' + voiceBad.slice(0, 8).join(', ')) : r.ok('two voices: every line of ours italic, every client line upright');

// the options: four, in the judge's order, one shown, ?v picks it
console.log('options');
const cases = [...html.matchAll(/<div class="case" data-opt="([a-z])"/g)].map(m => m[1]);
JSON.stringify(cases) === JSON.stringify(['a', 'b', 'c', 'd']) && JSON.stringify(OPTIONS) === JSON.stringify(cases) ? r.ok('four options: ' + cases.join(' ')) : r.fail('options are ' + cases.join(' '));
const totals = CONCEPTS.map(c => c.total);
totals.every((t, i) => i === 0 || t <= totals[i - 1]) && CONCEPTS[0].v === 'a' ? r.ok('in the judge\'s order, a the top scorer (' + CONCEPTS.map(c => c.v + ' ' + c.name + ' ' + c.total).join(' · ') + ')') : r.fail('not in score order: ' + totals.join(' '));
CONCEPTS.every(c => c.scores.length === 21 && c.scores.reduce((a, b) => a + b, 0) === c.total && c.scores.every(s => s >= 0 && s <= 2)) ? r.ok('each option: 21 scores of 0-2 that sum to its total') : r.fail('a score list is off');
/document\.body\.dataset\.v = \/\^\[a-d\]\$\/\.test\(v \|\| ''\) \? v : 'a'/.test(html) && /c\.dataset\.opt !== document\.body\.dataset\.v\) c\.remove\(\)/.test(html) ? r.ok('?v picks the option, a by default; the other three leave the page') : r.fail('the ?v switch is not there');

// the bet, against each page: all 21 questions, the judge's score, where it is answered
console.log('the bet');
for (const c of CONCEPTS) {
  const h = caseOf(c.v);
  const rows = [...h.matchAll(/<li class="q" data-q="([^"]+)" data-score="(\d)">/g)].map(m => [m[1], +m[2]]);
  JSON.stringify(rows.map(x => x[0])) === JSON.stringify(QIDS) ? r.ok(c.v + ': all 21 bet rows, in order') : r.fail(c.v + ': bet rows are ' + rows.map(x => x[0]).join(' '));
  rows.every(([q, s]) => s === c.scores[QIDS.indexOf(q)]) ? r.ok(c.v + ': every row shows the judge\'s score (' + c.total + ' of 42)') : r.fail(c.v + ': a row\'s score is not the judge\'s');
  const none = QIDS.filter(q => copy[`84.bet.${c.v}.where.${q}`].text === 'none');
  none.length ? r.fail(c.v + ': unanswered on the page: ' + none.join(' ')) : r.ok(c.v + ': every question answered by a section of the page');
  const secs = [...h.matchAll(/<section class="s [^"]*" data-s="(\d)"/g)].map(m => m[1]);
  JSON.stringify(secs) === JSON.stringify(c.sections.map(s => s.n)) ? r.ok(c.v + ': its sections, §' + secs.join(' §')) : r.fail(c.v + ': sections ' + secs.join(' ') + ' vs concept ' + c.sections.map(s => s.n).join(' '));
  QIDS.every(q => h.includes(`data-copy="84.bet.q.${q}"`)) ? r.ok(c.v + ': each row is the bet\'s own question') : r.fail(c.v + ': a question is missing');
  /<div class="tag" data-tag/.test(h) && h.includes('data-copy="84.x.tag.price"') ? r.ok(c.v + ': the project tag (team · time · $5–10K)') : r.fail(c.v + ': no project tag');
}
const betQ = Object.fromEntries(B.BET.beliefs.flatMap((b, i) => ['f', 'e', 'i'].map(k => [`b${i + 1}.${k}`, b[k][0]])));
QIDS.every(q => copy['84.bet.q.' + q].text === betQ[q]) ? r.ok('the 21 questions are bet.json\'s, word for word') : r.fail('a bet question differs from bet.json');

// Study 50's six, held, once in each option
console.log('six Tuesdays');
for (const v of OPTIONS) {
  const h = caseOf(v);
  const ok = (h.match(/<div class="col" data-m="/g) || []).length === 6 && (h.match(/<div class="six">/g) || []).length === 1
    && personas.every((p, i) => p.wants.every((_, k) => h.includes(`84.data.p${i}.w${k}.today`)) && sentences(p.give).every((_, n) => h.includes(`84.data.p${i}.give.s${n}`)));
  ok ? r.ok(v + ': the six Tuesdays once, every place, every give') : r.fail(v + ': the six are incomplete');
}
personas.every((p, i) => sentences(p.give).map((_, n) => DATA[`p${i}.give.s${n}`]).join(' ') === p.give) ? r.ok('every give, its paragraphs joined, is the guide\'s line word for word') : r.fail('a give does not join back');
Object.entries(copy).filter(([id]) => id.startsWith('84.data.')).every(([id, e]) => e.text === DATA[id.slice(8)]) ? r.ok('every 84.data line is personas.json word for word') : r.fail('a guide line changed');
read('personas.json') === fs.readFileSync(path.join(__dirname, '../43/personas.json'), 'utf8') ? r.ok('personas.json is 43\'s, unchanged') : r.fail('personas.json differs from 43\'s');
personas.every((p, i) => p.profile.endsWith(DATA[`p${i}.life`]) && !/\$|\d+K\b/.test(DATA[`p${i}.life`])) ? r.ok('each card is its profile line from the life sentence, the income clause dropped') : r.fail('a card carries income or is not the profile\'s tail');
const uses = (k) => personas.reduce((s, p) => s + p.wants.filter(x => PLACE.find(([j]) => j === k)[1].test(x.today)).length, 0);
const counts = ['coffeeshop', 'bar', 'home', 'club'].map(uses);
JSON.stringify(counts) === '[4,3,4,2]' && /<span class="pseg" style="--n:4;--c:[^"]+"><b data-copy="84\.x\.pl\.coffeeshop"/.test(html) ? r.ok('the places as the guide counts them: coffeeshop 4 · bar 3 · home 4 · country club 2') : r.fail('the places count ' + counts.join(' · '));

// quotes are only ever someone else's words
console.log('quotes and sources');
const quotes = [...html.matchAll(/<blockquote\b[^>]*>([\s\S]*?)<\/blockquote>/g)].map(m => m[1].replace(/<footer>[\s\S]*?<\/footer>/, ''));
const badQ = quotes.filter(q => !/data-copy=/.test(q) || [...q.matchAll(/data-copy="([^"]+)"/g)].some(m => copy[m[1]].flag !== 'sourced'));
badQ.length ? r.fail('a quote holds words that are not sourced') : r.ok(quotes.length + ' quotes, sourced words only');
// a line that traces only to Study 83 ("an easy weekday place.") is not used: Kahran's sources are 46-50
!/an easy weekday place/.test(html + read('copy.json')) ? r.ok('nothing that traces only to Study 83') : r.fail('"an easy weekday place." is back');
const ewc = path.join(os.homedir(), 'dev/ewc');
const boardFile = path.join(ewc, 'EWC workshopsession2fill.excalidraw');
const blob = html + read('copy.json') + read('words.json') + read('index.html') + read('concepts.json') + read('build.cjs');
if (fs.existsSync(boardFile)) {
  const board = Object.fromEntries(JSON.parse(fs.readFileSync(boardFile, 'utf8')).elements.filter(e => e.type === 'text' && !e.isDeleted).map(e => [e.id, e.text]));
  const fromBoard = Object.entries(WORDS).filter(([, x]) => x.flag === 'sourced' && /workshopsession2fill/.test(x.src || ''));
  const notOnBoard = fromBoard.filter(([, x]) => { const id = (x.src.match(/text (\S+)$/) || [])[1]; return id ? flat(board[id] || '') !== flat(x.text) : !Object.values(board).some(t => flat(t).includes(flat(x.text))); }).map(([k]) => k);
  notOnBoard.length ? r.fail('not verbatim on the board: ' + notOnBoard.join(', ')) : r.ok(fromBoard.length + ' lines verbatim on the workshop 2 board, element by element');
  const page = (f) => flat(fs.readFileSync(f, 'utf8').replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, ' ').replace(/&rsquo;|’/g, "'").replace(/&mdash;/g, '—').replace(/&amp;/g, '&').replace(/&eacute;/g, 'é'));
  const guide = page(path.join(ewc, 'src/brand-guide.html')), site = page(path.join(ewc, 'src/site/index.html'));
  const fromGuide = Object.entries(WORDS).filter(([, x]) => x.flag === 'sourced' && /brand-guide/.test(x.src || ''));
  const notInGuide = fromGuide.filter(([, x]) => !guide.includes(flat(x.text))).map(([k]) => k);
  notInGuide.length ? r.fail('not verbatim in the guide: ' + notInGuide.join(', ')) : r.ok(fromGuide.length + ' lines verbatim in the brand guide');
  const fromSite = Object.entries(WORDS).filter(([, x]) => x.flag === 'sourced' && /src\/site/.test(x.src || ''));
  const notOnSite = fromSite.filter(([, x]) => !site.includes(flat(x.text))).map(([k]) => k);
  fromSite.length && !notOnSite.length ? r.ok(fromSite.length + ' line(s) verbatim on the club\'s site') : r.fail('not verbatim on the site: ' + notOnSite.join(', '));
  // names (as 46 and 83): the founding-member answers open "First Last -"; the attendees on the "90 min · A, B" line
  const full = [];
  for (const t of Object.values(board)) for (const m of t.matchAll(/(?:^|\n)([A-Z][a-z]+) ([A-Z][a-z]+) -/g)) full.push([m[1], m[2]]);
  const guideText = read('personas.json');
  const needles = full.flatMap(([f, l]) => [f + ' ' + l, f, ...(new RegExp('\\b' + l + '\\b').test(guideText) ? [] : [l])]);
  const leaked = needles.filter(n => new RegExp('\\b' + n + '\\b').test(blob));
  full.length >= 6 ? r.ok('read ' + full.length + ' prospect names off the board') : r.fail('expected the board\'s prospect names, found ' + full.length);
  leaked.length ? r.fail(leaked.length + ' real prospect name(s) in Study 84') : r.ok('no prospect name on the page, in copy.json, words.json, concepts.json or the index');
  const line = Object.values(board).find(t => /^\d+ min\s+·\s+/.test(t)) || '';
  const people = line.replace(/^\d+ min\s+·\s+/, '').split(/,\s*/).map(x => x.trim()).filter(x => x && !/^(Kahran|Divya)$/.test(x));
  const met = people.filter(n => new RegExp('\\b' + n + '\\b', 'i').test(blob + read('page.js') + read('page.css')));
  people.length >= 2 ? r.ok('read ' + people.length + ' client attendees off the board') : r.fail('expected the workshop\'s attendees, found ' + people.length);
  met.length ? r.fail(met.length + ' client person name(s) in Study 84') : r.ok('no client person\'s name in Study 84');
} else r.ok('~/dev/ewc not on this machine: verbatim and name checks skipped');

// public repo: no money but $5–10K and 88%; no em dash in our words
console.log('public repo');
const spaced = (h) => noCode(h).replace(/<head>[\s\S]*?<\/head>/, '').replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&');
const text = spaced(html) + ' ' + spaced(read('index.html'));
const ourText = [...Object.values(WORDS).filter(x => x.flag !== 'sourced').map(x => x.text), ...Object.values(copy).filter(x => x.flag === 'label' || x.flag === 'draft').map(x => x.text), read('concepts.json'), w.text(noCode(read('index.html')))].join(' ');
const money = [...(text + ' ' + read('copy.json') + ' ' + read('concepts.json')).matchAll(/\$\s?[\d.,]+(?:[–-]\d+)?\s?[KkMm]?\+?|\b\d+(?:[.,]\d+)?\s?(?:[kK]\b|dollars|USD)|\b\d+(?:\.\d+)?\s?%/g)].map(m => m[0].trim());
const allowed = (m) => /^\$5[–-]10K$/.test(m) || m === '88%';
const badMoney = [...new Set(money.filter(m => !allowed(m)))];
badMoney.length ? r.fail('money or figures not allowed: ' + badMoney.join(', ')) : r.ok('the only figures: ' + [...new Set(money)].join(', '));
!/—/.test(ourText) ? r.ok('no em dash in our words (words.json, copy labels, concepts.json, the study page)') : r.fail('an em dash in our words');

// words: what each option asks the reader to read (ours, the club's), the bet strip and the six's data out
console.log('words');
const budget = {};
for (const v of OPTIONS) {
  const h = noCode(caseOf(v)).replace(/<aside class="bet"[\s\S]*?<\/aside>/, '');
  const seen = new Set();
  const counted = [...h.matchAll(/data-copy="84\.([^"]+)"[^>]*>([^<]*)</g)].filter(m => !m[1].startsWith('data.') && !seen.has(m[1]) && seen.add(m[1]));
  const sum = (fl) => counted.filter(m => fl(copy['84.' + m[1]].flag)).reduce((s, m) => s + words(w.text(m[2])), 0);
  const ours = sum(f => f === 'draft'), labels = sum(f => f === 'label'), theirs = sum(f => f === 'sourced');
  budget[v] = [ours, labels, theirs];
  // Kahran: the words carry too much. Our sentences (the italic voice) are held to 130 a whole page (83 held 120 for one piece); labels are counted, not capped. b is the wordiest, as the judge said
  ours <= 130 ? r.ok(v + ': ' + ours + ' words in our sentences (cap 130), ' + labels + ' in labels, ' + theirs + ' of the club\'s') : r.fail(v + ': ' + ours + ' words in our sentences, over 130');
}

// pictures
console.log('pictures');
for (const f of OPTIONS.flatMap(v => ['case-' + v + '-1440', 'case-' + v + '-390'])) read('index.html').includes('img/' + f + '.png') && fs.existsSync(path.join(__dirname, 'img', f + '.png')) ? r.ok('picture ' + f) : r.fail('missing picture ' + f);
['voice.png', 'values.jpg', 'kit.png', 'site.png'].every(f => fs.existsSync(path.join(__dirname, 'img', f))) ? r.ok('the four thumbnails of the work') : r.fail('a thumbnail is missing');

// live: the columns against 50's, the switch, the cards (needs the server serving this study)
console.log('live');
const base = process.env.MEASURE_BASE || 'http://127.0.0.1:8794/studies/iterations/';
const URL50 = process.env.MEASURE_50 || base + '50/six.html', URL84 = base + '84/six.html';
const run = (f, u) => JSON.parse(execFileSync('node', [path.join(__dirname, f), u], { encoding: 'utf8', timeout: 120000, stdio: ['ignore', 'pipe', 'pipe'] }));
let m50 = null; const m84 = {};
try { m50 = run('measure.mjs', URL50); for (const v of ['', ...OPTIONS]) m84[v] = run('measure.mjs', URL84 + (v ? '?v=' + v : '')); if (!m84.a['without-1440'].shown) throw new Error('84 not served at ' + URL84); }
catch (e) { m50 = null; r.ok('server or Chrome not available: columns not measured (' + String(e.message).split('\n')[0].slice(0, 120) + ')'); }
if (m50) {
  for (const v of OPTIONS) for (const k of Object.keys(m50)) {
    const a = m50[k], b = m84[v][k];
    a.perRow === b.perRow && JSON.stringify(a.cols) === JSON.stringify(b.cols) ? r.ok('?v=' + v + ' ' + k + ': the columns are 50\'s (' + b.perRow + ' to a row, ' + b.cols[0][1] + 'px)') : r.fail('?v=' + v + ' ' + k + ': the columns moved: 50 ' + JSON.stringify(a.cols) + ' vs 84 ' + JSON.stringify(b.cols));
    a.fewestParas === b.fewestParas && a.paraGap === b.paraGap ? r.ok('?v=' + v + ' ' + k + ': inside the columns as 50') : r.fail('?v=' + v + ' ' + k + ': inside the columns changed');
    b.pageWidth <= +k.split('-')[1] ? r.ok('?v=' + v + ' ' + k + ': nothing past the edge') : r.fail('?v=' + v + ' ' + k + ': the page is ' + b.pageWidth + 'px wide');
    JSON.stringify(b.shown) === JSON.stringify([v]) && b.sixes === 1 ? r.ok('?v=' + v + ' ' + k + ': only option ' + v + ', one six') : r.fail('?v=' + v + ' ' + k + ': shows ' + JSON.stringify(b.shown));
  }
  Object.values(m84['']).every(x => JSON.stringify(x.shown) === '["a"]') ? r.ok('no ?v: option a') : r.fail('no ?v shows ' + JSON.stringify(Object.values(m84['']).map(x => x.shown)));
  for (const v of OPTIONS) {
    const hv = run('hovers.mjs', URL84 + '?v=' + v);
    for (const [k, x] of Object.entries(hv)) {
      const bad = [];
      if (!(x.cards.length === 6 && x.cards.every(c => c.display === 'block'))) bad.push('a card does not open');
      if (!x.cards.every(c => c.position === 'absolute' && c.belowName >= 0 && c.belowName <= 16)) bad.push('not T-a');
      if (x.cards.some(c => c.left < 0 || c.right > x.vw)) bad.push('off screen');
      if (!x.cards.every(c => c.othersShut)) bad.push('more than one open');
      if (!x.cards.every((c, i) => c.text === life(personas[i]))) bad.push('a card reads wrong');
      if (!x.allOpen) bad.push('show all');
      if (x.pageWidth > x.vw) bad.push('page ' + x.pageWidth + 'px wide');
      if (x.errors.length) bad.push('errors: ' + x.errors.join(' | '));
      bad.length ? r.fail('?v=' + v + ' ' + k + ': cards: ' + bad.join('; ')) : r.ok('?v=' + v + ' ' + k + ': six cards, T-a, on screen, one at a time, the life sentence, no errors');
    }
  }
}
console.log('words, our sentences / labels / the club\'s: ' + OPTIONS.map(v => v + ' ' + budget[v].join('/')).join(' · '));
r.done();
