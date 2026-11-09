// Study 92: the EWC editing desk, for Kahran to edit 91 a with options (brief.md). Modelled on kahransingh.com's
// About desk (studies/09 there): the page's lines down one side, each with options to tap plus "my own words",
// and the live draft beside it. This script writes:
//   lines.json   eight rows, in 91 a's order, each with its options ({from, src, trace, html, show})
//   index.html   the desk, readable with no server and no JS (option 1s, which are 91 a as it is)
// The draft is 91 a's page itself (src/a.html of Study 91) with its eight lines cut out as {{slot}} markers
// (template.html is not written: the template sits inside index.html), filled by draft.js. Option 1 of each row
// is what 91 a says now, so the draft with no picks is 91 a byte for byte.
// Every option names its source: `src` is a file (relative to studies/iterations/) whose text must contain each
// string in `trace` (default: the option's own text); `src: "new"` marks a fresh line of ours. check.cjs holds both.
// Picks are saved by POST /api/study-92/pick (pick.cjs, mounted in studies/server.cjs) into picks.json.
//   node studies/iterations/92/build.cjs
const fs = require('node:fs');
const path = require('node:path');
const { render, quoteBlock, pairsHtml, labelsHtml, proofHtml, esc } = require('./draft.js');
const HERE = __dirname;
const IT = path.resolve(HERE, '..');
const A = fs.readFileSync(path.join(IT, '91/src/a.html'), 'utf8');

// ---- 91 a, cut into the template -------------------------------------------------------------
const cut = (re, slot, tpl) => { const m = re.exec(tpl); if (!m) throw new Error('91 a has no ' + slot); return { inner: m[1], tpl: tpl.replace(m[0], m[0].replace(m[1], '{{' + slot + '}}')) }; };
let tpl = A;
const now = {};
for (const [slot, re] of [
  ['headline', /<h1>([\s\S]*?)<\/h1>/],
  ['lede', /<p class="lede">([\s\S]*?)<\/p>/],
  ['labels', /<div class="head" role="row">([\s\S]*?)<\/div>/],
  ['pairs', /<ol>([\s\S]*?)<\/ol>/],
  ['cost', /<p class="cost">([\s\S]*?)<\/p>/],
  ['close', /<p class="big">([\s\S]*?)<\/p>/],
]) { const r = cut(re, slot, tpl); now[slot] = r.inner; tpl = r.tpl; }
{ const m = /<div class="proof">[\s\S]*?<\/div>/.exec(tpl); now.proof = m[0]; tpl = tpl.replace(m[0], '{{proof}}{{quote}}'); }
now.quote = '';
const WHO = Object.fromEntries([...now.pairs.matchAll(/<span class="who" role="cell">([^<]+)<\/span>/g)].map((m) => [m[1].replace(/&nbsp;/g, ' ').toLowerCase(), m[1]]));
const who = (k) => { if (!WHO[k]) throw new Error('no member ' + k); return WHO[k]; };
const set = (list) => pairsHtml(list.map(([k, what]) => [who(k), what]));
const Q = (t) => ({ html: quoteBlock(t), trace: [t], edit: t, show: '\u201c' + t + '\u201d' });
const COST = (s) => s.replace('$5–10K', '<b style="white-space:nowrap">$5–10K</b>');

