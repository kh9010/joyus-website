// The Site map tab's check (run by verify.cjs). pages.json is one tree, written by hand, so this
// holds it to things it cannot talk its way past: Divya's structure (Work first and deepest, by
// type, items named like "Gliitch Branding"; four stages); no UI done while the new UI is undecided;
// every HTML file in the last full-site commit accounted for exactly once; every old piece present or
// named as out; every state real and saying why; every study cited exists; every deck part opens on a
// page of its own project; the counts the page says out loud are the counts of the leaves.
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const here = __dirname, repo = path.resolve(here, '../..');
let bad = 0;
const ok = m => console.log('  ok   ' + m);
const fail = m => { bad++; console.log('  FAIL ' + m); };
const test = (c, m) => (c ? ok(m) : fail(m));
const D = JSON.parse(fs.readFileSync(path.join(here, 'pages.json'), 'utf8'));
const BET = JSON.parse(fs.readFileSync(path.join(here, 'bet.json'), 'utf8'));
const leaves = n => (n.kids ? n.kids.flatMap(leaves) : [n]);
const nodes = n => [n, ...(n.kids || []).flatMap(nodes)];
const depth = n => (n.kids ? 1 + Math.max(...n.kids.map(depth)) : 1);
const rows = D.tree.flatMap(leaves);
const pages = rows.filter(p => p.kind !== 'shape');
const STAGES = D.stages.map(s => s.id);
const find = id => D.tree.flatMap(nodes).find(n => n.id === id);
const titles = id => leaves(find(id)).map(n => n.title);

// 1. the structure Divya asked for (2 Nov)
const stageNames = [...new Set(D.stages.map(s => s.stage))];
test(stageNames.join() === 'UX,UI,Content,Refinement', 'four stages: ' + stageNames.join(', '));
const subNames = st => D.stages.filter(s => s.stage === st).map(s => s.sub).join();
test(subNames('Content') === 'Writing,Images,Interactions' && subNames('Refinement') === 'Strategic,Narrative,Visual', 'Content and Refinement have three each');
test(D.tree[0].id === 'work-branch', 'Work comes first');
test(D.tree.every((n, i) => !i || leaves(D.tree[0]).length > leaves(n).length || n.id === 'undecided'), 'Work is the largest decided branch');
const workTypes = find('work-branch').kids.filter(k => k.kids).map(k => k.title);
test(workTypes.join() === 'Branding,Website & Product,Strategy,Storytelling,IP work,Personal projects', 'Work, by type: ' + workTypes.join(', '));
test(depth(find('work-branch')) >= 4, 'Work is ' + depth(find('work-branch')) + ' levels deep');
test(titles('branding').includes('Gliitch Branding'), 'Gliitch Branding is under Branding');
test(!rows.some(n => /^Agemo (Branding|Brand voice)/.test(n.title)), 'Agemo has no branding (Divya, 2 Nov)');
test(titles('website-product').includes('Shapeshifter Proposal builder'), 'Shapeshifter is client work');
test(titles('storytelling').includes('Cranberry Storytelling'), 'Cranberry is on the tree');
test(find('ewc-website').siteLive === true, 'EWC\'s website is marked live');
const OWN = { ui: 'Divya', writing: 'Kahran', images: 'Divya', interactions: 'both', strategic: 'both', narrative: 'Kahran', visual: 'Divya' };
test(D.stages.every(s => s.owner === OWN[s.id]), 'each stage has the owner Divya named');
const clients = ['Tatsam', 'TomboyX', 'Gliitch', 'Agemo', 'Secret Senses', 'XTDB', 'Pratham USA', 'ConveGenius', 'Rachna Nivas', 'Klydo', 'EWC', 'Armoire', 'Shapeshifter', 'Cranberry'];
const byType = ['branding', 'website-product', 'strategy', 'storytelling'].flatMap(leaves2 => leaves(find(leaves2)));
const unnamed = byType.filter(n => !clients.some(c => n.title.startsWith(c + ' ')));
test(!unnamed.length, byType.length + ' client items each start with their client\'s name' + (unnamed.length ? ': not ' + unnamed.map(n => n.title).join(', ') : ''));
const noClient = clients.filter(c => !byType.some(n => n.title.startsWith(c + ' ')));
test(!noClient.length, 'all ' + clients.length + ' clients appear' + (noClient.length ? ': missing ' + noClient.join(', ') : ''));
const rachna = byType.filter(n => n.title.startsWith('Rachna Nivas ')).map(n => n.title.replace('Rachna Nivas ', '')).sort().join();
test(rachna === 'Strategy consulting,Voice,Website', 'Rachna Nivas: ' + rachna);
const ip = titles('ip-work');
for (const t of ['Comics', 'The Line Before', 'Mixed Meanings, the poetry films', 'Perpetuity, the page', 'Privacy policy']) test(ip.includes(t), t + ' is under IP work');
test(!rows.some(n => /Portal/.test(n.title)), 'there is no AI portal');
test(find('comics-page').parts.length === 4 && !find('comics-page').parts.some(q => /serious/i.test(q.t)), 'Comics is one page of four, the zine gone');
for (const t of ['Metro Museum of the Forgotten', 'Poetic lineage explorer', 'AI personal automation']) test(titles('personal').includes(t), t + ' is a personal project');
const retiredGroups = new Set(D.notPages.filter(p => p.why === 'retired').map(p => p.group));
test(['Essays', 'Topic hubs', 'Services'].every(g => retiredGroups.has(g)), 'retired: ' + [...retiredGroups].join(', '));
const stray = titles('experiments').filter(t => /Comics|Line before|AI videos|Metro|lineage|automation/i.test(t));
test(!stray.length, 'what moved to Together is not still under experiments' + (stray.length ? ': ' + stray.join() : ''));

