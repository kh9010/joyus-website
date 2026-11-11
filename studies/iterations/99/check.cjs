// Study 99: East West Club, nothing goes to waste, designed. Study 95's story and words, unchanged; only the look. Pinned here:
//  - the story is 95's: case.html carries the same people, parts, order, question and lines as 95/case.html;
//  - the six names and what fits them are Kahran's approved 92 final, word for word, in order; every part is a piece of
//    that person's "We give" line in the brand guide and every "instead of" one of their "today" lines (86/personas.json);
//  - Joyus's own design, not the club's: Space Grotesk only, the page white; and after Divya's "all of the above" (too many
//    colours, filled boxes like a dashboard, too loud): no boxes, and one colour on the grid, the yellow highlighter;
//  - public-repo rules: no em dash, no money or percentage, no persona profile line; noindex;
//  - the pictures are newer than the page (shoot.mjs writes report.json), and on a wide screen, a phone and a short phone:
//    nothing on top of anything else, nothing past the edge, no words outside their cell, no text under 13px, no page error;
//    the block fills 0, 0, 4, 4, 12, 20, 24; only whoever just arrived is highlighted; at the end the highlighter passes
//    over the block once and lets go; ink words read at 4.5:1 or better, pale ones at 3:1 (large bold) or 4.5:1.
//   node studies/iterations/99/check.cjs
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

const html = read('case.html'), was = read('../95/case.html');
/<meta name="robots" content="noindex/.test(html) ? ok('noindex') : fail('case.html has no noindex');
const D = dataOf(html);
JSON.stringify(D) === JSON.stringify(dataOf(was)) ? ok('the people, their tiles and the order are Study 95\'s') : fail('the people, tiles or order differ from Study 95');
stageOf(html) === stageOf(was) ? ok('the question, the lines and the close are Study 95\'s, word for word') : fail('the words differ from Study 95:\n   95 ' + stageOf(was) + '\n   99 ' + stageOf(html));

const final92 = read('../92/final.html');
const want = [...final92.matchAll(/<span class="who"[^>]*>([\s\S]*?)<\/span>[\s\S]*?<span class="what"[^>]*>([\s\S]*?)<\/span>/g)].map(m => [text(m[1]), text(m[2])]);
want.length === 6 && JSON.stringify(want) === JSON.stringify(D.people.map(p => [p.name, p.fits])) ? ok('the six names and what fits them are 92 final\'s, word for word, in order') : fail('pairs differ from 92 final');
const guide = JSON.parse(read('../86/personas.json')).personas;
let traced = 0;
for (const p of D.people) {
  const g = guide.find(x => x.name === p.persona);
  if (!g) { fail(p.name + ': no persona "' + p.persona + '" in the guide'); continue; }
  for (const part of p.parts) g.give.toLowerCase().includes(part.toLowerCase()) ? traced++ : fail(p.name + ': "' + part + '" is not in the guide\'s line for ' + p.persona);
  g.wants.some(w => w.today === p.instead) ? traced++ : fail(p.name + ': "instead of ' + p.instead + '" is not one of the guide\'s today lines');
  if (html.includes(g.profile)) fail('a persona profile line is on the page');
}
traced === 30 ? ok('24 tiles and 6 "instead of" lines, all the guide\'s own words') : fail('only ' + traced + ' of 30 guide lines traced');

