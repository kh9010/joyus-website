// Study 38: the subtitle in twelve fonts (on top of 37's checks). Fails if the page test failed, ran
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
rep.tests.length >= 52 ? r.ok('the whole test ran') : r.fail('only ' + rep.tests.length + ' checks ran');
for (const name of ['three fields build the same J, no errors; chamfer and exact on the same mask give the same stones', 'exact distance: the polygon count stays (within 15%)', 'the fine mask is read at its size: 1024', 'gummy, seed study38, rubik first, 40 stones', 'the subtitle in twelve fonts, each loaded; the links stay Space Grotesk', 'words C by default, Space Grotesk subtitle; the bar offers four treatments and twelve subtitles', 'every font: both fallen stones come from inside the outline', 'Sansita: the tail and the whole outline keep, 6 seeds', 'wide: the sign and the fallen stones sit under the words, bottom right, on screen', 'after the swap, the new fallen stones are under the words too', 'phone: the sign stays in front of the J, inside the stage', 'wide: the headline is two lines and "under construction" is whole on the second', 'C: the links stack as a list, each on its own line', '10 fonts build at 40'])
  rep.tests.some(t => t.name === name && t.pass) ? r.ok(name) : r.fail('missing or failed: ' + name);
const F = read('field.json');
F.m320 && F.m320.maskR === 320 && F.m1024 && F.m1024.maskR === 1024 && F.m320.meanErrPx > 0 && F.m320.maxErrPx > F.m320.meanErrPx ? r.ok(`field measured: chamfer off by ${F.m320.meanErrPx}px on average, ${F.m320.maxErrPx}px at worst, near the edge (${F.font}, 320px)`) : r.fail('field.json is missing or incomplete');
['img/field-chamfer.png', 'img/field-exact.png', 'img/close-chamfer.png', 'img/close-exact.png', 'img/close-exact1024.png'].every(f => fs.existsSync(path.join(here, f))) ? r.ok('contour pictures and close-ups are there') : r.fail('a picture is missing');
fs.existsSync(path.join(here, 'masks1024', 'rubik.png')) && fs.readdirSync(path.join(here, 'masks1024')).filter(f => f.endsWith('.png')).length === 10 ? r.ok('ten fine masks at 1024px') : r.fail('masks1024 is missing or incomplete');
const page = fs.readFileSync(path.join(here, 'coming-soon.html'), 'utf8');
/const EDGES = \['chamfer', 'exact', 'exact1024'\]/.test(page) && /field: EDGE === 'chamfer' \? 'chamfer' : 'exact'/.test(page) && (page.match(/data-edge="/g) || []).length === 3 ? r.ok('?edge= drives the field; the bar offers three') : r.fail('edge is not wired');
const jb = fs.readFileSync(path.join(here, 'jbuilder.js'), 'utf8');
/import \{ chamfer, edt \} from '\.\/bake\/dist\.js'/.test(jb) && /const R = bmp\.width;/.test(jb) && !/const SIDE = 1\.6, R = 320;/.test(jb) ? r.ok('the builder reads the mask at its size and uses dist.js') : r.fail('jbuilder is not the Study 34 one');
/\? \+Q\.get\('cells'\) : 40;/.test(page) && (page.match(/data-font=/g) || []).length === 10 && /const HOLD = 6;/.test(page) && /\? Q\.get\('words'\) : 'c';/.test(page) && /<span class="keep">under construction<\/span>/.test(page) && !/body\[data-words=c\]\[data-line=\w+\] \.links a/.test(page) && (page.match(/data-line="/g) || []).length === 12 ? r.ok('the J is as in Study 33; the headline keeps "under construction"; twelve subtitles, the links untouched') : r.fail('the J\'s build or the words changed');
/function floorAt\(px, py\)/.test(page) && /placeSite\(floorAt\(px, py\), LAYOUT\.wide\)/.test(page) && /for \(const o of wide \? \[\] : \[sign\]\)/.test(page) ? r.ok('the site is laid under the words from the camera; the J alone sizes the column') : r.fail('the site placement is not the Study 36 one');
/const INSIDE = 0\.06;/.test(page) && /d\.edge < -INSIDE/.test(page) && !/const FALL_FROM/.test(page) ? r.ok('fallen stones come from inside the outline; the tail rule is gone') : r.fail('the fallen-stone rule is not the Study 37 one');
const geo = crypto.createHash('sha256').update(fs.readFileSync(path.join(here, 'bake/solid-geometry.js'))).digest('hex');
geo === 'fb32489014e44c10dafdc70fd81747d67b7cae7cde467997a602abd3b4ec75cc' ? r.ok('bake/solid-geometry.js matches brand-lab @ 5d4a8f7') : r.fail('bake/solid-geometry.js differs from brand-lab @ 5d4a8f7');
r.done();
