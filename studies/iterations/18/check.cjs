// Study 18: the looks. Fails if
//  - the page test (page-test.mjs) failed or is older than the page, the
//    looks or the mesh;
//  - any lab shot (shoot.mjs → shots.json) had errors or drew no J;
//  - the five ideas are not at least 20 apart (distinct.py → distinct.json),
//    or a finish the page calls "too close" is not actually under 15;
//  - the copied brand-lab geometry changed;
//  - a look module named on the page doesn't exist.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const r = require('../../wirecheck.cjs').reporter();
const here = __dirname;
const read = (f) => fs.readFileSync(path.join(here, f), 'utf8');

// page test, and that it's current
const rep = JSON.parse(read('page-report.json'));
const h = crypto.createHash('sha256');
for (const f of ['coming-soon.html', 'mesh/p100-ao.json', ...fs.readdirSync(path.join(here, 'looks')).sort().map(f => 'looks/' + f)]) h.update(fs.readFileSync(path.join(here, f)));
rep.hash === h.digest('hex') ? r.ok('page-report.json is current (' + rep.when + ')') : r.fail('page-report.json is stale: re-run page-test.mjs');
const bad = rep.tests.filter(t => !t.pass);
bad.length ? bad.forEach(t => r.fail(t.name + ' (' + t.detail + ')')) : r.ok(rep.tests.length + ' browser checks pass');
rep.tests.length >= 56 ? r.ok('every look was tested') : r.fail('only ' + rep.tests.length + ' checks ran');

// lab shots
const shots = JSON.parse(read('shots.json'));
for (const [k, s] of Object.entries(shots)) (s.errors.length || s.ink < 0.3) ? r.fail(k + ': ' + (s.errors.join(' / ') || 'ink ' + s.ink)) : null;
r.ok(Object.keys(shots).length + ' lab shots drew the J without errors');

// distinct ideas vs finishes
const d = JSON.parse(read('distinct.json'));
for (const [k, v] of Object.entries(d.ideas)) v.distance >= 20 ? r.ok(`idea ${k}: ${v.distance} from nearest (${v.nearest})`) : r.fail(`idea ${k} only ${v.distance} from ${v.nearest}`);
for (const k of ['studio--p100', 'gummy--p100', 'sugared--p100-ao']) d.looks[k].distance < 15 ? r.ok(`finish ${k}: ${d.looks[k].distance}, close as the page says`) : r.fail(`${k} is ${d.looks[k].distance} apart: the page calls it too close`);

// provenance of the geometry
const geo = crypto.createHash('sha256').update(fs.readFileSync(path.join(here, 'bake/solid-geometry.js'))).digest('hex');
geo === 'fb32489014e44c10dafdc70fd81747d67b7cae7cde467997a602abd3b4ec75cc' ? r.ok('bake/solid-geometry.js matches brand-lab @ 5d4a8f7') : r.fail('bake/solid-geometry.js differs from brand-lab @ 5d4a8f7');

// every ?look= on the page and the study has a module
const named = new Set([...read('coming-soon.html').matchAll(/\?look=(\w+)/g), ...read('index.html').matchAll(/look=(\w+)/g)].map(m => m[1]));
for (const l of named) fs.existsSync(path.join(here, 'looks', l + '.js')) ? null : r.fail('no looks/' + l + '.js');
r.ok(named.size + ' looks named, all have modules');
r.done();
