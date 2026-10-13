// Study 33: C, another line. Fails if the page test failed, ran short or is
// stale; C isn't the default; the four line fonts aren't there or Unbounded
// is still C's line; or the J's build changed.
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
rep.tests.length >= 42 ? r.ok('the whole test ran') : r.fail('only ' + rep.tests.length + ' checks ran');
for (const name of ['words C by default, Space Grotesk line; the bar offers four treatments and four lines', 'C\'s line in four fonts, each loaded, the underlines kept', 'four treatments, each its own second-line font and link shape', 'gummy, seed study33, rubik first, 40 stones', 'lets go 6 seconds after it is whole', '10 fonts build at 40'])
  rep.tests.some(t => t.name === name && t.pass) ? r.ok(name) : r.fail('missing or failed: ' + name);
const page = fs.readFileSync(path.join(here, 'coming-soon.html'), 'utf8');
/\? Q\.get\('words'\) : 'c';/.test(page) ? r.ok('C is the default') : r.fail('C is not the default');
['serif', 'fraunces', 'mono'].every(l => new RegExp('body\\[data-words=c\\]\\[data-line=' + l + '\\] \\.note').test(page)) && /body\[data-words=c\] \.note \{ font: 500 [^}]*'Space Grotesk'/.test(page) ? r.ok('four line fonts for C') : r.fail('a line font is missing');
!/body\[data-words=c\][^\n]*Unbounded/.test(page) ? r.ok('Unbounded is no longer C\'s line') : r.fail('Unbounded is still C\'s line');
(page.match(/data-line="/g) || []).length === 4 ? r.ok('the bar offers the four lines') : r.fail('the bar does not offer four lines');
/\? \+Q\.get\('cells'\) : 40;/.test(page) && (page.match(/data-font=/g) || []).length === 10 && /const HOLD = 6;/.test(page) ? r.ok('the J is as in Study 30') : r.fail('the J\'s build changed');
const geo = crypto.createHash('sha256').update(fs.readFileSync(path.join(here, 'bake/solid-geometry.js'))).digest('hex');
geo === 'fb32489014e44c10dafdc70fd81747d67b7cae7cde467997a602abd3b4ec75cc' ? r.ok('bake/solid-geometry.js matches brand-lab @ 5d4a8f7') : r.fail('bake/solid-geometry.js differs from brand-lab @ 5d4a8f7');
r.done();
