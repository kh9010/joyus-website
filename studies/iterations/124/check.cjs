// Study 124: EWC, 123 a's energy with 123 b's simplicity, three ways. Divya on 123: "I like the energy in A and I like the
// simplicity in B"; c and d rejected. Pinned here:
//  - Study 99's people, parts, order, question, lines and close, word for word; no em dash, no figure; noindex;
//  - pictures newer than the pages, wide, phone and short phone: nothing on top of anything, nothing past the edge, no words
//    cut off, no text under 13px, no page error, fills 0 0 4 4 12 20 24 24 like 99, settled text at 4.5:1 or better;
//  - each way's idea, at every beat:
//    a split, flooded   the question's half takes the arriving person's colour and is ink between people; everything on it
//                       reads on it; everyone who has come is on the line with their stretch painted; the arriving four in view;
//    b takeover         each arrival takes the whole screen in their colour, words readable and inside the screen; the bands
//                       fill 0, 1, 2, 4, 6 as the takeovers fold back;
//    c stripes          a stripe is filled for everyone who has come; arrows on the arriving four only; the field runs edge to
//                       edge; the question one line on a wide screen; all six colours at the end.
//   node studies/iterations/124/check.cjs
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
const NAME = ['The joiner', 'The newcomer', 'The host', 'The golfer', 'The second act', 'The regular'];
const BANDS = { question: 0, offer: 0, one: 0, empty: 1, third: 2, fifth: 4, pass: 6, full: 6 };
const WAYS = { a: 'split, flooded', b: 'takeover', c: 'stripes' };

for (const v of Object.keys(WAYS)) {
  const html = read(v + '.html');
  console.log(v + ' ' + WAYS[v]);
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
      if (v === 'a') {
        if (settled && b.flood !== (arriving ? COLOUR[NOW[name]] : 'rgb(21, 22, 26)')) bad.push(name + ': the half is ' + b.flood);
        if (settled && b.halfContrast < 4.5) bad.push(name + ': words on the half at ' + b.halfContrast + ':1');
        if (b.onLine !== b.lit || b.squares !== b.lit) bad.push(name + ': ' + b.onLine + ' on the line, ' + b.squares + ' painted, ' + b.lit + ' come for');
        if (arriving && b.nowInView !== 4) bad.push(name + ': ' + b.nowInView + ' of the arriving four in view');
        if (name === 'full' && b.visible !== 24) bad.push('full: ' + b.visible + ' of 24 in view');
      }
      if (v === 'b') {
        if (settled && b.takeover !== (arriving ? NAME[NOW[name]] : null)) bad.push(name + ': takeover ' + b.takeover);
        if (arriving && (b.overColour !== COLOUR[NOW[name]] || b.overC < 4.5 || !b.overFits)) bad.push(name + ': the takeover is ' + b.overColour + ', words at ' + b.overC + ':1, inside the screen ' + b.overFits);
        if (b.full !== BANDS[name]) bad.push(name + ': ' + b.full + ' bands filled, should be ' + BANDS[name]);
      }
      if (v === 'c') {
        if (b.filled !== b.lit) bad.push(name + ': ' + b.filled + ' stripes filled, ' + b.lit + ' come for');
        if (settled && b.arrows !== (arriving ? 4 : 0)) bad.push(name + ': ' + b.arrows + ' arrows, should be ' + (arriving ? 4 : 0));
        if (name !== 'question' && !b.bleed) bad.push(name + ': the stripes do not run edge to edge');
        if (tag === 'wide' && b.questionLines !== 1) bad.push(name + ': the question takes ' + b.questionLines + ' lines');
        if (name === 'full' && b.colours !== 6) bad.push('full: ' + b.colours + ' colours');
      }
    }
    if (!view.beats.full.whole) bad.push('the end did not run');
    if (view.scrollWidth > view.innerWidth) bad.push('page wider than the screen: ' + view.scrollWidth);
    if (view.errors.length) bad.push('page errors: ' + view.errors[0]);
    bad.length ? bad.forEach(x => fail(v + ' ' + tag + ' ' + x)) : ok(tag + ': fills like 99, the idea holds at every beat, legible, nothing overlapping or cut off');
  }
}
console.log(failures ? failures + ' failure(s)' : 'all good');
process.exit(failures ? 1 : 0);
