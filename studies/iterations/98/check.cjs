// Study 98: Gliitch, the mark opens, steps aside and closes. Pinned here:
//  - case.html is noindex; the logo and the photo are Study 96's art/ files, cut from the 2019 brand guide; every square
//    comes from field.json, read off page 5 of the 2019 video guide by field.py (252 squares, three colours);
//  - public-repo rules: no em dash; no email address or phone number in the page's words; the question on the page once;
//  - the pictures are newer than the page (shoot.mjs writes report.json), and on a wide screen, a phone and a short phone:
//    no picture squished, no line on top of the mark, nothing past the edge, one line at a time, no text under 13px,
//    no page error; and the page does what it says: the question alone and never again; the mark wider than the screen
//    when it is loud; their picture with the whole screen once the mark is in the corner at the guide's size; then
//    exactly three squares and no logo; then every square on screen and the logo back in the middle.
//   node studies/iterations/98/check.cjs
const fs = require('node:fs');
const path = require('node:path');
const here = __dirname;
let failures = 0;
const ok = (m) => console.log('  ok   ' + m);
const fail = (m) => { failures++; console.log('  FAIL ' + m); };
const read = (f) => fs.readFileSync(path.join(here, f), 'utf8');
const ART = '../96/art/';

const html = read('case.html');
/<meta name="robots" content="noindex/.test(html) ? ok('noindex') : fail('case.html has no noindex');
const M = JSON.parse(read(ART + 'meta.json')), F = JSON.parse(read('field.json'));
const used = [...html.matchAll(/<img[^>]*src="([^"]+)"/g)].map(m => m[1]);
const key = (f) => path.basename(f).replace(/\.\w+$/, '');
const untraced = used.filter(f => !f.startsWith(ART) || !M[key(f)] || !M[key(f)].page || !fs.existsSync(path.join(here, f)));
untraced.length ? fail('pictures not traced to a guide page: ' + untraced.join(', ')) : ok(used.length + ' pictures, each cut from the brand guide (pages ' + used.map(f => M[key(f)].page).sort((a, b) => a - b).join(', ') + ')');
const colours = [...new Set(F.squares.map(s => s[3]))].sort();
F.page === 5 && F.squares.length === 252 && colours.length === 3 && fs.existsSync(path.join(here, 'field.py')) ? ok('252 squares in three colours, read off the video guide\'s ending screen (' + colours.join(' ') + ')') : fail('field.json is not the guide\'s ending screen: ' + F.squares.length + ' squares, ' + colours.join(' '));
F.squares.every(s => s[0] >= 0 && s[0] + s[2] <= 1.0001 && s[1] >= 0 && s[2] > 0) ? ok('every square sits inside the field') : fail('a square sits outside the field');

const body = html.replace(/<head>[\s\S]*?<\/head>/, '').replace(/<script[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, ' ');
/—/.test(body) ? fail('an em dash in the page\'s words') : ok('no em dash');
/@|\d{6,}/.test(body) ? fail('an email address or phone number in the page\'s words') : ok('no email address or phone number');
(html.match(/<h1/g) || []).length === 1 ? ok('the question is on the page once') : fail('the question should be on the page once');
ok('words on the page: ' + body.split(/\s+/).filter(Boolean).length);

if (!fs.existsSync(path.join(here, 'report.json'))) fail('no report.json: run shoot.mjs');
else {
  const rep = JSON.parse(read('report.json'));
  const age = (f) => fs.statSync(path.join(here, f)).mtimeMs;
  age('report.json') >= Math.max(age('case.html'), age('field.json'), age(ART + 'meta.json')) ? ok('the pictures are newer than the page') : fail('report.json is older than case.html, field.json or the art: run shoot.mjs');
  for (const tag of ['wide', 'phone', 'short']) {
    const v = rep.views[tag], bad = [];
    if (!v) { fail(tag + ': not shot'); continue; }
    for (const [name, b] of Object.entries(v.beats)) {
      if (b.squish > .01) bad.push(name + ': a picture squished by ' + b.squish);
      if (b.overlaps) bad.push(name + ': a line on top of the mark');
      if (b.out) bad.push(name + ': ' + b.out + ' things past the edge');
      if (b.line.length > 1) bad.push(name + ': two lines at once');
      if (b.small < 13) bad.push(name + ': text at ' + b.small + 'px');
      if (b.question && name !== 'question') bad.push(name + ': the question is still on screen');
    }
    const B = v.beats;
    if (!B.question.question || B.question.squares || B.question.line.length) bad.push('question: should be the question alone');
    if (B.loud.mark < v.innerWidth || B.loud.squares) bad.push('loud: the mark should be wider than the screen (' + B.loud.mark + ' of ' + v.innerWidth + ')');
    if (tag === 'wide' && B.loud.word > v.innerWidth) bad.push('loud: on a wide screen the whole word should fit (' + B.loud.word + ')');
    if (!(B.sweep.mark < B.loud.mark && B.sweep.mark > B.aside.mark && !B.sweep.centred)) bad.push('sweep: the mark should be on its way to the corner');
    if (!B.aside.photoFull) bad.push('aside: their picture should have the whole screen');
    if (Math.abs(B.aside.markShare / M.photo.logo[2] - 1) > .03) bad.push('aside: the mark is ' + B.aside.markShare + ' of the picture\'s width, the guide has ' + M.photo.logo[2]);
    if (B.three.squares !== 3 || B.three.mark > 1 || !B.three.photoFull) bad.push('three: should be their picture, three squares and no logo (' + B.three.squares + ' squares, mark ' + B.three.mark + ')');
    if (!(B.filling.squares > 3 && B.filling.squares < B.filling.onScreen)) bad.push('filling: the squares should be part way');
    if (B.close.squares !== B.close.onScreen || B.close.onScreen < 150) bad.push('close: every square on screen should be up (' + B.close.squares + ' of ' + B.close.onScreen + ')');
    if (!(B.close.mark > 200 && B.close.centred) || B.close.photoFull) bad.push('close: the logo should be back in the middle, their picture gone');
    if (v.scrollWidth > v.innerWidth) bad.push('page wider than the screen: ' + v.scrollWidth);
    if (v.errors.length) bad.push('page errors: ' + v.errors[0]);
    bad.length ? bad.forEach(b => fail(tag + ' ' + b)) : ok(tag + ': the question once, loud, the sweep, aside, three squares, the close; nothing squished, overlapping or cut off');
  }
}
console.log(failures ? failures + ' failure(s)' : 'all good');
process.exit(failures ? 1 : 0);
