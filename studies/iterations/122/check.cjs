// Study 122: EWC as four whole systems. Study 99's page four times; type, ground, layout, states and motion all change.
// Divya on 121: "they're all the same. You have changed just one singular layer." So this check holds them apart first:
//  - no two variants share a typeface or a ground colour, and each one's headline face is one of the gummy J's ten;
//  - each carries Study 99's people, parts, order, question, lines and close word for word; no em dash, no figure; noindex;
//  - pictures newer than the pages (shoot.mjs writes report-<v>.json), wide, phone and short phone: nothing on top of anything,
//    nothing past the edge, no words outside their part, no text under 13px, no page error, fills 0 0 4 4 12 20 24 24 like 99,
//    settled text at 4.5:1 or better (pale text too, or 3:1 where large and bold);
//  - and each system's own way of showing a person arrive:
//    a vibrant   a cloud of pills: one fills with a stone colour when its person comes; no two neighbours share a colour;
//    b energy    a slanted block: one marker line per person who has come; the arriving person's parts reversed out of ink;
//                every word on its own ground so no line crosses a letter;
//    c solved    a board with coordinates: a part's words have typed themselves in and its cell is solid once its person
//                has come; the arriving person's cells ringed;
//    d grounded  a wall on a floor, laid from the floor up: every course edge to edge but the top one, which is centred;
//                a brick is set once its person has come, and earth while they are arriving.
//   node studies/iterations/122/check.cjs
const fs = require('node:fs');
const path = require('node:path');
const here = __dirname;
let failures = 0;
const ok = (m) => console.log('  ok   ' + m);
const fail = (m) => { failures++; console.log('  FAIL ' + m); };
const read = (f) => fs.readFileSync(path.join(here, f), 'utf8');
const text = (h) => h.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').trim();
const dataOf = (h) => JSON.parse(h.match(/<script type="application\/json" id="data">([\s\S]*?)<\/script>/)[1]);
const stageOf = (h) => text(h.match(/<div id="run">[\s\S]*?<div class="foot">[\s\S]*?<\/div>/)[0]).replace(/\s+/g, ' ');
const was = read('../99/case.html');
const FILL = { question: 0, offer: 0, one: 4, empty: 4, third: 12, fifth: 20, pass: 24, full: 24 };
const CAME = { question: 0, offer: 0, one: 1, empty: 1, third: 3, fifth: 5, pass: 6, full: 6 };
const NOW = { one: 0, third: 2, fifth: 4 };
const SETTLED = ['question', 'offer', 'one', 'empty', 'third', 'fifth', 'full'];   // 'pass' is taken mid-motion
const J_FACES = ['Abril Fatface', 'Alfa Slab One', 'Archivo Black', 'Bagel Fat One', 'Calistoga', 'Lilita One', 'Rubik', 'Sansita Swashed', 'Shrikhand', 'Ultra'];
const NAMES = { a: 'vibrant', b: 'energy', c: 'solved', d: 'grounded' };
const seen = {};

