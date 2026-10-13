// Study 30: forty. Fails if the page test failed, ran short or is stale; a
// kept font is missing, didn't load, or is unscored at 40 stones; a dropped
// font (Tilt Warp and earlier) is back; the bar isn't 10 fonts with no count
// switch; the build isn't 40; Sansita's fallen stones aren't taken from the
// tail; the hold isn't six seconds; or the copied brand-lab geometry changed.
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
rep.tests.length >= 38 ? r.ok('the whole test ran') : r.fail('only ' + rep.tests.length + ' checks ran');
for (const name of ['gummy, seed study30, rubik first, 40 stones', '10 fonts build at 40', 'Sansita: both fallen stones come from the lowest 35% of the letter, 6 seeds', 'other fonts take fallen stones from anywhere on the outline', 'the next font takes the stage: archivo-black, a fresh J of 40', 'lets go 6 seconds after it is whole', 'wide: the J is inside the stage column, not under the words'])
  rep.tests.some(t => t.name === name && t.pass) ? r.ok(name) : r.fail('missing or failed: ' + name);
const FONTS = ['rubik', 'archivo-black', 'shrikhand', 'lilita', 'alfa-slab', 'bagel-fat', 'calistoga', 'abril', 'ultra', 'sansita-swashed'];
const OUT = ['tilt-warp', 'unbounded', 'bowlby', 'anton', 'bungee', 'chango', 'luckiest-guy', 'fredoka', 'rowdies', 'gluten', 'poetsen', 'modak', 'marker', 'fugaz', 'oleo', 'syne', 'titan', 'dela-gothic'];
const masks = read('masks/masks.json');
FONTS.every(f => masks[f] && masks[f].loaded && fs.existsSync(path.join(here, 'masks', f + '.png'))) ? r.ok('10 fonts drawn, each loaded') : r.fail('a font is missing or did not load when drawn');
const leg = read('legible-fonts.json');
FONTS.every(f => (leg.find(x => x.font === f && x.cells === 40) || {}).iou >= 0.75) ? r.ok('the 10 score ≥ 0.75 at 40 stones (Study 29)') : r.fail('a font is unscored at 40, or below 0.75');
const page = fs.readFileSync(path.join(here, 'coming-soon.html'), 'utf8');
!OUT.some(f => page.includes('"' + f + '"') || page.includes("'" + f + "'")) && OUT.every(f => !fs.existsSync(path.join(here, 'masks', f + '.png'))) ? r.ok('dropped fonts are not on the page and their masks are gone') : r.fail('a dropped font is still here');
(page.match(/data-font=/g) || []).length === 10 && !/data-cells=/.test(page) ? r.ok('the bar: 10 fonts, no count switch') : r.fail('the bar is not 10 fonts, or the count switch is back');
/\? \+Q\.get\('cells'\) : 40;/.test(page) ? r.ok('40 stones is the build') : r.fail('the build is not 40 stones');
/const FALL_FROM = \{ 'sansita-swashed': 0\.35 \}/.test(page) && /mid\(d\) < JH \* low/.test(page) ? r.ok('Sansita\'s fallen stones come from the lowest 35%') : r.fail('FALL_FROM is not wired');
/const HOLD = 6;/.test(page) ? r.ok('the J holds six seconds') : r.fail('HOLD is not 6');
const geo = crypto.createHash('sha256').update(fs.readFileSync(path.join(here, 'bake/solid-geometry.js'))).digest('hex');
geo === 'fb32489014e44c10dafdc70fd81747d67b7cae7cde467997a602abd3b4ec75cc' ? r.ok('bake/solid-geometry.js matches brand-lab @ 5d4a8f7') : r.fail('bake/solid-geometry.js differs from brand-lab @ 5d4a8f7');
r.done();
