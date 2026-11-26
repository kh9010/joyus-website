// Study 123: EWC from the anchor words. Divya on 122: "you could rearrange things also, like the title text, like where
// things are", and "you have just forgotten the anchor words". Her anchors: vibrance, multiplicity, energy, being able to
// solve things, surety, certainty, groundedness. Each variant is designed from one or two of them as a feeling (composition,
// scale, rhythm, type, colour, motion), not as a picture of the word, and each puts things in a different place.
// Pinned here:
//  - Study 99's people, parts, order, question, lines and close, word for word; no em dash, no figure; noindex;
//  - no typeface in two variants;
//  - pictures newer than the pages, wide, phone and short phone: nothing on top of anything, nothing past the edge, no words
//    cut off, no text under 13px, no page error, fills 0 0 4 4 12 20 24 24 like 99, settled text at 4.5:1 or better;
//  - and what each anchor asks of the page, measured:
//    a VIBRANCE, MULTIPLICITY  the question in the top-left corner; the room floods with the arriving person's colour and is
//                              white between people; everyone who came before keeps a chip of their colour; the arriving
//                              four are ringed; at least four type sizes at once; all six colours at the end;
//    b ENERGY, SOLVING         split: the question inside the ink half, the parts in the other; everyone who has come is on
//                              the line; the arriving four always in view; at the end all 24 on the line and in view;
//    c SURETY, CERTAINTY       one left edge for question, rule and person; the question never moves; nothing on the stage
//                              is ever moved; the arriving four marked, nothing else;
//    d GROUNDEDNESS            the question's foot near the bottom of the screen once the page opens; the parts sit on the
//                              question and the person on the parts; at least a fifth of the screen above them left open;
//                              the arriving four underlined.
//   node studies/iterations/123/check.cjs
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
const NOW = { one: 0, third: 2, fifth: 4 };
const SETTLED = ['question', 'offer', 'one', 'empty', 'third', 'fifth', 'full'];
const COLOUR = ['rgb(242, 90, 163)', 'rgb(47, 192, 216)', 'rgb(245, 198, 60)', 'rgb(125, 85, 212)', 'rgb(255, 138, 61)', 'rgb(44, 53, 68)'];
const ANCHOR = { a: 'vibrance, multiplicity', b: 'energy, being able to solve things', c: 'surety, certainty', d: 'groundedness' };
const fonts = {};