// ---- the rows ------------------------------------------------------------------------------
// q: the reader question it answers (Divya's bet, sitemap/bet.json), quoted in plain words
const ROWS = [
  { id: 'headline', label: 'headline', q: 'Have they worked on a problem shaped like mine?', options: [
    { from: '91 a', src: '91/src/a.html', html: now.headline },
    { from: '91 b (same in 91 c, d, 90 a-c, 89 d)', src: '91/src/b.html', html: "East West Club's value was big and vague. We made it specific." },
    { from: '90 d', src: '90/src/d.html', html: "East West Club's value was big. We made it specific." },
    { from: '88 brief, Kahran\'s frame (new)', src: '88/brief.md', trace: ['accessible and desirable to the right people'], html: 'East West Club had to feel accessible and desirable to the right people. <em>We worked out who they are.</em>' },
  ] },
  { id: 'lede', label: 'the paragraph (the moving equation)', q: 'What would they find that my team hasn\'t?', options: [
    { from: '91 a', src: '91/src/a.html', html: now.lede },
    { from: '91 d', src: '91/src/d.html', html: "A new members club in Seattle, not a country club. Settle who it's for, and its meaning changes. Settle its meaning, and different people join. So we adjusted both until each pair fit." },
    { from: '90 a', src: '90/src/a.html', html: "A new members club in Seattle, not a country club. Who it's for decides what it should mean, and what it means decides who joins. So we moved both, together, until each pair fit." },
    { from: '88 brief, Kahran\'s frame (new)', src: '88/brief.md', trace: ['Fix one and the other shifts'], html: 'A new members club in Seattle, not a country club. Who it was for kept moving, and so did what it offered. Fix one and the other shifts. So we solved both together, until six kinds of member each met one clear reason to join.' },
  ] },
  { id: 'labels', label: 'the column labels (who / what)', q: 'Do I feel clear after ten seconds, or tired?', options: [
    { from: '91 a', src: '91/src/a.html', trace: ["Who it's for", 'What it means to them'], html: now.labels, edit: "Who it's for / What it means to them" },
    { from: '91 d', src: '91/src/d.html', trace: ["Who it's for → ← What it means"], html: labelsHtml("Who it's for &rarr;", '&larr; What it means'), edit: "Who it's for / What it means" },
    { from: '90 b', src: '90/src/b.html', trace: ["Who it's for", 'What fits them'], html: labelsHtml("Who it's for", 'What fits them'), edit: "Who it's for / What fits them" },
    { from: 'new, plain', src: 'new', html: labelsHtml('Who joins', 'Why they join'), edit: 'Who joins / Why they join' },
  ] },
  { id: 'pairs', label: 'the six pairs (whole sets)', q: 'What do they actually make, and could they make mine?', options: [
    { from: '91 a (same words in 91 b-d, 90 a)', src: '91/src/a.html', html: now.pairs },
    { from: '90 c', src: '90/src/c.html', html: set([['quiet connector', 'Leagues that give him somewhere to go'], ['country-club guy', 'A bay he can book before work'], ['semi-retired operator', 'A named role he gets credit for'], ['new-to-seattle founder', "A lounge that's his “meet me at”"], ['empty-nester', 'Cohorts that start the same day'], ['mid-career high earner', 'Nights she can be in and out of']]) },
    { from: '90 b', src: '90/src/b.html', html: set([['quiet connector', 'leagues that give him a place to go'], ['country-club guy', 'a bay he can book before work'], ['semi-retired operator', 'a named role that gets him the credit'], ['new-to-seattle founder', 'a lounge he can work and meet in'], ['empty-nester', 'cohorts that start on the same day'], ['mid-career high earner', 'nights that get her in and out fast']]) },
    { from: '89 d', src: '89/src/d.html', html: set([['quiet connector', 'leagues: somewhere to go, friends or not'], ['country-club guy', 'a bay he can book before work'], ['semi-retired operator', 'a named role, and credit'], ['new-to-seattle founder', 'the lounge as “meet me at”'], ['empty-nester', 'cohorts that start on the same day'], ['mid-career high earner', 'quick nights, in and out']]) },
  ] },
  { id: 'proof', label: 'the proof', q: 'What did it do for them, at a size like mine?', options: [
    { from: '91 a', src: '91/src/a.html', html: now.proof },
    { from: 'brief 92 (new)', src: '92/brief.md', html: proofHtml('Founding members are signing up, with no paid marketing yet.') },
    { from: '90 c', src: '90/src/c.html', html: proofHtml("It resonates. Founding members are signing up ahead of the club's schedule.") },
    { from: 'quote B as the proof (founder, Nov 2026)', src: '92/brief.md', edit: "\u201cWe haven't had one person come for a tour or walk in and say like, I don't understand what you guys are doing.\u201d\na founder, East West Club", trace: ["We haven't had one person come for a tour or walk in and say like, I don't understand what you guys are doing."], html: proofHtml("“We haven't had one person come for a tour or walk in and say like, I don't understand what you guys are doing.”", 'a founder, East West Club') },
  ] },
  { id: 'quote', label: 'a client quote (new, optional)', q: 'Do I want mine to feel like that?', options: [
    { from: '91 a (no quote)', src: 'new', html: '', show: 'no quote' },
    { from: 'A, founder, hand-off call, Aug 2026', src: '92/brief.md', ...Q("It's been great to have those profiles because you can slot people in, like, as they're talking to you... the things they're saying resonate with a lot of the things that we discussed.") },
    { from: 'B, founder, Nov 2026 (skip if the proof is B)', src: '92/brief.md', ...Q("We haven't had one person come for a tour or walk in and say like, I don't understand what you guys are doing.") },
    { from: 'C, founder, May 2026, first seeing the six (two sentences joined)', src: '92/brief.md', ...Q('These are spot on... if we get these buckets, I think we fill up our membership pretty quickly.') },
    { from: 'D, founder, Aug 2026', src: '92/brief.md', ...Q('That exercise you guys ran us through has really made us more cognizant of the groups.') },
  ] },
  { id: 'cost', label: 'who, how long, what it cost', q: 'What do I ask for, how long does it take, what does it cost?', options: [
    { from: '91 a', src: '91/src/a.html', html: now.cost },
    { from: '91 a + two weeks (Kahran, 8 Nov)', src: '92/brief.md', trace: ['two weeks'], html: COST('<b>Kahran and Divya</b>, the two of us, for two weeks. What it cost: $5–10K.') },
    { from: 'new, three plain answers', src: '92/brief.md', trace: ['two weeks'], html: COST('Who: <b>Kahran and Divya</b>. How long: <b>two weeks</b>. What it cost: $5–10K.') },
    { from: 'new, this piece only', src: '92/brief.md', trace: ['two weeks'], html: COST("Two weeks with <b>Kahran and Divya</b>, the two of us, on who it's for and what it means. What it cost: $5–10K.") },
  ] },
  { id: 'close', label: 'the close', q: 'Can I write without having it all worked out?', options: [
    { from: '91 a', src: '91/src/a.html', html: now.close },
    { from: "Divya's bet (sitemap/bet.json)", src: '../sitemap/bet.json', html: "Tell us what's stuck. You don't need a brief. It starts small." },
    { from: '88 brief', src: '88/brief.md', trace: ['How would you have solved it?', "You don't need a brief. It starts small."], html: "How would you have solved it? You don't need a brief. It starts small." },
  ] },
];

