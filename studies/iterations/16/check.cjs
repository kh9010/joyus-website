// Study 16: the coming-soon page. shoot.mjs drives it in a real browser and
// writes report.json; this fails if any of its checks failed, or if the page
// or the baked J changed since (re-run: node studies/iterations/16/shoot.mjs).
// Also checks the copied brand-lab geometry is still the one it claims to be.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const r = require('../../wirecheck.cjs').reporter();
const here = __dirname;
const report = JSON.parse(fs.readFileSync(path.join(here, 'report.json'), 'utf8'));
const h = crypto.createHash('sha256');
for (const f of ['coming-soon.html', 'j.json']) h.update(fs.readFileSync(path.join(here, f)));
report.hash === h.digest('hex') ? r.ok('report.json is current (' + report.when + ')') : r.fail('report.json is stale: re-run shoot.mjs');
for (const t of report.tests) t.pass ? r.ok(t.name) : r.fail(t.name + ' (' + t.detail + ')');
report.tests.length >= 12 ? r.ok(report.tests.length + ' browser checks') : r.fail('only ' + report.tests.length + ' browser checks ran');
// the deck link points at a file that exists in the repo
const deck = (fs.readFileSync(path.join(here, 'coming-soon.html'), 'utf8').match(/href="([^"]*deck[^"]*)"/) || [])[1];
deck && fs.existsSync(path.join(here, decodeURIComponent(deck))) ? r.ok('deck file exists: ' + decodeURIComponent(deck)) : r.fail('deck link missing or broken: ' + deck);
// solid-geometry.js is brand-lab's, unchanged (sha of joyus/brand-lab @ 5d4a8f7)
const geo = crypto.createHash('sha256').update(fs.readFileSync(path.join(here, 'bake/solid-geometry.js'))).digest('hex');
geo === 'fb32489014e44c10dafdc70fd81747d67b7cae7cde467997a602abd3b4ec75cc' ? r.ok('bake/solid-geometry.js matches brand-lab @ 5d4a8f7') : r.fail('bake/solid-geometry.js differs from brand-lab @ 5d4a8f7');
r.done();
