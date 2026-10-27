// Study 45: the web + the verbs fused, five ways. As 42–44: round 4's nav and
// footer, every link a Study 03 page type. As 44: the finding first, a hard
// word budget, every readable string in a data-copy element listed in
// copy.json (and nothing in copy.json that isn't on a page), the guide's lines
// word for word, the web's claim still holding. Then what is new here: each
// page is one shape (not the web and the verbs stacked), every one of the 24
// wants is on the pages that file them, and the sourced words are found,
// verbatim, in their sources (~/dev/ewc, when it is on this machine).
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const w = require('../../wirecheck.cjs');
const { FUSES, VERBS, web, uses, DATA, WORDS } = require('./build.cjs');
const r = w.reporter();
const read = (f) => fs.readFileSync(path.join(__dirname, f), 'utf8');
const copy = JSON.parse(read('copy.json')).copy;
const { personas } = JSON.parse(read('personas.json'));
const BUDGET = 120;
const words = (s) => (s.match(/[A-Za-z0-9$][\w'’$.,&–-]*/g) || []).length;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const noCode = (h) => h.replace(/<script>[\s\S]*?<\/script>/g, '').replace(/<style>[\s\S]*?<\/style>/g, '');
const mainOf = (h) => (h.match(/<main class="piece">[\s\S]*?<\/main>/) || [''])[0];

const pages = FUSES.map(f => ({ ...f, html: read(f.file) }));
for (const p of pages) {
  console.log(p.file);
  w.links(p.html, r);
  w.chrome(p.html, r);
  for (const [, js] of p.html.matchAll(/<script>([\s\S]*?)<\/script>/g)) { try { new Function(js); r.ok('script parses'); } catch (e) { r.fail('script: ' + e.message); } }

  // every readable string is in a data-copy element (the wordmark box is a placeholder; counts are numbers)
  const left = w.text(noCode(p.html).replace(/<head>[\s\S]*?<\/head>/, '').replace(/<a class="gbox"[^>]*>wordmark<\/a>/g, '').replace(/<(\w+)[^>]*data-copy="[^"]+"[^>]*>[^<]*<\/\1>/g, ''));
  /^[\s\d→←·/|]*$/.test(left) ? r.ok('every readable string carries a data-copy id') : r.fail('text outside data-copy: ' + JSON.stringify(left.slice(0, 120)));

  // ids on the page ⇄ copy.json, and the page shows copy.json's text
  const found = [...p.html.matchAll(/data-copy="([^"]+)"[^>]*>([^<]*)</g)].map(m => ({ id: m[1], text: w.text(m[2]) }));
  const unknown = found.filter(f => !copy[f.id]).map(f => f.id);
  unknown.length ? r.fail('ids not in copy.json: ' + unknown.join(', ')) : r.ok(found.length + ' strings, each id in copy.json');
  const off = found.filter(f => copy[f.id] && w.text(esc(copy[f.id].text)) !== f.text).map(f => f.id);
  off.length ? r.fail('page text differs from copy.json: ' + off.join(', ')) : r.ok('page text = copy.json text');
  const missing = Object.entries(copy).filter(([id, e]) => e.pages.includes(p.key) && !found.some(f => f.id === id)).map(([id]) => id);
  missing.length ? r.fail('copy.json lists for ' + p.key + ' but the page lacks: ' + missing.join(', ')) : r.ok('everything copy.json lists for ' + p.key + ' is on the page');

  // the budget: our words inside the piece, each counted once; the guide's lines, the place names and round 4's chrome are out of it
  const counted = [...noCode(mainOf(p.html)).replace(/<span hidden>[\s\S]*?<\/span><\/span>/g, '').matchAll(/data-copy="([^"]+)"[^>]*>([^<]*)</g)]
    .filter(m => copy[m[1]] && !['chrome', 'web'].includes(copy[m[1]].flag) && !m[1].startsWith('45.data.'));
  const n = counted.reduce((s, m) => s + words(w.text(m[2])), 0);
  p.n = n;
  n <= BUDGET ? r.ok(n + ' words of ours (budget ' + BUDGET + ')') : r.fail(n + ' words of ours, over the budget of ' + BUDGET);

  /<\/section>\s*<section class="insight"[^>]*>\s*<p><span data-copy="45\.all\.insight"/.test(mainOf(p.html)) ? r.ok('the finding is the first thing after the head') : r.fail('the finding is not first');
  /<q>|<blockquote/.test(mainOf(p.html)) ? r.fail('a quote crept in (source it in check.cjs if one comes back)') : r.ok('no quotes');
}

// each page is one shape, and carries what that shape needs
console.log('shapes');
const H = Object.fromEntries(pages.map(p => [p.key, mainOf(p.html)]));
const count = (h, re) => (h.match(re) || []).length;
const has = (h, id) => h.includes(`data-copy="${id}"`);
const allWants = (h) => personas.every((x, i) => x.wants.every((_, k) => has(h, `45.data.p${i}.w${k}.want`)));
// 1 · a Tuesday night
count(H['1'], /<div class="night"/g) === 6 && count(H['1'], /data-p="\d"><span data-copy="45\.data\.p\d\.name"/g) === 6 ? r.ok('1: six members to pick from, an evening each') : r.fail('1: not six members and evenings');
allWants(H['1']) && personas.every((_, i) => has(H['1'], `45.data.p${i}.give`)) ? r.ok('1: every want, its place, and what the club gives') : r.fail('1: wants or gives missing');
has(H['1'], '45.t.ask') && /data-with="0"[\s\S]*data-with="1"/.test(H['1']) ? r.ok('1: the workshop question, then without → with') : r.fail('1: question or without/with missing');
// 2 · instead of
const W = web();
const heads = [...H['2'].matchAll(/<h3><span data-copy="45\.i\.instead">[^<]*<\/span> <span data-copy="([^"]+)"[^>]*>[^<]*<\/span><i>(\d+)<\/i>/g)].map(m => +m[2]);
heads.length >= 4 && heads.every((x, i) => !i || heads[i - 1] >= x) && heads.every(x => x > 1) ? r.ok('2: ' + heads.length + ' places as headings, most-used first (' + heads.join(' ') + ')') : r.fail('2: headings are not places in order: ' + heads.join(' '));
allWants(H['2']) ? r.ok('2: all 24 wants are filed') : r.fail('2: a want is not filed');
!/<svg|class="verbs"/.test(H['2']) ? r.ok('2: one list, no web and no verb row') : r.fail('2: a web or verb row crept in');
// 3 · the map redrawn
const steps = [...H['3'].matchAll(/<li data-verb="(\w+)"/g)].map(m => m[1]).join(' ');
steps === VERBS.join(' ') ? r.ok('3: seven verbs, in order, as the steps of one picture') : r.fail('3: steps are ' + steps);
count(H['3'], /<g class="s1 member">/g) === 6 && has(H['3'], '45.m.club') && count(H['3'], /<line class="s2 to-place"/g) === W.edges.length && count(H['3'], /<line class="s6 to-club"/g) === 6 ? r.ok('3: six members, ' + W.edges.length + ' lines to places, six to the club') : r.fail('3: the map is incomplete');
/<li data-verb="open"[^>]*>(?:(?!<\/li>)[\s\S])*data-copy="45\.m\.open\.after"[^>]*>after Joyus</.test(H['3']) ? r.ok('3: "open" is marked after Joyus') : r.fail('3: "open" is not marked after Joyus');
// 4 · the cast
count(H['4'], /<ol class="bill">[\s\S]*?<\/ol>/g) === 1 && count((H['4'].match(/<ol class="bill">[\s\S]*?<\/ol>/) || [''])[0], /<li>/g) === 6 ? r.ok('4: six on the bill, each with where they come from') : r.fail('4: the bill is not six');
['anchors', 'hosts', 'bridges', 'makers', 'seekers', 'quiet', 'wild'].every(k => has(H['4'], '45.c.r.' + k)) && has(H['4'], '45.c.rule') ? r.ok('4: the seven parts and the casting rule') : r.fail('4: a part or the rule is missing');
// 5 · two sets of verbs
personas.every((x, i) => x.wants.every((_, k) => has(H['5'], `45.v.p${i}.w${k}`))) && VERBS.every(v => has(H['5'], '45.v.o.' + v)) ? r.ok('5: all 24 of theirs and all 7 of ours') : r.fail('5: a verb is missing');
const ix = [...H['5'].matchAll(/<li class="([\w ]+)" data-verb="([^"]+)"/g)].map(m => ({ kinds: m[1], v: m[2] }));
ix.map(x => x.v).join('|') === ix.map(x => x.v).sort((a, b) => a.localeCompare(b)).join('|') ? r.ok('5: one index, a to z (' + ix.length + ' verbs)') : r.fail('5: the index is not a to z');
ix.some(x => x.v === 'meet' && x.kinds === 'theirs ours') ? r.ok('5: "meet" is both theirs and ours') : r.fail('5: "meet" is not shared');
/data-copy="45\.v\.o\.open\.date"[^>]*>after Joyus</.test(H['5']) ? r.ok('5: "open" is dated after Joyus') : r.fail('5: "open" is not dated after Joyus');

// copy.json: every entry is on a page; the guide's lines are the guide's; words.json is all used
console.log('copy.json');
const noPage = Object.entries(copy).filter(([, e]) => !e.pages.length).map(([id]) => id);
noPage.length ? r.fail('copy.json entries on no page: ' + noPage.join(', ')) : r.ok(Object.keys(copy).length + ' entries, each on a page');
const dataOff = Object.entries(copy).filter(([id, e]) => id.startsWith('45.data.') && e.text !== DATA[id.slice(8)]).map(([id]) => id);
dataOff.length ? r.fail('guide lines changed: ' + dataOff.join(', ')) : r.ok('every 45.data line is personas.json word for word');
read('personas.json') === fs.readFileSync(path.join(__dirname, '../43/personas.json'), 'utf8') ? r.ok('personas.json is 43\'s, unchanged') : r.fail('personas.json differs from 43\'s');
const wordsOff = Object.entries(WORDS).filter(([k, x]) => !copy['45.' + k] || (k !== 'all.claim' && copy['45.' + k].text !== x.text)).map(([k]) => k);
wordsOff.length ? r.fail('words.json not on a page or not as written: ' + wordsOff.join(', ')) : r.ok('every words.json entry is on a page, as written');
const unsourced = Object.entries(WORDS).filter(([, x]) => x.flag === 'sourced' && !x.src).map(([k]) => k);
unsourced.length ? r.fail('sourced without a src: ' + unsourced.join(', ')) : r.ok('every sourced word names its source');
const OUT = ['curated', 'elevated', 'exclusive', 'bespoke', 'concierge', 'amenities'];
const outHits = Object.entries(WORDS).filter(([, x]) => x.flag !== 'chrome' && OUT.some(o => x.text.toLowerCase().includes(o))).map(([k]) => k);
outHits.length ? r.fail('the club\'s out-words: ' + outHits.join(', ')) : r.ok('none of the club\'s out-words (' + OUT.join(', ') + ')');

// the sourced words new in 45, found verbatim where they say they come from
const ewc = path.join(os.homedir(), 'dev/ewc');
if (fs.existsSync(ewc)) {
  const src = { ex: fs.readFileSync(path.join(ewc, 'EWC workshopsession2fill.excalidraw'), 'utf8'), ho: fs.readFileSync(path.join(ewc, 'docs/HANDOFF.md'), 'utf8'), kit: fs.readFileSync(path.join(ewc, 'src/sales-kit.html'), 'utf8') };
  const where = (k) => k === 't.ask' ? src.ex : k === 'c.rule' ? src.kit : src.ho;
  const notFound = Object.entries(WORDS).filter(([k]) => /^(t\.ask|c\.r\.|c\.rule)/.test(k)).filter(([k, x]) => !where(k).includes(x.text)).map(([k]) => k);
  notFound.length ? r.fail('sourced words not in their source: ' + notFound.join(', ')) : r.ok('the question, the seven parts and the casting rule are verbatim in ~/dev/ewc');
} else r.ok('~/dev/ewc not on this machine: verbatim source check skipped');

// the web and its claim (as 43/44)
console.log('web');
const counts = ['coffeeshop', 'bar', 'home', 'countryclub'].map(k => uses(W, k));
counts.slice(0, 3).every(x => x > counts[3]) ? r.ok('"a coffeeshop, a bar, home" over another club holds (' + counts.join(' · ') + ')') : r.fail('the finding no longer holds: ' + counts.join(' · '));
const claim = copy['45.all.claim'].text;
claim.includes('coffeeshop ' + counts[0]) && claim.includes('bar ' + counts[1]) && claim.includes('home ' + counts[2]) && claim.includes('country club ' + counts[3]) ? r.ok('the claim line shows the counts: ' + claim) : r.fail('the claim line is off: ' + claim);

// the index: five buttons, each opening one fusion, with its picture
console.log('index');
const idx = read('index.html');
const btn = [...idx.matchAll(/data-src="([^"]+)"/g)].map(m => m[1]);
JSON.stringify(btn) === JSON.stringify(FUSES.map(f => f.file)) ? r.ok('five buttons, one per fusion, in order') : r.fail('index buttons: ' + btn.join(', '));
const shots = FUSES.map(f => 'img/' + f.file.replace('.html', '.png')).filter(s => !idx.includes(s) || !fs.existsSync(path.join(__dirname, s)));
shots.length ? r.fail('missing pictures: ' + shots.join(', ')) : r.ok('a picture of each fusion (shoot.mjs)');
console.log('words of ours: ' + pages.map(p => p.key + '=' + p.n).join(' '));

r.done();
