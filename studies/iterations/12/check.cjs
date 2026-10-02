// Study 12: judges crawl-report.json (written by crawl.mjs in a real browser).
// Fails if the report is stale: its hash must match the site files now.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const w = require('../../wirecheck.cjs');
const r = w.reporter();
const siteDir = path.join(__dirname, 'site');
const reportPath = path.join(__dirname, 'crawl-report.json');
if (!fs.existsSync(reportPath)) { r.fail('no crawl-report.json: run node studies/iterations/12/crawl.mjs'); r.done(); return; }
const rep = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
const hash = crypto.createHash('sha256');
for (const f of fs.readdirSync(siteDir).sort()) hash.update(f).update(fs.readFileSync(path.join(siteDir, f)));
hash.digest('hex') === rep.siteHash ? r.ok('report is fresh (' + rep.when.slice(0, 16) + 'Z), matches the site files') : r.fail('report is stale: site changed since the crawl; rerun crawl.mjs');
globalThis.module = undefined;
require(path.join(siteDir, 'site-data.js'));
const SITE = globalThis.SITE;
const pages = rep.pages, keys = Object.keys(pages);

console.log('links');
// an <a> with no href is a placeholder, not a link (the soon panel); "#" or "" is a dead link
const dead = rep.links.filter(l => l.raw === '#' || l.raw === '');
dead.length ? r.fail(dead.length + ' links go nowhere (href "#" or empty), e.g. "' + dead[0].text + '" on ' + dead[0].from) : r.ok(rep.links.length + ' links, none is "#" or empty');
const broken = keys.filter(k => pages[k].missing && !/^(piece|experiment|client)\.html\?/.test(k));
broken.length ? r.fail('pages that rendered a not-found state: ' + broken.join(', ')) : r.ok(keys.length + ' prototype pages and states visited, none rendered "not found"');
const notFound = keys.filter(k => pages[k].missing);
notFound.length ? r.fail('a link led to a missing piece/client: ' + notFound.join(', ')) : r.ok('every piece and client link landed on a real page');
const outside = Object.entries(rep.outside);
const local = outside.filter(([u, s]) => s !== 'external');
local.every(([, s]) => s === 200) ? r.ok(local.length + ' links into the live site resolve (' + local.map(([u]) => u.replace('http://127.0.0.1:8794/', '/')).join(', ') + ')') : r.fail('live-site links failing: ' + local.filter(([, s]) => s !== 200).map(x => x.join(' ')).join(', '));
console.log('  note external, not fetched: ' + outside.filter(([, s]) => s === 'external').map(([u]) => u).join(', '));

console.log('reach');
const live = SITE.pieces.filter(p => !p.soon);
const pieceUrl = (p) => (p.pill === 'exp' ? 'experiment.html?p=' : 'piece.html?p=') + p.slug;
const unreached = live.filter(p => !pages[pieceUrl(p)]);
unreached.length ? r.fail('pieces never reached: ' + unreached.map(p => p.slug).join(', ')) : r.ok('all ' + live.length + ' live pieces reached (' + SITE.pieces.filter(p => p.soon).length + ' "soon" piece correctly has no page)');
const fromHome = live.filter(p => !rep.links.some(l => l.from.startsWith('index.html') && l.raw === pieceUrl(p)));
fromHome.length ? r.fail('pieces the homepage panel never links to: ' + fromHome.map(p => p.slug).join(', ')) : r.ok('the homepage panel links to every one of them as the rotation reaches it');
const soonLinked = SITE.pieces.filter(p => p.soon && rep.links.some(l => l.raw === pieceUrl(p)));
soonLinked.length ? r.fail('"soon" pieces linked: ' + soonLinked.map(p => p.slug).join(', ')) : r.ok('no link anywhere to the "soon" piece');
const clientPages = Object.keys(SITE.clients).filter(c => SITE.clients[c].page), single = Object.keys(SITE.clients).filter(c => !SITE.clients[c].page);
const cMiss = clientPages.filter(c => !pages['client.html?c=' + c]);
cMiss.length ? r.fail('client pages not reached: ' + cMiss.join(', ')) : r.ok('all ' + clientPages.length + ' client pages reached');
const cBad = single.filter(c => rep.links.some(l => l.raw === 'client.html?c=' + c));
cBad.length ? r.fail('one-piece clients linked to a client page: ' + cBad.join(', ')) : r.ok('the ' + single.length + ' one-piece clients are never sent to a client page (Study 06)');
const types = { home: /^index\.html/, work: /^work\.html/, piece: /^piece\.html/, experiment: /^experiment\.html/, client: /^client\.html/, about: /^about\.html$/, kahran: /^kahran-singh\.html$/, divya: /^divya-tak\.html$/, 'say hi': /^say-hi\.html/, newsletter: /^newsletter\.html/, issue: /^issue-01\.html$/, privacy: /^privacy\.html$/ };
const tMiss = Object.entries(types).filter(([, re]) => !keys.some(k => re.test(k))).map(([t]) => t);
tMiss.length ? r.fail('page types never reached: ' + tMiss.join(', ')) : r.ok('all ' + Object.keys(types).length + ' page types reached by clicking from the homepage');

