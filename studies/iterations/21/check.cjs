// Study 21: road works. Fails if the page test failed, ran short, or is
// older than the page, the site, the builder, the masks or the looks; or the
// copied brand-lab geometry changed.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const r = require('../../wirecheck.cjs').reporter();
const here = __dirname;
const rep = JSON.parse(fs.readFileSync(path.join(here, 'page-report.json'), 'utf8'));
const h = crypto.createHash('sha256');
for (const f of ['coming-soon.html', 'jbuilder.js', 'site.js', ...fs.readdirSync(path.join(here, 'masks')).filter(f => f.endsWith('.png')).sort().map(f => 'masks/' + f), ...fs.readdirSync(path.join(here, 'looks')).sort().map(f => 'looks/' + f)]) h.update(fs.readFileSync(path.join(here, f)));
rep.hash === h.digest('hex') ? r.ok('page-report.json is current (' + rep.when + ')') : r.fail('page-report.json is stale: re-run page-test.mjs');
const bad = rep.tests.filter(t => !t.pass);
bad.length ? bad.forEach(t => r.fail(t.name + ' (' + t.detail + ')')) : r.ok(rep.tests.length + ' browser checks pass');
rep.tests.length >= 48 ? r.ok('the whole test ran') : r.fail('only ' + rep.tests.length + ' checks ran');
rep.tests.filter(t => /sign and 2 cones/.test(t.name)).length === 5 ? r.ok('the site was checked in all five looks') : r.fail('site not checked in every look');
fs.existsSync(path.join(here, 'img', 'page-random-' + rep.randomSeed + '.png')) ? r.ok('random-visit screenshot is this run\'s') : r.fail('no screenshot for random seed ' + rep.randomSeed);
const geo = crypto.createHash('sha256').update(fs.readFileSync(path.join(here, 'bake/solid-geometry.js'))).digest('hex');
geo === 'fb32489014e44c10dafdc70fd81747d67b7cae7cde467997a602abd3b4ec75cc' ? r.ok('bake/solid-geometry.js matches brand-lab @ 5d4a8f7') : r.fail('bake/solid-geometry.js differs from brand-lab @ 5d4a8f7');
r.done();
