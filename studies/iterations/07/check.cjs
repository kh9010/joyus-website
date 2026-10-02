// Study 07: the work index. The data file is regenerated from rev4 + Study 03
// and compared; the filter is run for every pill and every tag; each variant's
// own render() is executed and its output checked.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const w = require('../../wirecheck.cjs');
const r = w.reporter();
const read = (f) => fs.readFileSync(path.join(__dirname, f), 'utf8');
const { WORK, filterWork, slug } = require('./work-data.js');
const rev4 = w.rev4Pieces();
const q = (s) => filterWork(WORK, new URLSearchParams(s));

console.log('data');
const same = rev4.length === WORK.pieces.length && rev4.every((p, i) => {
  const d = WORK.pieces[i];
  return d.client === p.client && d.piece === p.piece && d.pill === p.pillId && d.s === p.sentence && d.tags.join() === p.tags.join();
});
same ? r.ok(WORK.pieces.length + ' pieces equal rev4, in rotation order, sentence and tags included') : r.fail('work-data.js has drifted from rev4');
const short = (c) => c.split(' / ')[0];
const per = {};
rev4.filter(p => p.pillId !== 'exp').forEach(p => per[short(p.client)] = (per[short(p.client)] || 0) + 1);
const ruleOk = WORK.pieces.every(d => d.clientPage === (d.pill !== 'exp' && per[short(d.client)] >= 2));
ruleOk ? r.ok('clientPage follows Study 06\'s rule (2+ pieces)') : r.fail('clientPage flags disagree with the rule');
WORK.pieces.every(d => d.to === (d.pill === 'exp' ? 'experiment' : 'piece')) ? r.ok('experiments go to experiment pages, the rest to piece pages') : r.fail('destination types wrong');

console.log('filter');
for (const p of WORK.pills) {
  const n = q('pill=' + p.id).length, want = rev4.filter(x => x.pillId === p.id).length;
  n === want ? r.ok('pill=' + p.id + ' → ' + n) : r.fail('pill=' + p.id + ' gives ' + n + ', rev4 has ' + want);
}
const tags = [...new Set(rev4.flatMap(p => p.tags))];
const badTags = tags.filter(t => q('tag=' + slug(t)).length !== rev4.filter(p => p.tags.includes(t)).length);
badTags.length ? r.fail('tag filters wrong: ' + badTags.join(', ')) : r.ok('all ' + tags.length + ' tags filter to exactly the pieces carrying them');
const slugs = tags.map(slug);
new Set(slugs).size === slugs.length ? r.ok('no two tags share a slug') : r.fail('tag slugs collide');
q('tag=nothing-here').length === 0 ? r.ok('unknown tag → 0 (the page shows its empty state)') : r.fail('unknown tag returned rows');
q('pill=strategy&tag=client-work').length === rev4.filter(p => p.pillId === 'strategy' && p.tags.includes('client work')).length ? r.ok('pill and tag combine') : r.fail('pill+tag combination wrong');

const ctx = (html) => { const c = { WORK, slug, Object }; vm.createContext(c); vm.runInContext((html.match(/<script id="render">([\s\S]*?)<\/script>/) || [])[1], c); return c; };
for (const f of ['work-a-cards.html', 'work-b-index.html']) {
  console.log(f);
  const html = read(f);
  // the static page only: render()'s template strings are checked by running it, below
  w.links(html.replace(/<script[\s\S]*?<\/script>/g, ''), r);
  w.chrome(html, r);
  const pills = [...html.matchAll(/<a class="pill"[^>]*data-filter="([^"]*)"/g)].map(m => m[1]);
  pills.join('|') === ['', ...WORK.pills.map(p => 'pill=' + p.id)].join('|') ? r.ok('filter row: All + the five pills, homepage order') : r.fail('filter row ' + pills.join(','));
  const out = ctx(html).render(WORK.pieces);
  const as = w.links(out, r);
  const pieceLinks = as.filter(a => a.to === 'piece' || a.to === 'experiment');
  const live = WORK.pieces.filter(p => !p.soon).length;
  pieceLinks.length === live ? r.ok(live + ' pieces link to their page; ' + (WORK.pieces.length - live) + ' "soon" piece is listed but not linked') : r.fail(pieceLinks.length + ' piece links, expected ' + live);
  if (f.startsWith('work-a')) {
    // the card is the link: nothing inside it may be a link
    const nested = [...out.matchAll(/<a class="card"[\s\S]*?<\/a>/g)].filter(m => /<a\b/.test(m[0].slice(2)));
    nested.length ? r.fail(nested.length + ' cards contain a link inside the card link') : r.ok('no link inside a card link');
    as.some(a => a.to === 'client') ? r.fail('A links to a client page from inside a card') : r.ok('no client or tag links (they would sit inside the card)');
  } else {
    const clientLinks = as.filter(a => a.to === 'client').length, want = WORK.pieces.filter(p => p.clientPage).length;
    clientLinks === want ? r.ok(clientLinks + ' client links, only for clients with a page') : r.fail(clientLinks + ' client links, expected ' + want);
    const tagLinks = as.filter(a => (a.filter || '').startsWith('tag=')).length, wantT = WORK.pieces.reduce((n, p) => n + p.tags.filter(t => t !== 'soon').length, 0);
    tagLinks === wantT ? r.ok(tagLinks + ' tag links: every tag on every row') : r.fail(tagLinks + ' tag links, expected ' + wantT);
  }
}

console.log('A vs B');
const strip = (h) => h.replace(/<title>[^<]*<\/title>/, '').replace(/\/\* <!--LIST-CSS-->[\s\S]*?<!--\/LIST-CSS--> \*\//, '').replace(/<script id="render">[\s\S]*?<\/script>/, '');
strip(read('work-a-cards.html')) === strip(read('work-b-index.html')) ? r.ok('identical outside the list CSS and render()') : r.fail('A and B differ outside the list');
r.done();