console.log('the amendments, held');
const piecePages = keys.filter(k => /^(piece|experiment)\.html\?p=/.test(k));
// guard: this rule once passed over zero pages (a mangled regex); it must see every live piece
if (piecePages.length !== live.length) r.fail('expected ' + live.length + ' piece/experiment pages in the crawl, found ' + piecePages.length);
const fromBad = piecePages.filter(k => { const own = k.split("?p=")[1]; const withFrom = rep.links.filter(l => l.from === k && /^say-hi\.html\?from=/.test(l.raw)); return withFrom.length !== 1 || withFrom[0].raw !== "say-hi.html?from=" + own; });
fromBad.length ? r.fail(fromBad.length + " piece/experiment pages without exactly one say-hi?from=<own slug>: " + fromBad.slice(0, 3).join(", ")) : r.ok(piecePages.length + " piece/experiment pages: each has exactly one say-hi link, carrying ?from=<its own slug> (Study 10); nav and footer stay plain");
const sayStates = keys.filter(k => /^say-hi\.html\?from=/.test(k));
sayStates.length && sayStates.every(k => pages[k].ctx === true) ? r.ok(sayStates.length + ' say-hi?from= pages each showed the "you were looking at" box') : r.fail('a say-hi?from= page did not show its context');
const panelStates = keys.filter(k => /^index\.html\?pill=/.test(k));
const panelBad = panelStates.filter(k => { const p = pages[k].panel; const piece = SITE.pieces.find(x => x.s === p.sentence); return !piece || (piece.soon ? p.href !== null : p.href !== pieceUrl(piece)); });
panelBad.length ? r.fail('panel href wrong at ' + panelBad.join(', ')) : r.ok(panelStates.length + ' parked panels: each links to its own piece, the "soon" one to nothing');
const personLinks = rep.links.filter(l => /^(Kahran|Divya)$/.test(l.text));
personLinks.every(l => /^(kahran-singh|divya-tak)\.html$/.test(l.raw)) ? r.ok('footer Kahran / Divya go to the old URLs, now pages (Study 09)') : r.fail('person links wrong');
const newsLink = rep.links.find(l => l.from === 'index.html' && l.text === 'Newsletter'), privLink = rep.links.find(l => l.from === 'index.html' && l.text === 'privacy');
newsLink && newsLink.raw === 'newsletter.html' && privLink && privLink.raw === 'privacy.html' ? r.ok('homepage: "Newsletter" → newsletter, "privacy" → privacy (Studies 03, 11)') : r.fail('homepage newsletter/privacy links');

console.log('phone (390 px)');
const over = Object.entries(rep.phone).filter(([, o]) => o).map(([u]) => u);
over.length ? r.fail('overflows at 390 px: ' + over.join(', ')) : r.ok(Object.keys(rep.phone).length + ' page types fit at 390 px, no sideways scroll');
r.done();
