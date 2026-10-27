// Study 43: the EWC piece page, six more ways. As Study 42: every page carries
// the round-4 chrome and the six differ only in the body. Then what is
// specific: each names Study 15 picks it borrows from, every quote is one we
// can source, the grid and the web are the brand guide word for word, the log
// runs oldest first, and the voice telling keeps the club's banned words out.
const fs = require('node:fs');
const path = require('node:path');
const w = require('../../wirecheck.cjs');
const { TELLINGS, web } = require('./build.cjs');
const r = w.reporter();
const read = (f) => fs.readFileSync(path.join(__dirname, f), 'utf8');
const { personas } = JSON.parse(read('personas.json'));
const refs = JSON.parse(read('../15/refs.json')).refs;

// every quote on any page, and where it is from (transcripts and messages are on kMini's raw.db)
const QUOTES = {
  "It's more like, it's just different. What we're building is very different.": 'granola 2277338, 1 Apr 2026, a founder',
  "What's their Tuesday night like without EWC?": 'ewc/EWC workshopsession2fill.excalidraw, part 2',
  'These are all, these are spot on. … this is at least like 90 of our population.': 'granola 2277342, 15 May 2026 15:39, a founder',
  'Kahran I really like their site!!!': 'whatsapp "Joyus <> EWC" 38170, 18 May 2026',
  'To me this feels more novel…': 'whatsapp "Joyus <> EWC" 335751, 23 Jun 2026',
  "I'd love to still stay organic and quiet and interesting and kind of not Elite": 'granola 3383201, 28 Aug 2026, a founder (final hand off call)',
  'We love the aesthetics of Bandon dunes golf resort and ghost tree restaurant in particular.': 'whatsapp "Joyus <> EWC" 38522, 1 May 2026',
  'I love this site and overall brand digital presence.': 'whatsapp "Joyus <> EWC" 38886, 1 May 2026 (aman.com)',
  'our whole family would go weekly and each person had their own reason why': 'workshop 2 board, part 1 (Athletic Club, State College)',
  'the vibrance, community, mtg unexpected friends': 'workshop 2 board, part 1 (Delhi Golf Club)',
  'Nature, calm, all walks of life, tech not at the forefront': 'workshop 2 board, part 1 (Bandon Dunes)',
  'non-members feel excluded from the moment they arrive': 'workshop 2 board, part 1 (Overlake)',
  'always felt large and overwhelming': 'workshop 2 board, part 1 (Pro Club)',
};

const pages = TELLINGS.map(t => ({ ...t, html: read(t.file) }));
const body = (h) => (h.match(/<p class="borrow">[\s\S]*?(?=<section class="also")/) || [''])[0];

for (const p of pages) {
  console.log(p.file);
  const as = w.links(p.html, r, ['external']);
  w.chrome(p.html, r);

  // borrows: every pick named is a Study 15 pick, linked to its own URL
  const picks = [...p.html.matchAll(/<a href="([^"]+)" data-to="external" data-pick="([^"]+)">/g)].map(m => ({ url: m[1], slug: m[2] }));
  const badPick = picks.filter(k => { const x = refs.find(y => y.slug === k.slug); return !x || x.picked !== true || x.url !== k.url; });
  picks.length === p.picks.length && !badPick.length ? r.ok('borrows from ' + picks.map(k => k.slug).join(' + ') + ', each a Study 15 pick at its own URL') : r.fail('borrow links off: ' + JSON.stringify(picks));

  // quotes: each one is in QUOTES, and each <q> sits under a source comment
  const qs = [...p.html.matchAll(/<q>([\s\S]*?)<\/q>/g)].map(m => w.text(m[1]));
  const unsourced = qs.filter(q => !QUOTES[q]);
  unsourced.length ? r.fail('quotes with no source: ' + unsourced.join(' | ')) : r.ok(qs.length + ' quotes, each a sourced line');
  const comments = (p.html.match(/<!-- sources?:/g) || []).length;
  comments >= qs.length ? r.ok(comments + ' source comments for ' + qs.length + ' quotes') : r.fail('only ' + comments + ' source comments for ' + qs.length + ' quotes');

  // pictures: every one is in img/, and none is the founders' renders
  const srcs = [...p.html.matchAll(/<img[^>]+src="([^"]+)"/g)].map(m => m[1]);
  const gone = srcs.filter(s => !fs.existsSync(path.join(__dirname, s)));
  gone.length ? r.fail('missing images: ' + gone.join(', ')) : r.ok(srcs.length + ' images, all in img/');
  const renders = srcs.filter(s => /render|entry|golf-sim|lounge|private-bay|qbr|rooftop|wedding|vision/i.test(s));
  renders.length ? r.fail('the founders\' renders are not our work: ' + renders.join(', ')) : r.ok('none of the founders\' renders');

  // the hire comes after Joyus wherever it is told
  const t = w.text(body(p.html));
  if (/run events/.test(t)) /after (Joyus|our part)|brought in someone/i.test(t) ? r.ok('the events/brand hire is told as after Joyus') : r.fail('the events/brand hire is not marked as after Joyus');

  // scripts parse
  for (const [, js] of p.html.matchAll(/<script>([\s\S]*?)<\/script>/g)) { try { new Function(js); r.ok('script parses'); } catch (e) { r.fail('script: ' + e.message); } }
}

// all six are the same page outside the body
console.log('six as one');
const strip = (h) => h.replace(/<\/style>\n<style>[\s\S]*?<\/style>/, '</style>').replace(/<title>[^<]*<\/title>/, '')
  .replace(/<div><dt>shape<\/dt><dd>[^<]*<\/dd><\/div>/, '').replace(/<p class="borrow">[\s\S]*?(?=<section class="also")/, '');