// Joyus's design
const css = html.match(/<style>([\s\S]*?)<\/style>/)[1];
const families = [...new Set([...html.matchAll(/family=([A-Za-z+]+)/g)].map(m => m[1]))];
families.length === 1 && families[0] === 'Space+Grotesk' && !/serif\b(?!;)/.test(css.replace(/sans-serif/g, '')) ? ok('Space Grotesk only, no serif') : fail('fonts: ' + families.join(', ') + (/serif/.test(css.replace(/sans-serif/g, '')) ? ' and a serif in the CSS' : ''));
/--bg:#fff\b/.test(css) && /#stage\{[^}]*background:var\(--bg\)/.test(css) ? ok('the page is white') : fail('the page is not white');
const rules = css.replace(/\/\*[\s\S]*?\*\//g, '');
!/drop-shadow|box-shadow|::after|::before|border-radius/.test(rules.slice(rules.indexOf('#grid{'), rules.indexOf('.ans{'))) ? ok('no boxes: the grid has no fills, shadows, corners or dots') : fail('a box, a shadow, a corner or a dot is back on the grid');
const hues = [...new Set((rules.slice(rules.indexOf('#grid{'), rules.indexOf('.ans{')).match(/var\(--[a-z-]+\)/g) || []))].sort();
JSON.stringify(hues) === JSON.stringify(['var(--hi)', 'var(--i)', 'var(--ink)', 'var(--off)', 'var(--rule)', 'var(--sans)']) && /--hi:#F2C94A\b/.test(css) && !/#f25aa3|#7d55d4|#2fc0d8|#0E2820|#D4B068/i.test(html) ? ok('one colour on the grid, the yellow; the rest is ink, pale and hairline') : fail('the grid uses ' + hues.join(' '));

const body = text(html.replace(/<head>[\s\S]*?<\/head>/, '').replace(/<script[\s\S]*?<\/script>/g, '')) + ' ' + D.people.map(p => [p.name, p.fits, p.instead, ...p.parts].join(' ')).join(' ');
/—/.test(body) ? fail('an em dash in the page\'s words') : ok('no em dash');
/[$%£€]|\d{2,}/.test(body) ? fail('a figure in the page\'s words') : ok('no money, percentage or count');

if (!fs.existsSync(path.join(here, 'report.json'))) fail('no report.json: run shoot.mjs');
else {
  const rep = JSON.parse(read('report.json'));
  const age = (f) => fs.statSync(path.join(here, f)).mtimeMs;
  age('report.json') >= age('case.html') ? ok('the pictures are newer than the page') : fail('report.json is older than case.html: run shoot.mjs');
  const FILL = { question: 0, offer: 0, one: 4, empty: 4, third: 12, fifth: 20, pass: 24, full: 24 };
  for (const tag of ['wide', 'phone', 'short']) {
    const v = rep.views[tag], bad = [];
    if (!v) { fail(tag + ': not shot'); continue; }
    for (const [name, b] of Object.entries(v.beats)) {
      if (b.overlaps) bad.push(name + ': ' + b.overlaps + ' things on top of each other');
      if (b.out) bad.push(name + ': ' + b.out + ' things past the edge');
      if (b.clipped.length) bad.push(name + ': words outside their cell in ' + b.clipped.join(' / '));
      if (b.small < 13) bad.push(name + ': text at ' + b.small + 'px');
      if (b.lit !== FILL[name]) bad.push(name + ': ' + b.lit + ' parts in ink, should be ' + FILL[name]);
      if (b.caption.length > 1) bad.push(name + ': two captions at once');
      if (b.boxed) bad.push(name + ': ' + b.boxed + ' cells have a fill, a shadow or a side border');
      if (b.litContrast !== null && b.litContrast < 4.5) bad.push(name + ': ink words at ' + b.litContrast + ':1');
      // the pale words are "off", but still have to be readable: 3:1 when the type is large and bold, 4.5:1 otherwise
      if (b.unlitContrast !== null && b.unlitContrast < (b.largeBold ? 3 : 4.5)) bad.push(name + ': pale words at ' + b.unlitContrast + ':1 at ' + b.type + 'px');
    }
    const B = v.beats;
    if (B.one.caption[0] !== 'The joiner' || B.one.now !== 4 || B.one.banded !== 4) bad.push('one: the first person\'s four parts should be in ink and highlighted');
    if (B.empty.banded !== 0 || B.third.banded !== 4 || B.fifth.banded !== 4) bad.push('only whoever just arrived should be highlighted (' + [B.empty.banded, B.third.banded, B.fifth.banded].join(', ') + ')');
    if (!B.pass.whole || B.pass.banded < 1 || B.pass.banded > 16) bad.push('pass: the highlighter should be part way across the block (' + B.pass.banded + ' of 24)');
    if (!B.full.whole || B.full.banded !== 0) bad.push('full: all in ink, the highlighter gone (' + B.full.banded + ' still highlighted)');
    if (v.scrollWidth > v.innerWidth) bad.push('page wider than the screen: ' + v.scrollWidth);
    if (v.errors.length) bad.push('page errors: ' + v.errors[0]);
    bad.length ? bad.forEach(b => fail(tag + ' ' + b)) : ok(tag + ': fills 0 to 24, only the arrival highlighted, one pass at the end then all ink, legible, nothing overlapping or cut off');
  }
}
console.log(failures ? failures + ' failure(s)' : 'all good');
process.exit(failures ? 1 : 0);
