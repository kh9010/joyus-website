// Study 125: EWC, 99's grid kept, 123 a's energy and 123 b's simplicity around it. Divya on 124: "I didn't want you to change
// that central part ... with the different blocks and columns, was so airy and nice and had space. This now just feels
// much more generic." So the first thing pinned here is the grid itself, against Study 99 measured live (grid99.mjs):
//  - the same number of columns, the same width and left edge, the same column gap, the same type on the parts (family,
//    size, weight), the same words in the same cells, every cell at the same x and width; rows as tall as 99's or taller
//    (never less air), and no taller than 99's own cap;
//  - Study 99's people, parts, order, question, lines and close, word for word; no em dash, no figure; noindex;
//  - pictures newer than the pages, wide, phone and short phone: nothing on top of anything, nothing past the edge, no words
//    outside their cell, no text under 13px, no page error, fills 0 0 4 4 12 20 24 24 like 99, settled text readable
//    (4.5:1, or 3:1 where the parts are large and bold, as in 99);
//  - and each version's idea:
//    a energy      the ground is the arriving person's colour, white between people; everyone come for has a rule in their
//                  colour, the arriving four a heavier one; all six colours on the grid at the end;
//    b simplicity  the question in capitals; the arriving four take a pink rule, nobody else does;
//    c both        a bar of six right under the question fills one per person; the arriving four take a heavy rule in their
//                  colour; everyone come for keeps one; all six at the end.
//   node studies/iterations/125/check.cjs
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
const G99 = JSON.parse(read('grid99.json'));
const CAP = { wide: 112, phone: 46, short: 46 };
const FILL = { question: 0, offer: 0, one: 4, empty: 4, third: 12, fifth: 20, pass: 24, full: 24 };
const CAME = { question: 0, offer: 0, one: 1, empty: 1, third: 3, fifth: 5, pass: 6, full: 6 };
const NOW = { one: 0, third: 2, fifth: 4 };
const SETTLED = ['question', 'offer', 'one', 'empty', 'third', 'fifth', 'full'];
const COLOUR = ['rgb(242, 90, 163)', 'rgb(47, 192, 216)', 'rgb(245, 198, 60)', 'rgb(125, 85, 212)', 'rgb(255, 138, 61)', 'rgb(44, 53, 68)'];
const WAYS = { a: 'energy around the grid', b: 'simplicity around the grid', c: 'both' };

for (const v of Object.keys(WAYS)) {
  const html = read(v + '.html');
  console.log(v + ' ' + WAYS[v]);
  /<meta name="robots" content="noindex/.test(html) ? ok('noindex') : fail(v + ': no noindex');
  JSON.stringify(dataOf(html)) === JSON.stringify(dataOf(was)) ? ok('the people, their parts and the order are Study 99\'s') : fail(v + ': the people, parts or order differ from Study 99');
  stageOf(html) === stageOf(was) ? ok('the question, the lines and the close are Study 99\'s, word for word') : fail(v + ': the words differ from Study 99:\n   99 ' + stageOf(was) + '\n   ' + v + '  ' + stageOf(html));
  html.includes("const th = Math.min(phone ? 46 : 112, (H - top - foot) / rows), gh = th * rows;") ? ok('the grid is laid out by 99\'s own code') : fail(v + ': the grid code is not 99\'s');
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
    // the grid, against 99
    const G = view.beats.third.geometry, B = G99[tag];
    for (const k of ['cols', 'width', 'left', 'gap', 'type', 'size', 'weight']) if (G[k] !== B[k]) bad.push('grid ' + k + ' is ' + G[k] + ', 99\'s is ' + B[k]);
    if (JSON.stringify(G.words) !== JSON.stringify(B.words)) bad.push('the grid holds different words or order from 99');
    if (G.row < B.row - .05) bad.push('rows ' + G.row + 'px, less air than 99\'s ' + B.row);
    if (G.row > CAP[tag] + .05) bad.push('rows ' + G.row + 'px, past 99\'s cap ' + CAP[tag]);
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
      if (settled && b.litContrast !== null && b.litContrast < 4.5) bad.push(name + ': a part come for at ' + b.litContrast + ':1');
      if (settled && b.unlitContrast !== null && b.unlitContrast < (b.largeBold ? 3 : 4.5)) bad.push(name + ': a waiting part at ' + b.unlitContrast + ':1');
      if (v === 'a' && settled) {
        const want = arriving ? COLOUR[NOW[name]] : 'rgb(255, 255, 255)';
        if (b.ground !== want) bad.push(name + ': the ground is ' + b.ground + ', should be ' + want);
        if (b.ruled !== b.lit) bad.push(name + ': ' + b.ruled + ' cells ruled in colour, ' + b.lit + ' come for');
        if (b.heavy !== (arriving ? 4 : 0)) bad.push(name + ': ' + b.heavy + ' heavy rules, should be ' + (arriving ? 4 : 0));
        if (b.colours !== CAME[name]) bad.push(name + ': ' + b.colours + ' colours on the grid, should be ' + CAME[name]);
      }
      if (v === 'b') {
        if (!b.questionCaps) bad.push(name + ': the question is not in capitals');
        if (settled && b.pink !== (arriving ? 4 : 0)) bad.push(name + ': ' + b.pink + ' pink rules, should be ' + (arriving ? 4 : 0));
      }
      if (v === 'c') {
        if (b.segs !== CAME[name]) bad.push(name + ': ' + b.segs + ' of the six filled, should be ' + CAME[name]);
        if (!b.barUnderQ) bad.push(name + ': the six are not right under the question');
        if (settled && b.heavy !== (arriving ? 4 : 0)) bad.push(name + ': ' + b.heavy + ' heavy rules, should be ' + (arriving ? 4 : 0));
        if (settled && b.ruled !== b.lit) bad.push(name + ': ' + b.ruled + ' cells ruled in colour, ' + b.lit + ' come for');
        if (b.colours !== CAME[name]) bad.push(name + ': ' + b.colours + ' colours on the grid, should be ' + CAME[name]);
      }
    }
    if (!view.beats.full.whole) bad.push('the end did not run');
    if (view.scrollWidth > view.innerWidth) bad.push('page wider than the screen: ' + view.scrollWidth);
    if (view.errors.length) bad.push('page errors: ' + view.errors[0]);
    bad.length ? bad.forEach(x => fail(v + ' ' + tag + ' ' + x)) : ok(tag + ': 99\'s grid to the pixel (rows ' + G.row + ' / 99 ' + B.row + '), fills like 99, the idea holds, legible, nothing overlapping');
  }
}
console.log(failures ? failures + ' failure(s)' : 'all good');
process.exit(failures ? 1 : 0);
