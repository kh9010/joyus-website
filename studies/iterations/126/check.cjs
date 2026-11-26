// Study 126: 125 c, the one Divya picked ("I think I like the one with both"), with her three notes, one step each:
//   step1  the orange is "too equidistant from everything else. It doesn't lend a personality": seafoam instead;
//   step2  "too many different fonts. Can we simplify that a little?": one typeface, Space Grotesk;
//   case   "it's more standard to underline than to overline": the colour goes under the words.
// Pinned here:
//  - each step is the one before plus exactly its change (step1 against 125 c; step2 and case built by make.cjs);
//  - 99's grid to the pixel on all three (grid99.json, measured live in Study 125): columns, width, left edge, gap, type,
//    words, every cell's x and width; rows never less airy than 99's, never past its cap;
//  - Study 99's people, parts, order, question, lines and close; no em dash, no figure; noindex;
//  - pictures newer than the pages, wide, phone and short phone: nothing on top of anything, nothing past the edge, words in
//    their cells, no text under 13px, no page error, fills like 99, the bar of six fills one per person, settled text readable;
//  - step2 and case load and use one typeface; case puts no colour above a cell, underlines everyone come for, the arriving
//    four more heavily, and no underline leaves its cell.
//   node studies/iterations/126/check.cjs
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
const bare = (h) => h.replace(/\/\*[\s\S]*?\*\//g, '');
const was = read('../99/case.html'), c125 = read('../125/c.html');
const G99 = JSON.parse(read('grid99.json'));
const CAP = { wide: 112, phone: 46, short: 46 };
const FILL = { question: 0, offer: 0, one: 4, empty: 4, third: 12, fifth: 20, pass: 24, full: 24 };
const CAME = { question: 0, offer: 0, one: 1, empty: 1, third: 3, fifth: 5, pass: 6, full: 6 };
const NOW = { one: 0, third: 2, fifth: 4 };
const SETTLED = ['question', 'offer', 'one', 'empty', 'third', 'fifth', 'full'];
const STEPS = { step1: 'seafoam', step2: 'one typeface', case: 'underlines' };

// step 1 is 125 c with one colour changed, and nothing else
const s1 = read('step1.html');
bare(s1).replace('#3fd0a4', '#ff8a3d') === bare(c125) ? ok('step1 is 125 c with only the orange changed') : fail('step1 differs from 125 c in more than the colour');
!/#ff8a3d/i.test(s1) && /#3fd0a4/.test(s1) ? ok('step1: seafoam in, orange gone') : fail('step1: the orange is still there or the seafoam is not');

for (const v of Object.keys(STEPS)) {
  const html = read(v + '.html');
  console.log(v + ' ' + STEPS[v]);
  /<meta name="robots" content="noindex/.test(html) ? ok('noindex') : fail(v + ': no noindex');
  JSON.stringify(dataOf(html)) === JSON.stringify(dataOf(was)) && stageOf(html) === stageOf(was) ? ok('Study 99\'s people, parts, order and words') : fail(v + ': differs from Study 99');
  html.includes("const th = Math.min(phone ? 46 : 112, (H - top - foot) / rows), gh = th * rows;") ? ok('the grid is laid out by 99\'s own code') : fail(v + ': the grid code is not 99\'s');
  if (v !== 'step1') {
    const families = [...new Set([...html.matchAll(/family=([A-Za-z+]+)/g)].map(m => m[1]))], css = bare(html.match(/<style>([\s\S]*?)<\/style>/)[1]);
    families.length === 1 && families[0] === 'Space+Grotesk' && !/Archivo|Lilita|Rubik|Montserrat/.test(css) ? ok('one typeface: Space Grotesk') : fail(v + ': typefaces ' + families.join(', '));
  }
  const body = text(html.replace(/<head>[\s\S]*?<\/head>/, '').replace(/<script[\s\S]*?<\/script>/g, '')) + ' ' + dataOf(html).people.map(p => [p.name, p.fits, p.instead, ...p.parts].join(' ')).join(' ');
  /—/.test(body) || /[$%£€]|\d{2,}/.test(body) ? fail(v + ': an em dash or a figure in the words') : ok('no em dash, no figure');
  const rf = 'report-' + v + '.json';
  if (!fs.existsSync(path.join(here, rf))) { fail(v + ': no ' + rf + ': run shoot.mjs ' + v); continue; }
  const age = (f) => fs.statSync(path.join(here, f)).mtimeMs;
  age(rf) >= age(v + '.html') ? ok('the pictures are newer than the page') : fail(v + ': ' + rf + ' is older than ' + v + '.html: run shoot.mjs ' + v);
  const rep = JSON.parse(read(rf));
  for (const tag of ['wide', 'phone', 'short']) {
    const view = rep.views[tag], bad = [];
    if (!view) { fail(v + ' ' + tag + ': not shot'); continue; }
    const G = view.beats.third.geometry, B = G99[tag];
    for (const k of ['cols', 'width', 'left', 'gap', 'type', 'size', 'weight']) if (G[k] !== B[k]) bad.push('grid ' + k + ' is ' + G[k] + ', 99\'s is ' + B[k]);
    if (JSON.stringify(G.words) !== JSON.stringify(B.words)) bad.push('the grid holds different words or order from 99');
    if (G.row < B.row - .05 || G.row > CAP[tag] + .05) bad.push('rows ' + G.row + 'px against 99\'s ' + B.row + ' (cap ' + CAP[tag] + ')');
    const xs = G.cells.filter((c, i) => c[0] !== B.cells[i][0] || c[2] !== B.cells[i][2]).length;
    if (xs) bad.push(xs + ' cells sit at a different x or width from 99');
    for (const [name, b] of Object.entries(view.beats)) {
      const settled = SETTLED.includes(name), arriving = name in NOW;
      if (b.overlaps) bad.push(name + ': ' + b.overlaps + ' things on top of each other');
      if (b.out) bad.push(name + ': ' + b.out + ' things past the edge');
      if (b.clipped.length) bad.push(name + ': words outside their cell in ' + b.clipped.join(' / '));
      if (b.small < 13) bad.push(name + ': text at ' + b.small + 'px');
      if (b.lit !== FILL[name]) bad.push(name + ': ' + b.lit + ' parts come for, should be ' + FILL[name]);
      if (b.caption.length > 1) bad.push(name + ': two captions at once');
      if (b.segs !== CAME[name]) bad.push(name + ': ' + b.segs + ' of the six filled, should be ' + CAME[name]);
      if (settled && b.litContrast !== null && b.litContrast < 4.5) bad.push(name + ': a part come for at ' + b.litContrast + ':1');
      if (settled && b.unlitContrast !== null && b.unlitContrast < (b.largeBold ? 3 : 4.5)) bad.push(name + ': a waiting part at ' + b.unlitContrast + ':1');
      if (settled && b.ruled !== b.lit) bad.push(name + ': ' + b.ruled + ' parts carry their colour, ' + b.lit + ' come for');
      if (settled && b.heavy !== (arriving ? 4 : 0)) bad.push(name + ': ' + b.heavy + ' heavy, should be ' + (arriving ? 4 : 0));
      if (v === 'case') {
        if (b.over) bad.push(name + ': colour above ' + b.over + ' cells');
        if (settled && b.spill.length) bad.push(name + ': underlines leave their cell in ' + b.spill.join(' / '));
      }
    }
    if (!view.beats.full.whole) bad.push('the end did not run');
    if (view.scrollWidth > view.innerWidth) bad.push('page wider than the screen: ' + view.scrollWidth);
    if (view.errors.length) bad.push('page errors: ' + view.errors[0]);
    bad.length ? bad.forEach(x => fail(v + ' ' + tag + ' ' + x)) : ok(tag + ': 99\'s grid to the pixel (rows ' + G.row + ' / 99 ' + B.row + '), fills like 99, the six fill, legible, nothing overlapping');
  }
}
console.log(failures ? failures + ' failure(s)' : 'all good');
process.exit(failures ? 1 : 0);