const plain = (h) => h.replace(/<style>[\s\S]*?<\/style>/g, '').replace(/<\/li>/g, '\n').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&rarr;/g, '→').replace(/&larr;/g, '←').replace(/&amp;/g, '&').replace(/[ \t]+/g, ' ').replace(/ ([.,;:!?])/g, '$1').replace(/ *\n */g, '\n').trim();
for (const r of ROWS) if (now[r.id] !== r.options[0].html) throw new Error(r.id + ': option 1 is not what 91 a says now');
const lines = ROWS.map((r) => ({ id: r.id, label: r.label, q: r.q, options: r.options.map((o) => ({
  from: o.from, src: o.src, trace: o.src === 'new' ? [] : (o.trace || [plain(o.html).replace(/^“|”$/g, '').replace(/\na founder, East West Club$/, '')].flatMap((t) => t.split('\n'))),
  html: o.html, show: o.show || plain(o.html), edit: o.edit !== undefined ? o.edit : o.src === 'new' && r.id === 'quote' ? '' : r.id === 'proof' ? plain(o.html.replace('<small>', '\n<small>')) : r.id === 'headline' ? plain(o.html.replace(/<em>([\s\S]*?)<\/em>/g, '*$1*')) : plain(o.html),
})) }));
// pairs: the editable text is "Who: what" per line
for (const o of lines.find((l) => l.id === 'pairs').options) {
  const rows = [...o.html.matchAll(/<span class="who" role="cell">([^<]+)<\/span>.*?<span class="what" role="cell">([^<]+)<\/span>/g)].map((m) => plain(m[1]) + ': ' + plain(m[2]));
  o.show = rows.join('\n'); o.edit = rows.join('\n');
}
// the trace for the pairs is the what-lines only (the who names are 91 a's, the same in every source)
for (const o of lines.find((l) => l.id === 'pairs').options) o.trace = o.edit.split('\n').map((l) => l.slice(l.indexOf(':') + 2));