// no UI is done until the new UI is decided (Divya, 2 Nov)
if (!D.uiDecided) {
  const early = rows.filter(p => p.s.ui[0] === 'd' || p.s.visual[0] === 'd').map(p => p.id);
  test(!early.length, 'the new UI is undecided, so no row has UI or visual refinement done' + (early.length ? ': ' + early.join(', ') : ''));
}
// the page that must never move stays where the stores point
const priv = find('mj-privacy');
test(priv && priv.url === '/motion-jigsaw/privacy/' && priv.live, 'the store-listed privacy URL is unchanged and marked live');

// 2. every old file, exactly once. A source may feed several items of one project, not two projects.
const ls = spawnSync('git', ['ls-tree', '-r', '--name-only', '5247822'], { cwd: repo, encoding: 'utf8', maxBuffer: 1e8 });
if (ls.status !== 0) fail('cannot read 5247822 from git');
const html = ls.stdout.split('\n').filter(f => /\.html$/.test(f));
const seen = {};
const mark = (f, by) => { if (!(seen[f] = seen[f] || []).includes(by)) seen[f].push(by); };
rows.forEach(p => (p.old || []).forEach(f => mark(f, p.id)));
rows.forEach(p => (p.source || []).forEach(f => mark(f, p.project || p.id)));
D.notPages.forEach(p => mark(p.file, p.why));
const missing = html.filter(f => !seen[f]);
const twice = Object.entries(seen).filter(([, v]) => v.length > 1);
const strangers = Object.keys(seen).filter(f => !html.includes(f));
test(!missing.length, html.length + ' old HTML files: none unaccounted' + (missing.length ? ': ' + missing.join(', ') : ''));
test(!twice.length, 'none accounted for twice' + (twice.length ? ': ' + twice.map(([f, v]) => f + ' (' + v.join(', ') + ')').join('; ') : ''));
test(!strangers.length, 'no row names a file that was not there' + (strangers.length ? ': ' + strangers.join(', ') : ''));

// 3. every old client piece is an item, or is named as out
const ia = JSON.parse(fs.readFileSync(path.join(here, '../iterations/03/ia.json'), 'utf8'));
const urls = new Set(rows.map(s => s.url));
const client = ia.pieces.filter(q => q.pill !== 'Experiments');
const lost = client.filter(q => !D.out[q.client + ' · ' + q.piece] && !urls.has(q.url));
test(!lost.length, client.length + ' old client pieces: each an item or named as out' + (lost.length ? ': lost ' + lost.map(q => q.client + ' · ' + q.piece).join(', ') : ''));
const ids = D.tree.flatMap(nodes).map(n => n.id);
const dup = ids.filter((x, i) => ids.indexOf(x) !== i);
test(!dup.length, 'ids are unique' + (dup.length ? ': ' + dup.join(', ') : ''));

// 4. states
const badState = [];
for (const p of rows) {
  if (!p.s) { badState.push(p.id + ' is a leaf with no cells'); continue; }
  const extra = Object.keys(p.s).filter(k => !STAGES.includes(k));
  if (extra.length) badState.push(p.id + ' has ' + extra.join());
  for (const k of STAGES) {
    const v = p.s[k];
    if (!v || !['0', 's', 'w', 'd'].includes(v[0])) { badState.push(p.id + '.' + k + ' bad state'); continue; }
    if (v[0] !== '0' && !v[1]) badState.push(p.id + '.' + k + ' moved with no reason');
    if (v[0] === 'w' && !['Divya', 'Kahran', 'both'].includes(v[2])) badState.push(p.id + '.' + k + ' waiting on nobody');
    if (v[0] !== 'w' && v[2]) badState.push(p.id + '.' + k + ' names someone but is not waiting');
  }
}
test(!badState.length, rows.length + ' items × ' + STAGES.length + ' cells: every cell a real state, every move says why' + (badState.length ? ': ' + badState.slice(0, 8).join('; ') : ''));

