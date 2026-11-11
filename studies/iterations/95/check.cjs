// Study 95: East West Club, nothing goes to waste. Pinned here:
//  - case.html is noindex; the six names and what fits them are Kahran's approved 92 final, word for word, in order;
//  - every tile is the brand guide's own words: a piece of that person's "We give" line (86/personas.json), and every
//    "instead of" is one of that person's "today" lines, as written; four tiles a person, 24 in all, each used once;
//  - public-repo rules: no em dash, no money or percentage, no persona profile line;
//  - the pictures are newer than the page (shoot.mjs writes report.json), and at every beat, on a wide screen, a phone
//    and a short phone: nothing on top of anything else, nothing past the edge, no tile's words cut off, no text
//    under 13px, no page error; the block fills 0, 0, 4, 4, 12, 20, 24.
//   node studies/iterations/95/check.cjs
const fs = require('node:fs');
const path = require('node:path');
const here = __dirname;
let failures = 0;
const ok = (m) => console.log('  ok   ' + m);
const fail = (m) => { failures++; console.log('  FAIL ' + m); };
const read = (f) => fs.readFileSync(path.join(here, f), 'utf8');
const text = (h) => h.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').trim();

const html = read('case.html');
/<meta name="robots" content="noindex/.test(html) ? ok('noindex') : fail('case.html has no noindex');
const D = JSON.parse(html.match(/<script type="application\/json" id="data">([\s\S]*?)<\/script>/)[1]);

const final92 = read('../92/final.html');
const want = [...final92.matchAll(/<span class="who"[^>]*>([\s\S]*?)<\/span>[\s\S]*?<span class="what"[^>]*>([\s\S]*?)<\/span>/g)].map(m => [text(m[1]), text(m[2])]);
const got = D.people.map(p => [p.name, p.fits]);
want.length === 6 && JSON.stringify(want) === JSON.stringify(got) ? ok('the six names and what fits them are 92 final\'s, word for word, in order') : fail('pairs differ from 92 final:\n   want ' + JSON.stringify(want) + '\n   got  ' + JSON.stringify(got));

const guide = JSON.parse(read('../86/personas.json')).personas;
let traced = 0;
for (const p of D.people) {
  const g = guide.find(x => x.name === p.persona);
  if (!g) { fail(p.name + ': no persona "' + p.persona + '" in the guide'); continue; }
  if (p.parts.length !== 4) fail(p.name + ' has ' + p.parts.length + ' tiles, not four');
  for (const part of p.parts) g.give.toLowerCase().includes(part.toLowerCase()) ? traced++ : fail(p.name + ': "' + part + '" is not in the guide\'s line for ' + p.persona);
  g.wants.some(w => w.today === p.instead) ? traced++ : fail(p.name + ': "instead of ' + p.instead + '" is not one of the guide\'s today lines');
  if (html.includes(g.profile)) fail('a persona profile line is on the page');
}
traced === 30 ? ok('24 tiles and 6 "instead of" lines, all the guide\'s own words') : fail('only ' + traced + ' of 30 guide lines traced');
const counts = [0, 0, 0, 0, 0, 0]; D.order.forEach(k => counts[k]++);
D.order.length === 24 && counts.every(c => c === 4) ? ok('24 tiles, four a person, each used once') : fail('tile order: ' + counts.join(','));

const body = text(html.replace(/<head>[\s\S]*?<\/head>/, '').replace(/<script[\s\S]*?<\/script>/g, '')) + ' ' + D.people.map(p => [p.name, p.fits, p.instead, ...p.parts].join(' ')).join(' ');
/—/.test(body) ? fail('an em dash in the page\'s words') : ok('no em dash');
/[$%£€]|\d{2,}/.test(body) ? fail('a figure in the page\'s words: ' + body.match(/\S*([$%£€]|\d{2,})\S*/)[0]) : ok('no money, percentage or count');
ok('words a reader can meet: ' + body.split(/\s+/).filter(Boolean).length);

if (!fs.existsSync(path.join(here, 'report.json'))) fail('no report.json: run shoot.mjs');
else {
  const rep = JSON.parse(read('report.json'));
  const age = (f) => fs.statSync(path.join(here, f)).mtimeMs;
  age('report.json') >= age('case.html') ? ok('the pictures are newer than the page') : fail('report.json is older than case.html: run shoot.mjs');
  const FILL = { question: 0, offer: 0, one: 4, empty: 4, third: 12, fifth: 20, full: 24 };
  for (const tag of ['wide', 'phone', 'short']) {
    const v = rep.views[tag], bad = [];
    if (!v) { fail(tag + ': not shot'); continue; }
    for (const [name, b] of Object.entries(v.beats)) {
      if (b.overlaps) bad.push(name + ': ' + b.overlaps + ' things on top of each other');
      if (b.out) bad.push(name + ': ' + b.out + ' things past the edge');
      if (b.clipped.length) bad.push(name + ': words cut off in ' + b.clipped.join(' / '));
      if (b.small < 13) bad.push(name + ': text at ' + b.small + 'px');
      if (b.lit !== FILL[name]) bad.push(name + ': ' + b.lit + ' tiles lit, should be ' + FILL[name]);
      if (b.caption.length > 1) bad.push(name + ': two captions at once');
    }
    if (v.beats.one.caption[0] !== 'The joiner' || v.beats.one.now !== 4) bad.push('one: the first person and their four tiles should be marked');
    if (v.scrollWidth > v.innerWidth) bad.push('page wider than the screen: ' + v.scrollWidth);
    if (v.errors.length) bad.push('page errors: ' + v.errors[0]);
    bad.length ? bad.forEach(b => fail(tag + ' ' + b)) : ok(tag + ': 7 beats, fills 0 to 24, nothing overlapping, cut off or too small');
  }
}
console.log(failures ? failures + ' failure(s)' : 'all good');
process.exit(failures ? 1 : 0);