for (const v of Object.keys(NAMES)) {
  const html = read(v + '.html');
  console.log(v + ' ' + NAMES[v]);
  /<meta name="robots" content="noindex/.test(html) ? ok('noindex') : fail(v + ': no noindex');
  JSON.stringify(dataOf(html)) === JSON.stringify(dataOf(was)) ? ok('the people, their parts and the order are Study 99\'s') : fail(v + ': the people, parts or order differ from Study 99');
  stageOf(html) === stageOf(was) ? ok('the question, the lines and the close are Study 99\'s, word for word') : fail(v + ': the words differ from Study 99:\n   99 ' + stageOf(was) + '\n   ' + v + '  ' + stageOf(html));
  const body = text(html.replace(/<head>[\s\S]*?<\/head>/, '').replace(/<script[\s\S]*?<\/script>/g, '')) + ' ' + dataOf(html).people.map(p => [p.name, p.fits, p.instead, ...p.parts].join(' ')).join(' ');
  /—/.test(body) ? fail(v + ': an em dash') : ok('no em dash');
  /[$%£€]|\d{2,}/.test(body) ? fail(v + ': a figure in the words') : ok('no money, percentage or count');
  const rf = 'report-' + v + '.json';
  if (!fs.existsSync(path.join(here, rf))) { fail(v + ': no ' + rf + ': run shoot.mjs ' + v); continue; }
  const age = (f) => fs.statSync(path.join(here, f)).mtimeMs;
  age(rf) >= age(v + '.html') ? ok('the pictures are newer than the page') : fail(v + ': ' + rf + ' is older than ' + v + '.html: run shoot.mjs ' + v);
  const rep = JSON.parse(read(rf));
  const first = rep.views.wide.beats.one;
  seen[v] = { fonts: first.fonts, bg: first.bg, head: first.fonts[0] };
  J_FACES.includes(first.fonts[0]) ? ok('the headline is in ' + first.fonts[0] + ', one of the J\'s ten faces') : fail(v + ': the headline face ' + first.fonts[0] + ' is not one of the J\'s ten');
  for (const tag of ['wide', 'phone', 'short']) {
    const view = rep.views[tag], bad = [];
    if (!view) { fail(v + ' ' + tag + ': not shot'); continue; }
    for (const [name, b] of Object.entries(view.beats)) {
      const settled = SETTLED.includes(name);
      if (b.overlaps) bad.push(name + ': ' + b.overlaps + ' things on top of each other');
      if (b.out) bad.push(name + ': ' + b.out + ' things past the edge');
      if (b.clipped.length) bad.push(name + ': words outside their part in ' + b.clipped.join(' / '));
      if (b.small < 13) bad.push(name + ': text at ' + b.small + 'px');
      if (b.lit !== FILL[name]) bad.push(name + ': ' + b.lit + ' parts come for, should be ' + FILL[name]);
      if (b.caption.length > 1) bad.push(name + ': two captions at once');
      if (settled && b.litContrast !== null && b.litContrast < 4.5) bad.push(name + ': text on a set part at ' + b.litContrast + ':1');
      if (b.unlitContrast !== null && b.unlitContrast < (b.largeBold ? 3 : 4.5)) bad.push(name + ': pale text at ' + b.unlitContrast + ':1');
      if (v === 'a') {
        if (b.filled !== b.lit) bad.push(name + ': ' + b.filled + ' pills filled, ' + b.lit + ' come for');
        if (b.sameNeighbour) bad.push(name + ': ' + b.sameNeighbour + ' neighbours share a colour');
      }
      if (v === 'b') {
        if (b.drawn !== CAME[name]) bad.push(name + ': ' + b.drawn + ' lines, should be ' + CAME[name]);
        if (settled && b.reversed !== (name in NOW ? 4 : 0)) bad.push(name + ': ' + b.reversed + ' parts reversed out, should be ' + (name in NOW ? 4 : 0));
        if (b.bare) bad.push(name + ': ' + b.bare + ' words with no ground of their own');
        if (!(b.slant < -1)) bad.push(name + ': the block is not on a slant (' + b.slant + ')');
      }
      if (v === 'c') {
        if (settled && b.typed !== b.lit) bad.push(name + ': ' + b.typed + ' parts typed in, ' + b.lit + ' come for');
        if (b.solid !== b.lit) bad.push(name + ': ' + b.solid + ' cells solid, ' + b.lit + ' come for');
        if (settled && b.ringed !== (name in NOW ? 4 : 0)) bad.push(name + ': ' + b.ringed + ' cells ringed, should be ' + (name in NOW ? 4 : 0));
        if (b.coords < (tag === 'wide' ? 10 : 12)) bad.push(name + ': only ' + b.coords + ' coordinates on the board');
      }
      if (v === 'd') {
        if (name !== 'question' && Math.abs(b.standsOn) > .5) bad.push(name + ': the wall is ' + b.standsOn + 'px off the floor');
        if (b.ragged) bad.push(name + ': ' + b.ragged + ' courses do not run edge to edge');
        if (!b.capCentred) bad.push(name + ': the top course is not centred');
        if (!b.startsAtFloor) bad.push(name + ': the wall is not laid from the floor up');
        if (b.set !== b.lit) bad.push(name + ': ' + b.set + ' bricks set, ' + b.lit + ' come for');
        if (settled && b.earthNow !== (name in NOW ? 4 : 0)) bad.push(name + ': ' + b.earthNow + ' bricks in earth, should be ' + (name in NOW ? 4 : 0));
      }
    }
    if (!view.beats.pass.whole || !view.beats.full.whole) bad.push('the end did not run');
    if (view.scrollWidth > view.innerWidth) bad.push('page wider than the screen: ' + view.scrollWidth);
    if (view.errors.length) bad.push('page errors: ' + view.errors[0]);
    bad.length ? bad.forEach(x => fail(v + ' ' + tag + ' ' + x)) : ok(tag + ': fills like 99, the system holds at every beat, legible, nothing overlapping or cut off');
  }
}
console.log('apart');
const vs = Object.keys(seen), shared = [], sameBg = [];
for (const x of vs) for (const y of vs) if (x < y) {
  const f = seen[x].fonts.filter(n => seen[y].fonts.includes(n)); if (f.length) shared.push(x + '/' + y + ': ' + f.join(', '));
  if (seen[x].bg === seen[y].bg) sameBg.push(x + '/' + y);
}
shared.length ? fail('typefaces shared: ' + shared.join('; ')) : ok('no typeface in two variants (' + vs.map(v => v + ' ' + seen[v].fonts.join(' + ')).join('; ') + ')');
sameBg.length ? fail('the same ground: ' + sameBg.join(', ')) : ok('four grounds (' + vs.map(v => v + ' ' + seen[v].bg).join('; ') + ')');
console.log(failures ? failures + ' failure(s)' : 'all good');
process.exit(failures ? 1 : 0);