// ---- the desk ------------------------------------------------------------------------------
const draft0 = render(tpl, lines, {});
if (draft0 !== A) throw new Error('the draft with no picks is not 91 a');
const rowsHtml = lines.map((l, n) => `<section class="row" id="row-${l.id}" data-row="${l.id}">
 <h2><span class="n">${String(n + 1).padStart(2, '0')}</span> ${esc(l.label)}</h2>
 <p class="q">answers: “${esc(l.q)}”</p>
 <div class="opts">
${l.options.map((o, i) => `  <button type="button" class="opt" data-row="${l.id}" data-from="${esc(o.from)}" data-i="${i}"${i === 0 ? ' aria-current="true"' : ''}><span class="from">${esc(o.from)}</span><span class="body">${esc(o.show).replace(/\n/g, '<br>')}</span></button>`).join('\n')}
 </div>
 <details class="own"><summary>my own words</summary><form class="edit" data-row="${l.id}"><textarea name="edit" rows="${l.id === 'pairs' ? 7 : 3}">${esc(l.options[0].edit)}</textarea><button type="submit">use these words</button></form>${l.id === 'pairs' ? '<p class="hint">one pair a line, who: what</p>' : l.id === 'labels' ? '<p class="hint">left / right</p>' : l.id === 'headline' ? '<p class="hint">*stars* make words pink</p>' : l.id === 'proof' ? '<p class="hint">a second line becomes the small line</p>' : l.id === 'quote' ? '<p class="hint">empty means no quote</p>' : ''}</details>
</section>`).join('\n');