pages.every(p => strip(p.html) === strip(pages[0].html)) ? r.ok('all six identical outside the body, its style and its shape line') : r.fail('the six differ outside the body');

// the grid, wherever it is shown, is the brand guide word for word
console.log('grid');
const lines = personas.flatMap(p => [p.name, p.profile, p.give, ...p.wants.flatMap(x => [x.want, x.today])]);
const known = new Set(personas.flatMap(p => [p.give, ...p.wants.map(x => x.want)]));
for (const f of ['telling-2-lenses.html', 'telling-4-record.html']) {
  const html = read(f), t = w.text(html);
  const miss = lines.filter(s => !t.includes(s));
  miss.length ? r.fail(f + ': grid lines missing or changed: ' + miss.map(s => s.slice(0, 40)).join(' | ')) : r.ok(f + ': ' + personas.length + ' personas, every want, today and give, word for word');
  const extra = [...html.matchAll(/class="(?:want|gives)">([^<]+)</g)].map(m => w.text(m[1])).filter(c => !known.has(c));
  extra.length ? r.fail(f + ': grid has lines not in the brand guide: ' + extra.join(' | ')) : r.ok(f + ': grid has nothing the brand guide does not');
}

// the web: built from personas.json, every want is an edge, and the claim line holds
console.log('web');
const W = web();
const embedded = JSON.parse((read('telling-3-web.html').match(/const WEB = (\{[\s\S]*?\});\n/) || [, 'null'])[1]);
JSON.stringify(embedded) === JSON.stringify(W) ? r.ok('the page\'s web = build.cjs from personas.json') : r.fail('the page\'s web is stale: rerun build.cjs');
const wants = personas.reduce((n, p) => n + p.wants.length, 0);
const covered = new Set(W.edges.map(e => e.p + ':' + e.w));
covered.size === wants ? r.ok('every one of ' + wants + ' wants is on the web (' + W.edges.length + ' lines, ' + W.places.length + ' places)') : r.fail(covered.size + ' of ' + wants + ' wants on the web');
const uses = (n) => W.edges.filter(e => W.places[e.s].name === n).length;
['a coffeeshop', 'a bar', 'home, a house'].every(n => uses(n) > uses('the country club')) ? r.ok('"a coffeeshop, a bar, home, far more often than another club" holds (' + ['a coffeeshop', 'a bar', 'home, a house', 'the country club'].map(n => n + ' ' + uses(n)).join(', ') + ')') : r.fail('the web\'s claim line no longer holds');

// the log: every row dated, oldest first, the hire last
console.log('log');
const log = read('telling-1-log.html');
const dates = [...log.matchAll(/<time datetime="([\d-]+)">/g)].map(m => m[1]);
dates.length >= 25 && dates.every((d, i) => !i || d >= dates[i - 1]) ? r.ok(dates.length + ' dated rows, oldest first (' + dates[0] + ' → ' + dates[dates.length - 1] + ')') : r.fail('log out of order or short: ' + dates.join(','));
/<li class="after">[\s\S]*?<\/li>\s*<\/ol>/.test(log) ? r.ok('the after-Joyus row is last') : r.fail('the after-Joyus row is not last');
const ol = (log.match(/<ol class="log">[\s\S]*?<\/ol>/) || [''])[0];
const rows = (ol.match(/<li[ >]/g) || []).length, srcs = (ol.match(/<!-- sources?:/g) || []).length;
srcs >= rows ? r.ok(srcs + ' source comments for ' + rows + ' rows') : r.fail('only ' + srcs + ' source comments for ' + rows + ' rows');

// the voice telling: seven verbs in order, blurbs drafts, none of the club's out-words
console.log('voice');
const voice = read('telling-6-voice.html');
const verbs = [...voice.matchAll(/<p class="verb">(\w+)</g)].map(m => m[1]).join(' ');
verbs === 'reframe meet sort price cast dress open' ? r.ok('seven verbs: ' + verbs) : r.fail('verbs are ' + verbs);
const blurbs = [...voice.matchAll(/<p class="blurb([^"]*)">([^<]+)</g)];
blurbs.length === 7 && blurbs.every(b => b[1].includes('line-draft')) ? r.ok('7 blurbs, each marked a draft') : r.fail('blurbs: ' + blurbs.length + ', drafts ' + blurbs.filter(b => b[1].includes('line-draft')).length);
const OUT = ['curated', 'elevated', 'exclusive', 'bespoke', 'concierge', 'amenities'];
const hits = blurbs.flatMap(b => OUT.filter(o => b[2].toLowerCase().includes(o)));
hits.length ? r.fail('the club\'s out-words in a blurb: ' + hits.join(', ')) : r.ok('no out-words (' + OUT.join(', ') + ') in the blurbs');

// the index: six buttons, each opening one of the six, with its picture
console.log('index');
const idx = read('index.html');
const btn = [...idx.matchAll(/data-src="([^"]+)"/g)].map(m => m[1]);
JSON.stringify(btn) === JSON.stringify(TELLINGS.map(t => t.file)) ? r.ok('six buttons, one per telling, in order') : r.fail('index buttons: ' + btn.join(', '));
const shots = TELLINGS.map(t => 'img/' + t.file.replace('.html', '.png')).filter(s => !idx.includes(s) || !fs.existsSync(path.join(__dirname, s)));
shots.length ? r.fail('missing pictures: ' + shots.join(', ')) : r.ok('a picture of each telling (shoot.mjs)');

r.done();
