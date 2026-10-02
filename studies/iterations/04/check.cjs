// Study 04: the piece page. Both versions are tested; A and B must differ
// only in the body, so the comparison isolates one decision.
const fs = require('node:fs');
const path = require('node:path');
const w = require('../../wirecheck.cjs');
const r = w.reporter();
const read = (f) => fs.readFileSync(path.join(__dirname, f), 'utf8');
const pieces = w.rev4Pieces();
const me = pieces.find(p => p.client === 'Klydo' && p.piece === 'branding');

for (const f of ['piece-a-rounds.html', 'piece-b-case.html']) {
  console.log(f);
  const html = read(f);
  const as = w.links(html, r);
  w.chrome(html, r);

  // continuity: the headline is the homepage sentence, word for word
  const h1 = w.text((html.match(/<h1>([\s\S]*?)<\/h1>/) || [])[1] || '');
  h1 === me.sentence ? r.ok('headline is the homepage sentence, unchanged') : r.fail('headline differs from rev4:\n       page: ' + h1 + '\n       rev4: ' + me.sentence);

  // every homepage tag is here, and now it's a link into the filtered work index
  const tagLinks = as.filter(a => a.to === 'work-index' && (a.filter || '').startsWith('tag='));
  const missingTags = me.tags.filter(t => !tagLinks.some(a => a.text === t));
  missingTags.length ? r.fail('tags missing as links: ' + missingTags.join(', ')) : r.ok(me.tags.length + ' homepage tags, each now links to /work/?tag=');

  // the pill is a way back to its filtered list
  as.some(a => a.to === 'work-index' && a.filter === 'pill=' + me.pillId) ? r.ok('pill "' + me.pill + '" links to /work/?pill=' + me.pillId) : r.fail('no link to the pill filter pill=' + me.pillId);

  // siblings: exactly the other Klydo pieces, each labelled with its own pill
  const sibs = pieces.filter(p => p.client === me.client && p !== me);
  const sibBlock = (html.match(/<div class="sib">([\s\S]*?)<\/div>\s*<\/section>/) || [])[1] || '';
  const shown = [...sibBlock.matchAll(/<small>([^<]+)<\/small><b>([^<]+)<\/b>/g)].map(m => ({ pill: w.text(m[1]), name: w.text(m[2]) }));
  const wrong = sibs.filter(s => !shown.some(x => x.name === s.client + ' · ' + s.piece && x.pill === s.pill));
  (wrong.length || shown.length !== sibs.length) ? r.fail('siblings off: expected ' + sibs.map(s => s.piece).join(', ') + '; shown ' + shown.map(x => x.name).join(', ')) : r.ok(sibs.length + ' sibling pieces, all the other Klydo pieces, each under its own pill');

  // next: the next piece in the same pill, in homepage rotation order
  const inPill = pieces.filter(p => p.pillId === me.pillId);
  const nxt = inPill[(inPill.indexOf(me) + 1) % inPill.length];
  const nextA = as.find(a => a.next);
  nextA && nextA.next === nxt.client + ' · ' + nxt.piece && nextA.text.includes(nxt.sentence) ? r.ok('next = ' + nextA.next + ', with its homepage sentence') : r.fail('next should be ' + nxt.client + ' · ' + nxt.piece);
}

// A and B differ only in the body
console.log('A vs B');
const strip = (h) => h.replace(/<style>[\s\S]*?<\/style>/, '').replace(/<title>[^<]*<\/title>/, '')
  .replace(/<section class="(rounds|case)"[\s\S]*?(?=<section class="also")/, '')
  .replace(/<div><dt>(rounds|shape)<\/dt><dd>[^<]*<\/dd><\/div>/, '');
strip(read('piece-a-rounds.html')) === strip(read('piece-b-case.html')) ? r.ok('A and B are identical outside the body and its one fact line') : r.fail('A and B differ outside the body');

// the rounds' dates agree with the wall's day count (day 1 = 10 Sep 2025)
console.log('rounds');
const a = read('piece-a-rounds.html');
const day1 = Date.UTC(2025, 8, 10);
let bad = 0, n = 0;
for (const m of a.matchAll(/<p class="when">(\d+) (\w{3}) 2025 · day (\d+)<\/p>/g)) {
  n++;
  const d = new Date(day1 + (m[3] - 1) * 864e5);
  const want = d.getUTCDate() + ' ' + d.toLocaleString('en', { month: 'short', timeZone: 'UTC' });
  if (want !== m[1] + ' ' + m[2]) { bad++; r.fail('round dated ' + m[1] + ' ' + m[2] + ' but day ' + m[3] + ' is ' + want); }
}
bad ? 0 : r.ok(n + ' round dates agree with their day numbers');
const nums = [...a.matchAll(/<span class="no">(\d+)<\/span>/g)].map(m => +m[1]);
nums.every((x, i) => x === i + 1) ? r.ok('rounds numbered 01–' + String(nums.length).padStart(2, '0') + ', oldest first') : r.fail('round numbers ' + nums.join(','));
// the source contradicts itself here; flagged, not fixed (it's Kahran's copy)
if (/day 15<\/p><p>Jumped in at week six/.test(a)) r.note('source inconsistency kept as is: round 01 is day 15 (week 3), its caption says "week six"');

r.done();
