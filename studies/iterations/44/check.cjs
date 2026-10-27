// Study 44: the web + the verbs, five ways. As 42/43: round 4's nav and footer,
// every link a Study 03 page type. Then what this study is for: the finding
// first on every page, a hard word budget (Divya, 27 Oct: "way more
// digestible"; Kahran: "more density and less words"), every readable string
// in a data-copy element listed in copy.json (and nothing in copy.json that
// isn't on a page), the guide's lines word for word, the web's claim still
// holding, the verbs in order with "open" told as after Joyus.
const fs = require('node:fs');
const path = require('node:path');
const w = require('../../wirecheck.cjs');
const { COMBOS, VERBS, web, uses, DATA, WORDS } = require('./build.cjs');
const r = w.reporter();
const read = (f) => fs.readFileSync(path.join(__dirname, f), 'utf8');
const copy = JSON.parse(read('copy.json')).copy;
const BUDGET = 120;
const words = (s) => (s.match(/[A-Za-z0-9$][\w'’$.,&–-]*/g) || []).length;
const strip = (h) => h.replace(/<script>[\s\S]*?<\/script>/g, '').replace(/<style>[\s\S]*?<\/style>/g, '').replace(/<svg[\s\S]*?<\/svg>/g, '');

const pages = COMBOS.map(c => ({ ...c, html: read(c.file) }));
for (const p of pages) {
  console.log(p.file);
  w.links(p.html, r);
  w.chrome(p.html, r);
  for (const [, js] of p.html.matchAll(/<script>([\s\S]*?)<\/script>/g)) { try { new Function(js); r.ok('script parses'); } catch (e) { r.fail('script: ' + e.message); } }

  // every readable string is in a data-copy element (the wordmark box is a placeholder, not copy)
  const left = w.text(strip(p.html).replace(/<head>[\s\S]*?<\/head>/, '').replace(/<a class="gbox"[^>]*>wordmark<\/a>/g, '').replace(/<(\w+)[^>]*data-copy="[^"]+"[^>]*>[^<]*<\/\1>/g, ''));
  /^[\s→←·/|]*$/.test(left) ? r.ok('every readable string carries a data-copy id') : r.fail('text outside data-copy: ' + JSON.stringify(left.slice(0, 120)));

  // ids on the page ⇄ copy.json, and the page shows copy.json's text
  const found = [...p.html.matchAll(/data-copy="([^"$]+)"[^>]*>([^<]*)</g)].map(m => ({ id: m[1], text: w.text(m[2]) }));
  const unknown = found.filter(f => !copy[f.id]).map(f => f.id);
  unknown.length ? r.fail('ids not in copy.json: ' + unknown.join(', ')) : r.ok(found.length + ' strings, each id in copy.json');
  const off = found.filter(f => copy[f.id] && w.text(esc(copy[f.id].text)) !== f.text).map(f => f.id);
  off.length ? r.fail('page text differs from copy.json: ' + off.join(', ')) : r.ok('page text = copy.json text');
  const hasWeb = /<svg class="web"/.test(p.html);
  const missing = Object.entries(copy).filter(([id, e]) => e.pages.includes(p.key) && !found.some(f => f.id === id) && !(hasWeb && /^44\.(data|web)\./.test(id))).map(([id]) => id);
  missing.length ? r.fail('copy.json lists for ' + p.key + ' but the page lacks: ' + missing.join(', ')) : r.ok('everything copy.json lists for ' + p.key + ' is on the page' + (hasWeb ? ' (or drawn by the web)' : ''));

  // the budget: our words and quoted words inside the piece; the guide's lines, the web's places and round 4's chrome are out of it
  const main = (p.html.match(/<main class="piece">[\s\S]*?<\/main>/) || [''])[0];
  const counted = [...strip(main).matchAll(/data-copy="([^"$]+)"[^>]*>([^<]*)</g)].filter(m => copy[m[1]] && !['chrome', 'web'].includes(copy[m[1]].flag) && !m[1].startsWith('44.data.'));
  const n = counted.reduce((s, m) => s + words(w.text(m[2])), 0);
  n <= BUDGET ? r.ok(n + ' words of ours (budget ' + BUDGET + ')') : r.fail(n + ' words of ours, over the budget of ' + BUDGET);

  // the finding comes first
  /<\/section>\s*<section class="insight"[^>]*>\s*<p><span data-copy="44\.all\.insight"/.test(main) ? r.ok('the finding is the first thing after the head') : r.fail('the finding is not first');
  /<q>|<blockquote/.test(main) ? r.fail('a quote crept in (44 has none; source it in check.cjs if one comes back)') : r.ok('no quotes');

  // the verbs: seven, in order, and "open" is after Joyus
  const vs = [...main.matchAll(/<li[^>]*data-verb="(\w+)"/g)].map(m => m[1]).join(' ');
  vs === VERBS.join(' ') ? r.ok('seven verbs in order') : r.fail('verbs are: ' + vs);
  /<li[^>]*data-verb="open"[^>]*>(?:(?!<\/li>)[\s\S])*data-copy="44\.all\.v\.open\.date"[^>]*>after Joyus</.test(main) ? r.ok('"open" is dated after Joyus') : r.fail('"open" is not dated after Joyus');
}
function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }

// each combination is what it says
console.log('shapes');
const H = Object.fromEntries(pages.map(p => [p.key, (p.html.match(/<main class="piece">[\s\S]*?<\/main>/) || [''])[0]]));
const at = (h, s) => h.indexOf(s);
at(H.a, '<svg class="web"') > 0 && at(H.a, '<ol class="verbs">') > at(H.a, '<svg class="web"') ? r.ok('A: the web, then the verbs') : r.fail('A is not web then verbs');
const halves = [...H.b.matchAll(/<section class="body half" data-half="(\w+)"[\s\S]*?<\/section>/g)];
halves.length === 2 && /<svg class="web"/.test(halves[0][0]) && !/class="verbs"/.test(halves[0][0]) && /class="verbs"/.test(halves[1][0]) && !/<svg/.test(halves[1][0]) ? r.ok('B: two halves, research and brand, each on its own') : r.fail('B halves are not separate');
at(H.c, '<ol class="verbs">') > 0 && at(H.c, '<div class="drawn"') > at(H.c, '<ol class="verbs">') && at(H.c, '<svg class="web"') > at(H.c, '<div class="drawn"') ? r.ok('C: the verbs, then sort and price drawn out as the web') : r.fail('C is not verbs → web');
(H.d.match(/<button type="button" aria-pressed/g) || []).length === 6 && (H.d.match(/<div class="member"/g) || []).length === 6 ? r.ok('D: six members to pick from') : r.fail('D does not have six members');
(H.e.match(/<li><b>/g) || []).length === 6 && !/<svg/.test(H.e) ? r.ok('E: six lines, no web') : r.fail('E is not six lines');

// copy.json: every entry is on a page; the guide's lines are the guide's, word for word
console.log('copy.json');
const noPage = Object.entries(copy).filter(([, e]) => !e.pages.length).map(([id]) => id);
noPage.length ? r.fail('copy.json entries on no page: ' + noPage.join(', ')) : r.ok(Object.keys(copy).length + ' entries, each on a page');
const dataOff = Object.entries(copy).filter(([id, e]) => id.startsWith('44.data.') && e.text !== DATA[id.slice(8)]).map(([id]) => id);
dataOff.length ? r.fail('guide lines changed: ' + dataOff.join(', ')) : r.ok('every 44.data line is personas.json word for word');
read('personas.json') === fs.readFileSync(path.join(__dirname, '../43/personas.json'), 'utf8') ? r.ok('personas.json is 43\'s, unchanged') : r.fail('personas.json differs from 43\'s');
const wordsOff = Object.entries(WORDS).filter(([k, x]) => !copy['44.' + k] || (k !== 'all.claim' && copy['44.' + k].text !== x.text)).map(([k]) => k);
wordsOff.length ? r.fail('words.json not on a page or not as written: ' + wordsOff.join(', ')) : r.ok('every words.json entry is on a page, as written');
const unsourced = Object.entries(WORDS).filter(([, x]) => x.flag === 'sourced' && !x.src).map(([k]) => k);
unsourced.length ? r.fail('sourced without a src: ' + unsourced.join(', ')) : r.ok('every sourced word names its source');
const OUT = ['curated', 'elevated', 'exclusive', 'bespoke', 'concierge', 'amenities'];
const outHits = Object.entries(WORDS).filter(([, x]) => x.flag !== 'chrome' && OUT.some(o => x.text.toLowerCase().includes(o))).map(([k]) => k);
outHits.length ? r.fail('the club\'s out-words: ' + outHits.join(', ')) : r.ok('none of the club\'s out-words (' + OUT.join(', ') + ')');

// the web and its claim (as 43)
console.log('web');
const W = web();
const embedded = JSON.parse((pages[0].html.match(/const WEB = (\{[\s\S]*?\});\n/) || [, 'null'])[1]);
JSON.stringify(embedded) === JSON.stringify(W) ? r.ok('the page\'s web = build.cjs from personas.json') : r.fail('the page\'s web is stale: rerun build.cjs');
const counts = ['coffeeshop', 'bar', 'home', 'countryclub'].map(k => uses(W, k));
counts.slice(0, 3).every(n => n > counts[3]) ? r.ok('"a coffeeshop, a bar, home" over another club holds (' + counts.join(' · ') + ')') : r.fail('the finding no longer holds: ' + counts.join(' · '));
const claim = copy['44.all.claim'].text;
claim.includes('coffeeshop ' + counts[0]) && claim.includes('bar ' + counts[1]) && claim.includes('home ' + counts[2]) && claim.includes('country club ' + counts[3]) ? r.ok('the claim line shows the counts: ' + claim) : r.fail('the claim line is off: ' + claim);

// the index: five buttons, each opening one combination, with its picture
console.log('index');
const idx = read('index.html');
const btn = [...idx.matchAll(/data-src="([^"]+)"/g)].map(m => m[1]);
JSON.stringify(btn) === JSON.stringify(COMBOS.map(c => c.file)) ? r.ok('five buttons, one per combination, in order') : r.fail('index buttons: ' + btn.join(', '));
const shots = COMBOS.map(c => 'img/' + c.file.replace('.html', '.png')).filter(s => !idx.includes(s) || !fs.existsSync(path.join(__dirname, s)));
shots.length ? r.fail('missing pictures: ' + shots.join(', ')) : r.ok('a picture of each combination (shoot.mjs)');

r.done();
