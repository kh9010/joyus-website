// Study 24: sign on the ground (no stand). Fails if the page test failed, ran
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
const leg = read('legible-fonts.json');
leg.every(x => x.iou >= 0.75) ? r.ok(leg.length + ' fonts score ≥ 0.75 (Study 23)') : r.fail('a font scores below 0.75');
const page = fs.readFileSync(path.join(here, 'coming-soon.html'), 'utf8');
/buildStand\(/.test(page) ? r.fail('the stand is back') : r.ok('no stand');
rep.tests.filter(t => /the sign stands on the floor/.test(t.name) && t.pass).length === 5 ? r.ok('the sign rests on the floor in all five looks') : r.fail('sign not on the floor in every look');
rep.tests.filter(t => /nothing on the floor overlaps a fallen stone/.test(t.name) && t.pass).length === 5 ? r.ok('the sign clears the fallen stones in all five looks') : r.fail('sign overlaps a fallen stone');
const geo = crypto.createHash('sha256').update(fs.readFileSync(path.join(here, 'bake/solid-geometry.js'))).digest('hex');
geo === 'fb32489014e44c10dafdc70fd81747d67b7cae7cde467997a602abd3b4ec75cc' ? r.ok('bake/solid-geometry.js matches brand-lab @ 5d4a8f7') : r.fail('bake/solid-geometry.js differs from brand-lab @ 5d4a8f7');
r.done();