// 5. every study cited exists
const cited = new Set();
for (const m of JSON.stringify(D.tree).matchAll(/Stud(?:y|ies) (\d\d(?:(?:, | and | to )\d\d)*)/g)) (m[1].match(/\d\d/g) || []).forEach(n => cited.add(n));
const gone = [...cited].filter(n => !fs.existsSync(path.join(here, '../iterations', n)));
test(!gone.length, cited.size + ' studies cited, all exist' + (gone.length ? ': not ' + gone.join(', ') : ''));

// 6. deck parts: each opens on a page that names its project, or falls in that project's run of pages
const deckFile = path.join(repo, 'Joyus - work deck-mar26.pdf');
const RUN = { tatsam: [2, 6], tomboyx: [7, 11], gliitch: [12, 15], agemo: [16, 21], 'secret-senses': [22, 26], xtdb: [27, 31], pratham: [33, 36], convegenius: [37, 41], rachna: [42, 45], klydo: [46, 50] };
const withParts = rows.filter(p => (p.parts || []).some(q => q.page)).map(p => ({ ...p, parts: p.parts.filter(q => q.page) }));
const outOfRun = withParts.flatMap(p => p.parts.filter(q => !RUN[p.project] || q.page < RUN[p.project][0] || q.page > RUN[p.project][1]).map(q => p.id + ' p.' + q.page));
test(!outOfRun.length, withParts.flatMap(p => p.parts).length + ' parts, each on a deck page of its own project' + (outOfRun.length ? ': not ' + outOfRun.join(', ') : ''));
const usedPages = withParts.flatMap(p => p.parts.map(q => q.page));
const dupPages = usedPages.filter((x, i) => usedPages.indexOf(x) !== i);
test(!dupPages.length, 'no deck page is used for two parts' + (dupPages.length ? ': ' + dupPages.join(', ') : ''));
if (spawnSync('pdftotext', ['-v'], { encoding: 'utf8' }).error) console.log('  skip deck text (no pdftotext)');
else {
  const squash = s => s.replace(/[^a-z]/gi, '').toLowerCase();
  const first = { Tatsam: 2, TomboyX: 7, Gliitch: 12, Agemo: 16, 'Secret Senses': 22, XTDB: 27, Pratham: 33, ConveGenius: 37, Rachna: 42, Klydo: 46 };
  const wrong = Object.entries(first).filter(([name, n]) => { const r = spawnSync('pdftotext', ['-f', String(n), '-l', String(n), deckFile, '-'], { encoding: 'utf8', maxBuffer: 1e8 }); return !squash(r.stdout || '').includes(squash(name)); }).map(([k]) => k);
  test(!wrong.length, 'each client\'s run of deck pages starts on a page that names it' + (wrong.length ? ': not ' + wrong.join(', ') : ''));
}

// 8. local links open something on this branch
const noFile = [];
for (const p of D.tree.flatMap(nodes)) for (const h of [...(p.links || []).map(l => l[1]), ...(p.parts || []).map(q => q.href).filter(Boolean)]) {
  if (/^https?:/.test(h)) continue;
  const f = decodeURIComponent(h.split(/[?#]/)[0]);
  if (!fs.existsSync(path.join(repo, f.endsWith('/') ? f + 'index.html' : f))) noFile.push(p.id + ' → ' + h);
}
test(!noFile.length, 'every local link opens' + (noFile.length ? ': ' + noFile.slice(0, 8).join('; ') : ''));

console.log(bad ? bad + ' failure(s)' : 'site map holds: ' + pages.length + ' items, Work ' + leaves(find('work-branch')).length);
// the bet mode's data
{
  const rows = BET.beliefs.flatMap(b => ['f', 'e', 'i'].map(k => b[k]));
  test(BET.beliefs.length === 7 && rows.length === 21 && rows.every(r => r[1].length === BET.outputs.length && r[1].every(v => [0, 1, 2].includes(v))), 'the bet: 21 questions, each scored against all ' + BET.outputs.length + ' outputs');
  const ids = new Set(D.tree.flatMap(function all(n) { return [n.id, ...(n.kids || []).flatMap(all)]; }));
  const gone = BET.outputs.filter(o => !ids.has(o.item)).map(o => o.item);
  test(!gone.length, 'each output the bet scores is an item on the tree' + (gone.length ? ': not ' + gone : ''));
  const lost = BET.outputs.flatMap(o => [o.img, o.url]).filter(f => !/^https?:/.test(f) && !fs.existsSync(path.join(here, f)));
  test(!lost.length, 'each output has its picture and its page' + (lost.length ? ': not ' + lost : ''));
}
process.exitCode = bad ? 1 : 0;
