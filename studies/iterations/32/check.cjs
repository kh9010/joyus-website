// Study 32: smoother stones. Fails if the page test failed, ran short or is
// stale; the three resolutions aren't built and measured; a finer mesh
// doesn't have more triangles; the words, the J's build (40 stones, ten
// fonts, Sansita from the tail, six seconds) changed; or the copied
// brand-lab geometry changed.
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
for (const name of ['three resolutions build the same J: finer means more triangles', 'finer meshes cost build time, measured', 'the finest still builds in time for the page', 'four treatments, each its own second-line font and link shape', 'gummy, seed study32, rubik first, 40 stones', 'lets go 6 seconds after it is whole', '10 fonts build at 40', 'Sansita: both fallen stones come from the lowest 35% of the letter, 6 seeds'])
  rep.tests.some(t => t.name === name && t.pass) ? r.ok(name) : r.fail('missing or failed: ' + name);
const m = rep.res || {};
[0.6, 1, 1.5].every(k => m[k] && m[k].tris > 0 && m[k].ms > 0) && m[0.6].tris < m[1].tris && m[1].tris < m[1.5].tris ? r.ok('measured: ' + [0.6, 1, 1.5].map(k => `res ${k} → ${m[k].tris} tris, ${m[k].ms} ms`).join('; ')) : r.fail('resolutions not measured, or triangles do not grow with res');
const page = fs.readFileSync(path.join(here, 'coming-soon.html'), 'utf8');
/const RESS = \[0\.6, 1, 1\.5\]/.test(page) && /res: RES, mask:/.test(page) && (page.match(/data-res="/g) || []).length === 3 ? r.ok('?res= drives the mesh; the bar offers three') : r.fail('res is not wired');
/in the meantime… you can check us out here/.test(page) && (page.match(/data-words="/g) || []).length === 4 ? r.ok('the words are as in Study 31') : r.fail('the words changed');
/\? \+Q\.get\('cells'\) : 40;/.test(page) && (page.match(/data-font=/g) || []).length === 10 && /const FALL_FROM = \{ 'sansita-swashed': 0\.35 \}/.test(page) && /const HOLD = 6;/.test(page) ? r.ok('the J is as in Study 30: 40 stones, ten fonts, Sansita from the tail, six seconds') : r.fail('the J\'s build changed');
const geo = crypto.createHash('sha256').update(fs.readFileSync(path.join(here, 'bake/solid-geometry.js'))).digest('hex');
geo === 'fb32489014e44c10dafdc70fd81747d67b7cae7cde467997a602abd3b4ec75cc' ? r.ok('bake/solid-geometry.js matches brand-lab @ 5d4a8f7') : r.fail('bake/solid-geometry.js differs from brand-lab @ 5d4a8f7');
r.done();
