// Study 121: EWC in four feelings. Study 99's page four times; only the look changes. Pinned here:
//  - each of a b c d carries Study 99's people, parts, order, question, lines and close, word for word (so 95's and 92 final's too);
//  - Joyus's own design: Space Grotesk only, the page white, no fills behind a part, no em dash, no figure, noindex;
//  - the pictures are newer than the pages (shoot.mjs writes report-<v>.json), on a wide screen, a phone and a short phone:
//    nothing on top of anything else, nothing past the edge, words inside their cell, no text under 13px, no page error,
//    the block fills 0, 0, 4, 4, 12, 20, 24, 24 like 99, ink words at 4.5:1 or better, pale ones 3:1 (large bold) or 4.5:1;
//  - and each variant's one idea, measured:
//    a vibrant   every person is one of the six pairs of the four stone colours, no two alike; a part keeps its pair as an underline
//                once its person has come; the tint is behind the words only while that person is arriving (and in the end pass);
//    b energy    one line per person who has come, only the arriving one heavy; no point of any line sits inside a word,
//                every word sits on white so no line crosses a letter;
//    c solved    every placed part is square, every waiting part loose; a row's line never comes before all its parts are placed;
//                wide, no row locks until the last person (each wide row holds all six); on a phone rows lock one by one;
//    d grounded  the floor is on screen from the first frame and the block stands on it; nothing turns or moves sideways;
//                a settled part sits on its shelf and a waiting one above it (on the short phone, the two-line parts have no air
//                to float in: at most five); the arriving person's shelves are heavy.
//   node studies/iterations/121/check.cjs
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
const CAME = { question: 0, offer: 0, one: 1, empty: 1, third: 3, fifth: 5, pass: 6, full: 6 };   // people who have come at each beat
const NOW = { one: 0, third: 2, fifth: 4 };                                                       // who is arriving
const SETTLED = ['question', 'offer', 'one', 'empty', 'third', 'fifth', 'full'];                  // 'pass' is taken mid-motion

