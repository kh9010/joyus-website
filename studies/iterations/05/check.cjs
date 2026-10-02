// Study 05: the experiment page. Adds one page type to Study 03, "external"
// (a live build, a Steam page): Study 03 had no type for leaving the site.
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const w = require('../../wirecheck.cjs');
const r = w.reporter();
const read = (f) => fs.readFileSync(path.join(__dirname, f), 'utf8');
const EXTRA = ['external'];
const pieces = w.rev4Pieces();
const exps = pieces.filter(p => p.pillId === 'exp');
const me = exps.find(p => p.client === 'Metro Museum of the Forgotten');
const nxt = exps[(exps.indexOf(me) + 1) % exps.length];
const words = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];

const dates = {};
for (const f of ['exp-a-like-piece.html', 'exp-b-thing-first.html']) {
  console.log(f);
  const html = read(f);
  const as = w.links(html, r, EXTRA);
  w.chrome(html, r);
  const h1 = w.text((html.match(/<h1>([\s\S]*?)<\/h1>/) || [])[1] || '');
  h1 === me.sentence ? r.ok('headline is the homepage sentence, unchanged') : r.fail('headline differs from rev4');
  const miss = me.tags.filter(t => !as.some(a => a.to === 'work-index' && a.text === t && (a.filter || '').startsWith('tag=')));
  miss.length ? r.fail('tags missing: ' + miss.join(', ')) : r.ok(me.tags.length + ' tags link to their filters');
  // no client: nothing on an experiment page may point at a client page
  as.some(a => a.to === 'client') ? r.fail('an experiment page links to a client page') : r.ok('no client link (experiments are "for ourselves")');
  const nextA = as.find(a => a.next);
  nextA && nextA.next === nxt.client + ' · ' + nxt.piece && nextA.text.includes(nxt.sentence) && nextA.to === 'experiment' ? r.ok('next = ' + nextA.next + ' (an experiment page)') : r.fail('next should be the experiment ' + nxt.client);
  const all = as.find(a => /^All \w+ experiments/.test(a.text));
  all && all.text.includes(words[exps.length]) && all.filter === 'pill=exp' ? r.ok('"All ' + words[exps.length] + ' experiments" matches the data and filters to the pill') : r.fail('"All N experiments" link wrong; data has ' + exps.length);
  dates[f] = [...html.matchAll(/(\d{1,2} \w{3} 2026)</g)].map(m => m[1]).filter((d, i, arr) => arr.indexOf(d) === i || true);
}

console.log('A vs B');
const strip = (h) => h.replace(/<style>[\s\S]*?<\/style>/, '').replace(/<title>[^<]*<\/title>/, '').replace(/<!--BODY-->[\s\S]*?<!--\/BODY-->/, '');
strip(read('exp-a-like-piece.html')) === strip(read('exp-b-thing-first.html')) ? r.ok('identical outside the body') : r.fail('A and B differ outside the body');
const body = (f) => (read(f).match(/<!--BODY-->([\s\S]*?)<!--\/BODY-->/) || [])[1] || '';
const rd = (f) => [...body(f).matchAll(/(\d{1,2} \w{3} 2026)</g)].map(m => m[1]);
const da = rd('exp-a-like-piece.html'), db = rd('exp-b-thing-first.html');
da.join() === db.join() ? r.ok('both tell the same ' + da.length + ' rounds, same dates, same order') : r.fail('rounds differ: A ' + da.join(', ') + ' / B ' + db.join(', '));
const t = da.map(d => Date.parse(d));
t.every((x, i) => i === 0 || x >= t[i - 1]) ? r.ok('oldest first') : r.fail('rounds out of order');

// provenance: every round date is a day something was committed to the project
console.log('provenance');
const base = path.resolve(__dirname, '../../../../delhi_metro_scraper_project');
const logDates = new Set();
for (const repo of ['metro-museum', 'metro-museum-unity']) {
  const g = spawnSync('git', ['-C', path.join(base, repo), 'log', '--format=%ad', '--date=short'], { encoding: 'utf8' });
  if (g.status === 0) g.stdout.split('\n').filter(Boolean).forEach(d => logDates.add(d));
}
if (!logDates.size) r.note('metro-museum repos not found on this machine; provenance skipped');
else {
  const iso = (d) => new Date(Date.parse(d + ' UTC')).toISOString().slice(0, 10);
  const unbacked = da.filter(d => !logDates.has(iso(d)));
  unbacked.length ? r.fail('round dates with no commit that day: ' + unbacked.join(', ')) : r.ok(da.length + ' round dates each match a commit day in metro-museum / metro-museum-unity');
}
r.done();
