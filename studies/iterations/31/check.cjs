// Study 31: the words. Fails if the page test failed, ran short or is stale;
// the headline isn't bigger than Study 30's; the second line isn't the new
// one; a treatment is missing, or the J's build changed (40 stones, ten
// fonts, Sansita from the tail, six seconds); or the copied brand-lab
// geometry changed.
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
for (const name of ['the headline is bigger than in Study 30', 'the second line: in the meantime… you can check us out here', 'four treatments, each its own second-line font and link shape', 'every treatment: the links fit the column, on wide and on a phone', 'gummy, seed study31, rubik first, 40 stones', 'lets go 6 seconds after it is whole', '10 fonts build at 40', 'Sansita: both fallen stones come from the lowest 35% of the letter, 6 seeds'])
  rep.tests.some(t => t.name === name && t.pass) ? r.ok(name) : r.fail('missing or failed: ' + name);
const page = fs.readFileSync(path.join(here, 'coming-soon.html'), 'utf8');
/in the meantime… you can check us out here/.test(page) && !/putting the pieces back together/.test(page) ? r.ok('the second line is the new one') : r.fail('the second line is not the new one');
['a', 'b', 'c', 'd'].every(w => new RegExp('body\\[data-words=' + w + '\\] \\.note \\{ font:').test(page) && new RegExp('body\\[data-words=' + w + '\\] \\.links a').test(page)) ? r.ok('four treatments, each with its own line font and link rule') : r.fail('a treatment is missing its line font or link rule');
(page.match(/data-words="/g) || []).length === 4 ? r.ok('the bar offers the four') : r.fail('the bar does not offer four treatments');
!/Caveat/.test(page) ? r.ok('Caveat is gone from the page') : r.fail('Caveat is still on the page');
/h1 \{ font-size: clamp\(2rem, 5vw, 3\.8rem\)/.test(page) ? r.ok('the headline is up to 3.8rem') : r.fail('the headline size changed');
/\? \+Q\.get\('cells'\) : 40;/.test(page) && (page.match(/data-font=/g) || []).length === 10 && /const FALL_FROM = \{ 'sansita-swashed': 0\.35 \}/.test(page) && /const HOLD = 6;/.test(page) ? r.ok('the J is as in Study 30: 40 stones, ten fonts, Sansita from the tail, six seconds') : r.fail('the J\'s build changed');
const geo = crypto.createHash('sha256').update(fs.readFileSync(path.join(here, 'bake/solid-geometry.js'))).digest('hex');
geo === 'fb32489014e44c10dafdc70fd81747d67b7cae7cde467997a602abd3b4ec75cc' ? r.ok('bake/solid-geometry.js matches brand-lab @ 5d4a8f7') : r.fail('bake/solid-geometry.js differs from brand-lab @ 5d4a8f7');
r.done();
