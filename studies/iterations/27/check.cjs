// Study 27: the J cycles its fonts. Fails if the page test failed, ran
// short or is stale; a font didn't load or scores below 0.75 (Study 20's
// legibility test); the page still carries looks, "new J" or a dropped font;
// the hold isn't ten seconds; or the copied brand-lab geometry changed.
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
rep.tests.length >= 32 ? r.ok('the whole test ran') : r.fail('only ' + rep.tests.length + ' checks ran');
for (const name of ['lets go ten seconds after it is whole', 'the stones drop to the floor', 'and not through it', 'then fade away', 'the next font takes the stage: rubik, a fresh J', 'and it comes whole', 'click Chango: the J lets go, Chango is next', '14 J fonts build'])
  rep.tests.some(t => t.name === name && t.pass) ? r.ok(name) : r.fail('missing or failed: ' + name);
const masks = read('masks/masks.json');
const FONTS = ['unbounded', 'rubik', 'archivo-black', 'shrikhand', 'bowlby', 'anton', 'lilita', 'alfa-slab', 'bungee', 'chango', 'luckiest-guy', 'fredoka', 'rowdies', 'bagel-fat'];
Object.keys(masks).length === 14 && FONTS.every(f => masks[f] && masks[f].loaded && fs.existsSync(path.join(here, 'masks', f + '.png'))) ? r.ok('14 fonts drawn, each loaded') : r.fail('a font is missing or did not load when drawn');
const leg = read('legible-fonts.json');
leg.length === 14 && leg.every(x => x.iou >= 0.75) ? r.ok('14 fonts score ≥ 0.75 (Study 20\'s test)') : r.fail('a font is unscored or scores below 0.75');
const page = fs.readFileSync(path.join(here, 'coming-soon.html'), 'utf8');
!/data-look=|id="reroll"/.test(page) && /const LOOK = 'gummy'/.test(page) ? r.ok('Gummy only; no look switch, no "new J"') : r.fail('looks or "new J" are back');
!/syne|titan|dela-gothic/.test(page) && fs.readdirSync(path.join(here, 'looks')).join() === 'gummy.js' ? r.ok('Syne, Titan, Dela Gothic and the other looks are gone') : r.fail('a dropped font or look is still here');
/const HOLD = 10;/.test(page) ? r.ok('the J holds ten seconds') : r.fail('HOLD is not 10');
const geo = crypto.createHash('sha256').update(fs.readFileSync(path.join(here, 'bake/solid-geometry.js'))).digest('hex');
geo === 'fb32489014e44c10dafdc70fd81747d67b7cae7cde467997a602abd3b4ec75cc' ? r.ok('bake/solid-geometry.js matches brand-lab @ 5d4a8f7') : r.fail('bake/solid-geometry.js differs from brand-lab @ 5d4a8f7');
r.done();