const NAMES = { a: 'vibrant', b: 'energy', c: 'solved', d: 'grounded' };
const css = {};
for (const v of Object.keys(NAMES)) {
  const html = read(v + '.html');
  console.log(v + ' ' + NAMES[v]);
  /<meta name="robots" content="noindex/.test(html) ? ok('noindex') : fail(v + ': no noindex');
  JSON.stringify(dataOf(html)) === JSON.stringify(dataOf(was)) ? ok('the people, their parts and the order are Study 99\'s') : fail(v + ': the people, parts or order differ from Study 99');
  stageOf(html) === stageOf(was) ? ok('the question, the lines and the close are Study 99\'s, word for word') : fail(v + ': the words differ from Study 99:\n   99 ' + stageOf(was) + '\n   ' + v + '  ' + stageOf(html));
  const style = css[v] = html.match(/<style>([\s\S]*?)<\/style>/)[1].replace(/\/\*[\s\S]*?\*\//g, '');
  const families = [...new Set([...html.matchAll(/family=([A-Za-z+]+)/g)].map(m => m[1]))];
  families.length === 1 && families[0] === 'Space+Grotesk' && !/serif/.test(style.replace(/sans-serif/g, '')) ? ok('Space Grotesk only') : fail(v + ': fonts ' + families.join(', '));
  /--bg:#fff\b/.test(style) && /#stage\{[^}]*background:var\(--bg\)/.test(style) ? ok('the page is white') : fail(v + ': the page is not white');
  const body = text(html.replace(/<head>[\s\S]*?<\/head>/, '').replace(/<script[\s\S]*?<\/script>/g, '')) + ' ' + dataOf(html).people.map(p => [p.name, p.fits, p.instead, ...p.parts].join(' ')).join(' ');
  /—/.test(body) ? fail(v + ': an em dash') : ok('no em dash');
  /[$%£€]|\d{2,}/.test(body) ? fail(v + ': a figure in the words') : ok('no money, percentage or count');

  const rf = 'report-' + v + '.json';
  if (!fs.existsSync(path.join(here, rf))) { fail(v + ': no ' + rf + ': run shoot.mjs ' + v); continue; }
  const age = (f) => fs.statSync(path.join(here, f)).mtimeMs;
  age(rf) >= age(v + '.html') ? ok('the pictures are newer than the page') : fail(v + ': ' + rf + ' is older than ' + v + '.html: run shoot.mjs ' + v);
  const rep = JSON.parse(read(rf));
  for (const tag of ['wide', 'phone', 'short']) {
    const view = rep.views[tag], bad = [];
    if (!view) { fail(v + ' ' + tag + ': not shot'); continue; }
    for (const [name, b] of Object.entries(view.beats)) {
      if (b.overlaps) bad.push(name + ': ' + b.overlaps + ' things on top of each other');
      if (b.out) bad.push(name + ': ' + b.out + ' things past the edge');
      if (b.clipped.length) bad.push(name + ': words outside their cell in ' + b.clipped.join(' / '));
      if (b.clash && b.clash.length) bad.push(name + ': words run into each other: ' + b.clash.join('; '));
      if (b.small < 13) bad.push(name + ': text at ' + b.small + 'px');
      if (b.lit !== FILL[name]) bad.push(name + ': ' + b.lit + ' parts in ink, should be ' + FILL[name]);
      if (b.caption.length > 1) bad.push(name + ': two captions at once');
      if (b.boxed) bad.push(name + ': ' + b.boxed + ' parts have a fill, a shadow or a side border');
      if (b.litContrast !== null && b.litContrast < 4.5) bad.push(name + ': ink words at ' + b.litContrast + ':1');
      if (b.unlitContrast !== null && b.unlitContrast < (b.largeBold ? 3 : 4.5)) bad.push(name + ': pale words at ' + b.unlitContrast + ':1 at ' + b.type + 'px');
      // the variant's own idea
      const settled = SETTLED.includes(name);
      if (v === 'a') {
        if (b.wrongPair) bad.push(name + ': ' + b.wrongPair + ' parts carry another person\'s pair');
        if (b.pairs.length !== CAME[name]) bad.push(name + ': ' + b.pairs.length + ' pairs under the words, should be ' + CAME[name]);
        if (new Set(b.pairs.map(s => [...s].sort().join(''))).size !== b.pairs.length) bad.push(name + ': two people share a pair');
        if (b.lined !== b.lit) bad.push(name + ': ' + b.lined + ' underlined but ' + b.lit + ' come for');
        if (settled && b.banded !== (name in NOW ? 4 : 0)) bad.push(name + ': the tint is behind ' + b.banded + ' parts, should be ' + (name in NOW ? 4 : 0));
      }
      if (v === 'b') {
        if (b.drawn !== CAME[name]) bad.push(name + ': ' + b.drawn + ' lines drawn, should be ' + CAME[name]);
        if (settled && JSON.stringify(b.thick) !== JSON.stringify(name in NOW ? [NOW[name]] : [])) bad.push(name + ': heavy lines ' + JSON.stringify(b.thick));
        if (b.dotIn) bad.push(name + ': ' + b.dotIn + ' points of a line sit inside a word');
        if (b.bare) bad.push(name + ': ' + b.bare + ' words have no white ground, a line could cross them');
      }
      if (v === 'c') {
        if (b.early) bad.push(name + ': ' + b.early + ' rows locked before all their parts were placed');
        if (settled && (b.litLoose || b.loose !== 24 - b.lit)) bad.push(name + ': ' + b.litLoose + ' placed parts not square, ' + b.loose + ' loose (should be ' + (24 - b.lit) + ')');
        const want = tag === 'wide' ? { third: 0, fifth: 0, full: 5 } : { third: 2, fifth: 8, full: 13 };
        if (name in want && b.locked !== want[name]) bad.push(name + ': ' + b.locked + ' rows locked, should be ' + want[name]);
      }
      if (v === 'd') {
        if (name !== 'question' && (b.floor < 6 || Math.abs(b.standsOn) > .5 || b.belowFloor < 0)) bad.push(name + ': the block is not standing on a floor on screen (floor ' + b.floor + ', gap ' + b.standsOn + ')');
        if (b.turned) bad.push(name + ': ' + b.turned + ' parts turn or move sideways');
        if (settled && b.settledLifted) bad.push(name + ': ' + b.settledLifted + ' settled parts are off their shelf');
        if (b.waitingDown > (tag === 'short' ? 5 : 0)) bad.push(name + ': ' + b.waitingDown + ' waiting parts are not floating');
        if (settled && b.heavy !== (name in NOW ? 4 : 0)) bad.push(name + ': ' + b.heavy + ' heavy shelves, should be ' + (name in NOW ? 4 : 0));
        if (settled && b.shelved !== b.lit) bad.push(name + ': ' + b.shelved + ' shelves in ink, ' + b.lit + ' parts come for');
      }
    }
    const B = view.beats;
    if (!B.pass.whole || !B.full.whole) bad.push('the end pass did not run');
    if (view.scrollWidth > view.innerWidth) bad.push('page wider than the screen: ' + view.scrollWidth);
    if (view.errors.length) bad.push('page errors: ' + view.errors[0]);
    bad.length ? bad.forEach(x => fail(v + ' ' + tag + ' ' + x)) : ok(tag + ': fills like 99, the idea holds at every beat, legible, nothing overlapping or cut off');
  }
}
// four looks, not one look four times: no two variants share their grid rules
const gridRules = v => css[v].slice(css[v].indexOf('#grid{'), css[v].indexOf('.ans{')).replace(/\s+/g, '');
const same = [];
for (const x of 'abcd') for (const y of 'abcd') if (x < y && gridRules(x) === gridRules(y)) same.push(x + '=' + y);
same.length ? fail('variants with the same grid: ' + same.join(', ')) : ok('four different grids');
console.log(failures ? failures + ' failure(s)' : 'all good');
process.exit(failures ? 1 : 0);
