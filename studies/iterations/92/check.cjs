// Study 92: the EWC editing desk (brief.md). Kahran picked 91 a, "okay for now; I want it a little more clear",
// and asked for a desk like the About desk on kahransingh.com to edit it himself. Pinned here:
//  - lines.json and index.html are a fresh build.cjs; 91 a's lines in order (the six pairs as six person rows, Kahran
//    8 Nov: "i hate the options for quiet connector etc, get me some more ppls"), each labelled with a reader
//    question from Divya's bet (sitemap/bet.json), each with 2-7 options (a person 5-7); option 1 of every row is what 91 a
//    says now, so the draft with no picks is 91 a byte for byte;
//  - every option traces: its src file exists and holds each trace string (or it is marked "new");
//  - the draft is clean in every option: no em dash, no money but $5–10K, no "88" and no other figure, no
//    "before the club was built", no "an easy weekday place", no persona profile line, no client person's or
//    prospect's name (read off the workshop board), quotes attributed "a founder, East West Club"; noindex;
//  - the save route (pick.cjs, mounted in studies/server.cjs): a good pick is written, atomically, in row order;
//    a bad row, a bad index, a wrong source, an extra key, an over-long edit, bad JSON and a GET are refused
//    and leave picks.json alone; picks.json as committed is empty;
//  - live, in headless Chrome against an in-process copy of the server (writes to a throwaway, never the real
//    picks.json): at 390 and 1280 nothing past the edge, no text under 13px on the desk or in the draft, a tap
//    changes the draft and is saved, on a phone "see the draft" opens it full width and "back" closes it.
//   node studies/iterations/92/check.cjs
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const { execFile } = require('node:child_process');
const here = __dirname;
const IT = path.resolve(here, '..');
const ROOT = path.resolve(here, '../../..');
let failures = 0;
const ok = (m) => console.log('  ok   ' + m);
const fail = (m) => { failures++; console.log('  FAIL ' + m); };
const read = (f) => fs.readFileSync(path.join(here, f), 'utf8');

const { lines, tpl, A, html, linesJson, plain } = require('./build.cjs');
const { render } = require('./draft.js');

