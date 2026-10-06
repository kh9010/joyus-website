// Study 20: font and depth. Fails if
//  - the page test failed, ran short, or is older than the page, builder,
//    masks or looks;
//  - a font didn't load when its mask was drawn;
//  - the bulge fix no longer holds (legible-fix.json), or the pick on the
//    page isn't what the scores say (legible-all.json);
//  - the scores printed on the study page don't match the measured ones;
//  - the copied brand-lab geometry changed.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const r = require('../../wirecheck.cjs').reporter();
const here = __dirname;
const read = (f) => JSON.parse(fs.readFileSync(path.join(here, f), 'utf8'));

const rep = read('page-report.json');
const h = crypto.createHash('sha256');
for (const f of ['coming-soon.html', 'jbuilder.js', ...fs.readdirSync(path.join(here, 'masks')).filter(f => f.endsWith('.png')).sort().map(f => 'masks/' + f), ...fs.readdirSync(path.join(here, 'looks')).sort().map(f => 'looks/' + f)]) h.update(fs.readFileSync(path.join(here, f)));
rep.hash === h.digest('hex') ? r.ok('page-report.json is current (' + rep.when + ')') : r.fail('page-report.json is stale: re-run page-test.mjs');
const bad = rep.tests.filter(t => !t.pass);
bad.length ? bad.forEach(t => r.fail(t.name + ' (' + t.detail + ')')) : r.ok(rep.tests.length + ' browser checks pass');
rep.tests.length >= 44 ? r.ok('the whole test ran') : r.fail('only ' + rep.tests.length + ' checks ran');

const masks = read('masks/masks.json');
Object.entries(masks).every(([, m]) => m.loaded) ? r.ok(Object.keys(masks).length + ' fonts loaded when drawn') : r.fail('a font did not load: ' + JSON.stringify(masks));

const fix = read('legible-fix.json');
const [before, after] = fix;
before.fixGlyph === false && before.spill > 0.3 && after.spill < 0.01 ? r.ok(`bulge fix: spill ${before.spill} → ${after.spill}`) : r.fail('bulge fix does not hold: ' + JSON.stringify(fix));

const all = read('legible-all.json');
const best = all.filter(x => x.font !== 'caveat').sort((a, b) => b.iou - a.iou)[0];
best.font === 'unbounded' && best.layer === false ? r.ok(`best measured: ${best.font} 3D (${best.iou})`) : r.fail(`best measured is ${best.font} ${best.layer ? '2D' : '3D'}, not the pick`);
const page = fs.readFileSync(path.join(here, 'index.html'), 'utf8');
let mismatch = 0;
for (const x of all.filter(x => x.cells === 25 && x.font !== 'caveat')) {
  const label = `fig-${x.font}-${x.layer ? '2d' : '3d'}.png`;
  const m = page.match(new RegExp(label.replace(/[.]/g, '\\.') + '"[^>]*>(?:</a>)?<figcaption class="s">(?:<b>)?([0-9.]+)'));
  if (!m || Math.abs(+m[1] - x.iou) > 0.006) { mismatch++; r.fail(`${label}: page says ${m && m[1]}, measured ${x.iou}`); }
}
if (!mismatch) r.ok('the 12 scores on the page match the measurements');

const geo = crypto.createHash('sha256').update(fs.readFileSync(path.join(here, 'bake/solid-geometry.js'))).digest('hex');
geo === 'fb32489014e44c10dafdc70fd81747d67b7cae7cde467997a602abd3b4ec75cc' ? r.ok('bake/solid-geometry.js matches brand-lab @ 5d4a8f7 (the fix lives in jbuilder.js)') : r.fail('bake/solid-geometry.js differs from brand-lab @ 5d4a8f7');
r.done();