const DESK_CSS = `
:root{--paper:#fafaf8;--surface:#fff;--ink:#1a1a1a;--ink2:#5f5f5f;--line:#e0ddd8;--line2:#efece7;--mark:#B8155F}
*{box-sizing:border-box}
html{font-synthesis:none}
body{margin:0;background:var(--paper);color:var(--ink);font:400 16px/1.45 'Space Grotesk',system-ui,-apple-system,sans-serif}
.desk{display:grid;grid-template-columns:minmax(0,520px) minmax(0,1fr);gap:0 40px;max-width:1280px;margin:0 auto;padding:24px 16px 6rem}
.head{grid-column:1/-1;padding-bottom:12px;margin-bottom:8px;border-bottom:1px solid var(--line)}
.eyebrow{font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:var(--ink2);margin:0 0 4px}
.head h1{font-size:22px;line-height:1.2;margin:0 0 6px;font-weight:700;letter-spacing:-.01em}
.head p{margin:0;font-size:16px;color:var(--ink2);max-width:60ch}
.status{font-size:13px;color:var(--ink2);margin-top:8px}
.status b{color:var(--ink);font-weight:500}
.row{padding:16px 0 18px;border-top:1px solid var(--line2)}
.row h2{margin:0;font-size:13px;line-height:1.4;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--ink);display:flex;gap:.6rem;align-items:baseline}
.row h2 .n{color:var(--ink2);font-variant-numeric:tabular-nums}
.row h2 .state{margin-left:auto;font-weight:500;color:var(--ink2);letter-spacing:.04em}
.row.picked h2 .state{color:var(--mark)}
.q{margin:2px 0 10px;font-size:13px;color:var(--ink2)}
.opts{display:grid;gap:6px}
.opt{display:block;width:100%;text-align:left;font:inherit;color:var(--ink);background:var(--surface);border:1px solid var(--line);border-left:4px solid transparent;border-radius:8px;padding:10px 12px;cursor:pointer}
.opt[aria-current]{border-color:#c9c4bc;border-left-color:var(--mark)}
.opt .from{display:block;font-size:13px;color:var(--ink2);margin-bottom:2px}
.opt .body{display:block;font-size:16px;line-height:1.4}
.own{margin-top:8px}
.own summary{font-size:13px;color:var(--ink2);cursor:pointer;padding:6px 0}
.own[open] summary,.row.edited .own summary{color:var(--ink)}
.row.edited .own summary::after{content:" (in use)";color:var(--mark)}
.edit{display:grid;gap:6px}
.edit textarea{width:100%;font:inherit;font-size:16px;line-height:1.4;border:1px solid var(--line);border-radius:8px;padding:10px 12px;background:var(--surface);color:var(--ink);resize:vertical}
.edit button{justify-self:start;font:inherit;font-size:16px;color:#fff;background:var(--ink);border:0;border-radius:8px;padding:9px 14px;cursor:pointer}
.hint{margin:4px 0 0;font-size:13px;color:var(--ink2)}
.preview{position:sticky;top:0;align-self:start;height:100vh;padding:16px 0}
.preview .bar{display:flex;justify-content:space-between;align-items:center;font-size:13px;color:var(--ink2);margin-bottom:8px}
.preview .bar button{display:none}
.preview iframe{display:block;width:100%;height:calc(100% - 32px);border:1px solid var(--line);border-radius:8px;background:#fff}
.see{display:none}
@media (max-width:900px){
 .desk{grid-template-columns:1fr;padding-bottom:96px}
 .preview{position:fixed;inset:0;height:100%;align-self:stretch;z-index:10;background:#fff;padding:0;display:none}
 body.drafting .preview{display:block}
 body.drafting{overflow:hidden}
 .preview .bar{margin:0;padding:10px 16px;border-bottom:1px solid var(--line);background:var(--paper)}
 .preview .bar button,.see{display:block;font:inherit;font-size:16px;font-weight:500;color:#fff;background:var(--ink);border:0;border-radius:999px;padding:10px 18px;cursor:pointer}
 .preview iframe{height:calc(100% - 59px);border:0;border-radius:0}
 .see{position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:5;box-shadow:0 4px 16px rgba(0,0,0,.18)}
}`;

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>92 / EWC desk: edit 91 a with options · Joyus homepage</title>
<link rel="icon" href="data:,">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&display=swap" rel="stylesheet">
<style>${DESK_CSS}
</style>
</head>
<body>
<div class="desk">
 <header class="head">
  <p class="eyebrow">Study 92 · 8 November 2026 · for Kahran</p>
  <h1>EWC desk: edit 91 a, line by line</h1>
  <p>Kahran picked 91 a ("okay for now; I want it a little more clear"). Each line of the page, with the ways it has been said. Tap one, or write your own. The first option is what 91 a says now. Picks save to <code>picks.json</code> for Claude to read.</p>
  <p class="status" id="status"><b>0 of ${lines.length}</b> changed from 91 a</p>
 </header>
 <main class="lines">
${rowsHtml}
 </main>
 <aside class="preview" aria-label="The draft">
  <div class="bar"><span>the draft, as picked</span><button type="button" id="back">back to the desk</button></div>
  <iframe id="draft" title="The draft" srcdoc="${esc(draft0)}"></iframe>
 </aside>
</div>
<button type="button" class="see" id="see">see the draft</button>
<script type="text/plain" id="template">${tpl.replace(/<\/script/gi, '<\\/script')}</script>
<script src="draft.js"></script>
<script src="desk.js"></script>
</body>
</html>
`;
module.exports = { plain, lines, tpl, A, html, linesJson: JSON.stringify(lines, null, 1) + '\n' };
if (require.main === module) {
  fs.writeFileSync(path.join(HERE, 'lines.json'), module.exports.linesJson);
  fs.writeFileSync(path.join(HERE, 'index.html'), html);
  console.log(`desk: ${lines.length} rows, ${lines.map((l) => l.options.length).join('+')} = ${lines.reduce((a, l) => a + l.options.length, 0)} options`);
}
