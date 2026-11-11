// Study 96: Gliitch, the mark turned down. Pinned here:
//  - case.html is noindex; every picture on it is a file cut from the 2019 brand guide by extract.py (art/meta.json
//    names the guide page each came from), none drawn for this page;
//  - public-repo rules: no em dash; no email address or phone number (the guide's business card page is not used);
//  - the pictures are newer than the page (shoot.mjs writes report.json), and on a wide screen, a phone and a short phone:
//    no picture squished, nothing on top of anything else, nothing past the edge, one line at a time, no text under 13px,
//    no page error; and the page does what it says: the pink covers the whole screen when it is loud, with white words;
//    then the circle alone; then a colour from the guide's eight; then the mark inside someone else's picture, at the
//    size the guide gives it; then the card with no logo at all.
//   node studies/iterations/96/check.cjs
const fs = require('node:fs');
const path = require('node:path');
const here = __dirname;
let failures = 0;
const ok = (m) => console.log('  ok   ' + m);
const fail = (m) => { failures++; console.log('  FAIL ' + m); };
const read = (f) => fs.readFileSync(path.join(here, f), 'utf8');

const html = read('case.html');
/<meta name="robots" content="noindex/.test(html) ? ok('noindex') : fail('case.html has no noindex');
const M = JSON.parse(read('art/meta.json'));
const used = [...html.matchAll(/src="img\/([^"]+)"/g)].map(m => m[1]).concat(Array.from({ length: 8 }, (_, i) => `colour-${i + 1}.svg`));
const untraced = used.filter(f => !M[f.replace(/\.\w+$/, '')] || !M[f.replace(/\.\w+$/, '')].page || !fs.existsSync(path.join(here, 'art', f)));
untraced.length ? fail('pictures not traced to a guide page: ' + untraced.join(', ')) : ok(used.length + ' pictures, each cut from a page of the brand guide (pages ' + [...new Set(used.map(f => M[f.replace(/\.\w+$/, '')].page))].sort((a, b) => a - b).join(', ') + ')');
fs.existsSync(path.join(here, 'extract.py')) ? ok('extract.py, which cuts them, is here') : fail('extract.py missing');

const body = html.replace(/<head>[\s\S]*?<\/head>/, '').replace(/<script[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, ' ').replace(/mailto:hello@joyus\.studio/g, '');
/—/.test(body) ? fail('an em dash in the page\'s words') : ok('no em dash');
/@|\d{6,}/.test(body) ? fail('an email address or phone number on the page') : ok('no email address or phone number');
ok('words on the page: ' + body.split(/\s+/).filter(Boolean).length);

if (!fs.existsSync(path.join(here, 'report.json'))) fail('no report.json: run shoot.mjs');
else {
  const rep = JSON.parse(read('report.json'));
  const age = (f) => fs.statSync(path.join(here, f)).mtimeMs;
  age('report.json') >= Math.max(age('case.html'), age('art/meta.json')) ? ok('the pictures are newer than the page') : fail('report.json is older than case.html or art/meta.json: run shoot.mjs');
  for (const tag of ['wide', 'phone', 'short']) {
    const v = rep.views[tag], bad = [];
    if (!v) { fail(tag + ': not shot'); continue; }
    for (const [name, b] of Object.entries(v.beats)) {
      if (b.squish > .01) bad.push(name + ': a picture squished by ' + b.squish);
      if (b.overlaps) bad.push(name + ': ' + b.overlaps + ' things on top of each other');
      if (b.out) bad.push(name + ': ' + b.out + ' things past the edge');
      if (b.caption.length > 1) bad.push(name + ': two lines at once');
      if (b.small < 13) bad.push(name + ': text at ' + b.small + 'px');
    }
    const B = v.beats, only = (b, id) => b.shown.length === 1 && b.shown[0] === id;
    if (B.question.shown.length || B.question.flooded) bad.push('question: should be the question alone');
    if (!B.loud.flooded || !B.loud.white || !only(B.loud, 'wm')) bad.push('loud: the pink should cover the whole screen, with white words and the wordmark');
    if (B.circle.flooded || !only(B.circle, 'logo') || B.circle.white) bad.push('circle: should be the logo alone on white');
    if (!(B.colour.shown.length === 1 && /^colour-\d\.svg$/.test(B.colour.shown[0]))) bad.push('colour: should be one of the guide\'s eight colours');
    if (B.stop.inPhoto !== true) bad.push('stop: the mark should sit inside the picture');
    else if (Math.abs(B.stop.stopShare / M.photo.logo[2] - 1) > .03) bad.push('stop: the mark is ' + B.stop.stopShare + ' of the picture\'s width, the guide has ' + M.photo.logo[2]);
    if (!only(B.squares, 'card')) bad.push('squares: should be the card alone, no logo');
    if (v.scrollWidth > v.innerWidth) bad.push('page wider than the screen: ' + v.scrollWidth);
    if (v.errors.length) bad.push('page errors: ' + v.errors[0]);
    bad.length ? bad.forEach(b => fail(tag + ' ' + b)) : ok(tag + ': loud, circle, colour, full stop, squares; nothing squished, overlapping, cut off or too small');
  }
}
console.log(failures ? failures + ' failure(s)' : 'all good');
process.exit(failures ? 1 : 0);
