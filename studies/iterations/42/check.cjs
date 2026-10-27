// Study 42: the EWC piece page, two ways. As Study 04: both pages carry the
// round-4 chrome, A and B differ only in the body. Then what is specific to
// this piece: the grid is the brand guide word for word, every quote is one
// we can source, and the rounds run oldest first.
const fs = require('node:fs');
const path = require('node:path');
const w = require('../../wirecheck.cjs');
const { personas: fromGuide, GUIDE } = require('./extract.cjs');
const r = w.reporter();
const read = (f) => fs.readFileSync(path.join(__dirname, f), 'utf8');
const { personas } = JSON.parse(read('personas.json'));
const pieces = w.rev4Pieces();
const PAGES = ['piece-a-rounds.html', 'piece-b-strategy.html'];

// every quote on either page, and where it is from (transcripts are on kMini's raw.db)
const QUOTES = {
  "It's more like, it's just different. What we're building is very different.": 'granola 2277338, 1 Apr 2026, a founder',
  "What's their Tuesday night like without EWC?": 'ewc/EWC workshopsession2fill.excalidraw, part 2',
  'These are all, these are spot on. … this is at least like 90 of our population.': 'granola 2277342, 15 May 2026 15:39, a founder',
};

for (const f of PAGES) {
  console.log(f);
  const html = read(f);
  // "external": eastwestclub.com, the client's live site; Study 03 has no type for it
  const as = w.links(html, r, ['external']);
  w.chrome(html, r);

  as.some(a => a.to === 'work-index' && a.filter === 'pill=strategy') ? r.ok('pill "Strategy" links to /work/?pill=strategy') : r.fail('no link to pill=strategy');
  as.filter(a => a.to === 'work-index' && (a.filter || '').startsWith('tag=')).length >= 2 ? r.ok('tags are links to /work/?tag=') : r.fail('tags are not links');

  // siblings: exactly rev4's EWC pieces, each under its own pill
  const sibs = pieces.filter(p => p.client === 'EWC');
  const sibBlock = (html.match(/<div class="sib">([\s\S]*?)<\/div>\s*<\/section>/) || [])[1] || '';
  const shown = [...sibBlock.matchAll(/<small>([^<]+)<\/small><b>([^<]+)<\/b>/g)].map(m => ({ pill: w.text(m[1]), name: w.text(m[2]) }));
  const wrong = sibs.filter(s => !shown.some(x => x.name === 'EWC · ' + s.piece && x.pill === s.pill));
  (wrong.length || shown.length !== sibs.length) ? r.fail('siblings off: want ' + sibs.map(s => s.pill + ' / ' + s.piece).join(', ')) : r.ok(sibs.length + ' sibling pieces, rev4\'s EWC pieces, each under its own pill');

  // next: EWC · strategy is not in rev4's rotation yet, so it points at the pill's first piece
  const first = pieces.find(p => p.pillId === 'strategy');
  const nextA = as.find(a => a.next);
  nextA && nextA.next.replace(/&amp;/g, '&') === first.client + ' · ' + first.piece && nextA.text.includes(first.sentence) ? r.ok('next = ' + nextA.next + ' (first in Strategy), with its homepage sentence') : r.fail('next should be ' + first.client + ' · ' + first.piece);

  // the grid: the six personas, every want, today and give, word for word
  const t = w.text(html);
  const miss = [];
  for (const p of personas) {
    for (const s of [p.name, p.profile, p.give, ...p.wants.flatMap(x => [x.want, x.today])]) if (!t.includes(s)) miss.push(s.slice(0, 50));
  }
  miss.length ? r.fail('grid lines missing or changed: ' + miss.join(' | ')) : r.ok('grid: ' + personas.length + ' personas, ' + personas.reduce((n, p) => n + p.wants.length, 0) + ' wants, each with its today and the give, word for word');
  const cells = [...html.matchAll(/class="(?:want|gives)">([^<]+)</g)].map(m => w.text(m[1]));
  const known = new Set(personas.flatMap(p => [p.give, ...p.wants.map(x => x.want)]));
  const extra = cells.filter(c => !known.has(c));
  extra.length ? r.fail('grid has lines not in the brand guide: ' + extra.join(' | ')) : r.ok('grid has nothing the brand guide does not');

  // quotes: each one is in QUOTES, and sits under a source comment
  const qs = [...html.matchAll(/<q>([\s\S]*?)<\/q>/g)].map(m => w.text(m[1]));
  const unsourced = qs.filter(q => !QUOTES[q]);
  unsourced.length ? r.fail('quotes with no source: ' + unsourced.join(' | ')) : r.ok(qs.length + ' quotes, each a sourced line');
  const comments = (html.match(/<!-- source/g) || []).length;
  comments >= qs.length ? r.ok(comments + ' source comments for ' + qs.length + ' quotes') : r.fail('only ' + comments + ' source comments for ' + qs.length + ' quotes');

  // pictures: every one is in img/, and none is the founders' renders
  const srcs = [...html.matchAll(/<img[^>]+src="([^"]+)"/g)].map(m => m[1]);
  const gone = srcs.filter(s => !fs.existsSync(path.join(__dirname, s)));
  gone.length ? r.fail('missing images: ' + gone.join(', ')) : r.ok(srcs.length + ' images, all in img/');
  const renders = srcs.filter(s => /render|entry|golf-sim|lounge|private-bay|qbr|rooftop|wedding|vision/i.test(s));
  renders.length ? r.fail('the founders\' renders are not our work: ' + renders.join(', ')) : r.ok('none of the founders\' renders');
}

