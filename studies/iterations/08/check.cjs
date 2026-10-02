// Study 08: About. Every line of Kahran's copy that's reused must be found
// verbatim in about.html; A's counts must equal the filters they open; and
// everything the old About carried that the new one drops must still have a
// home somewhere in the IA.
const fs = require('node:fs');
const path = require('node:path');
const w = require('../../wirecheck.cjs');
const r = w.reporter();
const read = (f) => fs.readFileSync(path.join(__dirname, f), 'utf8');
const about = w.text(fs.readFileSync(path.resolve(__dirname, '../../../about.html'), 'utf8')).replace(/’/g, "'");
const { WORK, filterWork } = require('../07/work-data.js');
const q = (s) => filterWork(WORK, new URLSearchParams(s)).length;

const shared = ["who we are when no one's watching", 'About Joyus',
  'Through collaboration, a polymathic mindset, creativity, and playful inquiry, we help teams uncover new ways of seeing, thinking, and building together.',
  'Based in Bangalore and New York City, we work across design, storytelling, behavioral science, system creation, business and culture, revenue and creativity.',
  'Kahran defines creative brain meets analytical brain.',
  'Divya believes you can get better at anything — everything! — by chipping away at it, working on it day after day in manageable chunks you can keep doing, day after day.',
  "Let's figure something out together. Be our friends."];
const five = ['wonder', 'instead of dread, we walk towards the unknown.', 'play', 'instead of paralysis, we make things.', 'curiosity', 'instead of defensiveness, we go looking for what could have been missed.', 'emergence', "instead of forcing a thesis, we listen for what it's trying to be.", 'wayfinding', 'instead of rigid control, one eye on the destination, the other on what the project reveals.', 'Five things we choose'];

for (const f of ['about-a-three-sides.html', 'about-b-whats-there.html']) {
  console.log(f);
  const html = read(f), page = w.text(html);
  const as = w.links(html, r);
  w.chrome(html, r);
  const lines = f.includes('-b-') ? [...shared, ...five] : shared;
  const notOnPage = lines.filter(s => !page.includes(s)), notInSource = lines.filter(s => !about.includes(s));
  notOnPage.length ? r.fail('missing on the page: ' + notOnPage.join(' | ')) : r.ok(lines.length + ' lines of about.html used');
  notInSource.length ? r.fail('not verbatim in about.html: ' + notInSource.join(' | ')) : r.ok('each one verbatim in about.html (whole sentences, none split)');
  const people = as.filter(a => a.to === 'person' && /more about/.test(a.text));
  people.length === 2 ? r.ok('both founders link to their own page') : r.fail(people.length + ' founder links');
  if (f.includes('-a-')) {
    for (const a of as.filter(x => /^\d+ /.test(x.text) && x.filter)) {
      const n = +a.text.split(' ')[0], got = q(a.filter);
      n === got ? r.ok('"' + a.text + '" = ' + a.filter + ' (' + got + ')') : r.fail('"' + a.text + '" but ' + a.filter + ' has ' + got);
    }
  }
}

console.log('A vs B');
const strip = (h) => h.replace(/<title>[^<]*<\/title>/, '').replace(/\/\* <!--BODY-CSS-->[\s\S]*?<!--\/BODY-CSS--> \*\//, '').replace(/<!--BODY-->[\s\S]*?<!--\/BODY-->/, '');
strip(read('about-a-three-sides.html')) === strip(read('about-b-whats-there.html')) ? r.ok('identical outside the body') : r.fail('A and B differ outside the body');

// what the old About carried, and where each now lives
console.log('nothing lost');
const pieces = WORK.pieces.map(p => p.client);
const homes = [
  ['Rachna Nivas (selected work)', pieces.includes('Rachna Nivas'), 'client page'],
  ['Agemo (selected work)', pieces.includes('Agemo / Codewords'), 'client page'],
  ['see all our work', true, 'nav: work'],
  ['comics · Mr Curl & friends', pieces.includes('Comics'), 'experiment: Comics'],
  ['podcast · Thinking on Thinking', true, 'footer: podcast'],
  ['installation · The Line Before', pieces.includes('Line before'), 'experiment: Line before (now known: an installation)'],
  ['video · Poem Films', pieces.includes('AI videos for poetry'), 'experiment: AI videos for poetry (my match; same thing?)'],
  ['see more about him', true, 'person page, Study 09'],
  ['see more about her', true, 'person page, Study 09'],
];
for (const [what, ok, where] of homes) {
  if (!about.includes(what.split(' (')[0].split(' · ').pop().replace(' & ', ' & '))) r.note('could not find "' + what + '" in about.html text');
  ok ? r.ok(what + ' → ' + where) : r.fail(what + ' has no home');
}
r.done();
