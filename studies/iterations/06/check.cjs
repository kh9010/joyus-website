// Study 06: the client page. Also tests the rule this study adds to Study 03:
// a client gets a page only with two or more pieces; a one-piece client's
// logo goes straight to the piece.
const fs = require('node:fs');
const path = require('node:path');
const w = require('../../wirecheck.cjs');
const r = w.reporter();
const read = (f) => fs.readFileSync(path.join(__dirname, f), 'utf8');
const repo = path.resolve(__dirname, '../../..');
const pieces = w.rev4Pieces().filter(p => p.pillId !== 'exp');
const short = (c) => c.split(' / ')[0];
const byClient = {};
pieces.forEach(p => (byClient[short(p.client)] = byClient[short(p.client)] || []).push(p));
const klydo = byClient.Klydo;

// the rule, from the data
const multi = Object.keys(byClient).filter(c => byClient[c].length >= 2);
console.log('rule: ' + multi.length + ' clients with 2+ pieces get a page; ' + (Object.keys(byClient).length - multi.length) + ' go straight to their piece');

for (const f of ['client-a-by-time.html', 'client-b-by-pill.html']) {
  console.log(f);
  const html = read(f);
  w.links(html, r);
  w.chrome(html, r);
  const cards = [...html.matchAll(/<a class="pc"[^>]*data-to="(\w+)"[^>]*data-piece="([^"]+)"[^>]*>[\s\S]*?<b>([\s\S]*?)<\/b>/g)].map(m => ({ to: m[1], name: m[2], sentence: w.text(m[3]) }));
  const want = klydo.map(p => 'Klydo · ' + p.piece);
  const names = cards.map(c => c.name);
  want.every(n => names.includes(n)) && names.length === want.length ? r.ok('all ' + want.length + ' Klydo pieces, once each') : r.fail('cards ' + names.join(', '));
  const badS = cards.filter(c => c.sentence !== (klydo.find(p => 'Klydo · ' + p.piece === c.name) || {}).sentence);
  badS.length ? r.fail('sentence differs from rev4: ' + badS.map(c => c.name).join(', ')) : r.ok('every card carries its homepage sentence, unchanged');
  cards.every(c => c.to === 'piece') ? r.ok('every card links to a piece page') : r.fail('a card does not link to a piece');
  // more clients: every other client once; the rule decides where each goes
  const more = [...(html.match(/<section class="more"[\s\S]*?<\/section>/) || [''])[0].matchAll(/data-to="(\w+)"[^>]*>([^<]+)</g)].map(m => ({ to: m[1], c: m[2] }));
  const others = Object.keys(byClient).filter(c => c !== 'Klydo');
  const missing = others.filter(c => !more.some(m => m.c === c));
  const wrongTo = more.filter(m => m.to !== (byClient[m.c] && byClient[m.c].length >= 2 ? 'client' : 'piece'));
  missing.length ? r.fail('more clients missing: ' + missing.join(', ')) : r.ok(others.length + ' other clients listed');
  wrongTo.length ? r.fail('rule broken for: ' + wrongTo.map(m => m.c + ' → ' + m.to).join(', ')) : r.ok('2+ pieces → client page, 1 piece → straight to the piece');
}

// A: time order, and the dates agree with the wall
console.log('A · by time');
const a = read('client-a-by-time.html');
const chapters = [...a.matchAll(/<section class="chap"[\s\S]*?<\/section>/g)].map(m => [...m[0].matchAll(/data-start="([\d-]+)"/g)].map(x => x[1]));
const flat = chapters.flat();
flat.every((d, i) => i === 0 || d >= flat[i - 1]) ? r.ok('pieces in start-date order across both chapters (' + chapters.map(c => c.length).join(' + ') + ')') : r.fail('out of order: ' + flat.join(', '));
const wall = read('../../../work/klydo-cut-design.html');
const arts = [...wall.matchAll(/day: (\d+), date: '([^']+)', type: '([^']+)'/g)].map(m => ({ day: +m[1], date: m[2], type: m[3] }));
const iso = (day) => new Date(Date.UTC(2025, 8, 10) + (day - 1) * 864e5).toISOString().slice(0, 10);
const span = (types) => { const ds = arts.filter(x => !types || types.includes(x.type)).map(x => x.day); return [iso(Math.min(...ds)), iso(Math.max(...ds)), ds.length]; };
const evidence = { 'Klydo · design': span(null), 'Klydo · product': span(['UX', 'flow']), 'Klydo · branding': span(['brand', 'launch']) };
for (const [name, [from, to, n]] of Object.entries(evidence)) {
  const start = (a.match(new RegExp('data-piece="' + name + '" data-start="([\\d-]+)"')) || [])[1];
  start === from ? r.ok(name + ' starts ' + from + ', its first artifact on the wall (' + n + ' artifacts, to ' + to + ')') : r.fail(name + ' start ' + start + ' but the wall says ' + from);
}
// Kahran's lines are used whole: the line and chapter names must exist verbatim in klydo.html
const k = w.text(read('../../../work/klydo.html'));
for (const s of ['From four people to a million orders to a thesis.', 'The build', 'The shift']) k.includes(s) ? r.ok('"' + s + '" is verbatim from work/klydo.html') : r.fail('"' + s + '" not found in work/klydo.html');

// B: homepage pill order, homepage piece order inside each pill
console.log('B · by pill');
const b = read('client-b-by-pill.html');
const groups = [...b.matchAll(/<h2 id="g\d">([^<]+)<\/h2>[\s\S]*?<\/section>/g)].map(m => ({ pill: w.text(m[1]), ps: [...m[0].matchAll(/data-piece="Klydo · ([^"]+)"/g)].map(x => x[1]) }));
const pillOrder = [...new Set(klydo.map(p => p.pill))].sort((x, y) => w.rev4Pieces().findIndex(p => p.pill === x) - w.rev4Pieces().findIndex(p => p.pill === y));
groups.map(g => g.pill).join('|') === pillOrder.join('|') ? r.ok('groups in homepage pill order: ' + pillOrder.join(', ')) : r.fail('group order ' + groups.map(g => g.pill).join(', '));
const inOrder = groups.every(g => g.ps.join('|') === klydo.filter(p => p.pill === g.pill).map(p => p.piece).join('|'));
inOrder ? r.ok('pieces inside each group in homepage rotation order') : r.fail('piece order inside a group differs from rev4');

console.log('A vs B');
const strip = (h) => h.replace(/<style>[\s\S]*?<\/style>/, '').replace(/<title>[^<]*<\/title>/, '').replace(/<!--BODY-->[\s\S]*?<!--\/BODY-->/, '');
strip(a) === strip(b) ? r.ok('identical outside the body') : r.fail('A and B differ outside the body');

console.log('the one-piece demonstration');
const t = read('client-a-tomboyx.html');
w.links(t, r);
const tc = (t.match(/class="pc"/g) || []).length;
tc === 1 && byClient.TomboyX.length === 1 ? r.ok('TomboyX: 1 piece in the data, 1 card on the page: the page exists only to link on') : r.fail('TomboyX demo out of step with the data');
r.done();
