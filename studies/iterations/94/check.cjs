// Study 94: East West Club, one stone that is six. Pinned here:
//  - case.html is noindex and carries the six who / what-fits pairs of Kahran's approved 92 final, word for word, in order;
//  - public-repo rules: no em dash, no figure anywhere in the page's words;
//  - the stones are six, cut from one whole by the live worker (stones.json), grey and colour renders the same size;
//  - the pictures are newer than the page (shoot.mjs writes report.json), and at every beat, wide and phone:
//    no stone squished, nothing on top of anything else, nothing past the edge, no text under 13px, no page error,
//    the stones never drawn bigger than they are in the whole; grey while it is one, all six coloured and named at the end.
//   node studies/iterations/94/check.cjs
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

// the six pairs, from 92 final
const final92 = read('../92/final.html');
const want = [...final92.matchAll(/<span class="who"[^>]*>([\s\S]*?)<\/span>[\s\S]*?<span class="what"[^>]*>([\s\S]*?)<\/span>/g)].map(m => [text(m[1]), text(m[2])]);
const got = [...html.matchAll(/<p class="who"><b>([\s\S]*?)<\/b><span>([\s\S]*?)<\/span><\/p>/g)].map(m => [text(m[1]), text(m[2])]);
want.length === 6 ? ok('92 final has six pairs') : fail('92 final pairs read as ' + want.length);
JSON.stringify(want) === JSON.stringify(got) ? ok('the six pairs are 92 final\'s, word for word, in order') : fail('pairs differ from 92 final:\n   want ' + JSON.stringify(want) + '\n   got  ' + JSON.stringify(got));

// our words
const body = text(html.replace(/<head>[\s\S]*?<\/head>/, '').replace(/<script[\s\S]*?<\/script>/g, ''));
/—/.test(body) ? fail('an em dash in the page\'s words') : ok('no em dash');
/\d/.test(body) ? fail('a figure in the page\'s words: ' + body.match(/\S*\d\S*/)[0]) : ok('no figure in the page\'s words');
ok('words on the page: ' + body.split(/\s+/).filter(Boolean).length);

// the stones
const st = JSON.parse(read('stones.json'));
st.stones.length === 6 ? ok('six stones from one whole (seed ' + st.seed + ')') : fail('stones: ' + st.stones.length);
st.stones.every(s => s.same) ? ok('grey and colour renders lie exactly over each other') : fail('a grey render is a different size from its colour render');
const missing = st.stones.flatMap((s, i) => [`img/s${i + 1}-grey.png`, `img/s${i + 1}-col.png`]).filter(f => !fs.existsSync(path.join(here, f)));
missing.length ? fail('missing ' + missing.join(', ')) : ok('twelve stone pictures exist');

// the page as drawn
if (!fs.existsSync(path.join(here, 'report.json'))) fail('no report.json: run shoot.mjs');
else {
  const rep = JSON.parse(read('report.json'));
  const age = (f) => fs.statSync(path.join(here, f)).mtimeMs;
  age('report.json') >= Math.max(age('case.html'), age('stones.json')) ? ok('the pictures are newer than the page') : fail('report.json is older than case.html or stones.json: run shoot.mjs');
  for (const [tag, v] of Object.entries(rep.views)) {
    const bad = [];
    for (const [name, b] of Object.entries(v.beats)) {
      if (b.squish > .01) bad.push(name + ': a stone squished by ' + b.squish);
      if (b.overlaps) bad.push(name + ': ' + b.overlaps + ' things on top of each other');
      if (b.out) bad.push(name + ': ' + b.out + ' things past the edge');
      if (b.small < 13) bad.push(name + ': text at ' + b.small + 'px');
      if (b.scale > 1) bad.push(name + ': stones drawn bigger than in the whole');
    }
    const B = v.beats;
    if (B.one.stones !== 6 || B.one.coloured !== 0 || B.one.labels !== 0) bad.push('one: should be six grey stones and no names');
    if (B.all.coloured !== 6 || B.all.labels !== 6) bad.push('all: should be six coloured stones, six names');
    if (!(B.first.labels === 1 && B.third.labels === 3)) bad.push('the names should come one at a time');
    if (v.scrollWidth > v.innerWidth) bad.push('page wider than the screen: ' + v.scrollWidth);
    if (v.errors.length) bad.push('page errors: ' + v.errors[0]);
    bad.length ? bad.forEach(b => fail(tag + ' ' + b)) : ok(tag + ': ' + Object.keys(B).length + ' beats, nothing squished, overlapping, cut off or too small');
  }
}
console.log(failures ? failures + ' failure(s)' : 'all good');
process.exit(failures ? 1 : 0);
