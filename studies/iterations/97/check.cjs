// Study 97: Gliitch, the question asked once. Pinned here:
//  - case.html is noindex; every picture on it is one of Study 96's art/ files, cut from the 2019 brand guide by
//    96/extract.py (meta.json names the guide page each came from), none drawn for this page;
//  - public-repo rules: no em dash; no email address or phone number;
//  - the pictures are newer than the page (shoot.mjs writes report.json), and on a wide screen, a phone and a short phone:
//    no picture squished, nothing on top of anything else, nothing past the edge, one line at a time, no text under 13px,
//    no page error; and the page does what it says: the question alone, and never again after the pink takes it;
//    the pink over the whole screen; the circle alone; the guide's eight colours; someone else's picture filling the
//    whole screen with the mark at the size the guide gives it; then the card with no logo at all.
//   node studies/iterations/97/check.cjs
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
const M = JSON.parse(read(ART + 'meta.json'));
const used = [...html.matchAll(/<img[^>]*src="([^"]+)"/g)].map(m => m[1]).concat(Array.from({ length: 8 }, (_, i) => `${ART}colour-${i + 1}.svg`));
const key = (f) => path.basename(f).replace(/\.\w+$/, '');
const untraced = used.filter(f => !f.startsWith(ART) || !M[key(f)] || !M[key(f)].page || !fs.existsSync(path.join(here, f)));
untraced.length ? fail('pictures not traced to a guide page: ' + untraced.join(', ')) : ok(used.length + ' pictures, each cut from a page of the brand guide (pages ' + [...new Set(used.map(f => M[key(f)].page))].sort((a, b) => a - b).join(', ') + ')');

const body = html.replace(/<head>[\s\S]*?<\/head>/, '').replace(/<script[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, ' ');
/—/.test(body) ? fail('an em dash in the page\'s words') : ok('no em dash');
/@|\d{6,}/.test(body) ? fail('an email address or phone number in the page\'s words') : ok('no email address or phone number');
(html.match(/<h1/g) || []).length === 1 ? ok('the question is on the page once') : fail('the question should be on the page once');
ok('words on the page: ' + body.split(/\s+/).filter(Boolean).length);

if (!fs.existsSync(path.join(here, 'report.json'))) fail('no report.json: run shoot.mjs');
else {
  const rep = JSON.parse(read('report.json'));
  const age = (f) => fs.statSync(path.join(here, f)).mtimeMs;
  age('report.json') >= Math.max(age('case.html'), age(ART + 'meta.json')) ? ok('the pictures are newer than the page') : fail('report.json is older than case.html or the art: run shoot.mjs');
  for (const tag of ['wide', 'phone', 'short']) {
    const v = rep.views[tag], bad = [];
    if (!v) { fail(tag + ': not shot'); continue; }
    for (const [name, b] of Object.entries(v.beats)) {
      if (b.squish > .01) bad.push(name + ': a picture squished by ' + b.squish);
      if (b.overlaps) bad.push(name + ': ' + b.overlaps + ' things on top of each other');
      if (b.out) bad.push(name + ': ' + b.out + ' things past the edge');
      if (b.line.length > 1) bad.push(name + ': two lines at once');
      if (b.small < 13) bad.push(name + ': text at ' + b.small + 'px');
      if (b.question && name !== 'question') bad.push(name + ': the question is still on screen');
    }
    const B = v.beats, only = (b, id) => b.shown.length === 1 && b.shown[0] === id;
    if (!B.question.question || B.question.shown.length || B.question.line.length) bad.push('question: should be the question alone');
    if (!B.loud.flooded || !only(B.loud, 'wm')) bad.push('loud: the pink should cover the whole screen, with the wordmark');
    if (B.circle.flooded || !only(B.circle, 'logo')) bad.push('circle: should be the logo alone on white');
    if (!(B.eight.shown.length === 8 && B.eight.shown.every(s => /^colour-\d\.svg$/.test(s)))) bad.push('eight: should be the guide\'s eight colours');
    if (!B.stop.photoFull) bad.push('stop: their picture should fill the whole screen');
    else if (!B.stop.stopShare || Math.abs(B.stop.stopShare / M.photo.logo[2] - 1) > .03) bad.push('stop: the mark is ' + B.stop.stopShare + ' of the picture\'s width, the guide has ' + M.photo.logo[2]);
    if (!only(B.squares, 'card')) bad.push('squares: should be the card alone, no logo');
    if (v.scrollWidth > v.innerWidth) bad.push('page wider than the screen: ' + v.scrollWidth);
    if (v.errors.length) bad.push('page errors: ' + v.errors[0]);
    bad.length ? bad.forEach(b => fail(tag + ' ' + b)) : ok(tag + ': the question once, loud, circle, eight colours, full stop, squares; nothing squished, overlapping or cut off');
  }
}
console.log(failures ? failures + ' failure(s)' : 'all good');
process.exit(failures ? 1 : 0);
