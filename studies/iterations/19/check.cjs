// Study 19: the construction site. Fails if
//  - the page test failed, ran short, or is older than the page, the
//    builder, the mask or the looks;
//  - the live builder no longer makes Study 18's J (equiv.json), or its
//    occlusion drifted from the ray-cast one;
//  - random seeds stopped being reliable (seeds.json);
//  - the copied brand-lab geometry changed.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const r = require('../../wirecheck.cjs').reporter();
const here = __dirname;
const read = (f) => JSON.parse(fs.readFileSync(path.join(here, f), 'utf8'));

const rep = read('page-report.json');
const h = crypto.createHash('sha256');
for (const f of ['coming-soon.html', 'jbuilder.js', 'j-mask.png', ...fs.readdirSync(path.join(here, 'looks')).sort().map(f => 'looks/' + f)]) h.update(fs.readFileSync(path.join(here, f)));
rep.hash === h.digest('hex') ? r.ok('page-report.json is current (' + rep.when + ')') : r.fail('page-report.json is stale: re-run page-test.mjs');
const bad = rep.tests.filter(t => !t.pass);
bad.length ? bad.forEach(t => r.fail(t.name + ' (' + t.detail + ')')) : r.ok(rep.tests.length + ' browser checks pass');
rep.tests.length >= 43 ? r.ok('the whole test ran') : r.fail('only ' + rep.tests.length + ' checks ran');
fs.existsSync(path.join(here, 'img', 'page-random-' + rep.randomSeed + '.png')) ? r.ok('random-visit screenshot is this run\'s (' + rep.randomSeed + ')') : r.fail('no screenshot for random seed ' + rep.randomSeed);

const eq = read('equiv.json');
eq.pieces[0] === eq.pieces[1] && eq.maxPos < 0.001 && eq.maxNrm < 0.001 ? r.ok(`live J = Study 18's baked J (max vertex difference ${eq.maxPos.toFixed(4)})`) : r.fail('live J differs from the bake: ' + JSON.stringify(eq.pieces) + ' ' + eq.maxPos);
eq.aoCorr > 0.9 && Math.abs(eq.aoMeanLive - eq.aoMeanRef) < 0.02 ? r.ok(`live occlusion tracks the ray-cast one (r ${eq.aoCorr}, mean ${eq.aoMeanLive} vs ${eq.aoMeanRef})`) : r.fail('occlusion drifted: ' + JSON.stringify({ r: eq.aoCorr, live: eq.aoMeanLive, ref: eq.aoMeanRef }));

const seeds = read('seeds.json');
const full = seeds.filter(s => s.made === 25).length, errs = seeds.filter(s => s.error).length;
!errs && full / seeds.length >= 0.95 ? r.ok(`${seeds.length} random seeds: ${full} kept all 25 stones, no errors`) : r.fail(`${errs} errors, ${full}/${seeds.length} full`);

const geo = crypto.createHash('sha256').update(fs.readFileSync(path.join(here, 'bake/solid-geometry.js'))).digest('hex');
geo === 'fb32489014e44c10dafdc70fd81747d67b7cae7cde467997a602abd3b4ec75cc' ? r.ok('bake/solid-geometry.js matches brand-lab @ 5d4a8f7') : r.fail('bake/solid-geometry.js differs from brand-lab @ 5d4a8f7');
r.done();
