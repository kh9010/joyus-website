// Study 28: left and right. Fails if the page test failed, ran short or is
// stale; a kept font didn't load or scores below 0.75 (Study 20's legibility
// test), or a culled one is back; the page still carries looks, "new J" or a
// dropped font; the hold isn't six seconds; the page isn't two columns; or
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
rep.tests.length >= 36 ? r.ok('the whole test ran') : r.fail('only ' + rep.tests.length + ' checks ran');
for (const name of ['wide: the stage is a left column, the words to its right, left-aligned', 'wide: the J is inside the stage column, not under the words', 'phone: stacked, the J above the words, centred', 'lets go 6 seconds after it is whole', 'the stones drop to the floor', 'then fade away', 'the next font takes the stage: rubik, a fresh J', 'and it comes whole', '25 J fonts build'])
  rep.tests.some(t => t.name === name && t.pass) ? r.ok(name) : r.fail('missing or failed: ' + name);
const FONTS = ['unbounded', 'rubik', 'archivo-black', 'shrikhand', 'bowlby', 'anton', 'lilita', 'alfa-slab', 'bungee', 'chango', 'luckiest-guy', 'fredoka', 'rowdies', 'bagel-fat', 'oleo', 'sansita-swashed', 'fugaz', 'marker', 'modak', 'abril', 'ultra', 'tilt-warp', 'calistoga', 'poetsen', 'gluten'];
const OUT = ['bangers', 'sedgwick', 'pacifico', 'leckerli', 'kaushan', 'lobster', 'courgette'];
const masks = read('masks/masks.json');
FONTS.every(f => masks[f] && masks[f].loaded && fs.existsSync(path.join(here, 'masks', f + '.png'))) ? r.ok('25 fonts drawn, each loaded') : r.fail('a font is missing or did not load when drawn');
const leg = read('legible-fonts.json');
const score = Object.fromEntries(leg.map(x => [x.font, x.iou]));
FONTS.every(f => score[f] >= 0.75) ? r.ok('the 25 kept score ≥ 0.75 (Study 20\'s test)') : r.fail('a kept font is unscored or scores below 0.75');
OUT.every(f => score[f] < 0.75 && !fs.existsSync(path.join(here, 'masks', f + '.png'))) ? r.ok('the 7 out score below 0.75 and are gone') : r.fail('a culled font scores ≥ 0.75 or is still here');
read('legible-cursive40.json').every(x => x.cells === 40 && x.iou < 0.75) ? r.ok('40 stones do not rescue the scripts') : r.fail('legible-cursive40.json changed');
const page = fs.readFileSync(path.join(here, 'coming-soon.html'), 'utf8');
!/data-look=|id="reroll"/.test(page) && /const LOOK = 'gummy'/.test(page) ? r.ok('Gummy only; no look switch, no "new J"') : r.fail('looks or "new J" are back');
!/syne|titan|dela-gothic/.test(page) && !OUT.some(f => page.includes('"' + f + '"') || page.includes("'" + f + "'")) ? r.ok('dropped and culled fonts are not on the page') : r.fail('a dropped font is on the page');
(page.match(/data-font=/g) || []).length === 25 ? r.ok('25 pills in the bar') : r.fail('the bar does not have 25 pills');
/const HOLD = 6;/.test(page) ? r.ok('the J holds six seconds') : r.fail('HOLD is not 6');
/grid-template-columns: 1\.35fr 1fr/.test(page) && /setViewOffset\(W, H, W \/ 2 -/.test(page) ? r.ok('two columns; the view is shifted to the stage column') : r.fail('the layout is not two columns, or the camera is not shifted');
const geo = crypto.createHash('sha256').update(fs.readFileSync(path.join(here, 'bake/solid-geometry.js'))).digest('hex');
geo === 'fb32489014e44c10dafdc70fd81747d67b7cae7cde467997a602abd3b4ec75cc' ? r.ok('bake/solid-geometry.js matches brand-lab @ 5d4a8f7') : r.fail('bake/solid-geometry.js differs from brand-lab @ 5d4a8f7');
r.done();