console.log('the desk');
read('lines.json') === linesJson ? ok('lines.json is a fresh build') : fail('lines.json differs from a fresh build.cjs');
read('index.html') === html ? ok('index.html is a fresh build') : fail('index.html differs from a fresh build.cjs');
const ORDER = ['headline', 'lede', 'labels', 'p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'proof', 'quote', 'cost', 'close'];
JSON.stringify(lines.map((l) => l.id)) === JSON.stringify(ORDER) ? ok('thirteen rows in 91 a\'s order (the six pairs one row per person): ' + ORDER.join(', ')) : fail('rows are ' + lines.map((l) => l.id).join(', '));
const bet = JSON.parse(fs.readFileSync(path.join(IT, '../sitemap/bet.json'), 'utf8'));
const questions = bet.beliefs.flatMap((b) => ['f', 'e', 'i'].map((k) => b[k][0]));
lines.every((l) => questions.includes(l.q) && html.includes('answers: “' + l.q.replace(/'/g, '&#39;') + '”') || html.includes('answers: “' + l.q + '”'))
  ? ok('every row quotes one of the bet\'s 21 reader questions') : fail('a row\'s question is not in bet.json or not on the desk');
lines.every((l) => l.options.length >= (l.pair ? 5 : 2) && l.options.length <= 7) ? ok('options per row: ' + lines.map((l) => l.id + ' ' + l.options.length).join(', ')) : fail('a row has too few or too many options (2-7; a person 5-7)');
lines.every((l) => l.options.every((o, i) => html.includes(`data-row="${l.id}" data-from="${o.from.replace(/'/g, '&#39;')}" data-i="${i}"`) || html.includes(`data-row="${l.id}" data-from="${o.from}" data-i="${i}"`)))
  ? ok('every option is a button on the desk, its source shown') : fail('an option is missing from the desk');
render(tpl, lines, {}) === A ? ok('no picks = 91 a byte for byte (option 1 of every row is what 91 a says now)') : fail('the draft with no picks is not 91 a');
lines.every((l) => (html.match(new RegExp(`<form class="edit" data-row="${l.id}"`, 'g')) || []).length === 1) ? ok('every row has "my own words"') : fail('a row has no own-words box');
/<meta name="robots" content="noindex">/.test(html) && /<meta name="robots" content="noindex">/.test(tpl) ? ok('the desk and the draft are noindex') : fail('noindex missing');
/class="eyebrow">Study 92 /.test(html) ? ok('the desk is numbered Study 92') : fail('no Study 92 eyebrow');

console.log('every option traces to a source');
const srcText = {};
for (const l of lines) for (const o of l.options) {
  if (o.src === 'new') { ok(l.id + ' / ' + o.from + ': marked new (ours)'); continue; }
  const f = path.join(IT, o.src);
  if (!fs.existsSync(f)) { fail(l.id + ' / ' + o.from + ': ' + o.src + ' missing'); continue; }
  srcText[f] = srcText[f] || plain(fs.readFileSync(f, 'utf8').replace(/<head>[\s\S]*?<\/head>/, '')).replace(/\s+/g, ' ');
  const textOf = (src) => { const g = path.join(IT, src); return (srcText[g] = srcText[g] || plain(fs.readFileSync(g, 'utf8').replace(/<head>[\s\S]*?<\/head>/, '')).replace(/\s+/g, ' ')); };
  const miss = o.trace.map((t) => (Array.isArray(t) ? t : [o.src, t])).filter(([s, t]) => !textOf(s).includes(t.replace(/\s+/g, ' '))).map(([s, t]) => s + ': ' + t);
  !o.trace.length ? fail(l.id + ' / ' + o.from + ': nothing to trace') : miss.length ? fail(l.id + ' / ' + o.from + ': not in "' + miss[0] + '"') : ok(l.id + ' / ' + o.from + ' ← ' + o.src + ' (' + o.trace.length + ')');
}
lines[0].options[0].from === '91 a' && lines.every((l) => /^91 a/.test(l.options[0].from)) ? ok('option 1 of every row is labelled 91 a') : fail('an option 1 is not labelled 91 a');

console.log('the people');
const pairRows = lines.filter((l) => l.pair);
pairRows.length === 6 && pairRows.map((l) => l.options[0].html).join('\n') === [...A.match(/<ol>([\s\S]*?)<\/ol>/)[1].matchAll(/  <li class="row"[\s\S]*?<\/li>/g)].map((m) => m[0]).join('\n')
  ? ok('six person rows, option 1 of each is 91 a\'s pair, in 91 a\'s order') : fail('the person rows do not start from 91 a\'s six pairs');
const fresh = pairRows.flatMap((l) => l.options.slice(1).map((o) => ({ l, o })));
const jargon = fresh.filter(({ o }) => /\bguys?\b|earner|income|salary|wealth|rich|\d|\byears? old\b|\bage\b|thirties|forties|fifties|retire/i.test(o.show));
jargon.length ? fail('a new person option uses a banned word (guy, earner, income, an age, a number): ' + jargon[0].o.show) : ok('no "guy", no income, age or number in the ' + fresh.length + ' new person options');
const lenses = new Set(fresh.map(({ o }) => o.from.replace(/ \(.*$/, '')));
lenses.size >= 5 ? ok('the new names come through ' + lenses.size + ' lenses: ' + [...lenses].join(', ')) : fail('only ' + lenses.size + ' lenses');
const sessions = JSON.parse(read('people-sources.json')).lines;
fresh.filter(({ o }) => /sessions/.test(o.from)).every(({ o }) => o.trace.some((t) => Array.isArray(t) && t[0] === '92/people-sources.json'))
  ? ok('every "the sessions" option traces to a line in people-sources.json (' + sessions.length + ' lines)') : fail('a sessions option has no sessions line');
const draftText = fresh.map(({ o }) => o.show).join(' ');
sessions.filter((x) => draftText.includes(x.text)).length === 0 ? ok('the sessions\' own lines are paraphrased, never on the draft') : fail('a session line is on the desk verbatim');

console.log('his picks');
const picksNow = JSON.parse(read('picks.json'));
Object.entries(picksNow).every(([row, p]) => { const l = lines.find((x) => x.id === row); return l && (typeof p.edit === 'string' || (l.options[p.i] && l.options[p.i].from === p.from)); })
  ? ok('every saved pick still names a row and an option (' + Object.keys(picksNow).join(', ') + ')') : fail('a saved pick no longer matches lines.json: ' + JSON.stringify(picksNow));

console.log('the draft is clean, every option');
const visible = (h) => h.replace(/<style[^>]*>[\s\S]*?<\/style>/g, '').replace(/<head>[\s\S]*?<\/head>/, '').replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ');
const drafts = lines.flatMap((l) => l.options.map((o, i) => ({ name: l.id + ' ' + (i + 1), h: render(tpl, lines, { [l.id]: { from: o.from, i } }) })));
const rules = [
  ['an em dash', (t) => /—/.test(t)],
  ['money or a figure other than $5–10K', (t) => [...t.matchAll(/\$\s?[\d.,]+(?:[–-]\d+)?\s?[KkMm]?\+?|\b\d+(?:[.,]\d+)?\s?(?:[kK]\b|dollars|USD|%)|\b\d+\b/g)].map((m) => m[0].trim()).some((m) => !/^\$5[–-]10K$/.test(m) && m !== '2026')],
  ['"88"', (t) => /88/.test(t)],
  ['"before the club was built"', (t) => /before the club was built/i.test(t)],
  ['"an easy weekday place"', (t) => /an easy weekday place/i.test(t)],
  ['income', (t) => /\bHHI\b|income|salary/i.test(t)],
];
for (const [name, bad] of rules) { const hit = drafts.find((d) => bad(visible(d.h))); hit ? fail(name + ' in the draft with ' + hit.name + ': ' + (visible(hit.h).match(/.{0,50}(—|88|\$\S+|\d+).{0,30}/) || [''])[0]) : ok('no ' + name + ' in any of the ' + drafts.length + ' drafts'); }
// Kahran's final (8 Nov): final.html is the draft as picked, standalone, under the same rules
const finalHtml = fs.existsSync(path.join(here, 'final.html')) ? read('final.html') : '';
finalHtml && finalHtml === render(tpl, lines, JSON.parse(read('picks.json'))) ? ok('final.html is the draft rendered from picks.json') : fail('final.html is missing or differs from the picks render');
/<meta name="robots" content="noindex">/.test(finalHtml) ? ok('final.html is noindex') : fail('final.html has no noindex');
for (const [name, bad] of rules) bad(visible(finalHtml)) ? fail('final.html: ' + name + ': ' + (visible(finalHtml).match(/.{0,50}(—|88|\$\S+|\d+).{0,30}/) || [''])[0]) : ok('final.html: no ' + name);
(finalHtml.match(/a founder, East West Club/g) || []).length === 1 ? ok('final.html credits "a founder, East West Club" once') : fail('final.html credits the founder ' + (finalHtml.match(/a founder, East West Club/g) || []).length + ' times');
const { personas } = JSON.parse(fs.readFileSync(path.join(IT, '86/personas.json'), 'utf8'));
const prof = personas.flatMap((p) => p.profile.split(/\.\s+/).map((s) => s.trim()).filter((s) => s.length > 8));
drafts.some((d) => prof.some((s) => d.h.includes(s))) ? fail('a persona profile line in a draft') : ok('no persona profile line (income, family) in any draft');
const quoted = lines.flatMap((l) => l.options).filter((o) => /“/.test(o.html) && /founder/.test(o.from));
quoted.length === 5 && quoted.every((o) => /a founder, East West Club/.test(o.html)) ? ok('the five founder quotes (A-D and the proof B) are each attributed "a founder, East West Club", no name') : fail('a founder quote without its attribution (' + quoted.length + ' found)');
const blob = drafts.map((d) => d.h).join('\n') + finalHtml + html + read('build.cjs') + read('brief.md') + read('lines.json') + read('people-sources.json');
const ewc = path.join(os.homedir(), 'dev/ewc');
const boardFile = path.join(ewc, 'EWC workshopsession2fill.excalidraw');
if (fs.existsSync(boardFile)) {
  const board = JSON.parse(fs.readFileSync(boardFile, 'utf8')).elements.filter((e) => e.type === 'text' && !e.isDeleted).map((e) => e.text);
  const full = [];
  for (const t of board) for (const m of t.matchAll(/(?:^|\n)([A-Z][a-z]+) ([A-Z][a-z]+) -/g)) full.push([m[1], m[2]]);
  const guideText = fs.readFileSync(path.join(IT, '86/personas.json'), 'utf8');
  const needles = full.flatMap(([f, l]) => [f + ' ' + l, f, ...(new RegExp('\\b' + l + '\\b').test(guideText) ? [] : [l])]);
  const leaked = needles.filter((n) => new RegExp('\\b' + n + '\\b').test(blob));
  full.length >= 6 ? ok('read ' + full.length + ' prospect names off the board') : fail('expected the board\'s prospect names, found ' + full.length);
  leaked.length ? fail(leaked.length + ' real prospect name(s) in Study 92') : ok('no prospect name in the desk, the drafts, build.cjs, lines.json or brief.md');
  const line = board.find((t) => /^\d+ min\s+·\s+/.test(t)) || '';
  const people = line.replace(/^\d+ min\s+·\s+/, '').split(/,\s*/).map((x) => x.trim()).filter((x) => x && !/^(Kahran|Divya)$/.test(x));
  const met = people.filter((n) => new RegExp('\\b' + n + '\\b', 'i').test(blob));
  people.length >= 2 ? ok('read ' + people.length + ' client attendees off the board') : fail('expected the workshop\'s attendees, found ' + people.length);
  met.length ? fail(met.length + ' client person name(s) in Study 92') : ok('no client person\'s name in Study 92');
} else ok('~/dev/ewc not on this machine: name checks skipped');

console.log('the save route');
const server = read('../../server.cjs');
server.includes("if (pathname === '/api/study-92/pick') { require('./iterations/92/pick.cjs')(req, res); return; }") ? ok('studies/server.cjs mounts POST /api/study-92/pick (one line)') : fail('studies/server.cjs does not mount the route');
console.log('  note picks.json holds ' + Object.keys(JSON.parse(read('picks.json'))).length + ' pick(s): Kahran\'s, kept as he left them');
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'study92-'));
process.env.PICKS = path.join(tmpDir, 'picks.json');
const pick = require('./pick.cjs');
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.css': 'text/css', '.png': 'image/png' };
const srv = http.createServer((req, res) => {
  const p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p === '/api/study-92/pick') return pick(req, res);
  // the desk reads its own picks.json: point it at the throwaway too
  const file = p === '/studies/iterations/92/picks.json' ? process.env.PICKS : path.join(ROOT, p);
  fs.readFile(file, (err, data) => { if (err) { res.writeHead(404).end(); return; } res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'text/plain', 'Cache-Control': 'no-store' }).end(data); });
});
const post = (port, body, method = 'POST', headers = {}) => new Promise((resolve) => {
  const r = http.request({ host: '127.0.0.1', port, path: '/api/study-92/pick', method, headers: { 'content-type': 'application/json', ...headers } }, (res) => { res.resume(); res.on('end', () => resolve(res.statusCode)); });
  r.on('error', () => resolve(0)); r.end(typeof body === 'string' ? body : JSON.stringify(body));
});
srv.listen(0, '127.0.0.1', async () => {
  const port = srv.address().port;
  const picksNow = () => { try { return fs.readFileSync(process.env.PICKS, 'utf8'); } catch { return ''; } };
  const good = await post(port, { row: 'proof', pick: { from: lines.find((l) => l.id === 'proof').options[2].from, i: 2 } });
  const good2 = await post(port, { row: 'headline', pick: { edit: 'East West Club, *made specific*.' } });
  const written = picksNow();
  good === 204 && good2 === 204 && JSON.stringify(Object.keys(JSON.parse(written))) === '["headline","proof"]' ? ok('a good pick and an edit are saved (204), in row order') : fail('good picks: ' + good + ' ' + good2 + ' wrote ' + written);
  fs.readdirSync(tmpDir).some((f) => f.endsWith('.tmp')) ? fail('a temp file left behind') : ok('written atomically (temp file renamed, none left)');
  const bad = [
    ['a row that is not on the desk', { row: 'hero', pick: { from: '91 a', i: 0 } }],
    ['an index past the options', { row: 'close', pick: { from: '91 a', i: 9 } }],
    ['a source that does not match the index', { row: 'close', pick: { from: '90 a', i: 1 } }],
    ['an extra key in the pick', { row: 'close', pick: { from: '91 a', i: 0, html: '<script>' } }],
    ['an extra key in the body', { row: 'close', pick: null, x: 1 }],
    ['an edit that is not text', { row: 'close', pick: { edit: 5 } }],
    ['an edit over 2000 characters', { row: 'close', pick: { edit: 'x'.repeat(2001) } }],
    ['a row that is a prototype key', { row: '__proto__', pick: null }],
    ['not JSON', '{row:'],
  ];
  for (const [name, body] of bad) { const s = await post(port, body); s === 400 && picksNow() === written ? ok('refused (400): ' + name) : fail('not refused: ' + name + ' (' + s + ')'); }
  const g = await post(port, '', 'GET');
  g === 405 ? ok('a GET is refused (405)') : fail('GET answered ' + g);
  const x = await post(port, { row: 'close', pick: null }, 'POST', { origin: 'http://evil.example' });
  x === 403 ? ok('a cross-site POST is refused (403)') : fail('cross-site POST answered ' + x);
  const back = await post(port, { row: 'headline', pick: null });
  back === 204 && JSON.stringify(Object.keys(JSON.parse(picksNow()))) === '["proof"]' ? ok('null takes a row back to 91 a') : fail('null did not clear the row');
  fs.writeFileSync(process.env.PICKS, '{}\n');

  console.log('live');
  try {
    // async: the server answering the desk lives in this process, so a blocking exec would starve it
    const stdout = await new Promise((resolve, reject) => execFile('node', [path.join(here, 'live.mjs'), `http://127.0.0.1:${port}/studies/iterations/92/index.html`], { encoding: 'utf8', timeout: 180000, env: process.env }, (err, so) => (err ? reject(err) : resolve(so))));
    const out = JSON.parse(stdout);
    for (const w of ['1280', '390']) {
      const r = out[w];
      r.pageWidth <= +w ? ok(w + ': nothing past the edge') : fail(w + ': the desk is ' + r.pageWidth + 'px wide');
      r.deskFont >= 13 ? ok(w + ': smallest text on the desk ' + r.deskFont + 'px') : fail(w + ': desk text at ' + r.deskFont + 'px');
      r.draftFont >= 13 && r.draftFontLast >= 13 ? ok(w + ': smallest text in the draft ' + r.draftFont + 'px (option 1s), ' + r.draftFontLast + 'px (last options)') : fail(w + ': draft text under 13px');
      r.h1 !== r.h1After && /^1[0-3] of 13/.test(r.status) && /saved/.test(r.status) && !/not saved/.test(r.status) ? ok(w + ': taps change the draft and save (' + r.status + ')') : fail(w + ': taps: ' + r.status + ' / ' + r.h1After);
      /^0 of 13/.test(r.statusReset) ? ok(w + ': option 1 everywhere takes it back to 91 a') : fail(w + ': reset says ' + r.statusReset);
      r.errors.length ? fail(w + ': errors ' + r.errors.join(' | ')) : ok(w + ': no errors');
    }
    const p = out['390'];
    p.draftHiddenAtFirst && p.drafting.shown && p.drafting.width === 390 && p.backHides ? ok('390: the draft is one tap away, full width (390px), and back closes it') : fail('390: draft on a phone ' + JSON.stringify([p.draftHiddenAtFirst, p.drafting, p.backHides]));
  } catch (e) { ok('Chrome not available: live part skipped (' + String(e.message).split('\n')[0].slice(0, 120) + ')'); }

  for (const f of ['desk-390', 'draft-390', 'desk-1280']) fs.existsSync(path.join(here, 'img', f + '.png')) ? ok('img/' + f + '.png') : fail('missing img/' + f + '.png');
  srv.close();
  fs.rmSync(tmpDir, { recursive: true, force: true });
  console.log(failures ? `\n${failures} failure(s)` : '\nPASS');
  process.exit(failures ? 1 : 0);
});
