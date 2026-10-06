// Study 23: smaller sign, more fonts. Fails if the page test failed, ran
// short or is stale; a font didn't load or scores below 0.75 (Study 20's
// legibility test); a score on the study page doesn't match; Print stopped
// screening the sign's ink; or the copied brand-lab geometry changed.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const r = require('../../wirecheck.cjs').reporter();
const here = __dirname;
const read = (f) => JSON.parse(fs.readFileSync(path.join(here, f), 'utf8'));
const rep = read('page-report.json');
const h = crypto.createHash('sha256');
for (const f of ['coming-soon.html', 'jbuilder.js', 'site.js', ...fs.readdirSync(path.join(here, 'masks')).filter(f => f.endsWith('.png')).sort().map(f => 'masks/' + f), ...fs.readdirSync(path.join(here, 'looks')).sort().map(f => 'looks/' + f)]) h.update(fs.readFileSync(path.join(here, f)));
rep.hash === h.digest('hex') ? r.ok('page-report.json is current (' + rep.when + ')') : r.fail('page-report.json is stale: re-run page-test.mjs');
const bad = rep.tests.filter(t => !t.pass);
bad.length ? bad.forEach(t => r.fail(t.name + ' (' + t.detail + ')')) : r.ok(rep.tests.length + ' browser checks pass');
rep.tests.length >= 54 ? r.ok('the whole test ran') : r.fail('only ' + rep.tests.length + ' checks ran');
rep.tests.some(t => t.name === 'print: the sign\'s drawn ink is screened' && t.pass) ? r.ok('Print screens the sign\'s ink') : r.fail('Print does not screen the sign\'s ink');
const masks = read('masks/masks.json');
Object.values(masks).every(m => m.loaded) ? r.ok(Object.keys(masks).length + ' fonts loaded when drawn') : r.fail('a font did not load');
const leg = read('legible-fonts.json'), page = fs.readFileSync(path.join(here, 'index.html'), 'utf8');
let off = 0;
for (const x of leg) {
  if (x.iou < 0.75) { off++; r.fail(`${x.font} scores ${x.iou}`); }
  const m = page.match(new RegExp('fig-font-' + x.font + '\.png"[^>]*></a><figcaption>[^<]*<span class="s">· ([0-9.]+)'));
  if (!m || Math.abs(+m[1] - x.iou) > 0.006) { off++; r.fail(`${x.font}: page says ${m && m[1]}, measured ${x.iou}`); }
}
if (!off) r.ok(`${leg.length} fonts score ≥ 0.75, and the page shows the measured scores`);
const geo = crypto.createHash('sha256').update(fs.readFileSync(path.join(here, 'bake/solid-geometry.js'))).digest('hex');
geo === 'fb32489014e44c10dafdc70fd81747d67b7cae7cde467997a602abd3b4ec75cc' ? r.ok('bake/solid-geometry.js matches brand-lab @ 5d4a8f7') : r.fail('bake/solid-geometry.js differs from brand-lab @ 5d4a8f7');
r.done();