// A and B differ only in the body
console.log('A vs B');
const strip = (h) => h.replace(/<style>[\s\S]*?<\/style>/, '').replace(/<title>[^<]*<\/title>/, '')
  .replace(/<section class="(rounds|case)"[\s\S]*?(?=<section class="also")/, '')
  .replace(/<div><dt>(rounds|shape)<\/dt><dd>[^<]*<\/dd><\/div>/, '');
strip(read(PAGES[0])) === strip(read(PAGES[1])) ? r.ok('A and B are identical outside the body and its one fact line') : r.fail('A and B differ outside the body');

// A's rounds: numbered 01–07, dated oldest first
console.log('rounds');
const a = read(PAGES[0]);
const nums = [...a.matchAll(/<span class="no">(\d+)<\/span>/g)].map(m => +m[1]);
nums.length === 7 && nums.every((x, i) => x === i + 1) ? r.ok('rounds numbered 01–07') : r.fail('round numbers ' + nums.join(','));
const M = { Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6, Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12 };
// a round that spans months is placed by where it ends ("14 May – Jul 2026" ends Jul 2026)
const ends = [...a.matchAll(/<p class="when">([^<]+)<\/p>/g)].map(m => m[1].split(' · ')[0]).map(s => {
  if (/after Joyus/.test(s)) return Infinity;
  const end = s.split(' – ').pop(), y = (s.match(/\d{4}/) || [])[0];
  const d = end.match(/^(?:(\d+) )?(\w{3})/);
  return d && M[d[2]] && y ? +y * 1e4 + M[d[2]] * 100 + +(d[1] || 31) : NaN;
});
ends.every((x, i) => !i || x >= ends[i - 1]) && !ends.some(Number.isNaN) ? r.ok('rounds run oldest first by where each ends; the hire comes after Joyus') : r.fail('rounds out of order: ' + ends.join(', '));

// the snapshot still matches the brand guide, where the guide is on this machine
console.log('source');
if (fs.existsSync(GUIDE)) {
  JSON.stringify(fromGuide(fs.readFileSync(GUIDE, 'utf8'))) === JSON.stringify(personas) ? r.ok('personas.json = the brand guide today') : r.fail('the brand guide changed: rerun extract.cjs and build.cjs');
} else r.note('brand guide not on this machine (' + GUIDE + '); checked against the snapshot only');

r.done();
