// Study 40: the font order, the sign right, white under the band, more air, heavier headline, the Drive deck (on top of 39's checks). Fails if the page test failed, ran
// short or is stale; the three fields aren't built and measured; the exact
// field changed the polygon count; the field pictures and numbers are
// missing; or the J's build / the words changed.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const r = require('../../wirecheck.cjs').reporter();
const here = __dirname;
const read = (f) => JSON.parse(fs.readFileSync(path.join(here, f), 'utf8'));
const rep = read('page-report.json');
const h = crypto.createHash('sha256');
for (const f of ['coming-soon.html', 'jbuilder.js', 'site.js', 'bake/dist.js', ...fs.readdirSync(path.join(here, 'masks')).filter(f => f.endsWith('.png')).sort().map(f => 'masks/' + f), ...fs.readdirSync(path.join(here, 'looks')).sort().map(f => 'looks/' + f)]) h.update(fs.readFileSync(path.join(here, f)));
rep.hash === h.digest('hex') ? r.ok('page-report.json is current (' + rep.when + ')') : r.fail('page-report.json is stale: re-run page-test.mjs');
const bad = rep.tests.filter(t => !t.pass);
bad.length ? bad.forEach(t => r.fail(t.name + ' (' + t.detail + ')')) : r.ok(rep.tests.length + ' browser checks pass');
rep.tests.length >= 40 ? r.ok('the whole test ran') : r.fail('only ' + rep.tests.length + ' checks ran');
for (const name of ['gummy, seed study40, rubik first, 40 stones', 'the fonts never put two sans in a row, round the wrap', 'hover: a white copy of the word is revealed from the left in step with the band, and hidden again', 'the yellow link keeps ink letters under its band', 'the headline is heavier: a stroke in the ink', '"Our work" goes to the Drive deck', 'more air between the subtitle and the links', 'hover: the colour band starts at 0, sweeps from the left to the full word, and leaves again', 'the words are decided: C, Space Grotesk subtitle, no switches in the bar', 'the sign sits under the words; the two blocks stay under the J', 'the J is a bit smaller: under 84% of the column\'s height', 'after the swap, the new blocks are under the J, the sign still under the words', 'every font: both fallen stones come from inside the outline', 'Sansita: the tail and the whole outline keep, 6 seeds', 'phone: the sign stays in front of the J, inside the stage', 'wide: the headline is two lines and "under construction" is whole on the second', 'C: the links stack as a list, each on its own line', '10 fonts build at 40'])
  rep.tests.some(t => t.name === name && t.pass) ? r.ok(name) : r.fail('missing or failed: ' + name);
['img/page-gummy.png', 'img/hover-1.png', 'img/hover-2.png', 'img/page-phone.png'].every(f => fs.existsSync(path.join(here, f))) ? r.ok('the pictures are there') : r.fail('a picture is missing');
fs.existsSync(path.join(here, 'masks1024', 'rubik.png')) && fs.readdirSync(path.join(here, 'masks1024')).filter(f => f.endsWith('.png')).length === 10 ? r.ok('ten fine masks at 1024px') : r.fail('masks1024 is missing or incomplete');
const page = fs.readFileSync(path.join(here, 'coming-soon.html'), 'utf8');
/const EDGE = 'exact1024';/.test(page) && /const RES = 0\.6;/.test(page) && !/data-res|data-edge|data-words|data-line/.test(page) ? r.ok('decided: exact field on the fine mask, res 0.6; no switches') : r.fail('a switch is back or the mesh/field decision changed');
const jb = fs.readFileSync(path.join(here, 'jbuilder.js'), 'utf8');
/import \{ chamfer, edt \} from '\.\/bake\/dist\.js'/.test(jb) && /const R = bmp\.width;/.test(jb) && !/const SIDE = 1\.6, R = 320;/.test(jb) ? r.ok('the builder reads the mask at its size and uses dist.js') : r.fail('jbuilder is not the Study 34 one');
/\? \+Q\.get\('cells'\) : 40;/.test(page) && (page.match(/data-font=/g) || []).length === 10 && /const HOLD = 6;/.test(page) && /const WV = 'c';/.test(page) && /<span class="keep">under construction<\/span>/.test(page) && /\.links a::after \{[^}]*clip-path: inset\(0 100% 0 0\)/.test(page) && /data-label="Our work"/.test(page) && /drive\.google\.com\/file\/d\/1cM-AvZpCK4QvV3oYHT2cnu9a0sGEgtoM/.test(page) && !/Joyus%20-%20work%20deck/.test(page) && /const SHRINK = 0\.84;/.test(page) ? r.ok('the J is as in Study 33; the headline keeps "under construction"; the hover sweeps; the J at 84%') : r.fail('the J\'s build or the words changed');
/function floorAt\(px, py\)/.test(page) && /placeSite\(floorAt\(px, py\), LAYOUT\.wide\)/.test(page) && /for \(const o of wide \? \[\] : \[sign\]\)/.test(page) ? r.ok('the site is laid under the words from the camera; the J alone sizes the column') : r.fail('the site placement is not the Study 36 one');
/const INSIDE = 0\.06;/.test(page) && /d\.edge < -INSIDE/.test(page) && !/const FALL_FROM/.test(page) ? r.ok('fallen stones come from inside the outline; the tail rule is gone') : r.fail('the fallen-stone rule is not the Study 37 one');
const geo = crypto.createHash('sha256').update(fs.readFileSync(path.join(here, 'bake/solid-geometry.js'))).digest('hex');
geo === 'fb32489014e44c10dafdc70fd81747d67b7cae7cde467997a602abd3b4ec75cc' ? r.ok('bake/solid-geometry.js matches brand-lab @ 5d4a8f7') : r.fail('bake/solid-geometry.js differs from brand-lab @ 5d4a8f7');
r.done();
