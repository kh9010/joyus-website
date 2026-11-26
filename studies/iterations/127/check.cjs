// Study 127: 126 on white, no lines between the parts, sentence case, in six typefaces for Divya to pick from. Her note on
// 126: "the lines ... dividing the different items ... so shit", "don't ... use this ugly weird color in the background",
// "use a different font". Pinned here:
//  - each page is 126's case with only the ground, the greys, the lines, the case, the typeface and its spacing changed (make.cjs);
//  - Study 99's people, parts, order and words; white ground (Joyus's #FFFFFF), no hairline on any part; noindex;
//  - each page loads and uses its one typeface, and no two pages share one;
//  - 99's grid kept: every cell at 99's x and width, rows never less airy than 99's; nothing overlapping, past the edge, cut
//    off or under 13px; no underline leaving its cell; ink at 4.5:1 and the waiting grey as 99 has it, on wide, phone, short.
//   node studies/iterations/127/check.cjs
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
const was = read('../99/case.html'), G99 = JSON.parse(read('grid99.json'));
const IDS = { space: 'Space Grotesk', bricolage: 'Bricolage Grotesque', instrument: 'Instrument Sans', schibsted: 'Schibsted Grotesk', familjen: 'Familjen Grotesk', dmsans: 'DM Sans' };
const age = (f) => fs.statSync(path.join(here, f)).mtimeMs;
if (!fs.existsSync(path.join(here, 'report.json'))) { fail('no report.json: run shoot.mjs'); process.exit(1); }
const rep = JSON.parse(read('report.json')), used = {};
for (const [id, family] of Object.entries(IDS)) {
  const f = 'f-' + id + '.html', html = read(f), css = html.match(/<style>([\s\S]*?)<\/style>/)[1].replace(/\/\*[\s\S]*?\*\//g, '');
  console.log(id + ' ' + family);
  /<meta name="robots" content="noindex/.test(html) ? ok('noindex') : fail(id + ': no noindex');
  JSON.stringify(dataOf(html)) === JSON.stringify(dataOf(was)) && stageOf(html) === stageOf(was) ? ok('Study 99\'s people, parts, order and words') : fail(id + ': differs from Study 99');
  /--paper:#FFFFFF/.test(css) && !/F4F1EA/i.test(html) ? ok('white ground') : fail(id + ': the ground is not white');
  !/\.t\{[^}]*border-top/.test(css) ? ok('no line between the parts') : fail(id + ': a line between the parts');
  !/text-transform:uppercase;/.test(css) ? ok('sentence case') : fail(id + ': capitals are back');
  const fam = [...new Set([...html.matchAll(/family=([A-Za-z+]+)/g)].map(m => m[1].replace(/\+/g, ' ')))];
  fam.length === 1 && fam[0] === family ? ok('loads one typeface, ' + family) : fail(id + ': loads ' + fam.join(', '));
  age('report.json') >= age(f) ? ok('the pictures are newer than the page') : fail(id + ': report.json older than ' + f + ': run shoot.mjs');
  const page = rep.pages[id];
  if (!page) { fail(id + ': not shot'); continue; }
  for (const [tag, view] of Object.entries(page)) {
    const bad = [], B = G99[tag];
    if (JSON.stringify(view.beats.font) !== JSON.stringify([family]) || !view.beats.loaded) bad.push('uses ' + view.beats.font.join(', ') + (view.beats.loaded ? '' : ', not loaded'));
    used[id] = view.beats.font;
    for (const name of ['third', 'full']) {
      const b = view.beats[name], G = b.geometry;
      if (G.cols !== B.cols || G.width !== B.width || G.left !== B.left || G.gap !== B.gap) bad.push(name + ': the grid is not 99\'s');
      if (!G.cells.every((c, i) => c[0] === B.cells[i][0] && c[2] === B.cells[i][2])) bad.push(name + ': cells moved from 99');
      if (G.row < B.row - .05) bad.push(name + ': rows ' + G.row + 'px, less air than 99\'s ' + B.row);
      if (b.overlaps || b.out || b.clipped.length || b.spill.length) bad.push(name + ': ' + b.overlaps + ' on top, ' + b.out + ' past the edge, cut off ' + b.clipped.join('/') + ', underlines out ' + b.spill.join('/'));
      if (b.small < 13) bad.push(name + ': text at ' + b.small + 'px');
      if (b.litContrast < 4.5 || (b.unlitContrast !== null && b.unlitContrast < (b.largeBold ? 3 : 4.5))) bad.push(name + ': text at ' + b.litContrast + ' / ' + b.unlitContrast + ':1');
    }
    if (view.scrollWidth > view.innerWidth) bad.push('page wider than the screen');
    if (view.errors.length) bad.push('page errors: ' + view.errors[0]);
    bad.length ? bad.forEach(x => fail(id + ' ' + tag + ' ' + x)) : ok(tag + ': 99\'s grid, legible, nothing overlapping or cut off');
  }
}
const all = Object.values(used).flat();
new Set(all).size === all.length && all.length === 6 ? ok('six pages, six typefaces') : fail('typefaces repeat across pages: ' + all.join(', '));
console.log(failures ? failures + ' failure(s)' : 'all good');
process.exit(failures ? 1 : 0);
