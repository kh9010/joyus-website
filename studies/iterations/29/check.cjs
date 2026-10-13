// Study 29: more stones. Fails if the page test failed, ran short or is
// stale; a kept font is missing, didn't load, or is unscored at 25, 40 or 60
// stones; a dropped font is back; the bar isn't 11 fonts + 3 counts; the
// hold isn't six seconds; the fly-in delays don't scale with the count; or
// the copied brand-lab geometry changed.
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
rep.tests.length >= 40 ? r.ok('the whole test ran') : r.fail('only ' + rep.tests.length + ' checks ran');
for (const name of ['?cells=60: about 60 stones, 2 on the floor, the bar lights 60', '60 stones: they let go and the next font follows, still 60, no errors', '60 stones build in about the time 25 do, idle', '11 fonts × 3 counts build', 'three other breaks each for Calistoga, Abril, Sansita', 'lets go 6 seconds after it is whole', 'wide: the J is inside the stage column, not under the words'])
  rep.tests.some(t => t.name === name && t.pass) ? r.ok(name) : r.fail('missing or failed: ' + name);
const FONTS = ['rubik', 'archivo-black', 'shrikhand', 'lilita', 'alfa-slab', 'bagel-fat', 'calistoga', 'abril', 'ultra', 'sansita-swashed', 'tilt-warp'];
const OUT = ['unbounded', 'bowlby', 'anton', 'bungee', 'chango', 'luckiest-guy', 'fredoka', 'rowdies', 'gluten', 'poetsen', 'modak', 'marker', 'fugaz', 'oleo', 'syne', 'titan', 'dela-gothic'];
const masks = read('masks/masks.json');
FONTS.every(f => masks[f] && masks[f].loaded && fs.existsSync(path.join(here, 'masks', f + '.png'))) ? r.ok('11 fonts drawn, each loaded') : r.fail('a font is missing or did not load when drawn');
const leg = read('legible-fonts.json');
const rows = FONTS.flatMap(f => [25, 40, 60].map(c => leg.find(x => x.font === f && x.cells === c)));
rows.every(x => x && x.iou >= 0.75) ? r.ok('33 builds scored (11 fonts × 25/40/60 stones), all ≥ 0.75') : r.fail('a font is unscored at some count, or scores below 0.75');
const page = fs.readFileSync(path.join(here, 'coming-soon.html'), 'utf8');
!OUT.some(f => page.includes('"' + f + '"') || page.includes("'" + f + "'")) && OUT.every(f => !fs.existsSync(path.join(here, 'masks', f + '.png'))) ? r.ok('dropped fonts are not on the page and their masks are gone') : r.fail('a dropped font is still here');
(page.match(/data-font=/g) || []).length === 11 && (page.match(/data-cells=/g) || []).length === 3 ? r.ok('the bar: 11 fonts, 3 stone counts') : r.fail('the bar is not 11 fonts + 3 counts');
/const CELLS = \[25, 40, 60\]/.test(page) && /cells: N,/.test(page) && /0\.06 \* 25 \/ pending\.length/.test(page) ? r.ok('?cells= drives the build; fly-in delays scale with the count') : r.fail('the stone count is not wired, or the delays do not scale');
/const HOLD = 6;/.test(page) ? r.ok('the J holds six seconds') : r.fail('HOLD is not 6');
const geo = crypto.createHash('sha256').update(fs.readFileSync(path.join(here, 'bake/solid-geometry.js'))).digest('hex');
geo === 'fb32489014e44c10dafdc70fd81747d67b7cae7cde467997a602abd3b4ec75cc' ? r.ok('bake/solid-geometry.js matches brand-lab @ 5d4a8f7') : r.fail('bake/solid-geometry.js differs from brand-lab @ 5d4a8f7');
r.done();