for (const v of Object.keys(ANCHOR)) {
  const html = read(v + '.html');
  console.log(v + ' ' + ANCHOR[v]);
  /<meta name="robots" content="noindex/.test(html) ? ok('noindex') : fail(v + ': no noindex');
  JSON.stringify(dataOf(html)) === JSON.stringify(dataOf(was)) ? ok('the people, their parts and the order are Study 99\'s') : fail(v + ': the people, parts or order differ from Study 99');
  stageOf(html) === stageOf(was) ? ok('the question, the lines and the close are Study 99\'s, word for word') : fail(v + ': the words differ from Study 99:\n   99 ' + stageOf(was) + '\n   ' + v + '  ' + stageOf(html));
  new RegExp('Anchors?: ' + ANCHOR[v].split(', ')[0].split(' ')[0].toUpperCase()).test(html) ? ok('the page names its anchor') : fail(v + ': the page does not name its anchor');
  const body = text(html.replace(/<head>[\s\S]*?<\/head>/, '').replace(/<script[\s\S]*?<\/script>/g, '')) + ' ' + dataOf(html).people.map(p => [p.name, p.fits, p.instead, ...p.parts].join(' ')).join(' ');
  /—/.test(body) ? fail(v + ': an em dash') : ok('no em dash');
  /[$%£€]|\d{2,}/.test(body) ? fail(v + ': a figure in the words') : ok('no money, percentage or count');
  const rf = 'report-' + v + '.json';
  if (!fs.existsSync(path.join(here, rf))) { fail(v + ': no ' + rf + ': run shoot.mjs ' + v); continue; }
  const age = (f) => fs.statSync(path.join(here, f)).mtimeMs;
  age(rf) >= age(v + '.html') ? ok('the pictures are newer than the page') : fail(v + ': ' + rf + ' is older than ' + v + '.html: run shoot.mjs ' + v);
  const rep = JSON.parse(read(rf));
  fonts[v] = rep.views.wide.beats.one.fonts;
  for (const tag of ['wide', 'phone', 'short']) {
    const view = rep.views[tag], bad = [];
    if (!view) { fail(v + ' ' + tag + ': not shot'); continue; }
    for (const [name, b] of Object.entries(view.beats)) {
      const settled = SETTLED.includes(name), arriving = name in NOW;
      if (b.overlaps) bad.push(name + ': ' + b.overlaps + ' things on top of each other');
      if (b.out) bad.push(name + ': ' + b.out + ' things past the edge');
      if (b.clipped.length) bad.push(name + ': words cut off in ' + b.clipped.join(' / '));
      if (b.small < 13) bad.push(name + ': text at ' + b.small + 'px');
      if (b.lit !== FILL[name]) bad.push(name + ': ' + b.lit + ' parts come for, should be ' + FILL[name]);
      if (b.caption.length > 1) bad.push(name + ': two captions at once');
      if (settled && b.litContrast !== null && b.litContrast < 4.5) bad.push(name + ': a part come for at ' + b.litContrast + ':1');
      if (settled && b.unlitContrast !== null && b.unlitContrast < 4.5) bad.push(name + ': a waiting part at ' + b.unlitContrast + ':1');
      if (v === 'a' && settled) {
        const want = arriving ? COLOUR[NOW[name]] : 'rgb(255, 255, 255)';
        if (b.ground !== want) bad.push(name + ': the room is ' + b.ground + ', should be ' + want);
        if (b.ringed !== (arriving ? 4 : 0)) bad.push(name + ': ' + b.ringed + ' parts ringed, should be ' + (arriving ? 4 : 0));
        if (b.chips !== b.lit - (arriving ? 4 : 0)) bad.push(name + ': ' + b.chips + ' chips, should be ' + (b.lit - (arriving ? 4 : 0)));
        if (b.sizes.length < 4) bad.push(name + ': only ' + b.sizes.length + ' type sizes');
        if (b.corner.qTop > 140 || b.corner.qLeft > 0.08 * (tag === 'wide' ? 1440 : 390) + 2) bad.push(name + ': the question is not in the top-left corner');
        if (name === 'full' && b.colours !== 6) bad.push('full: ' + b.colours + ' colours in the mosaic, should be 6');
      }
      if (v === 'b') {
        if (b.onLine !== b.lit) bad.push(name + ': ' + b.onLine + ' parts on the line, ' + b.lit + ' come for');
        if (arriving && b.nowInView !== 4) bad.push(name + ': ' + b.nowInView + ' of the arriving four in view');
        if (name === 'full' && b.visible !== 24) bad.push('full: ' + b.visible + ' of 24 in view');
        if (b.qC < 4.5 || b.sixC < 4.5) bad.push(name + ': the question at ' + b.qC + ' / ' + b.sixC + ':1 on the ink');
        if (tag === 'wide' && (!b.questionLeftHalf || !b.colRightHalf)) bad.push(name + ': not split: question ' + b.questionLeftHalf + ', column ' + b.colRightHalf);
      }
      if (v === 'c') {
        if (!b.oneEdge) bad.push(name + ': the question, rule and person do not share one edge');
        if (!b.questionStill) bad.push(name + ': the question moved');
        if (b.moved) bad.push(name + ': ' + b.moved + ' things on the stage were moved');
        if (settled && b.marked !== (arriving ? 4 : 0)) bad.push(name + ': ' + b.marked + ' parts marked, should be ' + (arriving ? 4 : 0));
      }
      if (v === 'd' && name !== 'question') {
        if (b.qFoot > 40) bad.push(name + ': the question\'s foot is ' + b.qFoot + 'px off the bottom');
        if (!(b.onQ >= 0 && b.onQ <= 34)) bad.push(name + ': the parts are ' + b.onQ + 'px off the question');
        if (b.capOn !== null && !(b.capOn >= 0 && b.capOn <= 26)) bad.push(name + ': the person is ' + b.capOn + 'px off the parts');
        if (b.sky < .2) bad.push(name + ': only ' + Math.round(b.sky * 100) + '% of the screen left open');
        if (settled && b.underlined !== (arriving ? 4 : 0)) bad.push(name + ': ' + b.underlined + ' parts underlined, should be ' + (arriving ? 4 : 0));
      }
    }
    if (v === 'd') { const B = view.beats; if (!(B.question.qY < B.offer.qY)) bad.push('the question did not go down (' + B.question.qY + ' then ' + B.offer.qY + ')'); }
    if (!view.beats.full.whole) bad.push('the end did not run');
    if (view.scrollWidth > view.innerWidth) bad.push('page wider than the screen: ' + view.scrollWidth);
    if (view.errors.length) bad.push('page errors: ' + view.errors[0]);
    bad.length ? bad.forEach(x => fail(v + ' ' + tag + ' ' + x)) : ok(tag + ': fills like 99, the anchor holds at every beat, legible, nothing overlapping or cut off');
  }
}
console.log('apart');
const shared = [];
for (const x in fonts) for (const y in fonts) if (x < y) { const f = fonts[x].filter(n => fonts[y].includes(n)); if (f.length) shared.push(x + '/' + y + ': ' + f.join(', ')); }
shared.length ? fail('typefaces shared: ' + shared.join('; ')) : ok('no typeface in two variants (' + Object.entries(fonts).map(([v, f]) => v + ' ' + f.join(' + ')).join('; ') + ')');
console.log(failures ? failures + ' failure(s)' : 'all good');
process.exit(failures ? 1 : 0);
