// Tests Study 03's inventory (ia.json) against the thing it inventories
// (Study 02's rev4.html), so the list can't quietly drift from the wireframe:
//   1. every piece in rev4's PILLS data is in ia.json, under the same pill, and nothing extra
//   2. every nav and footer label in rev4 has a clickables row
//   3. every name on rev4's logo wall is a client with pieces
//   4. every destination is a defined page type
//   5. page counts are derived, not typed: pieces, experiments, clients
//   6. every source file a piece cites exists in the repo
// Exit 1 on any failure. verify.cjs runs this.
const fs = require('node:fs');
const path = require('node:path');
const here = __dirname;
const repo = path.resolve(here, '../../..');
const ia = JSON.parse(fs.readFileSync(path.join(here, 'ia.json'), 'utf8'));
const rev4 = fs.readFileSync(path.join(here, '../02/rev4.html'), 'utf8');
let failures = 0;
const ok = (m) => console.log('  ok   ' + m);
const fail = (m) => { failures++; console.log('  FAIL ' + m); };
const norm = (s) => s.replace(/&amp;/g, '&').trim().toLowerCase();

// 1. pieces
const wirePieces = [];
// slice the PILLS array at each pill header; a lazy regex to the first ']}'
// stops at the first piece's tag list (that was this script's first bug)
const heads = [...rev4.matchAll(/\{id:'\w+',label:'([^']+)'/g)];
heads.forEach((h, i) => {
  const block = rev4.slice(h.index, i + 1 < heads.length ? heads[i + 1].index : rev4.indexOf('];', h.index));
  for (const m of block.matchAll(/\{c:'([^']+)',p:'([^']+)'/g)) wirePieces.push({ pill: h[1], client: m[1], piece: m[2] });
});
const key = (p) => norm(p.client) + ' · ' + norm(p.piece);
const iaKeys = new Map(ia.pieces.map(p => [key(p), p]));
let missing = 0, wrongPill = 0;
for (const w of wirePieces) {
  const p = iaKeys.get(key(w));
  if (!p) { missing++; fail('rev4 piece not in ia.json: ' + key(w)); }
  else if (norm(p.pill) !== norm(w.pill)) { wrongPill++; fail(key(w) + ' is under ' + p.pill + ' in ia.json, ' + w.pill + ' in rev4'); }
}
const extra = ia.pieces.filter(p => !wirePieces.some(w => key(w) === key(p)));
extra.forEach(p => fail('ia.json piece not in rev4: ' + key(p)));
if (!missing && !wrongPill && !extra.length) ok(wirePieces.length + ' pieces match rev4, pill for pill');

// 2. nav + footer labels
const navLabels = [...(rev4.match(/<header class="nav">[\s\S]*?<\/header>/) || [''])[0].matchAll(/<a[^>]*>([^<]+)<\/a>/g)].map(m => norm(m[1]));
const footLabels = [...(rev4.match(/<footer class="foot">[\s\S]*?<\/footer>/) || [''])[0].matchAll(/<li>([^<]+)<\/li>/g)].map(m => norm(m[1]));
const labelOf = (block) => new Set(ia.clickables.filter(c => c.block === block).map(c => norm(c.label)));
const navSet = labelOf('nav'), footSet = labelOf('footer');
const navMiss = navLabels.filter(l => !navSet.has(l)), footMiss = footLabels.filter(l => !footSet.has(l));
navMiss.forEach(l => fail('nav label "' + l + '" has no clickables row'));
footMiss.forEach(l => fail('footer label "' + l + '" has no clickables row'));
if (!navMiss.length) ok(navLabels.length + ' nav links inventoried');
if (!footMiss.length) ok(footLabels.length + ' footer links inventoried');

// 3. logo wall
const wall = [...(rev4.match(/<div class="logos">[\s\S]*?<\/section>/) || [''])[0].matchAll(/<div class="gbox">([^<]+)<\/div>/g)].map(m => m[1]).filter(n => n !== 'logo');
const clients = new Set(ia.pieces.filter(p => p.pill !== 'Experiments').map(p => p.client.split(' / ')[0]));
const wallMiss = wall.filter(n => !clients.has(n.split(' / ')[0]));
wallMiss.forEach(n => fail('logo wall name "' + n + '" has no pieces'));
if (!wallMiss.length) ok(wall.length + ' logo-wall names each lead to a client with pieces');
const offWall = [...clients].filter(c => !wall.includes(c));
if (offWall.length) console.log('  note clients with pieces but no logo on the wall: ' + offWall.join(', '));

// 4. destinations
const types = new Set(ia.pages.map(p => p.type));
const dests = (c) => [c.to, c.or].filter(Boolean);
const badTo = ia.clickables.filter(c => dests(c).some(t => !types.has(t)));
badTo.forEach(c => fail(c.id + ' goes to an undefined page type: ' + dests(c).join(' / ')));
if (!badTo.length) ok(ia.clickables.length + ' clickables, every destination defined');
const unreached = ia.pages.filter(p => p.type !== 'home' && !ia.clickables.some(c => dests(c).includes(p.type)));
if (unreached.length) console.log('  note page types not reached from the homepage (reached from deeper pages): ' + unreached.map(p => p.type).join(', '));

// 5. derived counts
const count = (t) => (ia.pages.find(p => p.type === t) || {}).count;
const nPiece = ia.pieces.filter(p => p.pill !== 'Experiments').length;
const nExp = ia.pieces.filter(p => p.pill === 'Experiments').length;
const nClient = clients.size;
[['piece', nPiece], ['experiment', nExp], ['client', nClient]].forEach(([t, n]) => count(t) === n ? ok(t + ' count ' + n + ' matches the data') : fail(t + ' count says ' + count(t) + ', data has ' + n));

// 6. sources exist
let badSrc = 0, nSrc = 0;
for (const p of ia.pieces) for (const s of p.source) { nSrc++; if (!fs.existsSync(path.join(repo, s))) { badSrc++; fail(key(p) + ' cites missing ' + s); } }
if (!badSrc) ok(nSrc + ' cited source files exist');

console.log(failures ? failures + ' failure(s)' : 'all checks passed');
process.exitCode = failures ? 1 : 0;
